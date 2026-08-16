from collections import defaultdict

from app.models import Transaction, TransactionType, FinancialSummary

def _money(value: float) -> float:
    return round(value, 2)


def analyze_transactions(transactions: list[Transaction]) -> FinancialSummary:
    """Return deterministic financial aggregates. Transfers are excluded."""
    income = sum(t.amount for t in transactions if t.type in {TransactionType.INCOME, TransactionType.REFUND})
    expenses = [t for t in transactions if t.type == TransactionType.EXPENSE]
    spending = sum(t.amount for t in expenses)
    category_totals: defaultdict[str, float] = defaultdict(float)
    for transaction in expenses:
        category_totals[transaction.category.value] += transaction.amount
    totals = {category: _money(amount) for category, amount in category_totals.items()}
    percentages = {category: _money(amount / spending * 100) for category, amount in totals.items()} if spending else {}
    return FinancialSummary(
        total_income=_money(income),
        total_spending=_money(spending),
        remaining=_money(income - spending),
        transaction_count=len(expenses),
        category_totals=totals,
        category_percentages=percentages,
    )
