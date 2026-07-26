"""
Comprehensive Business Model Test Suite for Foresight
Tests: Registration, Login, Admin override, Free tier limits, Pro feature locks, Billing endpoints
"""

import requests
import json
import time
import sys
import random
import string
import os
import shutil

BASE = "http://127.0.0.1:8000/api/v1"

# Colors for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

passed = 0
failed = 0
errors = []

def test(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  {GREEN}✓ PASS{RESET}  {name}")
    else:
        failed += 1
        msg = f"  {RED}✗ FAIL{RESET}  {name}"
        if detail:
            msg += f"  — {YELLOW}{detail}{RESET}"
        print(msg)
        errors.append(f"{name}: {detail}")

def section(title):
    print(f"\n{BOLD}{CYAN}{'='*60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'='*60}{RESET}")

# Generate unique emails for this test run
suffix = ''.join(random.choices(string.ascii_lowercase, k=6))
ADMIN_EMAIL = "ashuthoshkumar808@gmail.com"
ADMIN_PASS  = "admin123456"
FREE_EMAIL  = f"freeuser_{suffix}@test.com"
FREE_PASS   = "testpass123"
PRO_EMAIL   = f"prouser_{suffix}@test.com"
PRO_PASS    = "testpass123"

USERS_FILE = os.path.join(os.path.dirname(__file__), "app", "data", "users.json")
BACKUP_FILE = os.path.join(os.path.dirname(__file__), "app", "data", "users.json.bak")

def setup():
    if os.path.exists(USERS_FILE):
        shutil.copy2(USERS_FILE, BACKUP_FILE)
        os.remove(USERS_FILE)
        print("Backed up users.json")

def teardown():
    if os.path.exists(BACKUP_FILE):
        shutil.move(BACKUP_FILE, USERS_FILE)
        print("\nRestored users.json")

setup()

try:
    print(f"\n{BOLD}🧪 Foresight Business Model Test Suite{RESET}")
    print(f"   Admin:  {ADMIN_EMAIL}")
    print(f"   Free:   {FREE_EMAIL}")
    print(f"   Pro:    {PRO_EMAIL}")

    # ─────────────────────────────────────────────────────────────
    # 0. HEALTH CHECK
    # ─────────────────────────────────────────────────────────────
    section("0. Health Check")
    try:
        r = requests.get(f"{BASE}/health", timeout=5)
        test("Backend is reachable", r.status_code == 200, f"status={r.status_code}")
    except Exception as e:
        test("Backend is reachable", False, str(e))
        print(f"\n{RED}Backend is not running. Aborting tests.{RESET}")
        sys.exit(1)

    # ─────────────────────────────────────────────────────────────
    # 1. REGISTRATION TESTS
    # ─────────────────────────────────────────────────────────────
    section("1. Registration")

    # 1a. Register Admin
    r = requests.post(f"{BASE}/auth/register", json={
        "email": ADMIN_EMAIL, "password": ADMIN_PASS, "name": "Admin Ashuthosh"
    })
    if r.status_code == 400 and "already registered" in r.text:
        # Admin already exists, login instead
        r = requests.post(f"{BASE}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
        if r.status_code != 200:
            # Try registering with admin pass
            test("Admin register/login", False, f"Could not login existing admin: {r.text}")
            admin_token = None
        else:
            admin_data = r.json()
            admin_token = admin_data.get("token")
            test("Admin login (existing)", True)
            test("Admin response has is_admin=True", admin_data["user"].get("is_admin") == True, f"got is_admin={admin_data['user'].get('is_admin')}")
    else:
        admin_data = r.json()
        admin_token = admin_data.get("token")
        test("Admin registration returns 200", r.status_code == 200, f"status={r.status_code}, body={r.text[:200]}")
        test("Admin response has is_admin=True", admin_data.get("user", {}).get("is_admin") == True, f"got {admin_data}")

    # 1b. Register Free user
    r = requests.post(f"{BASE}/auth/register", json={
        "email": FREE_EMAIL, "password": FREE_PASS, "name": "Free Tester"
    })
    free_data = r.json()
    free_token = free_data.get("token")
    test("Free user registration returns 200", r.status_code == 200, f"status={r.status_code}")
    test("Free user tier is 'free'", free_data.get("user", {}).get("tier") == "free", f"got tier={free_data.get('user', {}).get('tier')}")
    test("Free user is_admin is False", free_data.get("user", {}).get("is_admin") == False, f"got is_admin={free_data.get('user', {}).get('is_admin')}")

    # 1c. Register Pro user (will manually upgrade after)
    r = requests.post(f"{BASE}/auth/register", json={
        "email": PRO_EMAIL, "password": PRO_PASS, "name": "Pro Tester"
    })
    pro_data = r.json()
    pro_token = pro_data.get("token")
    test("Pro user registration returns 200", r.status_code == 200, f"status={r.status_code}")

    # 1d. Duplicate registration should fail
    r = requests.post(f"{BASE}/auth/register", json={
        "email": FREE_EMAIL, "password": FREE_PASS, "name": "Dup"
    })
    test("Duplicate registration returns 400", r.status_code == 400, f"status={r.status_code}")

    # 1e. Short password should fail
    r = requests.post(f"{BASE}/auth/register", json={
        "email": f"short_{suffix}@test.com", "password": "123", "name": "Short"
    })
    test("Short password returns 400", r.status_code == 400, f"status={r.status_code}")

    # ─────────────────────────────────────────────────────────────
    # 2. LOGIN TESTS
    # ─────────────────────────────────────────────────────────────
    section("2. Login")

    r = requests.post(f"{BASE}/auth/login", json={"email": FREE_EMAIL, "password": FREE_PASS})
    test("Free user login succeeds", r.status_code == 200)
    login_data = r.json()
    test("Login response includes tier", login_data.get("user", {}).get("tier") == "free")
    test("Login response includes is_admin", login_data.get("user", {}).get("is_admin") == False)

    r = requests.post(f"{BASE}/auth/login", json={"email": FREE_EMAIL, "password": "wrongpassword"})
    test("Wrong password returns 401", r.status_code == 401)

    r = requests.post(f"{BASE}/auth/login", json={"email": "nonexistent@test.com", "password": "test123"})
    test("Non-existent user returns 401", r.status_code == 401)

    # ─────────────────────────────────────────────────────────────
    # 3. /auth/me PROFILE TESTS
    # ─────────────────────────────────────────────────────────────
    section("3. Profile (/auth/me)")

    # 3a. Admin profile
    r = requests.get(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    test("Admin /me returns 200", r.status_code == 200)
    me = r.json().get("user", {})
    test("Admin /me shows is_admin=True", me.get("is_admin") == True, f"got {me.get('is_admin')}")
    test("Admin /me shows credits_used_today", "credits_used_today" in me)

    # 3b. Free user profile
    r = requests.get(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {free_token}"})
    test("Free /me returns 200", r.status_code == 200)
    me = r.json().get("user", {})
    test("Free /me shows tier=free", me.get("tier") == "free")
    test("Free /me shows is_admin=False", me.get("is_admin") == False)

    # 3c. No token
    r = requests.get(f"{BASE}/auth/me")
    test("No token /me returns 401", r.status_code == 401, f"status={r.status_code}")

    # 3d. Invalid token
    r = requests.get(f"{BASE}/auth/me", headers={"Authorization": "Bearer invalidtoken123"})
    test("Invalid token /me returns 401", r.status_code == 401, f"status={r.status_code}")

    # ─────────────────────────────────────────────────────────────
    # 4. ADMIN BYPASS TESTS (simulate endpoint)
    # ─────────────────────────────────────────────────────────────
    section("4. Admin Bypass (Unlimited Access)")

    for i in range(5):
        r = requests.post(f"{BASE}/scenarios/simulate", 
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"query": f"What if Hyderabad banned cars by 2030? (admin test {i+1})", "parameters": {"city": "Hyderabad"}}
        )
        if i == 0:
            test(f"Admin simulate #{i+1} returns 200", r.status_code == 200, f"status={r.status_code}")
        elif i == 4:
            test(f"Admin simulate #{i+1} (beyond 3 limit) still 200", r.status_code == 200, f"status={r.status_code}")

    # Admin can access Pro features
    r = requests.post(f"{BASE}/scenarios/goal-seek",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"goal": "Zero traffic fatalities", "city": "Hyderabad", "timeline": "2030"}
    )
    test("Admin can access /goal-seek", r.status_code == 200, f"status={r.status_code}")

    r = requests.post(f"{BASE}/scenarios/vision",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"scenario_summary": "EV adoption in Hyderabad", "city": "Hyderabad"}
    )
    test("Admin can access /vision", r.status_code == 200, f"status={r.status_code}")

    # ─────────────────────────────────────────────────────────────
    # 5. FREE USER CREDIT LIMIT TESTS
    # ─────────────────────────────────────────────────────────────
    section("5. Free User Daily Credit Limits")

    # Run 3 simulations (should all succeed)
    for i in range(3):
        r = requests.post(f"{BASE}/scenarios/simulate",
            headers={"Authorization": f"Bearer {free_token}"},
            json={"query": f"What if Hyderabad built 100 new parks? (free test {i+1})", "parameters": {"city": "Hyderabad"}}
        )
        test(f"Free user simulate #{i+1}/3 returns 200", r.status_code == 200, f"status={r.status_code}")

    # 4th simulation should be blocked with 402
    r = requests.post(f"{BASE}/scenarios/simulate",
        headers={"Authorization": f"Bearer {free_token}"},
        json={"query": "What if Hyderabad banned plastic? (free test 4)", "parameters": {"city": "Hyderabad"}}
    )
    test("Free user simulate #4 returns 402 (limit reached)", r.status_code == 402, f"status={r.status_code}, body={r.text[:200]}")

    # 5th simulation should also be blocked
    r = requests.post(f"{BASE}/scenarios/simulate",
        headers={"Authorization": f"Bearer {free_token}"},
        json={"query": "What if Hyderabad banned plastic? (free test 5)", "parameters": {"city": "Hyderabad"}}
    )
    test("Free user simulate #5 also returns 402", r.status_code == 402, f"status={r.status_code}")

    # ─────────────────────────────────────────────────────────────
    # 6. PRO FEATURE LOCK TESTS (Free user)
    # ─────────────────────────────────────────────────────────────
    section("6. Pro Feature Locks (Free User Blocked)")

    r = requests.post(f"{BASE}/scenarios/goal-seek",
        headers={"Authorization": f"Bearer {free_token}"},
        json={"goal": "Zero emissions", "city": "Hyderabad", "timeline": "2030"}
    )
    test("Free user blocked from /goal-seek (403)", r.status_code == 403, f"status={r.status_code}")

    r = requests.post(f"{BASE}/scenarios/vision",
        headers={"Authorization": f"Bearer {free_token}"},
        json={"scenario_summary": "EV adoption in Hyderabad", "city": "Hyderabad"}
    )
    test("Free user blocked from /vision (403)", r.status_code == 403, f"status={r.status_code}")

    # ─────────────────────────────────────────────────────────────
    # 7. UNAUTHENTICATED ACCESS TESTS
    # ─────────────────────────────────────────────────────────────
    section("7. Unauthenticated Access")

    r = requests.post(f"{BASE}/scenarios/simulate",
        json={"query": "What if Hyderabad had free buses?", "parameters": {"city": "Hyderabad"}}
    )
    test("No-auth /simulate returns 401", r.status_code == 401, f"status={r.status_code}")

    r = requests.post(f"{BASE}/scenarios/goal-seek",
        json={"goal": "Zero emissions", "city": "Hyderabad", "timeline": "2030"}
    )
    test("No-auth /goal-seek returns 401", r.status_code == 401, f"status={r.status_code}")

    r = requests.post(f"{BASE}/scenarios/vision",
        json={"scenario_summary": "EV adoption", "city": "Hyderabad"}
    )
    test("No-auth /vision returns 401", r.status_code == 401, f"status={r.status_code}")

    # ─────────────────────────────────────────────────────────────
    # 8. PRO USER UPGRADE & ACCESS TESTS
    # ─────────────────────────────────────────────────────────────
    section("8. Pro User Upgrade & Access")

    # Manually upgrade the Pro user's tier in users.json via webhook simulation
    r = requests.post(f"{BASE}/billing/webhook",
        json={
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "client_reference_id": PRO_EMAIL,
                    "customer": "cus_test_mock_123",
                    "customer_email": PRO_EMAIL
                }
            }
        }
    )
    test("Webhook upgrade returns 200", r.status_code == 200, f"status={r.status_code}")

    # Re-login to get fresh token with updated tier
    r = requests.post(f"{BASE}/auth/login", json={"email": PRO_EMAIL, "password": PRO_PASS})
    pro_login = r.json()
    pro_token = pro_login.get("token")
    test("Pro user login after upgrade succeeds", r.status_code == 200)
    test("Pro user tier is now 'pro'", pro_login.get("user", {}).get("tier") == "pro", f"got tier={pro_login.get('user', {}).get('tier')}")

    # Pro user should have unlimited simulate access
    for i in range(5):
        r = requests.post(f"{BASE}/scenarios/simulate",
            headers={"Authorization": f"Bearer {pro_token}"},
            json={"query": f"What if Delhi doubled metro? (pro test {i+1})", "parameters": {"city": "Delhi"}}
        )
        if i == 4:
            test(f"Pro user simulate #{i+1} (beyond 3 limit) returns 200", r.status_code == 200, f"status={r.status_code}")

    # Pro user should access all Pro features
    r = requests.post(f"{BASE}/scenarios/goal-seek",
        headers={"Authorization": f"Bearer {pro_token}"},
        json={"goal": "Zero emissions by 2035", "city": "Delhi", "timeline": "2035"}
    )
    test("Pro user can access /goal-seek", r.status_code == 200, f"status={r.status_code}")

    r = requests.post(f"{BASE}/scenarios/vision",
        headers={"Authorization": f"Bearer {pro_token}"},
        json={"scenario_summary": "Free public transport in Delhi", "city": "Delhi"}
    )
    test("Pro user can access /vision", r.status_code == 200, f"status={r.status_code}")

    # ─────────────────────────────────────────────────────────────
    # 9. BILLING ENDPOINTS
    # ─────────────────────────────────────────────────────────────
    section("9. Billing Endpoints")

    r = requests.post(f"{BASE}/billing/checkout-session",
        headers={"Authorization": f"Bearer {free_token}"}
    )
    test("Checkout session returns 200", r.status_code == 200, f"status={r.status_code}")
    checkout_data = r.json()
    test("Checkout session has url", "url" in checkout_data, f"keys={list(checkout_data.keys())}")

    r = requests.post(f"{BASE}/billing/checkout-session")
    test("Checkout session without auth returns 401", r.status_code == 401, f"status={r.status_code}")

    # ─────────────────────────────────────────────────────────────
    # 10. SUBSCRIPTION CANCELLATION (Downgrade)
    # ─────────────────────────────────────────────────────────────
    section("10. Subscription Cancellation (Downgrade)")

    r = requests.post(f"{BASE}/billing/webhook",
        json={
            "type": "customer.subscription.deleted",
            "data": {
                "object": {
                    "customer": "cus_test_mock_123"
                }
            }
        }
    )
    test("Cancellation webhook returns 200", r.status_code == 200)

    # Verify user is downgraded
    r = requests.post(f"{BASE}/auth/login", json={"email": PRO_EMAIL, "password": PRO_PASS})
    downgraded = r.json()
    test("Downgraded user tier is 'free' again", downgraded.get("user", {}).get("tier") == "free", f"got tier={downgraded.get('user', {}).get('tier')}")

    # ─────────────────────────────────────────────────────────────
    # 11. FREE ENDPOINTS (should not require auth)
    # ─────────────────────────────────────────────────────────────
    section("11. Free Endpoints (no auth needed)")

    r = requests.get(f"{BASE}/scenarios/suggestions?city=Hyderabad")
    test("/suggestions accessible without auth", r.status_code == 200, f"status={r.status_code}")

    r = requests.get(f"{BASE}/scenarios/leaderboard")
    test("/leaderboard accessible without auth", r.status_code == 200, f"status={r.status_code}")

    # ─────────────────────────────────────────────────────────────
    # SUMMARY
    # ─────────────────────────────────────────────────────────────
    print(f"\n{BOLD}{'='*60}{RESET}")
    total = passed + failed
    print(f"{BOLD}  RESULTS: {passed}/{total} passed, {failed} failed{RESET}")
    if failed == 0:
        print(f"  {GREEN}{BOLD}✅ ALL TESTS PASSED!{RESET}")
    else:
        print(f"  {RED}{BOLD}❌ {failed} TEST(S) FAILED:{RESET}")
        for e in errors:
            print(f"    {RED}• {e}{RESET}")
    print(f"{'='*60}\n")
    
finally:
    teardown()

sys.exit(0 if failed == 0 else 1)
