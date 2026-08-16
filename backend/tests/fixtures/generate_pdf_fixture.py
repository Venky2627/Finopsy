import os
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

def generate_pdf():
    output_path = os.path.join(os.path.dirname(__file__), 'finopsy_stress_test.pdf')
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    elements = []
    
    styles = getSampleStyleSheet()
    
    # Junk header to test parser robustness
    elements.append(Paragraph("HDFC BANK LIMITED", styles['Title']))
    elements.append(Paragraph("Account Statement for Period: 01/01/2026 to 31/01/2026", styles['Normal']))
    elements.append(Paragraph("Name: Venkat", styles['Normal']))
    elements.append(Paragraph("Account No: 1234567890", styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Table data
    data = [
        ['Date', 'Narration', 'Chq/Ref No.', 'Value Date', 'Withdrawal (Dr)', 'Deposit (Cr)', 'Closing Balance'],
        ['01/01/2026', 'UPI/ZOMATO/123456/Payment', '123456', '01/01/2026', '420.00', '', '15842.23'],
        ['02/01/2026', 'NEFT-SALARY-ACME CORP', '789012', '02/01/2026', '', '50000.00', '65842.23'],
        ['05/01/2026', 'ATM WDL-HDFC-MUMBAI', '345678', '05/01/2026', '1000.00', '', '64842.23'],
        # Test blank rows
        ['', '', '', '', '', '', ''],
        # Test zero amounts
        ['10/01/2026', 'CASH DEPOSIT', '901234', '10/01/2026', '', '0.00', '64842.23'],
        # Test malformed dates (handled by normalizer but good for stress testing)
        ['31-02-2026', 'INVALID DATE WDL', '567890', '31-02-2026', '100.00', '', '64742.23']
    ]
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    elements.append(table)
    
    # Add a second table on the next page to test multi-page concatenation
    elements.append(Spacer(1, 400)) # Force page break essentially
    
    data2 = [
        ['Date', 'Narration', 'Chq/Ref No.', 'Value Date', 'Withdrawal (Dr)', 'Deposit (Cr)', 'Closing Balance'],
        ['15/01/2026', 'SWIGGY-LUNCH', '111111', '15/01/2026', '350.00', '', '64392.23'],
    ]
    table2 = Table(data2)
    table2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(table2)
    
    doc.build(elements)
    print(f"Generated {output_path}")

    # Generate an encrypted version
    import pikepdf
    output_encrypted_path = os.path.join(os.path.dirname(__file__), 'finopsy_stress_test_encrypted.pdf')
    pdf = pikepdf.Pdf.open(output_path)
    pdf.save(output_encrypted_path, encryption=pikepdf.Encryption(user="password123", owner="password123", allow=pikepdf.Permissions(extract=False)))
    print(f"Generated {output_encrypted_path}")


if __name__ == '__main__':
    generate_pdf()
