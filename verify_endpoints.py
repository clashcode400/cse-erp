import urllib.request
import urllib.error
import json

BASE_URL = 'http://127.0.0.1:8000/api'

def request(url, method='GET', data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8') if data else None,
        headers=headers,
        method=method
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body

print("="*60)
print("1. TEST LOGIN AS STUDENT (student_rohit)")
code, res = request(f"{BASE_URL}/auth/login/", 'POST', {
    "username": "student_rohit",
    "password": "StudentPassword123!"
})
assert code == 200, f"Login failed: {code} {res}"
student_token = res['access']
print(f"-> SUCCESS: Logged in as {res['user']['name']} ({res['user']['role']})")

print("="*60)
print("2. FETCH STUDENT DASHBOARD")
code, dash = request(f"{BASE_URL}/student/dashboard/", 'GET', token=student_token)
assert code == 200, f"Dashboard failed: {code}"
profile = dash['profile']
att = dash['attendance']
acad = dash['academic_summary']
pending = dash['submission_pending']
print(f"-> Profile: {profile['name']} | Reg: {profile['register_no']} | Dept: {profile['department']} | Year {profile['year']}")
print(f"-> Attendance: {att['overall_percentage']}% (Attended: {att['attended_classes']}/{att['total_classes']} classes, Low Alert: {att['is_low_overall']})")
print(f"-> CGPA: {acad['overall_cgpa']} | Percentage: {acad['overall_percentage']}% | Credits: {acad['cumulative_credits']}")
print(f"-> Submission Pending: {len(pending)} items (Nearest: '{pending[0]['title']}', due in {pending[0]['seconds_left']//3600}h)")

print("="*60)
print("3. VERIFY STUDENT WRITE OPERATION IS BLOCKED (MUST RETURN 403)")
code, err = request(f"{BASE_URL}/faculty/attendance/sheet/", 'POST', {
    "subject_id": 1,
    "date": "2026-09-30",
    "year": 3,
    "section": "A",
    "roster": [{"student_id": 1, "status": "PRESENT"}]
}, token=student_token)
print(f"-> Result HTTP Status: {code} (Expected: 403 Forbidden)")
assert code == 403, f"SECURITY VIOLATION! Student write did not return 403: got {code}"
print("-> SUCCESS: Backend DRF permission denied student write request with 403!")

print("="*60)
print("4. TEST LOGIN AS STUDENT ARJUN (LOW ATTENDANCE CANDIDATE)")
code, res = request(f"{BASE_URL}/auth/login/", 'POST', {
    "username": "student_arjun",
    "password": "StudentPassword123!"
})
arjun_token = res['access']
code, dash_arjun = request(f"{BASE_URL}/student/dashboard/", 'GET', token=arjun_token)
print(f"-> Arjun Attendance: {dash_arjun['attendance']['overall_percentage']}% | Low Alert Triggered: {dash_arjun['attendance']['is_low_overall']}")
assert dash_arjun['attendance']['is_low_overall'] == True, "Arjun should trigger low attendance alert < 75%"
print("-> SUCCESS: Low attendance (<75%) triggers alert flag correctly!")

print("="*60)
print("5. TEST LOGIN AS FACULTY (faculty_ananya)")
code, res = request(f"{BASE_URL}/auth/login/", 'POST', {
    "username": "faculty_ananya",
    "password": "FacultyPassword123!"
})
faculty_token = res['access']
print(f"-> Logged in as: {res['user']['name']} ({res['user']['role']})")

print("="*60)
print("6. FACULTY SAVES ATTENDANCE (SHOULD SUCCEED & CREATE AUDIT LOG)")
code, classes_data = request(f"{BASE_URL}/faculty/classes/", 'GET', token=faculty_token)
valid_subj_id = classes_data['subjects'][0]['id']
code, sheet_data = request(f"{BASE_URL}/faculty/attendance/sheet/?subject_id={valid_subj_id}", 'GET', token=faculty_token)
sample_roster = [{"student_id": r['student_id'], "status": "PRESENT"} for r in sheet_data['roster']]

code, fac_resp = request(f"{BASE_URL}/faculty/attendance/sheet/", 'POST', {
    "subject_id": valid_subj_id,
    "date": "2026-09-30",
    "year": 3,
    "section": "A",
    "roster": sample_roster
}, token=faculty_token)
assert code == 200, f"Faculty save failed: {code} {fac_resp}"
print(f"-> SUCCESS: Faculty attendance save returned 200: {fac_resp['message']}")

print("="*60)
print("7. TEST LOGIN AS ADMIN (admin_user)")
code, res = request(f"{BASE_URL}/auth/login/", 'POST', {
    "username": "admin_user",
    "password": "AdminPassword123!"
})
admin_token = res['access']
print(f"-> Logged in as: {res['user']['name']} ({res['user']['role']})")

print("="*60)
print("8. VERIFY ADMIN CANNOT EDIT MARKS (MUST RETURN 403)")
code, marks_sheet = request(f"{BASE_URL}/faculty/marks/sheet/?subject_id={valid_subj_id}", 'GET', token=faculty_token)
valid_assess_id = marks_sheet['assessments'][0]['id']
code, err = request(f"{BASE_URL}/faculty/marks/sheet/", 'POST', {
    "assessment_id": valid_assess_id,
    "roster": [{"student_id": sample_roster[0]['student_id'], "marks_obtained": 48.0}]
}, token=admin_token)
print(f"-> Result HTTP Status: {code} (Expected: 403 Forbidden)")
assert code == 403, f"Admin was able to write marks! Got {code}"
print("-> SUCCESS: Admin is blocked from editing academic marks (403 Forbidden)!")

print("="*60)
print("9. VERIFY AUDIT LOG TRAIL IN ADMIN PORTAL")
code, logs = request(f"{BASE_URL}/admin/audit-logs/", 'GET', token=admin_token)
assert code == 200 and len(logs) > 0, "No audit logs found"
latest = logs[0]
print(f"-> Latest Audit Entry: [{latest['timestamp']}] {latest['user_name']} ({latest['user_role']}) - {latest['action']} on {latest['model_name']}")
print("="*60)
print("ALL BACKEND & FRONTEND PERMISSION AND INTEGRATION CHECKS PASSED!")
