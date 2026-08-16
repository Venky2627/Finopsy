import os
import time
import logging
from datetime import date
from typing import Callable

from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.demo import demo_transactions
from app.financial import analyze_transactions
from app.models import QuickAddRequest, Transaction, TransactionSource, Category, ParseStatementResponse, FinancialSummary, DemoResponse
from app.categorization.rules import categorize_merchant
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
        confidence=1.0 if category == request.category else 0.8,
    )
    return txn


@app.post("/api/analyze", response_model=FinancialSummary)
def analyze(transactions: list[Transaction]) -> FinancialSummary:
    return analyze_transactions(transactions)


@app.post("/api/upload-statement", response_model=ParseStatementResponse)
async def upload_statement(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        return parse_statement(contents, file.filename)
    except Exception as e:
        logger.error(f"file_upload_error filename={file.filename} error={str(e)}")
        return JSONResponse(
            status_code=400,
            content={"error": {"code": "INVALID_FILE", "message": "The uploaded statement could not be parsed."}}
        )
