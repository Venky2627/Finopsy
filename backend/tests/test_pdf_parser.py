import pytest
import os
import io
from app.parsers.pdf_parser import extract_pdf_tables, PdfEncryptedError, PdfExtractionError

def get_fixture(filename):
    path = os.path.join(os.path.dirname(__file__), 'fixtures', filename)
    with open(path, 'rb') as f:
        return f.read()

def test_extract_clean_pdf():
    pdf_bytes = get_fixture('finopsy_stress_test.pdf')
    df = extract_pdf_tables(pdf_bytes)
    assert not df.empty
    assert len(df) >= 7 # multiple rows from multiple pages
    
    text = df.astype(str).sum(axis=1).str.lower().str.cat()
    assert "zomato" in text
    assert "swiggy" in text # from page 2

def test_extract_encrypted_pdf_no_password():
    pdf_bytes = get_fixture('finopsy_stress_test_encrypted.pdf')
    with pytest.raises(PdfEncryptedError) as exc:
        extract_pdf_tables(pdf_bytes)
    assert "password-protected" in str(exc.value)

def test_extract_encrypted_pdf_correct_password():
    pdf_bytes = get_fixture('finopsy_stress_test_encrypted.pdf')
    df = extract_pdf_tables(pdf_bytes, password="password123")
    assert not df.empty
    text = df.astype(str).sum(axis=1).str.lower().str.cat()
    assert "zomato" in text

def test_extract_encrypted_pdf_wrong_password():
    pdf_bytes = get_fixture('finopsy_stress_test_encrypted.pdf')
    with pytest.raises(PdfEncryptedError):
        extract_pdf_tables(pdf_bytes, password="wrong")

def test_extract_malformed_pdf():
    pdf_bytes = b"This is not a pdf file"
    with pytest.raises(PdfExtractionError):
        extract_pdf_tables(pdf_bytes)

def test_extract_pdf_no_tables():
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    
    # Generate an image-only or simple text PDF with no tables
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    can.drawString(10, 100, "Hello world, this has no tables.")
    can.save()
    packet.seek(0)
    pdf_bytes = packet.read()
    
    with pytest.raises(PdfExtractionError) as exc:
        extract_pdf_tables(pdf_bytes)
    assert "We couldn't reliably read this statement" in str(exc.value) or "No tabular data" in str(exc.value)

