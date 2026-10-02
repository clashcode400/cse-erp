import datetime
from decimal import Decimal
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from core.models import (
    User, UserRole, StudentProfile, FacultyProfile, Subject,
    AttendanceSession, AttendanceRecord, InternalAssessment, InternalMark,
    AuditLog
)


class RolePermissionTests(APITestCase):
    """
    Automated test suite verifying:
    1. Students CANNOT write to academic endpoints (MUST return 403 Forbidden).
    2. Faculty CAN create and edit academic data.
    3. Admins CANNOT edit marks or attendance (returns 403 Forbidden).
    4. Audit logs are generated for faculty edits.
    """

    def setUp(self):
        # 1. Create Student
        self.student_user = User.objects.create_user(
            username='test_student',
            password='TestPassword123!',
            role=UserRole.STUDENT,
            department='Computer Science & Engineering'
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            register_no='23CSE999',
            name='Test Student',
            year=3,
            section='A'
        )

        # 2. Create Faculty
        self.faculty_user = User.objects.create_user(
            username='test_faculty',
            password='TestPassword123!',
            role=UserRole.FACULTY,
            department='Computer Science & Engineering'
        )
        self.faculty_profile = FacultyProfile.objects.create(
            user=self.faculty_user,
            faculty_id='FAC-TEST-01',
            name='Test Faculty',
            designation='Associate Professor'
        )

        # 3. Create Admin
        self.admin_user = User.objects.create_user(
            username='test_admin',
            password='TestPassword123!',
            role=UserRole.ADMIN,
            department='Computer Science & Engineering'
        )

        # 4. Create Academic Subject & Assessment
        self.subject = Subject.objects.create(
            code='CS599',
            name='Advanced Testing & Distributed Verification',
            semester=5,
            year=3,
            credits=4,
            faculty=self.faculty_profile
        )
        self.assessment = InternalAssessment.objects.create(
            subject=self.subject,
            name='Internal Assessment 1',
            max_marks=Decimal('50.00'),
            date=timezone.localdate()
        )

    def test_student_cannot_write_attendance_returns_403(self):
        """Rule: Student write requests must return 403. Never rely on hidden buttons alone."""
        self.client.force_authenticate(user=self.student_user)
        payload = {
            'subject_id': self.subject.id,
            'date': str(timezone.localdate()),
            'year': 3,
            'section': 'A',
            'roster': [{'student_id': self.student_profile.id, 'status': 'PRESENT'}]
        }
        response = self.client.post('/api/faculty/attendance/sheet/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_modify_internal_marks_returns_403(self):
        """Student attempting to update internal marks directly must receive 403."""
        self.client.force_authenticate(user=self.student_user)
        payload = {
            'assessment_id': self.assessment.id,
            'roster': [{'student_id': self.student_profile.id, 'marks_obtained': 50.0}]
        }
        response = self.client.post('/api/faculty/marks/sheet/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_edit_marks_returns_403(self):
        """Rule: Admin creates/deactivates accounts only; CANNOT edit marks, attendance or any academic data."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'assessment_id': self.assessment.id,
            'roster': [{'student_id': self.student_profile.id, 'marks_obtained': 45.0}]
        }
        response = self.client.post('/api/faculty/marks/sheet/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_faculty_can_save_attendance_and_creates_audit_log(self):
        """Rule: Faculty is the ONLY role that can create/edit academic data, generating audit logs."""
        self.client.force_authenticate(user=self.faculty_user)
        initial_log_count = AuditLog.objects.count()

        payload = {
            'subject_id': self.subject.id,
            'date': str(timezone.localdate()),
            'year': 3,
            'section': 'A',
            'roster': [{'student_id': self.student_profile.id, 'status': 'PRESENT'}]
        }
        response = self.client.post('/api/faculty/attendance/sheet/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))

        # Check Audit log was created
        self.assertEqual(AuditLog.objects.count(), initial_log_count + 1)
        latest_log = AuditLog.objects.first()
        self.assertEqual(latest_log.user, self.faculty_user)
        self.assertEqual(latest_log.action, 'SAVE_ATTENDANCE_SESSION')

    def test_future_attendance_date_rejected(self):
        """Rule: Validation: no future attendance dates allowed."""
        self.client.force_authenticate(user=self.faculty_user)
        future_date = str(timezone.localdate() + datetime.timedelta(days=2))
        payload = {
            'subject_id': self.subject.id,
            'date': future_date,
            'year': 3,
            'section': 'A',
            'roster': [{'student_id': self.student_profile.id, 'status': 'PRESENT'}]
        }
        response = self.client.post('/api/faculty/attendance/sheet/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('future', response.data.get('error', '').lower())

    def test_marks_exceeding_max_rejected(self):
        """Rule: Validation: marks within max."""
        self.client.force_authenticate(user=self.faculty_user)
        payload = {
            'assessment_id': self.assessment.id,
            'roster': [{'student_id': self.student_profile.id, 'marks_obtained': 99.0}]  # Max is 50.00
        }
        response = self.client.post('/api/faculty/marks/sheet/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('details', response.data)

    def test_student_can_read_own_dashboard(self):
        """Student should be able to read their own dashboard successfully."""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/student/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['profile']['register_no'], '23CSE999')
