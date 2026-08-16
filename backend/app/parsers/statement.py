import pandas as pd
import io
import datetime as dt
from typing import List

from app.models import Transaction, TransactionSource, TransactionType, ParseStatementResponse
from app.categorization.rules import categorize_merchant

def parse_statement(file_bytes: bytes, filename: str) -> ParseStatementResponse:
    transactions: List[Transaction] = []
    warnings: List[str] = []
    
    is_csv = filename.lower().endswith('.csv')
    is_excel = filename.lower().endswith(('.xlsx', '.xls'))
    
    if not (is_csv or is_excel):
        warnings.append("Unsupported file type. Expected .csv or .xlsx")
        return ParseStatementResponse(transactions=[], total_rows=0, parsed_rows=0, skipped_rows=0, warnings=warnings)
    
    try:
        # Force a large number of columns to handle jagged junk rows at the top of statements
        if is_csv:
            df_raw = pd.read_csv(io.BytesIO(file_bytes), header=None, dtype=str, names=range(30), engine='python')
        else:
            df_raw = pd.read_excel(io.BytesIO(file_bytes), header=None, dtype=str, names=range(30))
    except pd.errors.EmptyDataError:
        warnings.append("File is empty.")
        return ParseStatementResponse(transactions=[], total_rows=0, parsed_rows=0, skipped_rows=0, warnings=warnings)
    except Exception as e:
        if "No columns to parse" in str(e) or "empty" in str(e).lower():
            warnings.append("File is empty.")
        else:
            warnings.append(f"Failed to read file: {str(e)}")
        return ParseStatementResponse(transactions=[], total_rows=0, parsed_rows=0, skipped_rows=0, warnings=warnings)
        
    if df_raw.empty:
        warnings.append("File is empty.")
        return ParseStatementResponse(transactions=[], total_rows=0, parsed_rows=0, skipped_rows=0, warnings=warnings)
        
    # Find probable header row
    header_row_idx = 0
    date_aliases = ['date', 'txn date', 'value date', 'transaction date']
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
        if any(alias in col for alias in ['date', 'txn date']):
            if 'norm_date' not in col_map.values(): col_map[col] = 'norm_date'
        elif any(alias in col for alias in ['narration', 'description', 'particulars', 'remarks', 'merchant']):
            if 'norm_merchant' not in col_map.values(): col_map[col] = 'norm_merchant'
        elif any(alias in col for alias in ['withdrawal', 'dr', 'debit']):
            if 'norm_debit' not in col_map.values(): col_map[col] = 'norm_debit'
        elif any(alias in col for alias in ['deposit', 'cr', 'credit']):
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
            raw_date = row['norm_date']
            if pd.isna(raw_date):
                skipped_rows += 1
                continue
            
            raw_date_str = str(raw_date).strip()
            if not raw_date_str or raw_date_str.lower() == 'nan':
                skipped_rows += 1
                continue
                
            parsed_date = pd.to_datetime(raw_date_str, dayfirst=True, errors='coerce')
            if pd.isna(parsed_date):
                warnings.append(f"Row {index}: Invalid date format '{raw_date_str}'")
                skipped_rows += 1
                continue
                
            dt_date = parsed_date.date()
            
            amount = 0.0
            txn_type = TransactionType.EXPENSE
            
            if has_amount and pd.notna(row.get('norm_amount')):
                val_str = str(row.get('norm_amount')).replace(',', '').strip()
                if val_str and val_str not in ['nan', 'none', 'null']:
                    val = float(val_str)
                    if val < 0:
                        amount = abs(val)
                        txn_type = TransactionType.INCOME
                    else:
                        amount = val
                        txn_type = TransactionType.EXPENSE
            elif has_debit and pd.notna(row.get('norm_debit')):
                val_str = str(row.get('norm_debit')).replace(',', '').strip()
                if val_str and val_str not in ['nan', 'none', 'null', '0', '0.0']:
                    amount = float(val_str)
                    txn_type = TransactionType.EXPENSE
            elif has_credit and pd.notna(row.get('norm_credit')):
                val_str = str(row.get('norm_credit')).replace(',', '').strip()
                if val_str and val_str not in ['nan', 'none', 'null', '0', '0.0']:
                    amount = float(val_str)
                    txn_type = TransactionType.INCOME
                    
            if amount <= 0:
                skipped_rows += 1
                continue
                
            merchant = "Unknown"
            if has_merchant and pd.notna(row.get('norm_merchant')):
                m_str = str(row.get('norm_merchant')).strip()
                if m_str and m_str.lower() not in ['nan', 'none']:
                    merchant = m_str
                    
            category = categorize_merchant(merchant)
            
            txn = Transaction(
                date=dt_date,
                amount=amount,
                merchant=merchant,
                description=None,
                category=category,
                type=txn_type,
                source=TransactionSource.STATEMENT,
                confidence=0.9 if category.value != "Other" else 0.5
            )
            transactions.append(txn)
            parsed_rows += 1
            
        except Exception as e:
            warnings.append(f"Row {index}: Skipped due to error: {str(e)}")
            skipped_rows += 1

    return ParseStatementResponse(
        transactions=transactions,
        total_rows=total_rows,
        parsed_rows=parsed_rows,
        skipped_rows=skipped_rows,
        warnings=warnings
    )
