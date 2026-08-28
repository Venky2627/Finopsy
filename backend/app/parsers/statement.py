import re
import io
import datetime as dt
import pandas as pd
from typing import List, Optional

from app.models import Transaction, TransactionSource, TransactionType, ParseStatementResponse, Category
from app.categorization.rules import categorize_merchant
from app.categorization.identity import identify_merchant

def clean_currency_amount(val) -> Optional[float]:
    """
    Robust Indian & International currency parser:
    1,20,000 -> 120000.0
    ₹1,20,000.50 -> 120000.50
    Rs. 1,200 -> 1200.0
    INR 1200 -> 1200.0
    -500 -> -500.0
    (500.00) -> -500.0
    """
    if pd.isna(val):
        return None
    val_str = str(val).strip()
    if not val_str or val_str.lower() in ['nan', 'none', 'null', '', '-']:
        return None
        
    # Check negative parentheses: (500.00)
    is_neg = False
    cleaned = val_str
    if cleaned.startswith('(') and cleaned.endswith(')'):
        is_neg = True
        cleaned = cleaned[1:-1].strip()
        
    # Strip currency signs & text notation (case-insensitive)
    cleaned = re.sub(r'(?i)(?:rs\.?|inr|usd|eur|gbp|[\u20B9$€£])', '', cleaned).strip()
    # Strip all commas and spaces
    cleaned = cleaned.replace(',', '').replace(' ', '')
    
    if cleaned.startswith('-'):
        is_neg = True
        cleaned = cleaned[1:].strip()
    elif cleaned.startswith('+'):
        cleaned = cleaned[1:].strip()
        
    try:
        num = float(cleaned)
        return -abs(num) if is_neg else num
    except (ValueError, TypeError):
        return None

def parse_statement(
    file_bytes: bytes, 
    filename: str, 
    password: str | None = None, 
    user_rules: dict[str, Category] = None,
    global_aliases: dict[str, str] = None,
    clean_merchants: list[str] = None
) -> ParseStatementResponse:
    transactions: List[Transaction] = []
    warnings: List[str] = []
    
    if user_rules is None:
        user_rules = {}
    if global_aliases is None:
        global_aliases = {}
    if clean_merchants is None:
        clean_merchants = []
        
    if not file_bytes:
        warnings.append("File is empty.")
        return ParseStatementResponse(transactions=[], total_rows=0, parsed_rows=0, skipped_rows=0, warnings=warnings)
    
    fn_lower = filename.lower()
    is_csv = fn_lower.endswith('.csv')
    is_excel = fn_lower.endswith(('.xlsx', '.xls'))
    is_pdf = fn_lower.endswith('.pdf')
    
    if not (is_csv or is_excel or is_pdf):
        warnings.append("Unsupported file format. Please upload a PDF, CSV, or Excel (.xlsx) statement.")
        return ParseStatementResponse(transactions=[], total_rows=0, parsed_rows=0, skipped_rows=0, warnings=warnings)
    
    # Magic bytes check
    if is_pdf and not file_bytes.startswith(b'%PDF-'):
        warnings.append("The file does not appear to be a valid PDF.")
        return ParseStatementResponse(transactions=[], total_rows=0, parsed_rows=0, skipped_rows=0, warnings=warnings)
    if is_excel and fn_lower.endswith('.xlsx') and not file_bytes.startswith(b'PK\x03\x04'):
        warnings.append("The file does not appear to be a valid Excel (.xlsx) file.")
        return ParseStatementResponse(transactions=[], total_rows=0, parsed_rows=0, skipped_rows=0, warnings=warnings)
    
    try:
        if is_pdf:
            from app.parsers.pdf_parser import extract_pdf_tables
            df_raw = extract_pdf_tables(file_bytes, password)
        elif is_csv:
            df_raw = pd.read_csv(io.BytesIO(file_bytes), header=None, dtype=str, names=range(35), engine='python')
        else:
            df_raw = pd.read_excel(io.BytesIO(file_bytes), header=None, dtype=str, names=range(35))
    except pd.errors.EmptyDataError:
        warnings.append("File is empty.")
        return ParseStatementResponse(transactions=[], total_rows=0, parsed_rows=0, skipped_rows=0, warnings=warnings)
    except Exception as e:
        if "No columns to parse" in str(e) or "empty" in str(e).lower():
            warnings.append("File is empty.")
        else:
            warnings.append(f"Failed to read file: {str(e)}")
        return ParseStatementResponse(transactions=[], total_rows=0, parsed_rows=0, skipped_rows=0, warnings=warnings)
        
    if df_raw is None or df_raw.empty:
        warnings.append("File contains no readable table rows.")
        return ParseStatementResponse(transactions=[], total_rows=0, parsed_rows=0, skipped_rows=0, warnings=warnings)
        
    # Find probable header row
    header_row_idx = 0
    date_aliases = ['date', 'txn date', 'value date', 'transaction date', 'posting date']
    found_header = False
    for idx, row in df_raw.iterrows():
        row_str = ' '.join([str(val).lower() for val in row.values if pd.notna(val)])
        if any(alias in row_str for alias in date_aliases):
            header_row_idx = idx
            found_header = True
            break
            
    df = df_raw.iloc[header_row_idx+1:].copy()
    if df.empty:
        warnings.append("No data rows found after header.")
        return ParseStatementResponse(transactions=[], total_rows=0, parsed_rows=0, skipped_rows=0, warnings=warnings)

    df.columns = df_raw.iloc[header_row_idx].astype(str).str.lower().str.strip()
    
    # Normalize column names
    col_map = {}
    for col in df.columns:
        if col == 'nan': continue
        if any(alias in col for alias in ['date', 'txn date', 'value date', 'posting date']):
            if 'norm_date' not in col_map.values(): col_map[col] = 'norm_date'
        elif any(alias in col for alias in ['narration', 'description', 'particulars', 'remarks', 'merchant', 'details']):
            if 'norm_merchant' not in col_map.values(): col_map[col] = 'norm_merchant'
        elif any(alias in col for alias in ['withdrawal', 'dr', 'debit', 'debit amount']):
            if 'norm_debit' not in col_map.values(): col_map[col] = 'norm_debit'
        elif any(alias in col for alias in ['deposit', 'cr', 'credit', 'credit amount']):
            if 'norm_credit' not in col_map.values(): col_map[col] = 'norm_credit'
        elif any(alias in col for alias in ['amount', 'txn amount', 'transaction amount']):
            if 'norm_amount' not in col_map.values(): col_map[col] = 'norm_amount'
            
    df = df.rename(columns=col_map)
    
    total_rows = len(df)
    parsed_rows = 0
    skipped_rows = 0
    
    has_date = 'norm_date' in df.columns
    has_merchant = 'norm_merchant' in df.columns
    has_amount = 'norm_amount' in df.columns
    has_debit = 'norm_debit' in df.columns
    has_credit = 'norm_credit' in df.columns
    
    if not has_date:
        warnings.append("Could not identify a Date column.")
        return ParseStatementResponse(transactions=[], total_rows=total_rows, parsed_rows=0, skipped_rows=total_rows, warnings=warnings)
        
    if not (has_amount or has_debit or has_credit):
        warnings.append("Could not identify an Amount, Debit, or Credit column.")
        return ParseStatementResponse(transactions=[], total_rows=total_rows, parsed_rows=0, skipped_rows=total_rows, warnings=warnings)
        
    for index, row in df.iterrows():
        try:
            raw_date = row.get('norm_date')
            if pd.isna(raw_date):
                skipped_rows += 1
                continue
            
            raw_date_str = str(raw_date).strip()
            if not raw_date_str or raw_date_str.lower() == 'nan':
                skipped_rows += 1
                continue
                
            parsed_date = pd.to_datetime(raw_date_str, dayfirst=True, errors='coerce')
            if pd.isna(parsed_date):
                skipped_rows += 1
                continue
                
            dt_date = parsed_date.date()
            
            amount = 0.0
            txn_type = TransactionType.EXPENSE
            
            if has_amount and pd.notna(row.get('norm_amount')):
                num = clean_currency_amount(row.get('norm_amount'))
                if num is not None and num != 0:
                    if num < 0:
                        amount = abs(num)
                        txn_type = TransactionType.INCOME
                    else:
                        amount = num
                        txn_type = TransactionType.EXPENSE
            elif has_debit and pd.notna(row.get('norm_debit')):
                num = clean_currency_amount(row.get('norm_debit'))
                if num is not None and num > 0:
                    amount = num
                    txn_type = TransactionType.EXPENSE
            elif has_credit and pd.notna(row.get('norm_credit')):
                num = clean_currency_amount(row.get('norm_credit'))
                if num is not None and num > 0:
                    amount = num
                    txn_type = TransactionType.INCOME
                    
            if amount <= 0:
                skipped_rows += 1
                continue
                
            merchant = "Unknown"
            if has_merchant and pd.notna(row.get('norm_merchant')):
                m_str = str(row.get('norm_merchant')).strip()
                if m_str and m_str.lower() not in ['nan', 'none']:
                    merchant = m_str
                    
            # Merchant Identity Normalization
            norm, clean_name, match_method, conf, override_cat = identify_merchant(
                merchant, user_rules, global_aliases, clean_merchants
            )
            
            effective_merchant = clean_name if clean_name else norm
            if not effective_merchant:
                effective_merchant = merchant
            
            if override_cat:
                category = override_cat
                cat_conf = 1.0
            else:
                category, cat_conf = categorize_merchant(effective_merchant)
                
            final_merchant = clean_name if (clean_name and conf >= 0.95) else merchant
            
            txn = Transaction(
                date=dt_date,
                amount=round(amount, 2),
                merchant=final_merchant,
                description=merchant if final_merchant != merchant else None,
                category=category,
                type=txn_type,
                source=TransactionSource.STATEMENT,
                extraction_confidence=0.9 if is_pdf else 1.0,
                category_confidence=cat_conf
            )
            transactions.append(txn)
            parsed_rows += 1
            
        except Exception as e:
            skipped_rows += 1

    return ParseStatementResponse(
        transactions=transactions,
        total_rows=total_rows,
        parsed_rows=parsed_rows,
        skipped_rows=skipped_rows,
        warnings=warnings
    )
