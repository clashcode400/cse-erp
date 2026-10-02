from django.urls import path
from .views import (
    CustomLoginView, CurrentUserView, DemoAccountsView,
    StudentDashboardView, StudentAttendanceView, StudentMarksView, StudentResultsView,
    StudentSubmissionSubmitView,
    FacultyClassesAndSubjectsView,
    FacultyAttendanceSpreadsheetView, FacultyInternalMarksSpreadsheetView,
    FacultySemesterMarksSpreadsheetView, FacultyAssignmentManageView,
    FacultyGradeSubmissionView, FacultyNoticeManageView,
    FacultySubjectEditView, FacultySubjectStudentsView, FacultySubjectEnrollmentView,
    FacultyRegistrationRequestsView, FacultyStudentsManageView,
    StudentSelfRegisterView,
    AdminUsersView, AdminToggleUserStatusView, AdminAuditLogsView
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────
    path('auth/login/',         CustomLoginView.as_view(),   name='auth-login'),
    path('auth/me/',            CurrentUserView.as_view(),   name='auth-me'),
    path('auth/demo-accounts/', DemoAccountsView.as_view(),  name='demo-accounts'),

    # ── Student self-registration (PUBLIC – no auth needed) ───────────────
    path('auth/register/',      StudentSelfRegisterView.as_view(), name='student-self-register'),

    # ── Student portal (read-only, own data) ─────────────────────────────
    path('student/dashboard/',                       StudentDashboardView.as_view(),       name='student-dashboard'),
    path('student/attendance/',                      StudentAttendanceView.as_view(),      name='student-attendance'),
    path('student/marks/',                           StudentMarksView.as_view(),           name='student-marks'),
    path('student/results/',                         StudentResultsView.as_view(),         name='student-results'),
    path('student/submissions/<int:pk>/submit/',     StudentSubmissionSubmitView.as_view(),name='student-submit'),

    # ── Faculty portal (only role that writes academic data) ─────────────
    path('faculty/classes/',                         FacultyClassesAndSubjectsView.as_view(),        name='faculty-classes'),
    path('faculty/attendance/sheet/',                FacultyAttendanceSpreadsheetView.as_view(),     name='faculty-attendance-sheet'),
    path('faculty/marks/sheet/',                     FacultyInternalMarksSpreadsheetView.as_view(),  name='faculty-marks-sheet'),
    path('faculty/semester-marks/sheet/',            FacultySemesterMarksSpreadsheetView.as_view(),  name='faculty-semester-marks-sheet'),
    path('faculty/assignments/',                     FacultyAssignmentManageView.as_view(),          name='faculty-assignments'),
    path('faculty/submissions/<int:pk>/grade/',      FacultyGradeSubmissionView.as_view(),           name='faculty-grade-submission'),
    path('faculty/notices/',                         FacultyNoticeManageView.as_view(),              name='faculty-notices'),
    path('faculty/notices/<int:pk>/',                FacultyNoticeManageView.as_view(),              name='faculty-notice-detail'),

    # Faculty Subject Management (edit name/code + enrollment)
    path('faculty/subjects/<int:pk>/edit/',          FacultySubjectEditView.as_view(),          name='faculty-subject-edit'),
    path('faculty/subjects/<int:pk>/students/',      FacultySubjectStudentsView.as_view(),      name='faculty-subject-students'),
    path('faculty/subjects/<int:pk>/enroll/',        FacultySubjectEnrollmentView.as_view(),    name='faculty-subject-enroll'),

    # Faculty Registration Approvals & Student Management
    path('faculty/registrations/',                   FacultyRegistrationRequestsView.as_view(), name='faculty-registrations'),
    path('faculty/registrations/<int:pk>/',          FacultyRegistrationRequestsView.as_view(), name='faculty-registration-action'),
    path('faculty/students/',                        FacultyStudentsManageView.as_view(),       name='faculty-students-manage'),

    # ── Admin portal (account management only) ───────────────────────────
    path('admin/users/',                             AdminUsersView.as_view(),              name='admin-users'),
    path('admin/users/<int:pk>/toggle/',             AdminToggleUserStatusView.as_view(),   name='admin-toggle-user'),
    path('admin/audit-logs/',                        AdminAuditLogsView.as_view(),          name='admin-audit-logs'),
]
