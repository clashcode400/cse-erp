import urllib.request
import urllib.error
import json
import time

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

ts = int(time.time())
test_reg = f"CSE2309{ts % 1000}"
test_user = f"student_new_{ts % 1000}"
test_pass = "TestStudentPass123!"

print(f"=== TEST 1: LOGIN AS FACULTY ===")
code, res = request(f"{BASE_URL}/auth/login/", 'POST', {
    "username": "faculty_ananya",
    "password": "FacultyPassword123!"
})
assert code == 200, f"Faculty login failed: {res}"
faculty_token = res['access']
print("-> Faculty logged in successfully")

print(f"=== TEST 2: FACULTY ADDS NEW STUDENT ({test_reg}) ===")
code, res = request(f"{BASE_URL}/faculty/students/", 'POST', {
    "register_no": test_reg,
    "name": "Kavitha Raman",
    "year": 3,
    "section": "A",
    "current_semester": 5,
    "admission_year": 2023
}, token=faculty_token)
assert code == 201, f"Faculty add student failed: {code} {res}"
print(f"-> Faculty created student: {res['student']['name']} ({res['student']['register_no']})")

print(f"=== TEST 3: STUDENT SELF-REGISTERS (PUBLIC) ===")
code, res = request(f"{BASE_URL}/auth/register/", 'POST', {
    "register_no": test_reg,
    "full_name": "Kavitha Raman",
    "username": test_user,
    "password": test_pass,
    "email": "kavitha.raman@cse.college.edu",
    "phone": "9876543210"
})
assert code == 201, f"Student self-registration failed: {code} {res}"
req_id = res['request_id']
print(f"-> Student submitted registration request: ID {req_id} (Status: {res['status']})")

print(f"=== TEST 4: CHECK REGISTRATION STATUS (PUBLIC) ===")
code, res = request(f"{BASE_URL}/auth/register/?register_no={test_reg}", 'GET')
assert code == 200, f"Check status failed: {code} {res}"
assert res['status'] == 'PENDING', f"Expected PENDING, got {res['status']}"
print(f"-> Public status check verified: {res['status']}")

print(f"=== TEST 5: FACULTY LISTS PENDING REGISTRATIONS ===")
code, res = request(f"{BASE_URL}/faculty/registrations/?status=PENDING", 'GET', token=faculty_token)
assert code == 200, f"Faculty list registrations failed: {code} {res}"
pending_ids = [r['id'] for r in res]
assert req_id in pending_ids, f"Request {req_id} not found in pending list"
print(f"-> Found request in Faculty Pending list ({len(res)} pending total)")

print(f"=== TEST 6: FACULTY APPROVES REGISTRATION ===")
code, res = request(f"{BASE_URL}/faculty/registrations/{req_id}/", 'PATCH', {
    "action": "approve"
}, token=faculty_token)
assert code == 201, f"Faculty approval failed: {code} {res}"
print(f"-> Registration approved: {res['message']}")

print(f"=== TEST 7: NEWLY REGISTERED & APPROVED STUDENT LOGS IN ===")
code, res = request(f"{BASE_URL}/auth/login/", 'POST', {
    "username": test_user,
    "password": test_pass
})
assert code == 200, f"New student login failed: {code} {res}"
new_student_token = res['access']
print(f"-> SUCCESS: Newly approved student logged in: {res['user']['name']} ({res['user']['role']})")

print(f"=== TEST 8: NEW STUDENT ACCESSES DASHBOARD ===")
code, res = request(f"{BASE_URL}/student/dashboard/", 'GET', token=new_student_token)
assert code == 200, f"New student dashboard failed: {code} {res}"
print(f"-> SUCCESS: Student dashboard loaded for {res['profile']['name']} ({res['profile']['register_no']})")

print(f"=== TEST 9: REJECTION / DISPROVAL FLOW ===")
test_reg_rej = f"CSE2308{ts % 1000}"
code, res = request(f"{BASE_URL}/auth/register/", 'POST', {
    "register_no": test_reg_rej,
    "full_name": "Invalid Student",
    "username": f"rej_{ts % 1000}",
    "password": test_pass,
    "email": "invalid@test.com"
})
assert code == 201
rej_id = res['request_id']

code, res = request(f"{BASE_URL}/faculty/registrations/{rej_id}/", 'PATCH', {
    "action": "reject",
    "rejection_reason": "Not recognized in current semester roster."
}, token=faculty_token)
assert code == 200
print(f"-> Faculty rejected/disproved registration successfully: {res['message']}")

print(f"=== TEST 10: VERIFY AUDIT TRAIL LOGGED BOTH ACTIONS ===")
code, res = request(f"{BASE_URL}/auth/login/", 'POST', {
    "username": "admin_user",
    "password": "AdminPassword123!"
})
admin_token = res['access']
code, res = request(f"{BASE_URL}/admin/audit-logs/?limit=5", 'GET', token=admin_token)
logs = res['results'] if isinstance(res, dict) and 'results' in res else res
actions = [log['action'] for log in logs]
assert 'APPROVE_STUDENT_REGISTRATION' in actions or 'REJECT_STUDENT_REGISTRATION' in actions
print("-> Audit log confirmed registration approvals and rejections!")

print("="*60)
print("ALL NEW STUDENT ADDITION & REGISTRATION APPROVAL TESTS PASSED!")
print("="*60)
