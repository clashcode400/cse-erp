import datetime
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils import timezone


class UserRole(models.TextChoices):
    STUDENT = 'STUDENT', 'Student'
    FACULTY = 'FACULTY', 'Faculty'
    ADMIN = 'ADMIN', 'Admin'


class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.STUDENT,
        db_index=True
    )
    department = models.CharField(
        max_length=100,
        default='Computer Science & Engineering'
    )
    phone = models.CharField(max_length=20, blank=True)
    avatar_color = models.CharField(max_length=30, default='#5B5BD6')

    def is_student(self):
        return self.role == UserRole.STUDENT

    def is_faculty(self):
        return self.role == UserRole.FACULTY

    def is_admin_role(self):
        return self.role == UserRole.ADMIN

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile', null=True, blank=True)
    register_no = models.CharField(max_length=30, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    department = models.CharField(max_length=100, default='Computer Science & Engineering')
    year = models.IntegerField(choices=[(1, 'Year 1'), (2, 'Year 2'), (3, 'Year 3'), (4, 'Year 4')], default=3)
    section = models.CharField(max_length=5, default='A')
    current_semester = models.IntegerField(default=5)
    admission_year = models.IntegerField(default=2023)
    overall_cgpa = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    overall_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    overall_attendance_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    class Meta:
        ordering = ['register_no']

    def __str__(self):
        return f"{self.register_no} - {self.name} (Year {self.year})"


class FacultyProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='faculty_profile')
    faculty_id = models.CharField(max_length=30, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    department = models.CharField(max_length=100, default='Computer Science & Engineering')
    designation = models.CharField(max_length=100, default='Assistant Professor')
    cabin = models.CharField(max_length=100, default='CSE Block - Room 304')
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)

    class Meta:
        ordering = ['faculty_id']

    def __str__(self):
        return f"{self.faculty_id} - {self.name} ({self.designation})"


class Subject(models.Model):
    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    department = models.CharField(max_length=100, default='Computer Science & Engineering')
    semester = models.IntegerField(default=5)
    year = models.IntegerField(choices=[(1, 'Year 1'), (2, 'Year 2'), (3, 'Year 3'), (4, 'Year 4')], default=3)
    credits = models.IntegerField(default=4)
    faculty = models.ForeignKey(FacultyProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='subjects')
    syllabus_summary = models.TextField(blank=True)

    class Meta:
        ordering = ['semester', 'code']

    def __str__(self):
        return f"{self.code} - {self.name} (Sem {self.semester})"


class ClassEnrollment(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='enrollments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='enrollments')
    academic_year = models.CharField(max_length=20, default='2026-2027')
    semester = models.IntegerField(default=5)

    class Meta:
        unique_together = ('student', 'subject', 'academic_year')

    def __str__(self):
        return f"{self.student.register_no} -> {self.subject.code}"


class AttendanceSession(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='attendance_sessions')
    faculty = models.ForeignKey(FacultyProfile, on_delete=models.CASCADE, related_name='conducted_sessions')
    date = models.DateField(db_index=True)
    session_slot = models.CharField(max_length=50, default='09:00 - 10:00 AM')
    topic = models.CharField(max_length=200, blank=True)
    class_year = models.IntegerField(default=3)
    class_section = models.CharField(max_length=5, default='A')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def clean(self):
        super().clean()
        if self.date and self.date > timezone.localdate():
            raise ValidationError({'date': 'Future attendance dates are not allowed.'})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.subject.code} on {self.date} ({self.session_slot})"


class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('OD', 'On Duty'),
        ('LATE', 'Late'),
    ]
    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name='records')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='attendance_records')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PRESENT')
    remarks = models.CharField(max_length=150, blank=True)

    class Meta:
        unique_together = ('session', 'student')
        ordering = ['student__register_no']

    def __str__(self):
        return f"{self.student.register_no} - {self.session.subject.code} on {self.session.date}: {self.status}"


class InternalAssessment(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='assessments')
    name = models.CharField(max_length=100)  # e.g., 'Internal Assessment 1', 'Internal Assessment 2'
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=50.00)
    weightage_pct = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)
    date = models.DateField(default=datetime.date.today)

    class Meta:
        ordering = ['subject', 'date']

    def __str__(self):
        return f"{self.subject.code} - {self.name} (Max: {self.max_marks})"


class InternalMark(models.Model):
    assessment = models.ForeignKey(InternalAssessment, on_delete=models.CASCADE, related_name='marks')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='internal_marks')
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2)
    is_absent = models.BooleanField(default=False)
    remarks = models.CharField(max_length=150, blank=True)

    class Meta:
        unique_together = ('assessment', 'student')
        ordering = ['student__register_no']

    def clean(self):
        super().clean()
        if self.marks_obtained is not None:
            if self.marks_obtained < 0:
                raise ValidationError({'marks_obtained': 'Marks cannot be negative.'})
            if self.marks_obtained > self.assessment.max_marks:
                raise ValidationError({'marks_obtained': f'Marks cannot exceed maximum of {self.assessment.max_marks}.'})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.register_no} - {self.assessment.name}: {self.marks_obtained}/{self.assessment.max_marks}"


class SemesterResult(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='semester_results')
    semester = models.IntegerField()
    academic_year = models.CharField(max_length=20, default='2025-2026')
    sgpa = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    total_credits = models.IntegerField(default=0)
    earned_credits = models.IntegerField(default=0)
    total_marks_obtained = models.DecimalField(max_digits=7, decimal_places=2, default=0.00)
    total_max_marks = models.DecimalField(max_digits=7, decimal_places=2, default=0.00)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=[('PASS', 'Pass'), ('FAIL', 'Fail'), ('WITHHELD', 'Withheld')], default='PASS')
    published_date = models.DateField(default=datetime.date.today)

    class Meta:
        unique_together = ('student', 'semester')
        ordering = ['student', 'semester']

    def __str__(self):
        return f"{self.student.register_no} - Sem {self.semester} (SGPA: {self.sgpa})"


class SubjectGrade(models.Model):
    GRADE_CHOICES = [
        ('O', 'Outstanding (10)'),
        ('A+', 'Excellent (9)'),
        ('A', 'Very Good (8)'),
        ('B+', 'Good (7)'),
        ('B', 'Above Average (6)'),
        ('C', 'Average (5)'),
        ('U', 'Reappear / Fail (0)'),
    ]
    semester_result = models.ForeignKey(SemesterResult, on_delete=models.CASCADE, related_name='grades')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    internal_marks = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    external_marks = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    total_marks = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    grade = models.CharField(max_length=5, choices=GRADE_CHOICES, default='A')
    grade_point = models.IntegerField(default=8)
    result_status = models.CharField(max_length=10, choices=[('PASS', 'Pass'), ('FAIL', 'Fail')], default='PASS')

    class Meta:
        unique_together = ('semester_result', 'subject')

    def __str__(self):
        return f"{self.semester_result.student.register_no} - {self.subject.code}: {self.grade} ({self.grade_point})"


class Assignment(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='assignments')
    faculty = models.ForeignKey(FacultyProfile, on_delete=models.CASCADE, related_name='created_assignments')
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateTimeField(db_index=True)
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)
    year = models.IntegerField(default=3)
    section = models.CharField(max_length=5, default='A')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-due_date']

    def __str__(self):
        return f"{self.subject.code} - {self.title} (Due: {self.due_date})"


class AssignmentSubmission(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUBMITTED', 'Submitted'),
        ('LATE', 'Late'),
        ('GRADED', 'Graded'),
    ]
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='assignment_submissions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    submission_text = models.TextField(blank=True)
    file_url = models.CharField(max_length=300, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    marks_awarded = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    faculty_feedback = models.TextField(blank=True)

    class Meta:
        unique_together = ('assignment', 'student')
        ordering = ['assignment__due_date']

    def __str__(self):
        return f"{self.student.register_no} - {self.assignment.title} [{self.status}]"


class Project(models.Model):
    STATUS_CHOICES = [
        ('PROPOSED', 'Proposed'),
        ('IN_PROGRESS', 'In Progress'),
        ('REVIEW_SCHEDULED', 'Review Scheduled'),
        ('COMPLETED', 'Completed'),
    ]
    title = models.CharField(max_length=250)
    domain = models.CharField(max_length=150, default='Artificial Intelligence & Cloud Computing')
    guide = models.ForeignKey(FacultyProfile, on_delete=models.CASCADE, related_name='guided_projects')
    year = models.IntegerField(default=4)
    academic_year = models.CharField(max_length=20, default='2026-2027')
    abstract = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='IN_PROGRESS')
    students = models.ManyToManyField(StudentProfile, related_name='projects')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class ProjectReview(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='reviews')
    review_number = models.IntegerField(default=1)  # 0: Zeroth Review, 1: First Review, 2: Second, 3: Final Viva
    review_name = models.CharField(max_length=100, default='Project Review 1')
    review_date = models.DateTimeField()
    venue = models.CharField(max_length=100, default='CSE Project Lab 1')
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    marks_awarded = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    comments = models.TextField(blank=True)
    status = models.CharField(
        max_length=30,
        choices=[('SCHEDULED', 'Scheduled'), ('COMPLETED', 'Completed'), ('PENDING_REVISION', 'Pending Revision')],
        default='SCHEDULED'
    )

    class Meta:
        ordering = ['review_date']

    def __str__(self):
        return f"{self.project.title} - {self.review_name} ({self.review_date})"


class Notice(models.Model):
    CATEGORY_CHOICES = [
        ('ACADEMIC', 'Academic'),
        ('EXAM', 'Examination'),
        ('PLACEMENT', 'Placement & Internship'),
        ('PROJECT', 'Project Review'),
        ('EVENT', 'Technical Symposium & Hackathon'),
    ]
    title = models.CharField(max_length=250)
    content = models.TextField()
    posted_by = models.ForeignKey(FacultyProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='posted_notices')
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='ACADEMIC')
    is_pinned = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    target_year = models.IntegerField(null=True, blank=True)  # Null = All Years
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return f"[{self.category}] {self.title}"


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_entries')
    user_name = models.CharField(max_length=150, blank=True)
    user_role = models.CharField(max_length=30)
    action = models.CharField(max_length=100)  # e.g., 'UPDATE_INTERNAL_MARKS', 'BULK_ATTENDANCE_SAVE'
    model_name = models.CharField(max_length=100)
    record_id = models.CharField(max_length=100, blank=True)
    old_value = models.JSONField(default=dict, blank=True)
    new_value = models.JSONField(default=dict, blank=True)
    ip_address = models.CharField(max_length=50, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {self.user_name} ({self.user_role}) - {self.action} on {self.model_name}"


class GradeScaleConfig(models.Model):
    grade = models.CharField(max_length=5, unique=True)
    grade_point = models.IntegerField()
    min_mark = models.DecimalField(max_digits=5, decimal_places=2)
    max_mark = models.DecimalField(max_digits=5, decimal_places=2)
    description = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['-grade_point']

    def __str__(self):
        return f"{self.grade} ({self.grade_point} pts: {self.min_mark}-{self.max_mark})"


class StudentRegistrationRequest(models.Model):
    """
    Self-registration request submitted by a prospective student.
    Students provide their register_no (must already exist in StudentProfile
    without a linked user account) and choose a username + password.
    Faculty reviews and APPROVES or REJECTS the request.
    """
    STATUS_CHOICES = [
        ('PENDING',  'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    register_no   = models.CharField(max_length=30, db_index=True)
    full_name     = models.CharField(max_length=150)
    desired_username = models.CharField(max_length=150)
    password_hash = models.CharField(max_length=256)          # bcrypt / django-style hashed
    email         = models.EmailField(blank=True)
    phone         = models.CharField(max_length=20, blank=True)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    rejection_reason = models.TextField(blank=True)
    reviewed_by   = models.ForeignKey(
        'User', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='reviewed_registrations'
    )
    reviewed_at   = models.DateTimeField(null=True, blank=True)
    submitted_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"RegRequest [{self.status}] {self.register_no} → @{self.desired_username}"
