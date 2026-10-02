from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.utils import timezone
from .models import (
    StudentProfile, AttendanceRecord, AttendanceSession,
    InternalMark, SemesterResult, SubjectGrade,
    AssignmentSubmission, ProjectReview, AuditLog
)


def log_faculty_audit(user, action, model_name, record_id, old_val, new_val, request=None):
    """
    Creates an immutable audit log entry for changes made by faculty or administrative roles.
    Logs who changed what, old value, new value, and timestamp.
    """
    ip = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')

    user_name = user.get_full_name() or user.username if user else "System"
    user_role = getattr(user, 'role', 'UNKNOWN') if user else "SYSTEM"

    return AuditLog.objects.create(
        user=user,
        user_name=user_name,
        user_role=user_role,
        action=action,
        model_name=model_name,
        record_id=str(record_id),
        old_value=old_val if isinstance(old_val, dict) else {"data": old_val},
        new_value=new_val if isinstance(new_val, dict) else {"data": new_val},
        ip_address=ip
    )


def calculate_student_attendance(student: StudentProfile):
    """
    Calculates attendance metrics:
    - Subject-wise: present, total, % (attendance % = present / total * 100)
    - Warning threshold: warn if below 75%
    - Overall attendance %
    """
    # Get all attendance records for student
    records = AttendanceRecord.objects.filter(student=student).select_related('session__subject')
    
    total_conducted = records.count()
    # Present includes 'PRESENT' and 'OD' (On Duty counts as attended in engineering departments)
    attended_count = records.filter(status__in=['PRESENT', 'OD']).count()

    overall_pct = (Decimal(attended_count) / Decimal(total_conducted) * Decimal(100.00)) if total_conducted > 0 else Decimal(0.00)
    overall_pct = round(overall_pct, 2)

    # Subject-wise calculation
    subject_map = {}
    for r in records:
        subj = r.session.subject
        if subj.id not in subject_map:
            subject_map[subj.id] = {
                'subject_id': subj.id,
                'code': subj.code,
                'name': subj.name,
                'credits': subj.credits,
                'total_classes': 0,
                'attended_classes': 0,
                'percentage': 0.0,
                'is_low_attendance': False,
            }
        subject_map[subj.id]['total_classes'] += 1
        if r.status in ['PRESENT', 'OD']:
            subject_map[subj.id]['attended_classes'] += 1

    subject_list = []
    for s_id, s_data in subject_map.items():
        if s_data['total_classes'] > 0:
            pct = round((Decimal(s_data['attended_classes']) / Decimal(s_data['total_classes'])) * Decimal(100.0), 2)
        else:
            pct = Decimal(0.0)
        s_data['percentage'] = float(pct)
        s_data['is_low_attendance'] = pct < Decimal(75.0)
        subject_list.append(s_data)

    return {
        'total_classes': total_conducted,
        'attended_classes': attended_count,
        'overall_percentage': float(overall_pct),
        'is_low_overall': overall_pct < Decimal(75.0),
        'subjects': subject_list
    }


def calculate_student_internal_marks(student: StudentProfile):
    """
    Subject-wise internal assessment marks with progress bars and percentage calculation.
    """
    marks = InternalMark.objects.filter(student=student).select_related('assessment__subject')

    subject_marks_map = {}
    for m in marks:
        subj = m.assessment.subject
        if subj.id not in subject_marks_map:
            subject_marks_map[subj.id] = {
                'subject_id': subj.id,
                'subject_code': subj.code,
                'subject_name': subj.name,
                'assessments': [],
                'total_obtained': Decimal(0),
                'total_max': Decimal(0),
                'percentage': 0.0
            }
        
        obtained = Decimal(0) if m.is_absent else m.marks_obtained
        max_m = m.assessment.max_marks
        pct = round((obtained / max_m * Decimal(100.0)), 2) if max_m > 0 else Decimal(0)

        subject_marks_map[subj.id]['assessments'].append({
            'assessment_id': m.assessment.id,
            'name': m.assessment.name,
            'date': str(m.assessment.date),
            'marks_obtained': float(obtained),
            'max_marks': float(max_m),
            'percentage': float(pct),
            'is_absent': m.is_absent,
            'remarks': m.remarks
        })
        subject_marks_map[subj.id]['total_obtained'] += obtained
        subject_marks_map[subj.id]['total_max'] += max_m

    result = []
    for s_id, s_data in subject_marks_map.items():
        total_max = s_data['total_max']
        total_obtained = s_data['total_obtained']
        if total_max > 0:
            subj_pct = round((total_obtained / total_max * Decimal(100.0)), 2)
        else:
            subj_pct = Decimal(0)
        s_data['percentage'] = float(subj_pct)
        s_data['total_obtained'] = float(total_obtained)
        s_data['total_max'] = float(total_max)
        result.append(s_data)

    return result


def calculate_student_cgpa_and_percentage(student: StudentProfile):
    """
    Server-side formulas:
    - Percentage = total obtained / total max * 100
    - CGPA = Σ(credit * grade point) / Σ credits
    - Semester-wise trend list
    """
    sem_results = SemesterResult.objects.filter(student=student).order_by('semester').prefetch_related('grades__subject')

    cumulative_credits = 0
    cumulative_points = Decimal(0)
    total_obtained_all = Decimal(0)
    total_max_all = Decimal(0)

    trend = []
    semesters_detail = []

    for sem in sem_results:
        sem_grades = sem.grades.all()
        sem_credits = 0
        sem_points = Decimal(0)
        sem_obtained = Decimal(0)
        sem_max = Decimal(0)

        grade_items = []
        for g in sem_grades:
            c = g.subject.credits
            sem_credits += c
            sem_points += Decimal(c * g.grade_point)
            sem_obtained += g.total_marks
            sem_max += Decimal(100.0)  # Standard total marks per subject

            grade_items.append({
                'subject_code': g.subject.code,
                'subject_name': g.subject.name,
                'credits': c,
                'internal_marks': float(g.internal_marks),
                'external_marks': float(g.external_marks),
                'total_marks': float(g.total_marks),
                'grade': g.grade,
                'grade_point': g.grade_point,
                'result_status': g.result_status
            })

        sgpa = round(sem_points / Decimal(sem_credits), 2) if sem_credits > 0 else Decimal(0)
        sem_pct = round((sem_obtained / sem_max * Decimal(100.0)), 2) if sem_max > 0 else Decimal(0)

        cumulative_credits += sem_credits
        cumulative_points += sem_points
        total_obtained_all += sem_obtained
        total_max_all += sem_max

        trend.append({
            'semester': f"Sem {sem.semester}",
            'semester_num': sem.semester,
            'sgpa': float(sgpa),
            'percentage': float(sem_pct)
        })

        semesters_detail.append({
            'semester': sem.semester,
            'academic_year': sem.academic_year,
            'sgpa': float(sgpa),
            'percentage': float(sem_pct),
            'total_credits': sem_credits,
            'earned_credits': sem.earned_credits or sem_credits,
            'status': sem.status,
            'grades': grade_items
        })

    overall_cgpa = round(cumulative_points / Decimal(cumulative_credits), 2) if cumulative_credits > 0 else Decimal(0)
    overall_pct = round((total_obtained_all / total_max_all * Decimal(100.0)), 2) if total_max_all > 0 else Decimal(0)

    # Persist the freshly computed summary on the student profile
    student.overall_cgpa = overall_cgpa
    student.overall_percentage = overall_pct
    student.save(update_fields=['overall_cgpa', 'overall_percentage'])

    return {
        'overall_cgpa': float(overall_cgpa),
        'overall_percentage': float(overall_pct),
        'cumulative_credits': cumulative_credits,
        'trend': trend,
        'semesters': semesters_detail
    }


def get_student_submission_pending(student: StudentProfile):
    """
    Returns all unsubmitted assignments and upcoming project reviews sorted by nearest deadline with countdown metadata.
    """
    now = timezone.now()
    pending_items = []

    # 1. Assignments pending for this student
    submissions = AssignmentSubmission.objects.filter(
        student=student,
        status__in=['PENDING', 'LATE']
    ).select_related('assignment__subject', 'assignment__faculty')

    for sub in submissions:
        assign = sub.assignment
        diff = assign.due_date - now
        seconds_left = int(diff.total_seconds())
        is_overdue = seconds_left < 0

        pending_items.append({
            'id': f"assign-{sub.id}",
            'submission_id': sub.id,
            'type': 'ASSIGNMENT',
            'title': assign.title,
            'subject': f"{assign.subject.code} - {assign.subject.name}",
            'faculty': assign.faculty.name if assign.faculty else "Faculty",
            'due_date': assign.due_date.isoformat(),
            'seconds_left': seconds_left,
            'is_overdue': is_overdue,
            'max_marks': float(assign.max_marks),
            'status': sub.status,
            'urgency': 'URGENT' if 0 < seconds_left <= 86400 else ('OVERDUE' if is_overdue else 'NORMAL')
        })

    # 2. Upcoming Project Reviews for student's projects
    student_projects = student.projects.all()
    upcoming_reviews = ProjectReview.objects.filter(
        project__in=student_projects,
        status='SCHEDULED'
    ).select_related('project')

    for rev in upcoming_reviews:
        diff = rev.review_date - now
        seconds_left = int(diff.total_seconds())
        is_overdue = seconds_left < 0

        pending_items.append({
            'id': f"project-{rev.id}",
            'review_id': rev.id,
            'type': 'PROJECT_REVIEW',
            'title': f"{rev.project.title} - {rev.review_name}",
            'subject': 'CSE Capstone Project',
            'venue': rev.venue,
            'due_date': rev.review_date.isoformat(),
            'seconds_left': seconds_left,
            'is_overdue': is_overdue,
            'max_marks': float(rev.max_marks),
            'status': rev.status,
            'urgency': 'URGENT' if 0 < seconds_left <= 86400 else ('OVERDUE' if is_overdue else 'NORMAL')
        })

    # Sort ascending by deadline (nearest first; overdue items will be at the very top or negative)
    pending_items.sort(key=lambda x: x['seconds_left'])
    return pending_items
