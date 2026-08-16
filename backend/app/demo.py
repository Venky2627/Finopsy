from datetime import date

from app.models import Category, Transaction, TransactionSource, TransactionType


def demo_transactions() -> list[Transaction]:
    today = date.today()
    return [
        Transaction(date=today, amount=15000, merchant="Allowance", category=Category.OTHER, type=TransactionType.INCOME, source=TransactionSource.STATEMENT),
        Transaction(date=today, amount=4820, merchant="Swiggy", category=Category.FOOD, source=TransactionSource.STATEMENT),
        Transaction(date=today, amount=2170, merchant="Uber", category=Category.TRANSPORT, source=TransactionSource.STATEMENT),
        Transaction(date=today, amount=1827, merchant="Campus Store", category=Category.SHOPPING, source=TransactionSource.STATEMENT),
        Transaction(date=today, amount=1485, merchant="College Cafe", category=Category.EDUCATION, source=TransactionSource.STATEMENT),
        Transaction(date=today, amount=1118, merchant="PVR", category=Category.ENTERTAINMENT, source=TransactionSource.STATEMENT),
    ]
