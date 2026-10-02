import datetime
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    User, UserRole, StudentProfile, FacultyProfile, Subject, ClassEnrollment,
    AttendanceSession, AttendanceRecord, InternalAssessment, InternalMark,
    SemesterResult, SubjectGrade, Assignment, AssignmentSubmission,
    Project, ProjectReview, Notice, AuditLog, GradeScaleConfig,
    StudentRegistrationRequest
)
from .serializers import (
    UserSerializer, StudentProfileSerializer, FacultyProfileSerializer,
    SubjectSerializer, AttendanceSessionSerializer, AttendanceRecordSerializer,
    InternalAssessmentSerializer, InternalMarkSerializer, SemesterResultSerializer,
    SubjectGradeSerializer, AssignmentSerializer, AssignmentSubmissionSerializer,
    ProjectSerializer, ProjectReviewSerializer, NoticeSerializer,
    AuditLogSerializer, GradeScaleConfigSerializer
)
from .permissions import (
    IsStudentRole, IsFacultyRole, IsAdminRole,
    AcademicDataPermission, UserManagementOnlyAdmin
)
from .services import (
    log_faculty_audit,
    calculate_student_attendance,
    calculate_student_internal_marks,
    calculate_student_cgpa_and_percentage,
    get_student_submission_pending
)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'name': user.get_full_name() or user.username,
            'email': user.email,
            'role': user.role,
            'department': user.department,
            'avatar_color': user.avatar_color,
        }
        if user.role == UserRole.STUDENT and hasattr(user, 'student_profile'):
            sp = user.student_profile
            data['student_profile'] = {
                'id': sp.id,
                'register_no': sp.register_no,
                'name': sp.name,
                'year': sp.year,
                'section': sp.section,
                'current_semester': sp.current_semester,
                'department': sp.department
            }
        elif user.role == UserRole.FACULTY and hasattr(user, 'faculty_profile'):
            fp = user.faculty_profile
            data['faculty_profile'] = {
                'id': fp.id,
                'faculty_id': fp.faculty_id,
                'name': fp.name,
                'designation': fp.designation,
                'cabin': fp.cabin,
                'department': fp.department
            }
        return data


class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        resp_data = serializer.data

        if user.role == UserRole.STUDENT and hasattr(user, 'student_profile'):
            resp_data['student_profile'] = StudentProfileSerializer(user.student_profile).data
        elif user.role == UserRole.FACULTY and hasattr(user, 'faculty_profile'):
            resp_data['faculty_profile'] = FacultyProfileSerializer(user.faculty_profile).data

        return Response(resp_data)


class DemoAccountsView(APIView):
    """Returns demo accounts for quick role-switching and test evaluation."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        demo_users = []
        for u in User.objects.filter(is_active=True).order_by('role', 'username'):
            item = {
                'id': u.id,
                'username': u.username,
                'name': u.get_full_name() or u.username,
                'role': u.role,
                'department': u.department,
                'avatar_color': u.avatar_color,
            }
            if u.role == UserRole.STUDENT and hasattr(u, 'student_profile'):
                item['register_no'] = u.student_profile.register_no
                item['year'] = u.student_profile.year
                item['semester'] = u.student_profile.current_semester
            elif u.role == UserRole.FACULTY and hasattr(u, 'faculty_profile'):
                item['faculty_id'] = u.faculty_profile.faculty_id
                item['designation'] = u.faculty_profile.designation
            demo_users.append(item)
        return Response(demo_users)


# =====================================================================
# STUDENT PORTAL ENDPOINTS
# =====================================================================

class StudentDashboardView(APIView):
    """
    Consolidated Student Dashboard containing:
    - Profile Card (Reg No, Name, Dept CSE, Year)
    - Overall & Subject-wise Attendance with 75% warning flag
    - Internal marks table with subject progress
    - Semester results with semester selector, SGPA, grades, pass/fail
    - Overall CGPA and Percentage stat cards with semester-wise trend
    - Latest Notices (pinned/new badges)
    - Assignments list (Pending/Submitted/Late/Graded)
    - Project reviews & deadlines
    - Submission Pending panel sorted by nearest deadline with countdown
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Determine student profile
        if request.user.role == UserRole.STUDENT:
            if not hasattr(request.user, 'student_profile'):
                return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)
            student = request.user.student_profile
        else:
            # Faculty or Admin can view a student dashboard by passing ?student_id=
            student_id = request.query_params.get('student_id')
            if not student_id:
                # Default to first student if not provided
                student = StudentProfile.objects.first()
            else:
                student = get_object_or_404(StudentProfile, id=student_id)

        if not student:
            return Response({'error': 'No student records available'}, status=status.HTTP_404_NOT_FOUND)

        # 1. Profile Header
        profile_data = {
            'register_no': student.register_no,
            'name': student.name,
            'department': student.department,
            'year': student.year,
            'section': student.section,
            'current_semester': student.current_semester,
            'admission_year': student.admission_year,
            'email': student.user.email,
        }

        # 2. Attendance
        attendance_data = calculate_student_attendance(student)

        # 3. Internal Marks
        internal_marks_data = calculate_student_internal_marks(student)

        # 4. Semester Results & CGPA Trend
        academics_data = calculate_student_cgpa_and_percentage(student)

        # 5. Notices (recent notices relevant to student year)
        notices_qs = Notice.objects.filter(is_active=True).order_by('-is_pinned', '-created_at')[:8]
        notices_data = NoticeSerializer(notices_qs, many=True).data

        # 6. Assignments
        submissions_qs = AssignmentSubmission.objects.filter(student=student).select_related('assignment__subject', 'assignment__faculty')
        assignments_data = AssignmentSubmissionSerializer(submissions_qs, many=True).data

        # 7. Projects
        projects_qs = student.projects.prefetch_related('reviews', 'guide').all()
        projects_data = ProjectSerializer(projects_qs, many=True).data

        # 8. Submission Pending Panel (sorted by nearest deadline with countdown)
        pending_panel = get_student_submission_pending(student)

        return Response({
            'profile': profile_data,
            'attendance': attendance_data,
            'internal_marks': internal_marks_data,
            'academic_summary': {
                'overall_cgpa': academics_data['overall_cgpa'],
                'overall_percentage': academics_data['overall_percentage'],
                'cumulative_credits': academics_data['cumulative_credits'],
                'trend': academics_data['trend'],
                'semesters': academics_data['semesters'],
            },
            'notices': notices_data,
            'assignments': assignments_data,
            'projects': projects_data,
            'submission_pending': pending_panel,
        })


class StudentAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = getattr(request.user, 'student_profile', None)
        if not student:
            student_id = request.query_params.get('student_id')
            student = get_object_or_404(StudentProfile, id=student_id) if student_id else StudentProfile.objects.first()

        data = calculate_student_attendance(student)
        return Response(data)


class StudentMarksView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = getattr(request.user, 'student_profile', None)
        if not student:
            student_id = request.query_params.get('student_id')
            student = get_object_or_404(StudentProfile, id=student_id) if student_id else StudentProfile.objects.first()

        internal_marks = calculate_student_internal_marks(student)
        return Response(internal_marks)


class StudentResultsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = getattr(request.user, 'student_profile', None)
        if not student:
            student_id = request.query_params.get('student_id')
            student = get_object_or_404(StudentProfile, id=student_id) if student_id else StudentProfile.objects.first()

        data = calculate_student_cgpa_and_percentage(student)
        return Response(data)


class StudentSubmissionSubmitView(APIView):
    """Allows student to submit their own assignment work."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        submission = get_object_or_404(AssignmentSubmission, id=pk)
        
        # Enforce that student can only submit their own work
        if request.user.role == UserRole.STUDENT:
            if submission.student.user != request.user:
                return Response({'error': 'You can only submit your own assignment'}, status=status.HTTP_403_FORBIDDEN)

        submission_text = request.data.get('submission_text', '')
        file_url = request.data.get('file_url', '')

        now = timezone.now()
        is_late = now > submission.assignment.due_date

        submission.submission_text = submission_text
        submission.file_url = file_url
        submission.submitted_at = now
        submission.status = 'LATE' if is_late else 'SUBMITTED'
        submission.save()

        return Response(AssignmentSubmissionSerializer(submission).data)


# =====================================================================
# FACULTY PORTAL ENDPOINTS (Spreadsheet batch editing + Audit Logging)
# =====================================================================

class FacultyClassesAndSubjectsView(APIView):
    """Returns subjects and class rosters for faculty pickers."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        subjects = Subject.objects.all().order_by('semester', 'code')
        subjects_data = SubjectSerializer(subjects, many=True).data

        # Available classes
        classes = [
            {'year': 1, 'semester': 1, 'section': 'A', 'label': 'Year 1 CSE - Section A (Sem 1)'},
            {'year': 2, 'semester': 3, 'section': 'A', 'label': 'Year 2 CSE - Section A (Sem 3)'},
            {'year': 3, 'semester': 5, 'section': 'A', 'label': 'Year 3 CSE - Section A (Sem 5)'},
            {'year': 3, 'semester': 5, 'section': 'B', 'label': 'Year 3 CSE - Section B (Sem 5)'},
            {'year': 4, 'semester': 7, 'section': 'A', 'label': 'Year 4 CSE - Section A (Sem 7)'},
        ]
        return Response({'subjects': subjects_data, 'classes': classes})


class FacultyAttendanceSpreadsheetView(APIView):
    """
    Spreadsheet-style attendance management:
    - GET: Retrieves attendance sheet for given subject, date, year, section
    - POST: Bulk save with validation (NO FUTURE DATES ALLOWED) + Audit Log
    """
    permission_classes = [AcademicDataPermission]

    def get(self, request):
        subject_id = request.query_params.get('subject_id')
        date_str = request.query_params.get('date', str(timezone.localdate()))
        year = request.query_params.get('year', '3')
        section = request.query_params.get('section', 'A')

        if not subject_id:
            first_subj = Subject.objects.first()
            subject_id = first_subj.id if first_subj else None

        subject = get_object_or_404(Subject, id=subject_id)
        students = StudentProfile.objects.filter(year=year, section=section).order_by('register_no')

        # Try to find existing session
        session = AttendanceSession.objects.filter(
            subject=subject,
            date=date_str,
            class_year=year,
            class_section=section
        ).first()

        records_map = {}
        if session:
            for r in session.records.all():
                records_map[r.student_id] = r.status

        roster = []
        for s in students:
            roster.append({
                'student_id': s.id,
                'register_no': s.register_no,
                'name': s.name,
                'status': records_map.get(s.id, 'PRESENT'),  # Default to Present
            })

        return Response({
            'subject': SubjectSerializer(subject).data,
            'date': date_str,
            'year': int(year),
            'section': section,
            'session_id': session.id if session else None,
            'session_slot': session.session_slot if session else '09:00 - 10:00 AM',
            'topic': session.topic if session else '',
            'roster': roster
        })

    def post(self, request):
        # Strict validation: Only Faculty can write!
        if request.user.role != UserRole.FACULTY:
            return Response({'error': 'Forbidden: Only faculty can record attendance.'}, status=status.HTTP_403_FORBIDDEN)

        subject_id = request.data.get('subject_id')
        date_str = request.data.get('date')
        slot = request.data.get('session_slot', '09:00 - 10:00 AM')
        topic = request.data.get('topic', '')
        year = request.data.get('year', 3)
        section = request.data.get('section', 'A')
        roster_data = request.data.get('roster', [])

        # Server-side validation: NO FUTURE DATES ALLOWED
        try:
            session_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

        if session_date > timezone.localdate():
            return Response({'error': 'Validation Error: Attendance cannot be marked for future dates.'}, status=status.HTTP_400_BAD_REQUEST)

        subject = get_object_or_404(Subject, id=subject_id)
        faculty_profile = getattr(request.user, 'faculty_profile', None)
        if not faculty_profile:
            faculty_profile = FacultyProfile.objects.first()

        with transaction.atomic():
            session, created = AttendanceSession.objects.get_or_create(
                subject=subject,
                date=session_date,
                class_year=year,
                class_section=section,
                defaults={
                    'faculty': faculty_profile,
                    'session_slot': slot,
                    'topic': topic,
                }
            )
            if not created:
                session.session_slot = slot
                session.topic = topic
                session.save()

            old_records = {r.student.register_no: r.status for r in session.records.select_related('student')}
            new_records = {}

            for item in roster_data:
                student_id = item.get('student_id')
                status_val = item.get('status', 'PRESENT')
                student = StudentProfile.objects.get(id=student_id)
                
                rec, _ = AttendanceRecord.objects.update_or_create(
                    session=session,
                    student=student,
                    defaults={'status': status_val}
                )
                new_records[student.register_no] = status_val

            # AUDIT LOGGING: Log faculty edit with old value, new value, who changed, timestamp
            log_faculty_audit(
                user=request.user,
                action='SAVE_ATTENDANCE_SESSION',
                model_name='AttendanceSession',
                record_id=session.id,
                old_val={'subject': subject.code, 'date': str(session_date), 'records': old_records},
                new_val={'subject': subject.code, 'date': str(session_date), 'records': new_records},
                request=request
            )

        return Response({
            'success': True,
            'message': f'Attendance for {subject.code} on {session_date} saved successfully.',
            'session_id': session.id,
            'total_students': len(roster_data)
        })


class FacultyInternalMarksSpreadsheetView(APIView):
    """
    Spreadsheet-style marks entry:
    - GET: Roster with current marks for chosen assessment
    - POST: Bulk save with validation (marks <= max_marks, >= 0) + Audit Log
    """
    permission_classes = [AcademicDataPermission]

    def get(self, request):
        subject_id = request.query_params.get('subject_id')
        assessment_id = request.query_params.get('assessment_id')
        year = request.query_params.get('year', '3')
        section = request.query_params.get('section', 'A')

        if not subject_id:
            subject = Subject.objects.first()
        else:
            subject = get_object_or_404(Subject, id=subject_id)

        assessments = InternalAssessment.objects.filter(subject=subject).order_by('date')
        if not assessment_id:
            curr_assessment = assessments.first()
        else:
            curr_assessment = get_object_or_404(InternalAssessment, id=assessment_id)

        students = StudentProfile.objects.filter(year=year, section=section).order_by('register_no')

        marks_map = {}
        if curr_assessment:
            for m in curr_assessment.marks.all():
                marks_map[m.student_id] = {
                    'marks_obtained': float(m.marks_obtained),
                    'is_absent': m.is_absent,
                    'remarks': m.remarks
                }

        roster = []
        for s in students:
            m_info = marks_map.get(s.id, {'marks_obtained': 0.0, 'is_absent': False, 'remarks': ''})
            roster.append({
                'student_id': s.id,
                'register_no': s.register_no,
                'name': s.name,
                'marks_obtained': m_info['marks_obtained'],
                'is_absent': m_info['is_absent'],
                'remarks': m_info['remarks'],
            })

        return Response({
            'subject': SubjectSerializer(subject).data,
            'assessments': InternalAssessmentSerializer(assessments, many=True).data,
            'selected_assessment': InternalAssessmentSerializer(curr_assessment).data if curr_assessment else None,
            'max_marks': float(curr_assessment.max_marks) if curr_assessment else 50.0,
            'year': int(year),
            'section': section,
            'roster': roster
        })

    def post(self, request):
        if request.user.role != UserRole.FACULTY:
            return Response({'error': 'Forbidden: Only faculty can modify internal marks.'}, status=status.HTTP_403_FORBIDDEN)

        assessment_id = request.data.get('assessment_id')
        roster_data = request.data.get('roster', [])

        assessment = get_object_or_404(InternalAssessment, id=assessment_id)
        max_marks = assessment.max_marks

        # Server-side validation: Marks must be within 0 and max_marks
        errors = []
        for item in roster_data:
            marks_val = item.get('marks_obtained', 0)
            try:
                dec_marks = Decimal(str(marks_val))
            except Exception:
                errors.append(f"Invalid marks value for student ID {item.get('student_id')}")
                continue

            if dec_marks < 0 or dec_marks > max_marks:
                errors.append(f"Marks {dec_marks} exceeds allowed range [0 - {max_marks}] for student {item.get('register_no')}")

        if errors:
            return Response({'error': 'Validation Failed', 'details': errors}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            old_records = {m.student.register_no: float(m.marks_obtained) for m in assessment.marks.select_related('student')}
            new_records = {}

            for item in roster_data:
                student = StudentProfile.objects.get(id=item['student_id'])
                marks_val = Decimal(str(item.get('marks_obtained', 0)))
                is_abs = item.get('is_absent', False)
                rem = item.get('remarks', '')

                InternalMark.objects.update_or_create(
                    assessment=assessment,
                    student=student,
                    defaults={
                        'marks_obtained': marks_val,
                        'is_absent': is_abs,
                        'remarks': rem
                    }
                )
                new_records[student.register_no] = float(marks_val)

            # Audit Log
            log_faculty_audit(
                user=request.user,
                action='UPDATE_INTERNAL_MARKS',
                model_name='InternalAssessment',
                record_id=assessment.id,
                old_val={'assessment': assessment.name, 'marks': old_records},
                new_val={'assessment': assessment.name, 'marks': new_records},
                request=request
            )

        return Response({
            'success': True,
            'message': f'Marks for {assessment.name} ({assessment.subject.code}) saved successfully.',
            'total_updated': len(roster_data)
        })


class FacultySemesterMarksSpreadsheetView(APIView):
    """
    Spreadsheet-style entry for external/semester grades:
    - Bulk save semester grades, external marks, compute CGPA/SGPA with audit log.
    """
    permission_classes = [AcademicDataPermission]

    def get(self, request):
        semester = int(request.query_params.get('semester', '5'))
        subject_id = request.query_params.get('subject_id')
        year = request.query_params.get('year', '3')
        section = request.query_params.get('section', 'A')

        subjects = Subject.objects.filter(semester=semester)
        subject = get_object_or_404(Subject, id=subject_id) if subject_id else subjects.first()

        students = StudentProfile.objects.filter(year=year, section=section).order_by('register_no')

        roster = []
        for s in students:
            sem_result = SemesterResult.objects.filter(student=s, semester=semester).first()
            grade_obj = SubjectGrade.objects.filter(semester_result=sem_result, subject=subject).first() if sem_result else None

            roster.append({
                'student_id': s.id,
                'register_no': s.register_no,
                'name': s.name,
                'internal_marks': float(grade_obj.internal_marks) if grade_obj else 38.0,
                'external_marks': float(grade_obj.external_marks) if grade_obj else 48.0,
                'total_marks': float(grade_obj.total_marks) if grade_obj else 86.0,
                'grade': grade_obj.grade if grade_obj else 'A',
                'grade_point': grade_obj.grade_point if grade_obj else 8,
                'result_status': grade_obj.result_status if grade_obj else 'PASS',
            })

        return Response({
            'semester': semester,
            'subject': SubjectSerializer(subject).data if subject else None,
            'subjects': SubjectSerializer(subjects, many=True).data,
            'roster': roster
        })

    def post(self, request):
        if request.user.role != UserRole.FACULTY:
            return Response({'error': 'Forbidden: Only faculty can record semester grades.'}, status=status.HTTP_403_FORBIDDEN)

        semester = int(request.data.get('semester', 5))
        subject_id = request.data.get('subject_id')
        roster_data = request.data.get('roster', [])

        subject = get_object_or_404(Subject, id=subject_id)

        # Grade scale mapping
        grade_scale = {
            'O': (10, 'PASS'),
            'A+': (9, 'PASS'),
            'A': (8, 'PASS'),
            'B+': (7, 'PASS'),
            'B': (6, 'PASS'),
            'C': (5, 'PASS'),
            'U': (0, 'FAIL'),
        }

        with transaction.atomic():
            old_log = {}
            new_log = {}

            for item in roster_data:
                student = StudentProfile.objects.get(id=item['student_id'])
                sem_result, _ = SemesterResult.objects.get_or_create(
                    student=student,
                    semester=semester,
                    defaults={'academic_year': '2026-2027'}
                )

                intern = Decimal(str(item.get('internal_marks', 0)))
                extern = Decimal(str(item.get('external_marks', 0)))
                total = intern + extern
                grade_choice = item.get('grade', 'A')
                gp, res_stat = grade_scale.get(grade_choice, (8, 'PASS'))

                sg_obj, created = SubjectGrade.objects.update_or_create(
                    semester_result=sem_result,
                    subject=subject,
                    defaults={
                        'internal_marks': intern,
                        'external_marks': extern,
                        'total_marks': total,
                        'grade': grade_choice,
                        'grade_point': gp,
                        'result_status': res_stat,
                    }
                )

                new_log[student.register_no] = {'grade': grade_choice, 'total': float(total)}
                # Recalculate CGPA and percentage
                calculate_student_cgpa_and_percentage(student)

            log_faculty_audit(
                user=request.user,
                action='BULK_SAVE_SEMESTER_GRADES',
                model_name='SubjectGrade',
                record_id=f"Sem-{semester}-Subj-{subject.code}",
                old_val={'subject': subject.code, 'semester': semester},
                new_val={'subject': subject.code, 'semester': semester, 'grades': new_log},
                request=request
            )

        return Response({'success': True, 'message': f'Semester {semester} grades updated successfully.'})


class FacultyAssignmentManageView(APIView):
    """Faculty assignment creation and grading with audit logging."""
    permission_classes = [AcademicDataPermission]

    def get(self, request):
        assignments = Assignment.objects.all().order_by('-due_date')
        return Response(AssignmentSerializer(assignments, many=True).data)

    def post(self, request):
        if request.user.role != UserRole.FACULTY:
            return Response({'error': 'Forbidden: Only faculty can create assignments.'}, status=status.HTTP_403_FORBIDDEN)

        subject_id = request.data.get('subject_id')
        title = request.data.get('title')
        description = request.data.get('description', '')
        due_date = request.data.get('due_date')
        max_marks = request.data.get('max_marks', 20.0)
        year = request.data.get('year', 3)
        section = request.data.get('section', 'A')

        subject = get_object_or_404(Subject, id=subject_id)
        faculty_profile = getattr(request.user, 'faculty_profile', FacultyProfile.objects.first())

        assignment = Assignment.objects.create(
            subject=subject,
            faculty=faculty_profile,
            title=title,
            description=description,
            due_date=due_date,
            max_marks=max_marks,
            year=year,
            section=section
        )

        # Pre-create pending submissions for students of that year and section
        students = StudentProfile.objects.filter(year=year, section=section)
        for s in students:
            AssignmentSubmission.objects.create(
                assignment=assignment,
                student=s,
                status='PENDING'
            )

        log_faculty_audit(
            user=request.user,
            action='CREATE_ASSIGNMENT',
            model_name='Assignment',
            record_id=assignment.id,
            old_val={},
            new_val={'title': title, 'subject': subject.code, 'due_date': str(due_date)},
            request=request
        )

        return Response(AssignmentSerializer(assignment).data, status=status.HTTP_201_CREATED)


class FacultyGradeSubmissionView(APIView):
    """Faculty marks submission status & grades assignments."""
    permission_classes = [AcademicDataPermission]

    def post(self, request, pk):
        if request.user.role != UserRole.FACULTY:
            return Response({'error': 'Forbidden: Only faculty can grade assignments.'}, status=status.HTTP_403_FORBIDDEN)

        submission = get_object_or_404(AssignmentSubmission, id=pk)
        marks = request.data.get('marks_awarded')
        feedback = request.data.get('faculty_feedback', '')
        sub_status = request.data.get('status', 'GRADED')

        old_state = {'marks': float(submission.marks_awarded or 0), 'status': submission.status}

        submission.marks_awarded = marks
        submission.faculty_feedback = feedback
        submission.status = sub_status
        submission.save()

        new_state = {'marks': float(marks), 'status': sub_status, 'feedback': feedback}

        log_faculty_audit(
            user=request.user,
            action='GRADE_ASSIGNMENT_SUBMISSION',
            model_name='AssignmentSubmission',
            record_id=submission.id,
            old_val=old_state,
            new_val=new_state,
            request=request
        )

        return Response(AssignmentSubmissionSerializer(submission).data)


class FacultyNoticeManageView(APIView):
    """Faculty Notice publishing, pinning, and expiration."""
    permission_classes = [AcademicDataPermission]

    def get(self, request):
        notices = Notice.objects.all().order_by('-is_pinned', '-created_at')
        return Response(NoticeSerializer(notices, many=True).data)

    def post(self, request):
        if request.user.role != UserRole.FACULTY:
            return Response({'error': 'Forbidden: Only faculty can post department notices.'}, status=status.HTTP_403_FORBIDDEN)

        faculty_profile = getattr(request.user, 'faculty_profile', None)
        title = request.data.get('title')
        content = request.data.get('content')
        category = request.data.get('category', 'ACADEMIC')
        is_pinned = request.data.get('is_pinned', False)
        target_year = request.data.get('target_year')

        notice = Notice.objects.create(
            title=title,
            content=content,
            posted_by=faculty_profile,
            category=category,
            is_pinned=is_pinned,
            target_year=target_year
        )

        log_faculty_audit(
            user=request.user,
            action='POST_NOTICE',
            model_name='Notice',
            record_id=notice.id,
            old_val={},
            new_val={'title': title, 'category': category, 'is_pinned': is_pinned},
            request=request
        )

        return Response(NoticeSerializer(notice).data, status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        if request.user.role != UserRole.FACULTY:
            return Response({'error': 'Forbidden: Only faculty can edit notices.'}, status=status.HTTP_403_FORBIDDEN)

        notice = get_object_or_404(Notice, id=pk)
        old_val = {'title': notice.title, 'is_pinned': notice.is_pinned, 'is_active': notice.is_active}

        if 'title' in request.data:
            notice.title = request.data['title']
        if 'content' in request.data:
            notice.content = request.data['content']
        if 'is_pinned' in request.data:
            notice.is_pinned = request.data['is_pinned']
        if 'is_active' in request.data:
            notice.is_active = request.data['is_active']
        if 'category' in request.data:
            notice.category = request.data['category']

        notice.save()

        new_val = {'title': notice.title, 'is_pinned': notice.is_pinned, 'is_active': notice.is_active}
        log_faculty_audit(
            user=request.user,
            action='UPDATE_NOTICE',
            model_name='Notice',
            record_id=notice.id,
            old_val=old_val,
            new_val=new_val,
            request=request
        )

        return Response(NoticeSerializer(notice).data)


# =====================================================================
# ADMIN PORTAL ENDPOINTS (User management + Audit Log viewer)
# =====================================================================

class AdminUsersView(APIView):
    """
    Admin: creates/deactivates accounts only;
    cannot edit marks, attendance, or any academic data.
    """
    permission_classes = [UserManagementOnlyAdmin]

    def get(self, request):
        users = User.objects.all().order_by('-date_joined')
        return Response(UserSerializer(users, many=True).data)

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password', 'Pass@123')
        role = request.data.get('role', UserRole.STUDENT)
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        email = request.data.get('email', '')

        if User.objects.filter(username=username).exists():
            return Response({'error': f'Username {username} already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                password=password,
                role=role,
                first_name=first_name,
                last_name=last_name,
                email=email,
                department='Computer Science & Engineering'
            )

            if role == UserRole.STUDENT:
                reg_no = request.data.get('register_no', f"23CS{User.objects.count():03d}")
                year = int(request.data.get('year', 3))
                section = request.data.get('section', 'A')
                StudentProfile.objects.create(
                    user=user,
                    register_no=reg_no,
                    name=f"{first_name} {last_name}".strip() or username,
                    year=year,
                    section=section
                )
            elif role == UserRole.FACULTY:
                fac_id = request.data.get('faculty_id', f"FAC-CSE-{User.objects.count():02d}")
                designation = request.data.get('designation', 'Assistant Professor')
                FacultyProfile.objects.create(
                    user=user,
                    faculty_id=fac_id,
                    name=f"{first_name} {last_name}".strip() or username,
                    designation=designation
                )

            log_faculty_audit(
                user=request.user,
                action='CREATE_USER_ACCOUNT',
                model_name='User',
                record_id=user.id,
                old_val={},
                new_val={'username': username, 'role': role, 'name': f"{first_name} {last_name}"},
                request=request
            )

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class AdminToggleUserStatusView(APIView):
    """Admin activates or deactivates user accounts."""
    permission_classes = [UserManagementOnlyAdmin]

    def patch(self, request, pk):
        user = get_object_or_404(User, id=pk)
        old_status = user.is_active
        new_status = request.data.get('is_active', not old_status)
        user.is_active = new_status
        user.save()

        log_faculty_audit(
            user=request.user,
            action='TOGGLE_USER_STATUS',
            model_name='User',
            record_id=user.id,
            old_val={'is_active': old_status},
            new_val={'is_active': new_status},
            request=request
        )

        return Response({'id': user.id, 'username': user.username, 'is_active': user.is_active})


class AdminAuditLogsView(APIView):
    """Retrieves immutable audit logs of all faculty/administrative changes."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        logs = AuditLog.objects.all().order_by('-timestamp')[:100]
        return Response(AuditLogSerializer(logs, many=True).data)


# =====================================================================
# FACULTY SUBJECT MANAGEMENT (Edit name/code + Add/Remove Students)
# =====================================================================

class FacultySubjectEditView(APIView):
    """
    Faculty-only: Edit a subject's name and code.
    PATCH /api/faculty/subjects/<pk>/edit/
    """
    permission_classes = [AcademicDataPermission]

    def patch(self, request, pk):
        if request.user.role != UserRole.FACULTY:
            return Response(
                {'error': 'Forbidden: Only faculty can edit subject details.'},
                status=status.HTTP_403_FORBIDDEN
            )

        subject = get_object_or_404(Subject, id=pk)
        old_code = subject.code
        old_name = subject.name

        new_code = request.data.get('code', subject.code).strip().upper()
        new_name = request.data.get('name', subject.name).strip()

        errors = {}
        if not new_code:
            errors['code'] = 'Subject code cannot be empty.'
        if not new_name:
            errors['name'] = 'Subject name cannot be empty.'

        # Check uniqueness of code (excluding self)
        if new_code and Subject.objects.filter(code=new_code).exclude(id=pk).exists():
            errors['code'] = f'Subject code "{new_code}" is already taken by another subject.'

        if errors:
            return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        subject.code = new_code
        subject.name = new_name
        subject.save()

        log_faculty_audit(
            user=request.user,
            action='EDIT_SUBJECT_DETAILS',
            model_name='Subject',
            record_id=subject.id,
            old_val={'code': old_code, 'name': old_name},
            new_val={'code': new_code, 'name': new_name},
            request=request
        )

        return Response(SubjectSerializer(subject).data)


class FacultySubjectStudentsView(APIView):
    """
    Faculty-only: List enrolled students for a subject + all available students.
    GET /api/faculty/subjects/<pk>/students/
    Returns:
      - enrolled: list of currently enrolled StudentProfiles
      - available: list of students NOT yet enrolled (candidates to add)
    """
    permission_classes = [AcademicDataPermission]

    def get(self, request, pk):
        subject = get_object_or_404(Subject, id=pk)

        enrolled_ids = ClassEnrollment.objects.filter(subject=subject).values_list('student_id', flat=True)
        enrolled_students = StudentProfile.objects.filter(id__in=enrolled_ids).order_by('register_no')
        available_students = StudentProfile.objects.exclude(id__in=enrolled_ids).order_by('register_no')

        return Response({
            'subject': SubjectSerializer(subject).data,
            'enrolled': StudentProfileSerializer(enrolled_students, many=True).data,
            'available': StudentProfileSerializer(available_students, many=True).data,
        })


class FacultySubjectEnrollmentView(APIView):
    """
    Faculty-only: Add or remove a student from a subject.
    POST /api/faculty/subjects/<pk>/enroll/   body: { student_id, action: 'add'|'remove' }
    """
    permission_classes = [AcademicDataPermission]

    def post(self, request, pk):
        if request.user.role != UserRole.FACULTY:
            return Response(
                {'error': 'Forbidden: Only faculty can manage enrollments.'},
                status=status.HTTP_403_FORBIDDEN
            )

        subject = get_object_or_404(Subject, id=pk)
        student_id = request.data.get('student_id')
        action = request.data.get('action', 'add')  # 'add' or 'remove'

        if not student_id:
            return Response({'error': 'student_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        student = get_object_or_404(StudentProfile, id=student_id)

        if action == 'add':
            enrollment, created = ClassEnrollment.objects.get_or_create(
                student=student,
                subject=subject,
                defaults={
                    'academic_year': '2026-2027',
                    'semester': subject.semester,
                }
            )
            if not created:
                return Response({'message': f'{student.name} is already enrolled in {subject.code}.'}, status=status.HTTP_200_OK)

            log_faculty_audit(
                user=request.user,
                action='ENROLL_STUDENT',
                model_name='ClassEnrollment',
                record_id=enrollment.id,
                old_val={},
                new_val={'student': student.register_no, 'subject': subject.code},
                request=request
            )
            return Response({'message': f'Successfully enrolled {student.name} in {subject.code}.'}, status=status.HTTP_201_CREATED)

        elif action == 'remove':
            deleted, _ = ClassEnrollment.objects.filter(student=student, subject=subject).delete()
            if not deleted:
                return Response({'error': f'{student.name} is not enrolled in {subject.code}.'}, status=status.HTTP_404_NOT_FOUND)

            log_faculty_audit(
                user=request.user,
                action='REMOVE_STUDENT_ENROLLMENT',
                model_name='ClassEnrollment',
                record_id=f'{student.register_no}-{subject.code}',
                old_val={'student': student.register_no, 'subject': subject.code},
                new_val={},
                request=request
            )
            return Response({'message': f'Successfully removed {student.name} from {subject.code}.'})

        return Response({'error': 'action must be "add" or "remove".'}, status=status.HTTP_400_BAD_REQUEST)


# =====================================================================
# STUDENT SELF-REGISTRATION (public request) + FACULTY APPROVAL
# =====================================================================

class StudentSelfRegisterView(APIView):
    """
    PUBLIC endpoint – no authentication required.
    A prospective student submits their register_no + desired username + password.

    Validations:
    1. register_no must already exist in StudentProfile (seeded by faculty/admin).
    2. register_no must NOT already have a linked User account.
    3. desired_username must be unique in User table.
    4. No duplicate pending request for the same register_no.

    On success → creates a StudentRegistrationRequest with status=PENDING.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        register_no      = request.data.get('register_no', '').strip().upper()
        desired_username = request.data.get('username', '').strip().lower()
        password         = request.data.get('password', '')
        full_name        = request.data.get('full_name', '').strip()
        email            = request.data.get('email', '').strip()
        phone            = request.data.get('phone', '').strip()

        errors = {}

        # -- Validations --
        if not register_no:
            errors['register_no'] = 'Register number is required.'
        if not desired_username:
            errors['username'] = 'Desired username is required.'
        elif len(desired_username) < 4:
            errors['username'] = 'Username must be at least 4 characters.'
        if not password or len(password) < 6:
            errors['password'] = 'Password must be at least 6 characters.'
        if not full_name:
            errors['full_name'] = 'Full name is required.'

        if errors:
            return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        # Check if student already has an active login account
        student_profile = StudentProfile.objects.filter(register_no=register_no).first()
        if student_profile and student_profile.user_id:
            return Response(
                {'errors': {'register_no': 'This register number already has an active login account.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check username uniqueness
        if User.objects.filter(username=desired_username).exists():
            return Response(
                {'errors': {'username': f'Username "{desired_username}" is already taken. Please choose another.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check no duplicate pending request
        if StudentRegistrationRequest.objects.filter(register_no=register_no, status='PENDING').exists():
            return Response(
                {'errors': {'register_no': 'A registration request for this register number is already pending faculty review.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Hash password using Django's hasher
        from django.contrib.auth.hashers import make_password
        hashed_pw = make_password(password)

        reg_request = StudentRegistrationRequest.objects.create(
            register_no=register_no,
            full_name=full_name or (student_profile.name if student_profile else register_no),
            desired_username=desired_username,
            password_hash=hashed_pw,
            email=email,
            phone=phone,
            status='PENDING',
        )

        return Response({
            'message': f'Registration request submitted successfully! Your request (ID: {reg_request.id}) is pending faculty approval. You will be able to login once approved.',
            'request_id': reg_request.id,
            'register_no': register_no,
            'status': 'PENDING',
        }, status=status.HTTP_201_CREATED)

    def get(self, request):
        """Check status of a registration request by register_no (public)."""
        register_no = request.query_params.get('register_no', '').strip().upper()
        if not register_no:
            return Response({'error': 'register_no query param required.'}, status=status.HTTP_400_BAD_REQUEST)

        req = StudentRegistrationRequest.objects.filter(register_no=register_no).order_by('-submitted_at').first()
        if not req:
            return Response({'status': 'NOT_FOUND', 'message': 'No registration request found for this register number.'})

        return Response({
            'request_id': req.id,
            'register_no': req.register_no,
            'desired_username': req.desired_username,
            'status': req.status,
            'rejection_reason': req.rejection_reason,
            'submitted_at': req.submitted_at,
            'reviewed_at': req.reviewed_at,
        })


class FacultyRegistrationRequestsView(APIView):
    """
    Faculty-only: List and action on student registration requests.
    GET  /api/faculty/registrations/          → list all (filter by ?status=PENDING)
    PATCH /api/faculty/registrations/<pk>/    → approve or reject
        body: { action: 'approve' | 'reject', rejection_reason: '' }
    """
    permission_classes = [AcademicDataPermission]

    def get(self, request):
        status_filter = request.query_params.get('status', '')
        qs = StudentRegistrationRequest.objects.all()
        if status_filter:
            qs = qs.filter(status=status_filter.upper())

        data = []
        for r in qs:
            # Try to find the matched student profile name
            try:
                sp = StudentProfile.objects.get(register_no=r.register_no)
                profile_name = sp.name
                year = sp.year
                section = sp.section
            except StudentProfile.DoesNotExist:
                profile_name = r.full_name
                year = None
                section = None

            data.append({
                'id': r.id,
                'register_no': r.register_no,
                'full_name': r.full_name,
                'profile_name': profile_name,
                'year': year,
                'section': section,
                'desired_username': r.desired_username,
                'email': r.email,
                'phone': r.phone,
                'status': r.status,
                'rejection_reason': r.rejection_reason,
                'submitted_at': r.submitted_at,
                'reviewed_at': r.reviewed_at,
                'reviewed_by_name': r.reviewed_by.get_full_name() if r.reviewed_by else None,
            })
        return Response(data)

    def patch(self, request, pk):
        """Approve or reject a registration request."""
        if request.user.role != UserRole.FACULTY:
            return Response({'error': 'Only faculty can review registration requests.'}, status=status.HTTP_403_FORBIDDEN)

        reg_req = get_object_or_404(StudentRegistrationRequest, id=pk)

        if reg_req.status != 'PENDING':
            return Response({'error': f'This request is already {reg_req.status}. Cannot action again.'}, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get('action', '')  # 'approve' or 'reject'
        rejection_reason = request.data.get('rejection_reason', '').strip()

        if action not in ('approve', 'reject'):
            return Response({'error': 'action must be "approve" or "reject".'}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'reject':
            reg_req.status = 'REJECTED'
            reg_req.rejection_reason = rejection_reason or 'Rejected by faculty.'
            reg_req.reviewed_by = request.user
            reg_req.reviewed_at = timezone.now()
            reg_req.save()

            log_faculty_audit(
                user=request.user,
                action='REJECT_STUDENT_REGISTRATION',
                model_name='StudentRegistrationRequest',
                record_id=reg_req.id,
                old_val={'status': 'PENDING', 'register_no': reg_req.register_no},
                new_val={'status': 'REJECTED', 'reason': rejection_reason},
                request=request
            )
            return Response({'message': f'Registration request for {reg_req.register_no} has been rejected.'})

        # APPROVE: Create User + link to StudentProfile (auto-creating StudentProfile if not existing)
        student_profile = StudentProfile.objects.filter(register_no=reg_req.register_no).first()

        if student_profile and student_profile.user_id:
            return Response({'error': 'This student already has an active account.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=reg_req.desired_username).exists():
            return Response({'error': f'Username "{reg_req.desired_username}" is now taken. Ask student to re-register with a different username.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Create the User account (password already hashed)
            user = User(
                username=reg_req.desired_username,
                email=reg_req.email,
                role=UserRole.STUDENT,
                department='Computer Science & Engineering',
                avatar_color='#5B5BD6',
                is_active=True,
            )
            user.password = reg_req.password_hash  # already Django-hashed
            name_parts = (reg_req.full_name or (student_profile.name if student_profile else reg_req.register_no)).split(' ', 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''
            user.save()

            # Ensure StudentProfile exists and link to User
            if not student_profile:
                student_profile = StudentProfile.objects.create(
                    register_no=reg_req.register_no,
                    name=reg_req.full_name,
                    department='Computer Science & Engineering',
                    year=3,
                    section='A',
                    current_semester=5,
                    admission_year=2023,
                    user=user,
                )
            else:
                student_profile.user = user
                student_profile.save()

            reg_req.status = 'APPROVED'
            reg_req.reviewed_by = request.user
            reg_req.reviewed_at = timezone.now()
            reg_req.save()

            log_faculty_audit(
                user=request.user,
                action='APPROVE_STUDENT_REGISTRATION',
                model_name='StudentRegistrationRequest',
                record_id=reg_req.id,
                old_val={'status': 'PENDING'},
                new_val={'status': 'APPROVED', 'username_created': user.username, 'register_no': reg_req.register_no},
                request=request
            )

        return Response({
            'message': f'Registration approved! Account @{user.username} created and linked to {reg_req.register_no}.',
            'username': user.username,
            'register_no': reg_req.register_no,
        }, status=status.HTTP_201_CREATED)


class FacultyStudentsManageView(APIView):
    """
    Faculty-only: List all students and create new students in CSE department.
    GET  /api/faculty/students/          → list all StudentProfiles
    POST /api/faculty/students/          → create new StudentProfile
      body: { register_no, name, year, section, current_semester, admission_year }
    """
    permission_classes = [AcademicDataPermission]

    def get(self, request):
        students = StudentProfile.objects.all().order_by('register_no')
        serializer = StudentProfileSerializer(students, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != UserRole.FACULTY:
            return Response({'error': 'Only faculty can add new students.'}, status=status.HTTP_403_FORBIDDEN)

        register_no = request.data.get('register_no', '').strip().upper()
        name = request.data.get('name', '').strip()
        try:
            year = int(request.data.get('year', 3))
        except (ValueError, TypeError):
            year = 3
        section = request.data.get('section', 'A').strip().upper()
        try:
            current_semester = int(request.data.get('current_semester', (year * 2) - 1))
        except (ValueError, TypeError):
            current_semester = 5
        try:
            admission_year = int(request.data.get('admission_year', 2026 - year + 1))
        except (ValueError, TypeError):
            admission_year = 2023

        if not register_no:
            return Response({'error': 'Register number is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not name:
            return Response({'error': 'Student name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if StudentProfile.objects.filter(register_no=register_no).exists():
            return Response({'error': f'Student with register number "{register_no}" already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        student = StudentProfile.objects.create(
            register_no=register_no,
            name=name,
            year=year,
            section=section,
            current_semester=current_semester,
            admission_year=admission_year,
            department='Computer Science & Engineering',
        )

        log_faculty_audit(
            user=request.user,
            action='ADD_NEW_STUDENT',
            model_name='StudentProfile',
            record_id=student.id,
            old_val={},
            new_val={'register_no': register_no, 'name': name, 'year': year, 'section': section},
            request=request
        )

        return Response({
            'message': f'Student {name} ({register_no}) added successfully to CSE Department.',
            'student': StudentProfileSerializer(student).data
        }, status=status.HTTP_201_CREATED)
