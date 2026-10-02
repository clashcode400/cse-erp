from rest_framework import permissions


class IsStudentRole(permissions.BasePermission):
    """Allows access only to authenticated Students."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'STUDENT')


class IsFacultyRole(permissions.BasePermission):
    """Allows access only to authenticated Faculty members."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'FACULTY')


class IsAdminRole(permissions.BasePermission):
    """Allows access only to Administrator accounts."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'ADMIN' or request.user.is_superuser or request.user.is_staff)
        )


class AcademicDataPermission(permissions.BasePermission):
    """
    Enforces strict academic domain boundaries:
    - READ (GET, HEAD, OPTIONS): Allowed for authenticated Students, Faculty, and Admins.
    - WRITE (POST, PUT, PATCH, DELETE):
      * Faculty: ONLY role that can create/edit academic data (returns True).
      * Student: FORBIDDEN! Student write attempts must return 403.
      * Admin: FORBIDDEN! Admin cannot edit marks, attendance, or academic data.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        # Read methods are permitted for any valid logged-in user (filtered by role downstream)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Non-safe methods (POST, PUT, PATCH, DELETE):
        # STRICT RULE: Faculty is the ONLY role permitted to modify academic records.
        if request.user.role == 'FACULTY':
            return True

        # Students and Admins attempting to write MUST receive 403 Forbidden
        return False

    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False

        # Write operations: Only faculty
        if request.method not in permissions.SAFE_METHODS:
            return request.user.role == 'FACULTY'

        # Read operations:
        # If student, ensure they only access their own record
        if request.user.role == 'STUDENT':
            student_profile = getattr(request.user, 'student_profile', None)
            if not student_profile:
                return False

            if hasattr(obj, 'student'):
                return obj.student == student_profile
            if hasattr(obj, 'user'):
                return obj.user == request.user
            if hasattr(obj, 'students'):
                return student_profile in obj.students.all()
            return True  # Catalog data like Subject, Notice is visible to student

        # Faculty and Admin can inspect objects
        return True


class UserManagementOnlyAdmin(permissions.BasePermission):
    """
    Admin: creates/deactivates accounts only;
    Students and Faculty cannot access account administration endpoints.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'ADMIN' or request.user.is_superuser)
        )
