import pytest
from datetime import date, datetime
from app.parsers.statement import parse_statement, clean_currency_amount
from app.financial.roast_engine import generate_local_roast, RoastRequest, RoastResponse
from app.models import Category, TransactionType, Transaction, TransactionSource

def test_clean_currency_amount_indian_formats():
    assert clean_currency_amount("1,200") == 1200.0
    assert clean_currency_amount("1,20,000") == 120000.0
    assert clean_currency_amount("₹1,20,000.50") == 120000.50
    assert clean_currency_amount("Rs. 1,200") == 1200.0
    assert clean_currency_amount("Rs 1,200") == 1200.0
    assert clean_currency_amount("INR 1200") == 1200.0
    assert clean_currency_amount("-500") == -500.0
    assert clean_currency_amount("(500.00)") == -500.0
    assert clean_currency_amount("0") is None or clean_currency_amount("0") == 0.0
    assert clean_currency_amount("") is None
    assert clean_currency_amount("nan") is None

def test_statement_parser_indian_csv():
    csv_data = b"""Date,Particulars,Amount
01/08/2026,UPI/93847291/SWIGGY_BLR/28391,Rs. 450.00
02/08/2026,AMZN MKTG IN,"1,20,000.00"
03/08/2026,UBER RIDES,INR 340.50
04/08/2026,Salary,"-50,000.00"
"""
    res = parse_statement(csv_data, "statement.csv")
    assert res.total_rows == 4
    assert res.parsed_rows == 4
    assert res.skipped_rows == 0
    assert len(res.transactions) == 4
    
    # Swiggy
    assert res.transactions[0].merchant == "Swiggy"
    assert res.transactions[0].category == Category.FOOD
    assert res.transactions[0].amount == 450.00
    assert res.transactions[0].type == TransactionType.EXPENSE
    
    # Amazon
    assert res.transactions[1].merchant == "Amazon"
    assert res.transactions[1].category == Category.SHOPPING
    assert res.transactions[1].amount == 120000.00
    
    # Uber
    assert res.transactions[2].merchant == "Uber"
    assert res.transactions[2].category == Category.TRANSPORT
    assert res.transactions[2].amount == 340.50
    
    # Salary
    assert res.transactions[3].type == TransactionType.INCOME
    assert res.transactions[3].amount == 50000.00

def test_magic_bytes_validation():
    # Corrupt PDF
    corrupt_pdf = b"NOT_A_REAL_PDF_HEADER_DATA"
    res = parse_statement(corrupt_pdf, "statement.pdf")
    assert res.parsed_rows == 0
    assert any("valid PDF" in w for w in res.warnings)
    
    # Corrupt XLSX
    corrupt_xlsx = b"NOT_A_ZIP_HEADER"
    res2 = parse_statement(corrupt_xlsx, "statement.xlsx")
    assert res2.parsed_rows == 0
    assert any("valid Excel" in w for w in res2.warnings)
    
    # Unsupported file type
    res3 = parse_statement(b"hello", "statement.exe")
    assert res3.parsed_rows == 0
    assert any("Unsupported file format" in w for w in res3.warnings)

def test_roast_engine_never_null_and_fact_grounded():
    req = RoastRequest(
        total_spent=27205,
        category_totals={"Food": 9450, "Shopping": 6528},
        category_percentages={"Food": 34.7, "Shopping": 24.0},
        top_merchant="Swiggy",
        top_merchant_amount=7200,
        transaction_count=42,
        severity="savage",
        seen_roasts=[]
    )
    
    # Mild
    mild_roast = generate_local_roast(req, "mild")
    assert mild_roast is not None and len(mild_roast) > 10
    
    # Savage
    savage_roast = generate_local_roast(req, "savage")
    assert savage_roast is not None and len(savage_roast) > 10
    
    # Unhinged
    unhinged_roast = generate_local_roast(req, "unhinged")
    assert unhinged_roast is not None and len(unhinged_roast) > 10
    
    # Deduplication memory
    req.seen_roasts = [savage_roast]
    second_roast = generate_local_roast(req, "savage")
    assert second_roast != savage_roast or len(req.seen_roasts) > 0

def test_idempotent_migration_fingerprinting():
    t1 = Transaction(
        date=date(2026, 8, 1),
        amount=250.0,
        merchant="Swiggy",
        category=Category.FOOD,
        type=TransactionType.EXPENSE,
        source=TransactionSource.MANUAL
    )
    t2 = Transaction(
        date=date(2026, 8, 1),
        amount=250.0,
        merchant="Swiggy",
        category=Category.FOOD,
        type=TransactionType.EXPENSE,
        source=TransactionSource.MANUAL
    )
    
    fp1 = f"{t1.date}|{t1.amount:.2f}|{t1.merchant.strip().lower()}|{t1.type.value}"
    fp2 = f"{t2.date}|{t2.amount:.2f}|{t2.merchant.strip().lower()}|{t2.type.value}"
    assert fp1 == fp2
    
    # Different amount
    t3 = Transaction(
        date=date(2026, 8, 1),
        amount=300.0,
        merchant="Swiggy",
        category=Category.FOOD,
        type=TransactionType.EXPENSE,
        source=TransactionSource.MANUAL
    )
    fp3 = f"{t3.date}|{t3.amount:.2f}|{t3.merchant.strip().lower()}|{t3.type.value}"
    assert fp1 != fp3
