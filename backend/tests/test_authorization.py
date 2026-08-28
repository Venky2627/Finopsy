import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.auth import get_current_user
from app.models import Transaction, TransactionType, Category, TransactionSource
from datetime import date

client = TestClient(app)

# Helper mock for User A and User B
user_a = {"id": "user-a-1111", "email": "usera@test.com", "token": "token-a"}
user_b = {"id": "user-b-2222", "email": "userb@test.com", "token": "token-b"}

def test_unauthenticated_endpoints_blocked():
    # Attempting to fetch transactions without auth
    res = client.get("/api/transactions")
    assert res.status_code == 401
    
    # Attempting to fetch me profile without auth
    res_me = client.get("/api/me")
    assert res_me.status_code == 401
    
    # Attempting to delete me without auth
    res_del = client.delete("/api/me")
    assert res_del.status_code == 401

def test_user_a_cannot_access_user_b_data():
    """Verify that User A dependency extracts User A identity and scopes query to User A."""
    app.dependency_overrides[get_current_user] = lambda: user_a
    
    with patch("app.main.get_supabase") as mock_get_sb:
        mock_table = MagicMock()
        mock_get_sb.return_value.table.return_value = mock_table
        
        # User A requests transactions
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_eq = MagicMock()
        mock_select.eq.return_value = mock_eq
        mock_order = MagicMock()
        mock_eq.order.return_value = mock_order
        mock_order.execute.return_value.data = [{"id": "txn-1", "user_id": "user-a-1111", "amount": 500}]
        
        res = client.get("/api/transactions")
        assert res.status_code == 200
        # Check that .eq('user_id', 'user-a-1111') was strictly called
        mock_select.eq.assert_called_with("user_id", "user-a-1111")
        
    app.dependency_overrides.clear()

def test_user_a_cannot_delete_user_b_transaction():
    """Verify that delete transaction requires id AND user_id matching caller."""
    app.dependency_overrides[get_current_user] = lambda: user_a
    
    with patch("app.main.get_supabase") as mock_get_sb:
        mock_table = MagicMock()
        mock_get_sb.return_value.table.return_value = mock_table
        
        mock_delete = MagicMock()
        mock_table.delete.return_value = mock_delete
        mock_eq1 = MagicMock()
        mock_delete.eq.return_value = mock_eq1
        mock_eq2 = MagicMock()
        mock_eq1.eq.return_value = mock_eq2
        # Mocking that no row matching (id='txn-b-999', user_id='user-a-1111') was found
        mock_eq2.execute.return_value.data = []
        
        res = client.delete("/api/transactions/txn-b-999")
        assert res.status_code == 404
        mock_delete.eq.assert_called_with("id", "txn-b-999")
        mock_eq1.eq.assert_called_with("user_id", "user-a-1111")
        
    app.dependency_overrides.clear()

def test_user_a_cannot_update_user_b_transaction():
    """Verify that update transaction requires id AND user_id matching caller."""
    app.dependency_overrides[get_current_user] = lambda: user_a
    
    with patch("app.main.get_supabase") as mock_get_sb:
        mock_table = MagicMock()
        mock_get_sb.return_value.table.return_value = mock_table
        
        mock_update = MagicMock()
        mock_table.update.return_value = mock_update
        mock_eq1 = MagicMock()
        mock_update.eq.return_value = mock_eq1
        mock_eq2 = MagicMock()
        mock_eq1.eq.return_value = mock_eq2
        mock_eq2.execute.return_value.data = []
        
        res = client.patch("/api/transactions/txn-b-999", json={"merchant": "Hacked"})
        assert res.status_code == 404
        mock_update.eq.assert_called_with("id", "txn-b-999")
        mock_eq1.eq.assert_called_with("user_id", "user-a-1111")
        
    app.dependency_overrides.clear()
