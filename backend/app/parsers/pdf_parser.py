import pandas as pd
import io
import pikepdf
import pdfplumber
import logging

logger = logging.getLogger(__name__)

class PdfEncryptedError(Exception):
    pass

class PdfExtractionError(Exception):
    pass

def extract_pdf_tables(file_bytes: bytes, password: str | None = None) -> pd.DataFrame:
    """
    Extract tables from a PDF file.
    Raises PdfEncryptedError if encrypted and no password provided.
    Raises PdfExtractionError if tables cannot be reliably extracted.
    """
    # 1. Check encryption and decrypt in memory if needed
    try:
        # We use pikepdf to check encryption and decrypt.
        with pikepdf.Pdf.open(io.BytesIO(file_bytes), password=password or "") as pdf:
            # Save the decrypted (or already unencrypted) PDF to a new memory stream
            clean_pdf_stream = io.BytesIO()
            pdf.save(clean_pdf_stream)
            clean_pdf_stream.seek(0)
            
    except pikepdf.PasswordError:
        raise PdfEncryptedError("This PDF is password-protected. Please provide the password.")
    except Exception as e:
        logger.error(f"pdf_open_error: {str(e)}")
        raise PdfExtractionError("Failed to open or decrypt the PDF. It may be malformed.")

    # 2. Extract tables using pdfplumber
    all_rows = []
    try:
        with pdfplumber.open(clean_pdf_stream) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        # Clean up row (remove None, strip whitespace, etc.)
                        clean_row = [str(cell).strip() if cell is not None else "" for cell in row]
                        # Only keep rows that are not entirely empty
                        if any(clean_row):
                            all_rows.append(clean_row)
    except Exception as e:
        logger.error(f"pdf_extract_error: {str(e)}")
        raise PdfExtractionError("Failed to extract text from the PDF.")

    # 3. Validate extraction
    if not all_rows:
        raise PdfExtractionError("No tabular data could be found in this PDF.")
        
    df = pd.DataFrame(all_rows)
    
    # Validation Gate: Does this actually resemble a statement?
    text_content = " ".join(df.astype(str).sum(axis=1).str.lower())
    
    date_keywords = ['date', 'txn date', 'value date', 'transaction date']
    money_keywords = ['amount', 'withdrawal', 'deposit', 'dr', 'cr', 'debit', 'credit', 'balance']
    desc_keywords = ['narration', 'description', 'particulars', 'remarks', 'merchant']
    
    has_date_kw = any(kw in text_content for kw in date_keywords)
    has_money_kw = any(kw in text_content for kw in money_keywords)
    has_desc_kw = any(kw in text_content for kw in desc_keywords)
    
    if not (has_date_kw and has_money_kw and has_desc_kw):
        raise PdfExtractionError("We couldn't reliably read this statement. Extracted tables do not match standard bank statement formats.")
        
    if len(df) < 2:
        raise PdfExtractionError("Not enough data rows found in this statement.")
        
    return df
