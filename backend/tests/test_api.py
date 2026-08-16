from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_quick_add_success():
    response = client.post("/api/quick-add", json={
        "amount": 250,
        "merchant": "Swiggy",
        "category": "Food"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 250
    assert data["merchant"] == "Swiggy"
    assert data["category"] == "Food"
    assert data["type"] == "expense"
    assert data["source"] == "manual"
    assert "id" in data
    assert "date" in data

def test_quick_add_invalid():
    # Missing merchant
    response = client.post("/api/quick-add", json={
        "amount": 250,
        "category": "Food"
    })
    assert response.status_code == 422
    
    # Negative amount
    response = client.post("/api/quick-add", json={
        "amount": -50,
        "merchant": "Swiggy"
    })
    assert response.status_code == 422

def test_analyze():
    # Insert two transactions as they would come from frontend
    t1 = {
        "amount": 200,
        "merchant": "Uber",
        "category": "Transport",
        "date": "2026-08-01",
        "type": "expense"
    }
    t2 = {
        "amount": 1000,
        "merchant": "Salary",
        "category": "Other",
        "date": "2026-08-01",
        "type": "income"
    }
    
    response = client.post("/api/analyze", json=[t1, t2])
    assert response.status_code == 200
    summary = response.json()
    assert summary["total_income"] == 1000.0
    assert summary["total_spending"] == 200.0
    assert summary["remaining"] == 800.0
    assert summary["transaction_count"] == 1
    assert summary["category_totals"] == {"Transport": 200.0}
