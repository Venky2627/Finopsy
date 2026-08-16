"""
Finopsy Phase 2.4 — RLS Isolation Security Test

Tests Row Level Security on the local Supabase instance using
real authenticated user JWTs (NOT the service-role key).

Covers:
  - User A can read own transactions
  - User B cannot read User A's transactions
  - User A cannot read User B's transactions
  - Cross-user INSERT blocked
  - Cross-user UPDATE blocked
  - Cross-user DELETE blocked
  - user_id reassignment blocked via UPDATE
"""

import requests
import json
import pytest

# Local Supabase endpoints (from `npx supabase start`)
API_URL = "http://127.0.0.1:54321"
GOTRUE_URL = f"{API_URL}/auth/v1"
REST_URL = f"{API_URL}/rest/v1"

ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"


def _headers(access_token: str) -> dict:
    """Build PostgREST headers using a real user JWT."""
    return {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _admin_headers() -> dict:
    """Service-role headers — used ONLY for user creation setup, never for RLS tests."""
    return {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


def create_user(email: str, password: str) -> dict:
    """Create a user via GoTrue admin API and return the full user object."""
    resp = requests.post(
        f"{GOTRUE_URL}/admin/users",
        headers=_admin_headers(),
        json={
            "email": email,
            "password": password,
            "email_confirm": True,
        },
    )
    assert resp.status_code in (200, 201), f"Failed to create user {email}: {resp.text}"
    return resp.json()


def login_user(email: str, password: str) -> str:
    """Login via GoTrue and return the access_token (real JWT)."""
    resp = requests.post(
        f"{GOTRUE_URL}/token?grant_type=password",
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
        json={"email": email, "password": password},
    )
    assert resp.status_code == 200, f"Failed to login {email}: {resp.text}"
    return resp.json()["access_token"]


def cleanup_user(user_id: str):
    """Delete a user via GoTrue admin API."""
    requests.delete(
        f"{GOTRUE_URL}/admin/users/{user_id}",
        headers=_admin_headers(),
    )


# ──────────────────────────────────────────────
#  FIXTURES
# ──────────────────────────────────────────────

@pytest.fixture(scope="module")
def users():
    """Create two test users, yield their info, then clean up."""
    user_a_data = create_user("user-a@test.finopsy.local", "password-a-secure-123")
    user_b_data = create_user("user-b@test.finopsy.local", "password-b-secure-456")

    token_a = login_user("user-a@test.finopsy.local", "password-a-secure-123")
    token_b = login_user("user-b@test.finopsy.local", "password-b-secure-456")

    yield {
        "a": {"id": user_a_data["id"], "token": token_a},
        "b": {"id": user_b_data["id"], "token": token_b},
    }

    # Cleanup: delete transactions, then users
    for uid in [user_a_data["id"], user_b_data["id"]]:
        requests.delete(
            f"{REST_URL}/transactions?user_id=eq.{uid}",
            headers=_admin_headers() | {"Prefer": "return=minimal"},
        )
        cleanup_user(uid)


@pytest.fixture(autouse=True, scope="module")
def seed_transactions(users):
    """Seed one transaction per user using their own authenticated sessions."""
    # User A: ₹500 Swiggy Food
    resp_a = requests.post(
        f"{REST_URL}/transactions",
        headers=_headers(users["a"]["token"]),
        json={
            "user_id": users["a"]["id"],
            "date": "2026-08-16",
            "amount": 500.00,
            "merchant": "Swiggy",
            "category": "Food",
            "type": "expense",
            "source": "manual",
        },
    )
    assert resp_a.status_code == 201, f"Seed A failed: {resp_a.text}"

    # User B: ₹1000 Amazon Shopping
    resp_b = requests.post(
        f"{REST_URL}/transactions",
        headers=_headers(users["b"]["token"]),
        json={
            "user_id": users["b"]["id"],
            "date": "2026-08-16",
            "amount": 1000.00,
            "merchant": "Amazon",
            "category": "Shopping",
            "type": "expense",
            "source": "manual",
        },
    )
    assert resp_b.status_code == 201, f"Seed B failed: {resp_b.text}"

    yield


# ──────────────────────────────────────────────
#  SELECT ISOLATION TESTS
# ──────────────────────────────────────────────

class TestSelectIsolation:
    def test_user_a_sees_only_own_transactions(self, users):
        resp = requests.get(f"{REST_URL}/transactions", headers=_headers(users["a"]["token"]))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["merchant"] == "Swiggy"
        assert float(data[0]["amount"]) == 500.00

    def test_user_b_sees_only_own_transactions(self, users):
        resp = requests.get(f"{REST_URL}/transactions", headers=_headers(users["b"]["token"]))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["merchant"] == "Amazon"
        assert float(data[0]["amount"]) == 1000.00

    def test_user_b_cannot_query_user_a_by_filter(self, users):
        resp = requests.get(
            f"{REST_URL}/transactions?user_id=eq.{users['a']['id']}",
            headers=_headers(users["b"]["token"]),
        )
        assert resp.status_code == 200
        assert resp.json() == []

    def test_user_a_cannot_query_user_b_by_filter(self, users):
        resp = requests.get(
            f"{REST_URL}/transactions?user_id=eq.{users['b']['id']}",
            headers=_headers(users["a"]["token"]),
        )
        assert resp.status_code == 200
        assert resp.json() == []


# ──────────────────────────────────────────────
#  INSERT ISOLATION TESTS
# ──────────────────────────────────────────────

class TestInsertIsolation:
    def test_user_b_cannot_insert_as_user_a(self, users):
        """User B attempts to insert a transaction with User A's user_id."""
        resp = requests.post(
            f"{REST_URL}/transactions",
            headers=_headers(users["b"]["token"]),
            json={
                "user_id": users["a"]["id"],
                "date": "2026-08-16",
                "amount": 999.00,
                "merchant": "Hack Attempt",
                "category": "Other",
                "type": "expense",
                "source": "manual",
            },
        )
        # Should be rejected by WITH CHECK policy
        assert resp.status_code in (403, 401, 409, 400), f"INSERT attack succeeded: {resp.text}"


# ──────────────────────────────────────────────
#  UPDATE ISOLATION TESTS
# ──────────────────────────────────────────────

class TestUpdateIsolation:
    def test_user_b_cannot_update_user_a_transaction(self, users):
        """User B attempts to update User A's transaction."""
        resp = requests.patch(
            f"{REST_URL}/transactions?user_id=eq.{users['a']['id']}",
            headers=_headers(users["b"]["token"]) | {"Prefer": "return=representation"},
            json={"merchant": "HACKED"},
        )
        assert resp.status_code == 200
        # RLS should return zero affected rows
        assert resp.json() == []

    def test_user_id_reassignment_blocked(self, users):
        """User A attempts to reassign their own transaction to User B's user_id."""
        resp = requests.patch(
            f"{REST_URL}/transactions?user_id=eq.{users['a']['id']}",
            headers=_headers(users["a"]["token"]) | {"Prefer": "return=representation"},
            json={"user_id": users["b"]["id"]},
        )
        # WITH CHECK should block this: the new row would fail the policy check
        if resp.status_code == 200:
            # If 200, the result should be empty (no rows updated)
            assert resp.json() == [], f"user_id reassignment succeeded: {resp.text}"
        else:
            # 403 or similar rejection is also acceptable
            assert resp.status_code in (403, 401, 409, 400)


# ──────────────────────────────────────────────
#  DELETE ISOLATION TESTS
# ──────────────────────────────────────────────

class TestDeleteIsolation:
    def test_user_b_cannot_delete_user_a_transaction(self, users):
        """User B attempts to delete User A's transaction."""
        resp = requests.delete(
            f"{REST_URL}/transactions?user_id=eq.{users['a']['id']}",
            headers=_headers(users["b"]["token"]) | {"Prefer": "return=representation"},
        )
        assert resp.status_code == 200
        assert resp.json() == []

    def test_user_a_can_still_see_own_transaction(self, users):
        """Verify User A's data survived all attack attempts."""
        resp = requests.get(f"{REST_URL}/transactions", headers=_headers(users["a"]["token"]))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        merchants = [t["merchant"] for t in data]
        assert "Swiggy" in merchants


# ──────────────────────────────────────────────
#  PROFILE ISOLATION TESTS
# ──────────────────────────────────────────────

class TestProfileIsolation:
    def test_user_a_can_read_own_profile(self, users):
        resp = requests.get(
            f"{REST_URL}/profiles?id=eq.{users['a']['id']}",
            headers=_headers(users["a"]["token"]),
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_user_b_cannot_read_user_a_profile(self, users):
        resp = requests.get(
            f"{REST_URL}/profiles?id=eq.{users['a']['id']}",
            headers=_headers(users["b"]["token"]),
        )
        assert resp.status_code == 200
        assert resp.json() == []

    def test_user_b_cannot_update_user_a_profile(self, users):
        resp = requests.patch(
            f"{REST_URL}/profiles?id=eq.{users['a']['id']}",
            headers=_headers(users["b"]["token"]) | {"Prefer": "return=representation"},
            json={"username": "hacked"},
        )
        assert resp.status_code == 200
        assert resp.json() == []
