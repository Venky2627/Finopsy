import os
import time
import logging
from datetime import date
from typing import Callable

from fastapi import FastAPI, File, UploadFile, Request, Depends, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi import status, HTTPException

from app.demo import demo_transactions
from app.financial import analyze_transactions
from app.models import QuickAddRequest, Transaction, TransactionSource, Category, ParseStatementResponse, FinancialSummary, DemoResponse, UserProfileUpdate, TransactionBulkUpdate
from app.categorization.rules import categorize_merchant
from app.auth import get_current_user
from app.supabase_client import get_supabase, get_admin_supabase

from app.parsers.statement import parse_statement

# 1. Logging setup
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("finopsy")

app = FastAPI(title="Finopsy API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Structured request logging & error handling
@app.middleware("http")
async def log_requests(request: Request, call_next: Callable):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"path={request.url.path} method={request.method} status={response.status_code} duration={process_time:.3f}s")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"path={request.url.path} method={request.method} status=500 duration={process_time:.3f}s error={str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred."}}
        )

from fastapi.exceptions import RequestValidationError
from fastapi import status

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    # If detail is already in our error format, use it directly
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    # Otherwise wrap it
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": "HTTP_ERROR", "message": str(exc.detail)}}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": {"code": "VALIDATION_ERROR", "message": str(exc)}}
    )

@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/demo", response_model=DemoResponse)
def demo() -> DemoResponse:
    transactions = demo_transactions()
    summary = analyze_transactions(transactions)
    return DemoResponse(transactions=transactions, summary=summary)


@app.post("/api/quick-add", response_model=Transaction)
def quick_add(request: QuickAddRequest) -> Transaction:
    category = request.category
    if category == Category.OTHER:
        category = categorize_merchant(request.merchant)
            
    txn = Transaction(
        date=request.date or date.today(),
        amount=request.amount,
        merchant=request.merchant,
        description=request.description,
        category=category,
        type=request.type,
        source=TransactionSource.MANUAL,
        extraction_confidence=1.0,
        category_confidence=1.0 if category == request.category else 0.8,
    )
    return txn


@app.post("/api/analyze", response_model=FinancialSummary)
def analyze(transactions: list[Transaction]) -> FinancialSummary:
    return analyze_transactions(transactions)


@app.post("/api/upload-statement", response_model=ParseStatementResponse)
async def upload_statement(
    file: UploadFile = File(...),
    password: str | None = Form(default=None)
):
    try:
        # Size limit (e.g., 10MB)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            return JSONResponse(
                status_code=413,
                content={"error": {"code": "FILE_TOO_LARGE", "message": "File exceeds the 10MB limit."}}
            )
            
        from app.parsers.pdf_parser import PdfEncryptedError, PdfExtractionError
        try:
            return parse_statement(contents, file.filename, password=password)
        except PdfEncryptedError as e:
            return JSONResponse(
                status_code=422,
                content={"error": {"code": "PDF_ENCRYPTED", "message": str(e)}}
            )
        except PdfExtractionError as e:
            return JSONResponse(
                status_code=400,
                content={"error": {"code": "PDF_EXTRACTION_FAILED", "message": str(e)}}
            )
    except Exception as e:
        logger.error(f"file_upload_error filename={file.filename} error={str(e)}")
        return JSONResponse(
            status_code=400,
            content={"error": {"code": "INVALID_FILE", "message": "The uploaded statement could not be parsed."}}
        )

@app.get("/api/me")
def get_me(user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    res = supabase.table('profiles').select('*').eq('id', user['id']).execute()
    if res.data:
        return res.data[0]
    return {"id": user['id'], "email": user.get('email')}

@app.patch("/api/me")
def update_me(update: UserProfileUpdate, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    update_data = update.model_dump(exclude_unset=True)
    if not update_data:
        return {"status": "no changes"}
    res = supabase.table('profiles').update(update_data).eq('id', user['id']).execute()
    if res.data:
        return res.data[0]
    # If not found, insert
    update_data['id'] = user['id']
    res = supabase.table('profiles').insert(update_data).execute()
    return res.data[0]

@app.delete("/api/me")
def delete_me(user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    # delete all transactions
    supabase.table('transactions').delete().eq('user_id', user['id']).execute()
    # delete profile
    supabase.table('profiles').delete().eq('id', user['id']).execute()
    
    # Also delete user from auth
    admin_supabase = get_admin_supabase()
    admin_supabase.auth.admin.delete_user(user['id'])
    
    return {"status": "deleted"}

@app.get("/api/transactions")
def get_transactions(user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    res = supabase.table('transactions').select('*').eq('user_id', user['id']).execute()
    return res.data

@app.post("/api/transactions")
def create_transactions(transactions: list[Transaction], user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    data = []
    for t in transactions:
        t_dict = t.model_dump(mode="json")
        t_dict['user_id'] = user['id']
        data.append(t_dict)
    if not data:
        return []
    res = supabase.table('transactions').insert(data).execute()
    return res.data

@app.patch("/api/transactions/bulk")
def bulk_update_transactions(updates: list[TransactionBulkUpdate], user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    # Apply updates individually for now to ensure RLS per-row execution via API
    # Since Supabase postgrest doesn't easily support bulk update with varying values in one request,
    # we can iterate or use a stored procedure. Iterating is fine for 30-50 txns.
    results = []
    for update in updates:
        update_data = update.model_dump(exclude_unset=True)
        txn_id = update_data.pop('id')
        if not update_data:
            continue
        res = supabase.table('transactions').update(update_data).eq('id', txn_id).eq('user_id', user['id']).execute()
        if res.data:
            results.append(res.data[0])
    return results

@app.patch("/api/transactions/{id}")
def update_transaction(id: str, update: dict, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    res = supabase.table('transactions').update(update).eq('id', id).eq('user_id', user['id']).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail={"error": {"code": "NOT_FOUND", "message": "Transaction not found"}})
    return res.data[0]

@app.delete("/api/transactions/{id}")
def delete_transaction(id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    res = supabase.table('transactions').delete().eq('id', id).eq('user_id', user['id']).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail={"error": {"code": "NOT_FOUND", "message": "Transaction not found"}})
    return {"status": "deleted"}

@app.delete("/api/transactions")
def delete_all_transactions(user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    res = supabase.table('transactions').delete().eq('user_id', user['id']).execute()
    return {"status": "deleted"}

@app.post("/api/transactions/migrate")
def migrate_transactions(transactions: list[Transaction], user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    data = []
    for t in transactions:
        t_dict = t.model_dump(mode="json")
        t_dict['user_id'] = user['id']
        data.append(t_dict)
    if not data:
        return []
    res = supabase.table('transactions').insert(data).execute()
    return {"migrated": len(data)}

@app.get("/api/username/check")
def check_username(username: str):
    admin_supabase = get_admin_supabase()
    res = admin_supabase.table('profiles').select('username').eq('username', username).execute()
    if res.data:
        return {"available": False}
    return {"available": True}

