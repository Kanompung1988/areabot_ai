"""
AreaBot — Integration Test Suite
Run with: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

# ── In-memory SQLite for tests ────────────────────────
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


# ─────────────────────────────────────────────────────
# Health & Root
# ─────────────────────────────────────────────────────
class TestHealth:
    def test_root(self, client):
        r = client.get("/")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "running"
        assert "AreaBot" in data["service"]

    def test_health(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


# ─────────────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────────────
class TestAuth:
    def _register(self, client, email="test@example.com"):
        return client.post("/api/auth/register", json={
            "email": email,
            "full_name": "Test User",
            "password": "password123",
        })

    def test_register(self, client):
        r = self._register(client)
        assert r.status_code == 201
        data = r.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["email"] == "test@example.com"

    def test_register_duplicate_email(self, client):
        self._register(client)
        r = self._register(client)
        assert r.status_code == 400

    def test_login_success(self, client):
        self._register(client)
        r = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123",
        })
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_wrong_password(self, client):
        self._register(client)
        r = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpass",
        })
        assert r.status_code == 401

    def test_refresh_token(self, client):
        r = self._register(client)
        refresh = r.json()["refresh_token"]
        r2 = client.post("/api/auth/refresh", json={"refresh_token": refresh})
        assert r2.status_code == 200
        assert "access_token" in r2.json()

    def test_refresh_token_invalid(self, client):
        r = client.post("/api/auth/refresh", json={"refresh_token": "bad_token"})
        assert r.status_code == 401

    def test_me_requires_auth(self, client):
        r = client.get("/api/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self, client):
        token = self._register(client).json()["access_token"]
        r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json()["email"] == "test@example.com"


# ─────────────────────────────────────────────────────
# Bots CRUD
# ─────────────────────────────────────────────────────
class TestBots:
    def _token(self, client):
        r = client.post("/api/auth/register", json={
            "email": "bot_owner@example.com",
            "full_name": "Bot Owner",
            "password": "password123",
        })
        return r.json()["access_token"]

    def test_create_bot(self, client):
        token = self._token(client)
        r = client.post("/api/bots", json={
            "name": "My Bot",
            "company_name": "My Company",
        }, headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == "My Bot"
        assert "api_key" in data
        assert "id" in data

    def test_list_bots(self, client):
        token = self._token(client)
        headers = {"Authorization": f"Bearer {token}"}
        client.post("/api/bots", json={"name": "Bot 1", "company_name": "Co"}, headers=headers)
        client.post("/api/bots", json={"name": "Bot 2", "company_name": "Co"}, headers=headers)
        r = client.get("/api/bots", headers=headers)
        assert r.status_code == 200
        assert len(r.json()) == 2

    def test_get_bot(self, client):
        token = self._token(client)
        headers = {"Authorization": f"Bearer {token}"}
        bot_id = client.post("/api/bots", json={"name": "Bot", "company_name": "Co"}, headers=headers).json()["id"]
        r = client.get(f"/api/bots/{bot_id}", headers=headers)
        assert r.status_code == 200
        assert r.json()["id"] == bot_id

    def test_update_bot(self, client):
        token = self._token(client)
        headers = {"Authorization": f"Bearer {token}"}
        bot_id = client.post("/api/bots", json={"name": "Old", "company_name": "Co"}, headers=headers).json()["id"]
        r = client.patch(f"/api/bots/{bot_id}", json={"name": "New Name"}, headers=headers)
        assert r.status_code == 200
        assert r.json()["name"] == "New Name"

    def test_delete_bot(self, client):
        token = self._token(client)
        headers = {"Authorization": f"Bearer {token}"}
        bot_id = client.post("/api/bots", json={"name": "Bot", "company_name": "Co"}, headers=headers).json()["id"]
        r = client.delete(f"/api/bots/{bot_id}", headers=headers)
        assert r.status_code == 204

    def test_bots_require_auth(self, client):
        r = client.get("/api/bots")
        assert r.status_code == 401


# ─────────────────────────────────────────────────────
# Proxy
# ─────────────────────────────────────────────────────
class TestProxy:
    def test_chat_requires_auth(self, client):
        r = client.post("/v1/chat/completions", json={
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": "hello"}]
        })
        assert r.status_code == 401

    def test_chat_invalid_key(self, client):
        r = client.post(
            "/v1/chat/completions",
            headers={"Authorization": "Bearer invalid_key"},
            json={"model": "gpt-4o", "messages": [{"role": "user", "content": "hi"}]},
        )
        assert r.status_code in (401, 422)


# ─────────────────────────────────────────────────────
# Billing
# ─────────────────────────────────────────────────────
class TestBilling:
    def test_list_plans(self, client):
        r = client.get("/api/billing/plans")
        assert r.status_code == 200
        plans = r.json()["plans"]
        assert len(plans) == 3
        names = {p["id"] for p in plans}
        assert {"free", "pro", "business"} == names

    def test_subscription_requires_auth(self, client):
        r = client.get("/api/billing/subscription")
        assert r.status_code == 401


# ─────────────────────────────────────────────────────
# Dashboard stats
# ─────────────────────────────────────────────────────
class TestAdmin:
    def test_dashboard_stats(self, client):
        r = client.post("/api/auth/register", json={
            "email": "admin@example.com",
            "full_name": "Admin",
            "password": "password123",
        })
        token = r.json()["access_token"]
        r = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert "total_bots" in data
        assert "total_messages" in data
