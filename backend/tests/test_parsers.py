import pytest
from app.parsers.statement import parse_statement
from app.models import Category, TransactionType

def test_parse_clean_csv():
    csv_content = b"""Date,Merchant,Amount
    01/08/2026,Swiggy,250.50
    02/08/2026,Uber,150.00
    03/08/2026,Salary,-50000.00
    """
    res = parse_statement(csv_content, "statement.csv")
    assert res.total_rows == 3
    assert res.parsed_rows == 3
    assert res.skipped_rows == 0
    assert len(res.transactions) == 3
    
    assert res.transactions[0].category == Category.FOOD
    assert res.transactions[0].type == TransactionType.EXPENSE
    assert res.transactions[0].amount == 250.50
    
    assert res.transactions[1].category == Category.TRANSPORT
    
    assert res.transactions[2].type == TransactionType.INCOME
    assert res.transactions[2].amount == 50000.00

def test_parse_junk_header_and_dr_cr():
    csv_content = b"""XYZ Bank Statement
    Account: 123456
    Generated: 2026-08-10
    
    Txn Date,Particulars,Dr,Cr
    10-08-2026,Amazon,1200,,
    11-08-2026,Netflix,500,,
    12-08-2026,Refund,,100,
    """
    res = parse_statement(csv_content, "statement.csv")
    assert res.total_rows == 3
    assert res.parsed_rows == 3
    assert res.skipped_rows == 0
    assert res.transactions[0].category == Category.SHOPPING
    assert res.transactions[0].amount == 1200
    assert res.transactions[0].type == TransactionType.EXPENSE
    
    assert res.transactions[2].amount == 100
    assert res.transactions[2].type == TransactionType.INCOME

def test_parse_withdrawal_deposit():
    csv_content = b"""Date,Remarks,Withdrawal,Deposit
    2026-08-15,Starbucks,300,
    2026-08-16,Bonus,,5000
    """
    res = parse_statement(csv_content, "statement.csv")
    assert res.total_rows == 2
    assert res.parsed_rows == 2
    
def test_parse_missing_merchant():
    csv_content = b"""Date,Remarks,Amount
    2026-08-15,,300
    """
    res = parse_statement(csv_content, "statement.csv")
    assert res.transactions[0].merchant == "Unknown"
    assert res.transactions[0].category == Category.OTHER

def test_parse_zero_and_negative_amounts():
    csv_content = b"""Date,Remarks,Amount
    2026-08-15,Test,0
    2026-08-15,Test,-100
    """
    res = parse_statement(csv_content, "statement.csv")
    assert res.total_rows == 2
    assert res.parsed_rows == 1  # 0 amount should be skipped
    assert res.skipped_rows == 1
    assert res.transactions[0].type == TransactionType.INCOME
    assert res.transactions[0].amount == 100

def test_parse_malformed_dates():
    csv_content = b"""Date,Merchant,Amount
    invalid-date,Test,100
    2026-08-15,Test,100
    """
    res = parse_statement(csv_content, "statement.csv")
    assert res.total_rows == 2
    assert res.parsed_rows == 1
    assert res.skipped_rows == 1
    assert len(res.warnings) > 0
    assert "Invalid date format 'invalid-date'" in res.warnings[0]

def test_parse_unsupported_columns():
    csv_content = b"""Foo,Bar,Baz
    1,2,3
    """
    res = parse_statement(csv_content, "statement.csv")
    assert res.parsed_rows == 0
    assert "Could not identify a Date column" in res.warnings[0]

def test_empty_statement():
    res = parse_statement(b"", "statement.csv")
    assert res.parsed_rows == 0
    assert "File is empty." in res.warnings[0]
