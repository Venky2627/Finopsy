from datetime import date, timedelta

from app.models import Category, Transaction, TransactionSource, TransactionType


def demo_transactions() -> list[Transaction]:
    """Realistic Indian college student spending for August 2026."""
    # Base date: Aug 1, 2026
    base = date(2026, 8, 1)
    d = lambda day: base + timedelta(days=day - 1)

    return [
        # Income — monthly allowance
        Transaction(date=d(1), amount=25000, merchant="Bank Credit — Allowance", category=Category.INCOME, type=TransactionType.INCOME, source=TransactionSource.STATEMENT),

        # Food delivery addiction (Swiggy × 5, Zomato × 3, others)
        Transaction(date=d(1), amount=450, merchant="Swiggy", category=Category.FOOD, source=TransactionSource.STATEMENT),
        Transaction(date=d(3), amount=320, merchant="Zomato", category=Category.FOOD, source=TransactionSource.STATEMENT),
        Transaction(date=d(5), amount=650, merchant="KFC", category=Category.FOOD, source=TransactionSource.STATEMENT),
        Transaction(date=d(8), amount=280, merchant="Domino's Pizza", category=Category.FOOD, source=TransactionSource.STATEMENT),
        Transaction(date=d(10), amount=410, merchant="Swiggy", category=Category.FOOD, source=TransactionSource.STATEMENT),
        Transaction(date=d(12), amount=380, merchant="Biryani Blues", category=Category.FOOD, source=TransactionSource.STATEMENT),
        Transaction(date=d(15), amount=520, merchant="McDonald's", category=Category.FOOD, source=TransactionSource.STATEMENT),
        Transaction(date=d(18), amount=290, merchant="Zomato", category=Category.FOOD, source=TransactionSource.STATEMENT),
        Transaction(date=d(20), amount=470, merchant="Swiggy", category=Category.FOOD, source=TransactionSource.STATEMENT),
        Transaction(date=d(22), amount=350, merchant="Burger King", category=Category.FOOD, source=TransactionSource.STATEMENT),
        Transaction(date=d(25), amount=430, merchant="KFC", category=Category.FOOD, source=TransactionSource.STATEMENT),
        Transaction(date=d(27), amount=390, merchant="Swiggy", category=Category.FOOD, source=TransactionSource.STATEMENT),

        # Transport (Uber, Ola, Rapido)
        Transaction(date=d(2), amount=180, merchant="Uber", category=Category.TRANSPORT, source=TransactionSource.STATEMENT),
        Transaction(date=d(4), amount=95, merchant="Rapido", category=Category.TRANSPORT, source=TransactionSource.STATEMENT),
        Transaction(date=d(7), amount=220, merchant="Ola", category=Category.TRANSPORT, source=TransactionSource.STATEMENT),
        Transaction(date=d(9), amount=150, merchant="Uber", category=Category.TRANSPORT, source=TransactionSource.STATEMENT),
        Transaction(date=d(14), amount=85, merchant="Rapido", category=Category.TRANSPORT, source=TransactionSource.STATEMENT),
        Transaction(date=d(17), amount=195, merchant="Ola", category=Category.TRANSPORT, source=TransactionSource.STATEMENT),
        Transaction(date=d(21), amount=170, merchant="Uber", category=Category.TRANSPORT, source=TransactionSource.STATEMENT),
        Transaction(date=d(24), amount=110, merchant="Rapido", category=Category.TRANSPORT, source=TransactionSource.STATEMENT),
        Transaction(date=d(26), amount=205, merchant="Ola", category=Category.TRANSPORT, source=TransactionSource.STATEMENT),

        # Shopping spree (Amazon, Flipkart, Myntra)
        Transaction(date=d(5), amount=2399, merchant="Amazon", category=Category.SHOPPING, source=TransactionSource.STATEMENT),
        Transaction(date=d(11), amount=1499, merchant="Myntra", category=Category.SHOPPING, source=TransactionSource.STATEMENT),
        Transaction(date=d(16), amount=899, merchant="Flipkart", category=Category.SHOPPING, source=TransactionSource.STATEMENT),
        Transaction(date=d(23), amount=1799, merchant="Amazon", category=Category.SHOPPING, source=TransactionSource.STATEMENT),

        # Entertainment
        Transaction(date=d(6), amount=1118, merchant="PVR Cinemas", category=Category.ENTERTAINMENT, source=TransactionSource.STATEMENT),
        Transaction(date=d(19), amount=650, merchant="BookMyShow", category=Category.ENTERTAINMENT, source=TransactionSource.STATEMENT),

        # Subscriptions
        Transaction(date=d(1), amount=499, merchant="Netflix", category=Category.SUBSCRIPTIONS, source=TransactionSource.STATEMENT),
        Transaction(date=d(1), amount=119, merchant="Spotify", category=Category.SUBSCRIPTIONS, source=TransactionSource.STATEMENT),

        # Education
        Transaction(date=d(3), amount=1485, merchant="College Cafe", category=Category.EDUCATION, source=TransactionSource.STATEMENT),
        Transaction(date=d(15), amount=320, merchant="Stationery Shop", category=Category.EDUCATION, source=TransactionSource.STATEMENT),

        # Groceries
        Transaction(date=d(4), amount=1250, merchant="BigBasket", category=Category.GROCERIES, source=TransactionSource.STATEMENT),
        Transaction(date=d(13), amount=980, merchant="DMart", category=Category.GROCERIES, source=TransactionSource.STATEMENT),
        Transaction(date=d(20), amount=1100, merchant="BigBasket", category=Category.GROCERIES, source=TransactionSource.STATEMENT),
        Transaction(date=d(27), amount=890, merchant="Local Kirana", category=Category.GROCERIES, source=TransactionSource.STATEMENT),

        # Bills & Utilities
        Transaction(date=d(1), amount=1999, merchant="Electricity Bill", category=Category.BILLS, source=TransactionSource.STATEMENT),
        Transaction(date=d(5), amount=699, merchant="Jio Recharge", category=Category.BILLS, source=TransactionSource.STATEMENT),
        Transaction(date=d(15), amount=1500, merchant="ACT Fibernet", category=Category.BILLS, source=TransactionSource.STATEMENT),

        # Healthcare
        Transaction(date=d(8), amount=450, merchant="Apollo Pharmacy", category=Category.HEALTHCARE, source=TransactionSource.STATEMENT),
        Transaction(date=d(18), amount=1200, merchant="Doctor Consultation", category=Category.HEALTHCARE, source=TransactionSource.STATEMENT),
    ]

def demo_subscriptions():
    return [
        {
            "merchant": "Netflix",
            "category": "Subscriptions",
            "monthly_amount": 499,
            "frequency": "Monthly",
            "occurrence_count": 8,
            "total_paid_so_far": 3992,
            "annual_projection": 5988,
            "next_predicted_date": "2026-09-01",
            "confidence": 0.95
        },
        {
            "merchant": "Spotify Premium",
            "category": "Subscriptions",
            "monthly_amount": 119,
            "frequency": "Monthly",
            "occurrence_count": 8,
            "total_paid_so_far": 952,
            "annual_projection": 1428,
            "next_predicted_date": "2026-09-03",
            "confidence": 0.92
        },
        {
            "merchant": "Coursera Annual Plan",
            "category": "Education",
            "monthly_amount": 916.58,
            "frequency": "Yearly",
            "occurrence_count": 1,
            "total_paid_so_far": 10999,
            "annual_projection": 10999,
            "next_predicted_date": "2027-07-15",
            "confidence": 0.88
        },
        {
            "merchant": "Gold's Gym",
            "category": "Healthcare",
            "monthly_amount": 1500,
            "frequency": "Monthly",
            "occurrence_count": 6,
            "total_paid_so_far": 9000,
            "annual_projection": 18000,
            "next_predicted_date": "2026-09-05",
            "confidence": 0.90
        }
    ]
