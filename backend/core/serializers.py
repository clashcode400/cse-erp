from rest_framework import serializers
from .models import (
    User, StudentProfile, FacultyProfile, Subject, ClassEnrollment,
    AttendanceSession, AttendanceRecord, InternalAssessment, InternalMark,
    SemesterResult, SubjectGrade, Assignment, AssignmentSubmission,
    Project, ProjectReview, Notice, AuditLog, GradeScaleConfig,
    StudentRegistrationRequest
)


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'role_display', 'department', 'phone', 'avatar_color', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class StudentProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'user', 'username', 'email', 'is_active', 'register_no', 'name',
            'department', 'year', 'section', 'current_semester', 'admission_year',
            'overall_cgpa', 'overall_percentage', 'overall_attendance_pct'
        ]
        read_only_fields = ['id', 'overall_cgpa', 'overall_percentage', 'overall_attendance_pct']


class FacultyProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)

    class Meta:
        model = FacultyProfile
        fields = [
            'id', 'user', 'username', 'is_active', 'faculty_id', 'name',
            'department', 'designation', 'cabin', 'email', 'phone'
        ]
        read_only_fields = ['id']


class SubjectSerializer(serializers.ModelSerializer):
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)

    class Meta:
        model = Subject
        fields = ['id', 'code', 'name', 'department', 'semester', 'year', 'credits', 'faculty', 'faculty_name', 'syllabus_summary']


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_reg = serializers.CharField(source='student.register_no', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = ['id', 'session', 'student', 'student_reg', 'student_name', 'status', 'remarks']


class AttendanceSessionSerializer(serializers.ModelSerializer):
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)
    records = AttendanceRecordSerializer(many=True, read_only=True)

    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'subject', 'subject_code', 'subject_name', 'faculty', 'faculty_name',
            'date', 'session_slot', 'topic', 'class_year', 'class_section', 'created_at', 'records'
        ]


class InternalMarkSerializer(serializers.ModelSerializer):
    student_reg = serializers.CharField(source='student.register_no', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    max_marks = serializers.DecimalField(source='assessment.max_marks', max_digits=5, decimal_places=2, read_only=True)
    assessment_name = serializers.CharField(source='assessment.name', read_only=True)

    class Meta:
        model = InternalMark
        fields = ['id', 'assessment', 'assessment_name', 'student', 'student_reg', 'student_name', 'marks_obtained', 'max_marks', 'is_absent', 'remarks']


class InternalAssessmentSerializer(serializers.ModelSerializer):
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    marks = InternalMarkSerializer(many=True, read_only=True)

    class Meta:
        model = InternalAssessment
        fields = ['id', 'subject', 'subject_code', 'subject_name', 'name', 'max_marks', 'weightage_pct', 'date', 'marks']


class SubjectGradeSerializer(serializers.ModelSerializer):
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    credits = serializers.IntegerField(source='subject.credits', read_only=True)

    class Meta:
        model = SubjectGrade
        fields = [
            'id', 'semester_result', 'subject', 'subject_code', 'subject_name', 'credits',
            'internal_marks', 'external_marks', 'total_marks', 'grade', 'grade_point', 'result_status'
        ]


class SemesterResultSerializer(serializers.ModelSerializer):
    student_reg = serializers.CharField(source='student.register_no', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    grades = SubjectGradeSerializer(many=True, read_only=True)

    class Meta:
        model = SemesterResult
        fields = [
            'id', 'student', 'student_reg', 'student_name', 'semester', 'academic_year',
            'sgpa', 'total_credits', 'earned_credits', 'total_marks_obtained', 'total_max_marks',
            'percentage', 'status', 'published_date', 'grades'
        ]


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_reg = serializers.CharField(source='student.register_no', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    max_marks = serializers.DecimalField(source='assignment.max_marks', max_digits=5, decimal_places=2, read_only=True)
    due_date = serializers.DateTimeField(source='assignment.due_date', read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'assignment', 'assignment_title', 'student', 'student_reg', 'student_name',
            'status', 'submission_text', 'file_url', 'submitted_at', 'marks_awarded', 'max_marks',
            'due_date', 'faculty_feedback'
        ]


class AssignmentSerializer(serializers.ModelSerializer):
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)
    submissions_count = serializers.IntegerField(source='submissions.count', read_only=True)

    class Meta:
        model = Assignment
        fields = [
            'id', 'subject', 'subject_code', 'subject_name', 'faculty', 'faculty_name',
            'title', 'description', 'due_date', 'max_marks', 'year', 'section', 'created_at',
            'submissions_count'
        ]


class ProjectReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectReview
        fields = ['id', 'project', 'review_number', 'review_name', 'review_date', 'venue', 'max_marks', 'marks_awarded', 'comments', 'status']


class ProjectSerializer(serializers.ModelSerializer):
    guide_name = serializers.CharField(source='guide.name', read_only=True)
    reviews = ProjectReviewSerializer(many=True, read_only=True)
    students_detail = StudentProfileSerializer(source='students', many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'domain', 'guide', 'guide_name', 'year', 'academic_year',
            'abstract', 'status', 'students', 'students_detail', 'created_at', 'reviews'
        ]


class NoticeSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.CharField(source='posted_by.name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Notice
        fields = [
            'id', 'title', 'content', 'posted_by', 'posted_by_name', 'category', 'category_display',
            'is_pinned', 'is_active', 'target_year', 'created_at', 'expires_at'
        ]


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_name', 'user_role', 'action', 'model_name', 'record_id', 'old_value', 'new_value', 'ip_address', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class GradeScaleConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeScaleConfig
        fields = ['id', 'grade', 'grade_point', 'min_mark', 'max_mark', 'description']
