from datetime import date

from app.financial import analyze_transactions
from app.models import Category, Transaction, TransactionType


def test_expenses_are_the_only_spending_and_refunds_increase_remaining():
    transactions = [
        Transaction(date=date(2026, 1, 1), amount=1000, merchant="Allowance", type=TransactionType.INCOME),
        Transaction(date=date(2026, 1, 2), amount=250, merchant="Swiggy", category=Category.FOOD),
        Transaction(date=date(2026, 1, 3), amount=25, merchant="Return", type=TransactionType.REFUND),
        Transaction(date=date(2026, 1, 4), amount=100, merchant="Transfer", type=TransactionType.TRANSFER),
    ]
    summary = analyze_transactions(transactions)
    assert summary.total_income == 1025
    assert summary.total_spending == 250
    assert summary.remaining == 775
    assert summary.category_totals == {"Food": 250}
    assert summary.category_percentages == {"Food": 100}
