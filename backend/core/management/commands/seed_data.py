import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import (
    User, UserRole, StudentProfile, FacultyProfile, Subject, ClassEnrollment,
    AttendanceSession, AttendanceRecord, InternalAssessment, InternalMark,
    SemesterResult, SubjectGrade, Assignment, AssignmentSubmission,
    Project, ProjectReview, Notice, AuditLog, GradeScaleConfig
)
from core.services import calculate_student_cgpa_and_percentage, calculate_student_attendance


class Command(BaseCommand):
    help = 'Seeds realistic fictional academic data for the CSE Department ERP portal.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Wipe existing database records before seeding',
        )

    def handle(self, *args, **options):
        clean = options.get('clean', False)
        if User.objects.exists() and not clean:
            self.stdout.write(self.style.WARNING('Database already seeded. Skipping seed (use --clean to wipe and re-seed).'))
            return

        if clean:
            self.stdout.write(self.style.NOTICE('Clearing existing data...'))
            AuditLog.objects.all().delete()
            Notice.objects.all().delete()
            ProjectReview.objects.all().delete()
            Project.objects.all().delete()
            AssignmentSubmission.objects.all().delete()
            Assignment.objects.all().delete()
            SubjectGrade.objects.all().delete()
            SemesterResult.objects.all().delete()
            InternalMark.objects.all().delete()
            InternalAssessment.objects.all().delete()
            AttendanceRecord.objects.all().delete()
            AttendanceSession.objects.all().delete()
            ClassEnrollment.objects.all().delete()
            Subject.objects.all().delete()
            StudentProfile.objects.all().delete()
            FacultyProfile.objects.all().delete()
            User.objects.all().delete()
            GradeScaleConfig.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Data wiped. Seeding new data...'))
        else:
            self.stdout.write(self.style.NOTICE('Seeding new data...'))

        # 1. Configurable Grade Scale
        grade_scales = [
            ('O', 10, 90.0, 100.0, 'Outstanding performance'),
            ('A+', 9, 80.0, 89.9, 'Excellent understanding'),
            ('A', 8, 70.0, 79.9, 'Very Good'),
            ('B+', 7, 60.0, 69.9, 'Good mastery'),
            ('B', 6, 55.0, 59.9, 'Above Average'),
            ('C', 5, 50.0, 54.9, 'Average (Pass mark)'),
            ('U', 0, 0.0, 49.9, 'Reappear / Fail'),
        ]
        for g, pt, mn, mx, desc in grade_scales:
            GradeScaleConfig.objects.create(
                grade=g, grade_point=pt, min_mark=Decimal(str(mn)), max_mark=Decimal(str(mx)), description=desc
            )

        # 2. System Administrator (CANNOT edit marks/attendance, only accounts)
        admin_user = User.objects.create_superuser(
            username='admin_user',
            email='cse_admin@college.edu',
            password='AdminPassword123!',
            first_name='Dr. Rajesh',
            last_name='Narayanan',
            role=UserRole.ADMIN,
            department='Computer Science & Engineering',
            avatar_color='#12141F'
        )

        # 3. Faculty Members (THE ONLY ROLE THAT CAN EDIT MARKS/ATTENDANCE)
        faculty_users_data = [
            ('faculty_hod', 'Dr. K. Ramanathan', 'Dr.', 'Ramanathan', 'Professor & HOD', 'FAC-CSE-01', 'CSE Main Block 301', '#5B5BD6'),
            ('faculty_ananya', 'Dr. Ananya Sharma', 'Dr. Ananya', 'Sharma', 'Associate Professor', 'FAC-CSE-02', 'CSE Block 304', '#2DD4BF'),
            ('faculty_vikram', 'Prof. Vikram Sethi', 'Vikram', 'Sethi', 'Assistant Professor', 'FAC-CSE-03', 'CSE Block 306', '#F5B841'),
            ('faculty_priya', 'Prof. Priya Sundaram', 'Priya', 'Sundaram', 'Assistant Professor', 'FAC-CSE-04', 'CSE Block 308', '#FF7A6B'),
        ]

        faculty_profiles = {}
        for uname, full_name, f_name, l_name, desig, fid, cabin, color in faculty_users_data:
            u = User.objects.create_user(
                username=uname,
                email=f"{uname}@college.edu",
                password='FacultyPassword123!',
                first_name=f_name,
                last_name=l_name,
                role=UserRole.FACULTY,
                department='Computer Science & Engineering',
                avatar_color=color
            )
            fp = FacultyProfile.objects.create(
                user=u,
                faculty_id=fid,
                name=full_name,
                designation=desig,
                cabin=cabin,
                email=u.email,
                phone='+91 98401 23456'
            )
            faculty_profiles[uname] = fp

        # 4. CSE Subjects for Semester 5 (Year 3)
        subjects_data = [
            ('CS501', 'Database Management Systems', 5, 3, 4, faculty_profiles['faculty_priya'], 'Relational models, SQL optimization, transactions, ACID, indexing, distributed DBMS.'),
            ('CS502', 'Design & Analysis of Algorithms', 5, 3, 4, faculty_profiles['faculty_ananya'], 'Divide and conquer, dynamic programming, greedy methods, NP-completeness.'),
            ('CS503', 'Computer Networks', 5, 3, 4, faculty_profiles['faculty_vikram'], 'OSI/TCP layers, routing algorithms, TCP congestion control, socket programming.'),
            ('CS504', 'Operating Systems', 5, 3, 4, faculty_profiles['faculty_vikram'], 'Process scheduling, virtual memory, concurrency, file systems, IPC.'),
            ('CS505', 'Machine Learning & Deep Learning', 5, 3, 3, faculty_profiles['faculty_ananya'], 'Supervised learning, neural networks, CNNs, transformers, model evaluation.'),
            ('CS506', 'Cloud Computing & DevOps Lab', 5, 3, 2, faculty_profiles['faculty_hod'], 'Docker containers, Kubernetes, CI/CD pipelines, Terraform, microservices.'),
        ]

        created_subjects = {}
        for code, name, sem, yr, cr, fac, summary in subjects_data:
            s = Subject.objects.create(
                code=code,
                name=name,
                semester=sem,
                year=yr,
                credits=cr,
                faculty=fac,
                syllabus_summary=summary
            )
            created_subjects[code] = s

        # 5. Fictional Students (Computer Science & Engineering - Year 3, Section A)
        students_data = [
            ('student_rohit', '23CSE101', 'Rohit Verma', 3, 'A', 5, 2023, '#5B5BD6'),
            ('student_sneha', '23CSE102', 'Sneha Kulkarni', 3, 'A', 5, 2023, '#2DD4BF'),
            ('student_arjun', '23CSE103', 'Arjun Patel', 3, 'A', 5, 2023, '#FF7A6B'),  # Low attendance candidate < 75%
            ('student_deepa', '23CSE104', 'Deepa Iyer', 3, 'A', 5, 2023, '#A855F7'),
            ('student_karthik', '23CSE105', 'Karthik Nair', 3, 'A', 5, 2023, '#F5B841'), # Borderline attendance
        ]

        student_profiles = {}
        for uname, regno, name, yr, sec, sem, adm_yr, color in students_data:
            u = User.objects.create_user(
                username=uname,
                email=f"{uname}@student.college.edu",
                password='StudentPassword123!',
                first_name=name.split()[0],
                last_name=name.split()[-1],
                role=UserRole.STUDENT,
                department='Computer Science & Engineering',
                avatar_color=color
            )
            sp = StudentProfile.objects.create(
                user=u,
                register_no=regno,
                name=name,
                year=yr,
                section=sec,
                current_semester=sem,
                admission_year=adm_yr
            )
            student_profiles[uname] = sp

            # Enroll student in all 6 subjects
            for subj in created_subjects.values():
                ClassEnrollment.objects.create(student=sp, subject=subj, semester=sem)

        # 6. Seed Attendance Sessions (Past dates up to yesterday/today - NO future dates!)
        today = timezone.localdate()
        sessions = []
        # Generate 15 attendance sessions across the subjects over the past month
        for i in range(15, 0, -1):
            sess_date = today - datetime.timedelta(days=i * 2)
            for subj in created_subjects.values():
                sess = AttendanceSession.objects.create(
                    subject=subj,
                    faculty=subj.faculty or faculty_profiles['faculty_hod'],
                    date=sess_date,
                    session_slot='09:00 - 10:00 AM' if subj.code in ['CS501', 'CS502'] else '11:15 - 12:15 PM',
                    topic=f"Unit {((15 - i) % 4) + 1}: Core Concepts & Applications",
                    class_year=3,
                    class_section='A'
                )
                sessions.append((sess, subj.code))

        # Record attendance per student
        # Rohit: ~88% attendance
        # Sneha: ~96% attendance
        # Arjun: ~65% attendance (triggers Coral Warning < 75%)
        # Deepa: ~82% attendance
        # Karthik: ~72% attendance (triggers Coral Warning < 75%)
        for sess, code in sessions:
            for uname, sp in student_profiles.items():
                if uname == 'student_sneha':
                    status = 'PRESENT'
                elif uname == 'student_rohit':
                    status = 'ABSENT' if sess.id % 8 == 0 else 'PRESENT'
                elif uname == 'student_arjun':
                    # Absences to force below 75%
                    status = 'ABSENT' if (sess.id % 3 == 0 or sess.id % 7 == 0) else 'PRESENT'
                elif uname == 'student_deepa':
                    status = 'ABSENT' if sess.id % 5 == 0 else 'PRESENT'
                elif uname == 'student_karthik':
                    status = 'ABSENT' if (sess.id % 4 == 0 or sess.id % 9 == 0) else 'PRESENT'
                else:
                    status = 'PRESENT'

                AttendanceRecord.objects.create(session=sess, student=sp, status=status)

        # 7. Internal Assessments & Marks
        assessments = [
            ('CS501', 'Internal Assessment 1', 50.0, 20.0, today - datetime.timedelta(days=25)),
            ('CS501', 'Internal Assessment 2', 50.0, 20.0, today - datetime.timedelta(days=10)),
            ('CS502', 'Internal Assessment 1', 50.0, 20.0, today - datetime.timedelta(days=24)),
            ('CS502', 'Internal Assessment 2', 50.0, 20.0, today - datetime.timedelta(days=9)),
            ('CS503', 'Internal Assessment 1', 50.0, 20.0, today - datetime.timedelta(days=23)),
            ('CS503', 'Internal Assessment 2', 50.0, 20.0, today - datetime.timedelta(days=8)),
            ('CS504', 'Internal Assessment 1', 50.0, 20.0, today - datetime.timedelta(days=22)),
            ('CS504', 'Internal Assessment 2', 50.0, 20.0, today - datetime.timedelta(days=7)),
            ('CS505', 'Internal Assessment 1', 50.0, 20.0, today - datetime.timedelta(days=21)),
            ('CS505', 'Internal Assessment 2', 50.0, 20.0, today - datetime.timedelta(days=6)),
            ('CS506', 'Lab Model Practical', 50.0, 20.0, today - datetime.timedelta(days=5)),
        ]

        for s_code, a_name, max_m, wt, dt in assessments:
            assessment = InternalAssessment.objects.create(
                subject=created_subjects[s_code],
                name=a_name,
                max_marks=Decimal(str(max_m)),
                weightage_pct=Decimal(str(wt)),
                date=dt
            )
            # Give marks to students within max_marks
            marks_dist = {
                'student_rohit': 44.5,
                'student_sneha': 48.0,
                'student_arjun': 34.0,
                'student_deepa': 41.5,
                'student_karthik': 37.0,
            }
            for uname, sp in student_profiles.items():
                m_val = marks_dist.get(uname, 40.0)
                # Slight variation by assessment
                if '2' in a_name:
                    m_val = min(float(max_m), m_val + 1.5)
                InternalMark.objects.create(
                    assessment=assessment,
                    student=sp,
                    marks_obtained=Decimal(str(m_val)),
                    remarks='Good performance' if m_val > 40 else 'Needs improvement in algorithmic proofs'
                )

        # 8. Semester Results for Past Semesters (Sem 1 to Sem 4) + Current Sem 5
        # Grade scale mapping: O=10, A+=9, A=8, B+=7, B=6, C=5, U=0
        sem_history = [
            (1, '2023-2024', {'student_rohit': (8.40, 81.5), 'student_sneha': (9.20, 89.0), 'student_arjun': (7.00, 68.0), 'student_deepa': (7.90, 76.5), 'student_karthik': (7.50, 72.0)}),
            (2, '2023-2024', {'student_rohit': (8.65, 83.2), 'student_sneha': (9.35, 91.0), 'student_arjun': (7.20, 69.5), 'student_deepa': (8.15, 78.0), 'student_karthik': (7.60, 73.5)}),
            (3, '2024-2025', {'student_rohit': (8.90, 86.0), 'student_sneha': (9.50, 93.0), 'student_arjun': (7.10, 68.5), 'student_deepa': (8.20, 79.5), 'student_karthik': (7.80, 75.0)}),
            (4, '2024-2025', {'student_rohit': (8.85, 85.5), 'student_sneha': (9.60, 94.0), 'student_arjun': (7.30, 70.0), 'student_deepa': (8.30, 80.5), 'student_karthik': (7.90, 76.0)}),
        ]

        for sem_num, ac_yr, records in sem_history:
            for uname, sp in student_profiles.items():
                sgpa_val, pct_val = records.get(uname, (8.0, 78.0))
                sr = SemesterResult.objects.create(
                    student=sp,
                    semester=sem_num,
                    academic_year=ac_yr,
                    sgpa=Decimal(str(sgpa_val)),
                    total_credits=24,
                    earned_credits=24,
                    percentage=Decimal(str(pct_val)),
                    status='PASS',
                    published_date=today - datetime.timedelta(days=(5 - sem_num) * 120)
                )

                # Add sample subject grades for that semester
                for idx, subj in enumerate(created_subjects.values()):
                    gp = 9 if sgpa_val >= 9.0 else (8 if sgpa_val >= 8.0 else 7)
                    grd = 'O' if gp == 10 else ('A+' if gp == 9 else ('A' if gp == 8 else 'B+'))
                    SubjectGrade.objects.create(
                        semester_result=sr,
                        subject=subj,
                        internal_marks=Decimal('38.5'),
                        external_marks=Decimal(str(float(gp * 8.5) - 10.0)),
                        total_marks=Decimal(str(pct_val)),
                        grade=grd,
                        grade_point=gp,
                        result_status='PASS'
                    )

        # 9. Recalculate CGPA and update student profiles
        for sp in student_profiles.values():
            calculate_student_cgpa_and_percentage(sp)
            calculate_student_attendance(sp)

        # 10. Assignments & Submissions
        now = timezone.now()
        assignments_data = [
            (
                created_subjects['CS501'], faculty_profiles['faculty_priya'],
                'B+ Tree & Indexing Implementation',
                'Implement a B+ Tree indexing module in C++/Python handling split & merge on bulk insertions. Submit GitHub repository link and performance benchmark PDF.',
                now + datetime.timedelta(hours=18), # Urgent! Less than 24h
                20.0
            ),
            (
                created_subjects['CS502'], faculty_profiles['faculty_ananya'],
                'Dynamic Programming: Network Routing Bottlenecks',
                'Design dynamic programming formulations for multi-commodity flow with minimum congestion. Include mathematical proofs and test case analysis.',
                now + datetime.timedelta(days=4), # Upcoming
                25.0
            ),
            (
                created_subjects['CS503'], faculty_profiles['faculty_vikram'],
                'TCP Sliding Window Simulation in Mininet',
                'Simulate packet drops, timeout retransmissions, and cubic vs bbr congestion control using Mininet and Wireshark traces.',
                now - datetime.timedelta(days=3), # Past due
                20.0
            ),
        ]

        for subj, fac, title, desc, due, max_m in assignments_data:
            assign = Assignment.objects.create(
                subject=subj,
                faculty=fac,
                title=title,
                description=desc,
                due_date=due,
                max_marks=Decimal(str(max_m)),
                year=3,
                section='A'
            )
            # Create submissions
            for uname, sp in student_profiles.items():
                if 'Past' in desc or due < now:
                    # Graded or Submitted
                    sub_stat = 'GRADED'
                    awarded = Decimal(str(float(max_m) - 2.0))
                    submitted_time = due - datetime.timedelta(hours=4)
                    feedback = 'Solid trace analysis and clear graphs. Well done.'
                elif 'B+ Tree' in title:
                    # Nearest deadline: Rohit & Arjun pending, Sneha submitted
                    if uname in ['student_rohit', 'student_arjun', 'student_karthik']:
                        sub_stat = 'PENDING'
                        awarded = None
                        submitted_time = None
                        feedback = ''
                    else:
                        sub_stat = 'SUBMITTED'
                        awarded = None
                        submitted_time = now - datetime.timedelta(hours=2)
                        feedback = ''
                else:
                    # Dynamic programming assignment: Pending for all
                    sub_stat = 'PENDING'
                    awarded = None
                    submitted_time = None
                    feedback = ''

                AssignmentSubmission.objects.create(
                    assignment=assign,
                    student=sp,
                    status=sub_stat,
                    submission_text='https://github.com/cse-student/assignment-solution' if sub_stat != 'PENDING' else '',
                    submitted_at=submitted_time,
                    marks_awarded=awarded,
                    faculty_feedback=feedback
                )

        # 11. CSE Capstone / Mini Projects & Reviews
        project1 = Project.objects.create(
            title='Autonomous Edge Drone Surveillance with Vision-Language Models',
            domain='Artificial Intelligence & Robotics',
            guide=faculty_profiles['faculty_ananya'],
            year=3,
            academic_year='2026-2027',
            abstract='Deploying quantized vision-language models on edge NVIDIA Jetson Orin boards for real-time anomaly detection in smart city infrastructure.',
            status='IN_PROGRESS'
        )
        project1.students.add(student_profiles['student_rohit'], student_profiles['student_sneha'])

        project2 = Project.objects.create(
            title='Zero-Knowledge Proofs for Verifiable Cloud Database Queries',
            domain='Cryptographic Systems & Distributed Computing',
            guide=faculty_profiles['faculty_hod'],
            year=3,
            academic_year='2026-2027',
            abstract='A decentralized database integrity layer utilizing zk-SNARKs to prove SQL query execution correctness without leaking underlying sensitive tables.',
            status='REVIEW_SCHEDULED'
        )
        project2.students.add(student_profiles['student_arjun'], student_profiles['student_deepa'], student_profiles['student_karthik'])

        # Scheduled Project Reviews (with countdowns for student submission pending panel)
        ProjectReview.objects.create(
            project=project1,
            review_number=1,
            review_name='Phase 1: Architecture & Model Quantization Review',
            review_date=now + datetime.timedelta(days=6, hours=4),
            venue='CSE Project Lab 1 (Block B Room 204)',
            max_marks=Decimal('100.0'),
            status='SCHEDULED',
            comments='Prepare 15-minute slide deck with live edge FPS benchmark demonstration.'
        )

        ProjectReview.objects.create(
            project=project2,
            review_number=1,
            review_name='Phase 1: Cryptographic Primitives & Circuit Design Review',
            review_date=now + datetime.timedelta(days=2, hours=10), # Near deadline!
            venue='CSE Seminar Hall A',
            max_marks=Decimal('100.0'),
            status='SCHEDULED',
            comments='Circuits for SELECT, WHERE, and JOIN proofs must be executed in front of the review committee.'
        )

        # 12. Department Notices
        notices_data = [
            (
                'End-Semester Practical & Theory Examination Schedule (Nov/Dec 2026)',
                'The Controller of Examinations has published the final dates for Semester 5 B.Tech CSE examinations. Model practicals begin on Oct 14. Download the signed hall tickets from the department counter.',
                'EXAM', True, faculty_profiles['faculty_hod']
            ),
            (
                'Google Summer of Code & HackCSE 2026 Registration Open',
                'Annual 36-hour National Level Hackathon sponsored by Google Cloud & Intel. Theme: Distributed AI and Green Computing. Cash prize pool: INR 2.5 Lakhs. Register your teams before Oct 10.',
                'EVENT', True, faculty_profiles['faculty_ananya']
            ),
            (
                'Campus Placement Drive: Microsoft & Cisco Hiring Round 1',
                'Pre-placement talks and online assessment for 2027 batch will be held this Saturday at 10:00 AM. Dress code: Formal. Keep updated resumes and GitHub portfolios ready.',
                'PLACEMENT', False, faculty_profiles['faculty_vikram']
            ),
            (
                'Phase 1 Project Review Schedule & Evaluation Rubrics',
                'All 3rd Year project batches must submit the literature survey and system architecture diagrams before their scheduled slot. Review schedule is now posted on the notice board.',
                'PROJECT', False, faculty_profiles['faculty_hod']
            ),
            (
                'IEEE Computer Society Distinguished Lecture on Quantum Computing',
                'Join us in Main Auditorium this Thursday at 3:00 PM for a keynote by Dr. Leslie Lamport on formal verification and distributed consensus.',
                'ACADEMIC', False, faculty_profiles['faculty_priya']
            ),
        ]

        for title, content, cat, pinned, fac in notices_data:
            Notice.objects.create(
                title=title,
                content=content,
                posted_by=fac,
                category=cat,
                is_pinned=pinned,
                target_year=3
            )

        # 13. Audit Log Entries
        audit_samples = [
            (faculty_profiles['faculty_priya'].user, 'SAVE_ATTENDANCE_SESSION', 'AttendanceSession', '14', {'status': 'DRAFT'}, {'subject': 'CS501', 'total_students': 5, 'present': 4}),
            (faculty_profiles['faculty_ananya'].user, 'UPDATE_INTERNAL_MARKS', 'InternalAssessment', 'IA-1-CS502', {'max': 50}, {'subject': 'CS502', 'updated_students': 5}),
            (admin_user, 'CREATE_USER_ACCOUNT', 'User', 'student_karthik', {}, {'username': 'student_karthik', 'role': 'STUDENT'}),
        ]
        for u, action, m_name, rec_id, old_v, new_v in audit_samples:
            AuditLog.objects.create(
                user=u,
                user_name=u.get_full_name() or u.username,
                user_role=u.role,
                action=action,
                model_name=m_name,
                record_id=rec_id,
                old_value=old_v,
                new_value=new_v,
                ip_address='192.168.1.45'
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded CSE Department ERP database!'))
        self.stdout.write(self.style.SUCCESS(f'Users created: 1 Admin, {len(faculty_profiles)} Faculty, {len(student_profiles)} Students.'))
        self.stdout.write(self.style.SUCCESS('Demo credentials:'))
        self.stdout.write('  Student: student_rohit / StudentPassword123! (High CGPA 8.85)')
        self.stdout.write('  Student: student_arjun / StudentPassword123! (Low Attendance 65% warning)')
        self.stdout.write('  Faculty: faculty_ananya / FacultyPassword123! (Dr. Ananya Sharma)')
        self.stdout.write('  Faculty: faculty_hod / FacultyPassword123! (Dr. K. Ramanathan, HOD)')
        self.stdout.write('  Admin:   admin_user / AdminPassword123! (Dr. Rajesh Narayanan)')
