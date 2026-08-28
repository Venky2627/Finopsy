import datetime as dt
from datetime import date, datetime, timezone
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Category(str, Enum):
    FOOD = "Food"
    GROCERIES = "Groceries"
    TRANSPORT = "Transport"
    SHOPPING = "Shopping"
    ENTERTAINMENT = "Entertainment"
    BILLS = "Bills & Utilities"
    RENT = "Rent"
    HEALTHCARE = "Healthcare"
    EDUCATION = "Education"
    TRAVEL = "Travel"
    SUBSCRIPTIONS = "Subscriptions"
    TRANSFERS = "Transfers"
    CASH = "Cash Withdrawal"
    INCOME = "Income"
    FEES = "Fees & Charges"
    OTHER = "Other"


class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"
    REFUND = "refund"


class TransactionSource(str, Enum):
    MANUAL = "manual"
    STATEMENT = "statement"


class Transaction(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID | None = None
    date: date
    amount: float = Field(gt=0)
    merchant: str = Field(min_length=1, max_length=120)
    description: str | None = None
    category: Category = Category.OTHER
    type: TransactionType = TransactionType.EXPENSE
    payment_method: str | None = None
    source: TransactionSource = TransactionSource.MANUAL
    extraction_confidence: float = Field(default=1.0, ge=0, le=1)
    category_confidence: float = Field(default=1.0, ge=0, le=1)
    user_edited: bool = False
    created_at: datetime = Field(default_factory=utc_now)

class QuickAddRequest(BaseModel):
    amount: float = Field(gt=0)
    merchant: str = Field(min_length=1, max_length=120)
    category: Category = Category.OTHER
    date: dt.date | None = None
    description: str | None = None
    type: TransactionType = TransactionType.EXPENSE

class ParseStatementResponse(BaseModel):
    transactions: list[Transaction]
    total_rows: int
    parsed_rows: int
    skipped_rows: int
    warnings: list[str]

class SubscriptionOut(BaseModel):
    merchant: str
    category: str
    monthly_amount: float
    frequency: str
    occurrence_count: int
    total_paid_so_far: float
    annual_projection: float
    next_predicted_date: str | None
    confidence: float

class BudgetCreate(BaseModel):
    category: Category
    monthly_limit: float = Field(gt=0)

class BudgetOut(BaseModel):
    id: UUID
    category: Category
    monthly_limit: float
    spent_this_month: float
    remaining: float
    percentage: float
    status: str
    created_at: datetime

class FinancialSummary(BaseModel):
    total_income: float
    total_spending: float
    remaining: float
    transaction_count: int
    category_totals: dict[str, float]
    category_percentages: dict[str, float]
    daily_spending: list[dict[str, float | str]] = Field(default_factory=list)
    subscriptions: list[SubscriptionOut] = Field(default_factory=list)

class DemoResponse(BaseModel):
    transactions: list[Transaction]
    summary: FinancialSummary

class UserProfileUpdate(BaseModel):
    username: str | None = None
    display_name: str | None = None

class TransactionBulkUpdate(BaseModel):
    id: str
    merchant: str | None = None
    date: dt.date | None = None
    amount: float | None = None
    type: TransactionType | None = None
    category: Category | None = None
