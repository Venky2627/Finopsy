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
    daily_totals: defaultdict[str, float] = defaultdict(float)
    for transaction in expenses:
        category_totals[transaction.category.value] += transaction.amount
        daily_totals[transaction.date.isoformat()] += transaction.amount

    daily_spending = []
    if expenses:
        from datetime import timedelta
        import app.models
        
        min_date = min(t.date for t in expenses)
        max_date = max(t.date for t in expenses)
        today = app.models.utc_now().date()
        if max_date > today:
            max_date = today
            
        current_date = min_date
        while current_date <= max_date:
            date_str = current_date.isoformat()
            daily_spending.append({
                "date": date_str,
                "amount": _money(daily_totals[date_str])
            })
            current_date += timedelta(days=1)

    totals = {category: _money(amount) for category, amount in category_totals.items()}
    percentages = {category: _money(amount / spending * 100) for category, amount in totals.items()} if spending else {}
    subscriptions = detect_subscriptions(transactions)

    return FinancialSummary(
        total_income=_money(income),
        total_spending=_money(spending),
        remaining=_money(income - spending),
        transaction_count=len(expenses),
        category_totals=totals,
        category_percentages=percentages,
        daily_spending=daily_spending,
        subscriptions=subscriptions
    )

def detect_subscriptions(transactions: list[Transaction]) -> list[dict]:
    # Group by merchant
    from app.models import SubscriptionOut
    from datetime import timedelta
    
    merchant_groups = defaultdict(list)
    for t in transactions:
        if t.type == TransactionType.EXPENSE and t.amount > 0:
            merchant_groups[t.merchant.strip().lower()].append(t)
            
    subs = []
    
    for merchant, txns in merchant_groups.items():
        if len(txns) < 2:
            continue
            
        # Sort by date
        txns.sort(key=lambda x: x.date)
        
        amounts = [t.amount for t in txns]
        avg_amount = sum(amounts) / len(amounts)
        
        # Check variance ±15%
        if any(abs(a - avg_amount) / avg_amount > 0.15 for a in amounts):
            continue
            
        # Check intervals
        intervals = [(txns[i].date - txns[i-1].date).days for i in range(1, len(txns))]
        avg_interval = sum(intervals) / len(intervals)
        
        frequency = None
        annual_multiplier = 0
        if 25 <= avg_interval <= 35:
            frequency = "Monthly"
            annual_multiplier = 12
        elif 350 <= avg_interval <= 380:
            frequency = "Yearly"
            annual_multiplier = 1
            
        if not frequency:
            continue
            
        # Calculate confidence
        interval_variance = sum(abs(i - avg_interval) for i in intervals) / len(intervals)
        amount_variance = sum(abs(a - avg_amount) for a in amounts) / len(amounts)
        
        confidence = 1.0 - min((interval_variance / 10.0), 0.5) - min((amount_variance / (avg_amount * 0.15)), 0.5)
        confidence = max(0.1, min(confidence, 1.0))
        
        next_date = txns[-1].date + timedelta(days=int(avg_interval))
        
        subs.append(SubscriptionOut(
            merchant=txns[-1].merchant,
            category=txns[-1].category.value,
            monthly_amount=_money(avg_amount if frequency == "Monthly" else avg_amount / 12),
            frequency=frequency,
            occurrence_count=len(txns),
            total_paid_so_far=_money(sum(amounts)),
            annual_projection=_money(avg_amount * annual_multiplier),
            next_predicted_date=next_date.isoformat(),
            confidence=round(confidence, 2)
        ))
        
    subs.sort(key=lambda x: x.annual_projection, reverse=True)
    return subs
