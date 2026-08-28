import os
import time
import logging
from datetime import date
from typing import Callable, List, Dict, Any

from fastapi import FastAPI, File, UploadFile, Request, Depends, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi import status, HTTPException
from pydantic import BaseModel

from app.demo import demo_transactions
from app.financial import analyze_transactions
from app.models import (
    QuickAddRequest, Transaction, TransactionSource, Category, 
    ParseStatementResponse, FinancialSummary, DemoResponse, 
    UserProfileUpdate, TransactionBulkUpdate, BudgetCreate, BudgetOut
)
from app.categorization.rules import categorize_merchant
from app.auth import get_current_user, optional_current_user
from app.supabase_client import get_supabase, get_admin_supabase
from app.parsers.statement import parse_statement
from app.financial.roast_engine import RoastRequest, RoastResponse, generate_roast_engine

# 1. Logging setup (Privacy: zero logging of financial amounts, PII, passwords, or tokens)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("finopsy")

app = FastAPI(title="Finopsy API", version="0.2.0")

allowed_origins_raw = os.environ.get("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Structured request logging (Paths and status codes only - zero PII)
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
        logger.error(f"path={request.url.path} method={request.method} status=500 duration={process_time:.3f}s")
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred."}}
        )

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": "HTTP_ERROR", "message": str(exc.detail)}}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": {"code": "VALIDATION_ERROR", "message": "Invalid request payload format."}}
    )

# =========================================================================
# PUBLIC ENDPOINTS
# =========================================================================

@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.get("/api/demo", response_model=DemoResponse)
def get_demo_data():
    from app.demo import demo_transactions, demo_subscriptions
    from app.financial.engine import analyze_transactions
    
    txns = demo_transactions()
    summary = analyze_transactions(txns)
    summary.subscriptions = demo_subscriptions()
    
    return DemoResponse(
        transactions=txns,
        summary=summary
    )

@app.post("/api/quick-add", response_model=Transaction)
def quick_add(request: QuickAddRequest) -> Transaction:
    category = request.category
    if category == Category.OTHER:
        category, _ = categorize_merchant(request.merchant)
            
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

class ResolveMerchantsRequest(BaseModel):
    merchants: list[str]

@app.post("/api/merchants/resolve")
async def resolve_merchants(req: ResolveMerchantsRequest):
    from app.categorization.llm import resolve_unknown_merchants_batch
    try:
        mapping = resolve_unknown_merchants_batch(req.merchants)
        return {"mapping": mapping}
    except Exception as e:
        logger.warning(f"Merchant resolution warning: {e}")
        return {"mapping": {}}

@app.post("/api/roast", response_model=RoastResponse)
async def generate_roast_endpoint(req: RoastRequest, request: Request):
    return await generate_roast_engine(req)

@app.get("/api/username/check")
def check_username(username: str):
    admin_supabase = get_admin_supabase()
    res = admin_supabase.table('profiles').select('username').eq('username', username).execute()
    if res.data:
        return {"available": False}
    return {"available": True}

@app.get("/api/users/check-username")
def check_username_alias(username: str):
    return check_username(username)

# =========================================================================
# STATEMENT UPLOAD (PUBLIC / OPTIONALLY AUTHENTICATED)
# =========================================================================

@app.post("/api/upload-statement", response_model=ParseStatementResponse)
async def upload_statement(
    file: UploadFile = File(...),
    password: str | None = Form(default=None),
    user: dict | None = Depends(optional_current_user)
):
    try:
        contents = await file.read()
        
        # Max Size Check: 10MB
        if len(contents) > 10 * 1024 * 1024:
            return JSONResponse(
                status_code=413,
                content={"error": {"code": "FILE_TOO_LARGE", "message": "File exceeds the 10MB limit."}}
            )

        user_rules = {}
        global_aliases = {}
        clean_merchants = []
        
        try:
            supabase = get_supabase(user.get('token') if user else None)
            
            if user:
                res = supabase.table('user_merchant_rules').select('merchant_pattern,category').eq('user_id', user['id']).execute()
                for row in (res.data or []):
                    try:
                        user_rules[row['merchant_pattern'].lower()] = Category(row['category'])
                    except Exception:
                        pass
                    
            # Fetch global merchant aliases safely
            aliases_res = supabase.table('merchant_aliases').select('normalized_pattern,merchants(clean_name)').execute()
            for a in (aliases_res.data or []):
                merchants_data = a.get('merchants')
                if merchants_data and isinstance(merchants_data, dict) and 'clean_name' in merchants_data:
                    global_aliases[a['normalized_pattern']] = merchants_data['clean_name']
                    
        except Exception as e:
            logger.warning("Rules lookup proceeding with default heuristics.")
            
        from app.parsers.pdf_parser import PdfEncryptedError, PdfExtractionError
        try:
            return parse_statement(
                contents, file.filename or "statement.csv", password=password, 
                user_rules=user_rules, global_aliases=global_aliases, clean_merchants=clean_merchants
            )
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
        return JSONResponse(
            status_code=400,
            content={"error": {"code": "INVALID_FILE", "message": "The uploaded statement could not be parsed."}}
        )

# =========================================================================
# AUTHENTICATED USER LIFECYCLE & RLS-PROTECTED ENDPOINTS
# =========================================================================

@app.get("/api/me")
def get_me(user: dict = Depends(get_current_user)):
    supabase = get_supabase(user['token'])
    res = supabase.table('profiles').select('*').eq('id', user['id']).execute()
    if res.data:
        return res.data[0]
    return {"id": user['id'], "email": user.get('email')}

@app.patch("/api/me")
def update_me(update: UserProfileUpdate, user: dict = Depends(get_current_user)):
    supabase = get_supabase(user['token'])
    update_data = update.model_dump(exclude_unset=True)
    if not update_data:
        return {"status": "no changes"}
    res = supabase.table('profiles').update(update_data).eq('id', user['id']).execute()
    if res.data:
        return res.data[0]
    update_data['id'] = user['id']
    res = supabase.table('profiles').insert(update_data).execute()
    return res.data[0] if res.data else {"id": user['id']}

@app.delete("/api/me")
def delete_me(user: dict = Depends(get_current_user)):
    """True Deletion: Completely wipes all user records and deletes auth user account."""
    admin_supabase = get_admin_supabase()
    uid = user['id']
    
    # 1. Delete all user transactions
    admin_supabase.table('transactions').delete().eq('user_id', uid).execute()
    # 2. Delete user budgets
    admin_supabase.table('budgets').delete().eq('user_id', uid).execute()
    # 3. Delete user merchant rules
    admin_supabase.table('user_merchant_rules').delete().eq('user_id', uid).execute()
    # 4. Delete user profile
    admin_supabase.table('profiles').delete().eq('id', uid).execute()
    # 5. Delete Supabase auth user account
    try:
        admin_supabase.auth.admin.delete_user(uid)
    except Exception as e:
        logger.warning(f"Auth user deletion notice: {e}")
        
    return {"status": "deleted"}

@app.get("/api/transactions")
def get_user_transactions(user: dict = Depends(get_current_user)):
    supabase = get_supabase(user['token'])
    res = supabase.table('transactions').select('*').eq('user_id', user['id']).order('date', desc=True).execute()
    return res.data or []

@app.post("/api/transactions")
def create_transactions(transactions: list[Transaction], user: dict = Depends(get_current_user)):
    supabase = get_supabase(user['token'])
    if not transactions:
        return []
        
    # Fetch existing transactions to deduplicate
    existing_res = supabase.table('transactions').select('date, amount, merchant, type').eq('user_id', user['id']).execute()
    existing_fingerprints = set()
    for row in (existing_res.data or []):
        fp = f"{row['date']}|{float(row['amount']):.2f}|{row['merchant'].strip().lower()}|{row.get('type', 'expense')}"
        existing_fingerprints.add(fp)
        
    data = []
    rules = []
    for t in transactions:
        t_dict = t.model_dump(mode="json")
        user_edited = t_dict.pop('user_edited', False)
        t_dict['user_id'] = user['id']
        
        # Deduplication check
        t_type = t_dict.get('type', 'expense')
        fp = f"{t_dict['date']}|{float(t_dict['amount']):.2f}|{t_dict['merchant'].strip().lower()}|{t_type}"
        if fp in existing_fingerprints:
            continue
            
        existing_fingerprints.add(fp)
        data.append(t_dict)
        
        if user_edited and t_dict.get('merchant'):
            rules.append({
                'user_id': user['id'],
                'merchant_pattern': t_dict['merchant'],
                'category': t_dict['category']
            })
            
    if not data:
        return []
        
    res = supabase.table('transactions').insert(data).execute()
    
    if rules:
        try:
            supabase.table('user_merchant_rules').upsert(rules, on_conflict='user_id,merchant_pattern').execute()
        except Exception:
            pass
            
    return res.data or []

@app.post("/api/transactions/migrate")
def migrate_transactions(transactions: list[Transaction], user: dict = Depends(get_current_user)):
    """Idempotent Migration: Deduplicates incoming transactions against user's existing records."""
    supabase = get_supabase(user['token'])
    if not transactions:
        return {"migrated": 0, "skipped_duplicates": 0, "total_received": 0}
        
    # Fetch existing transaction fingerprints
    existing_res = supabase.table('transactions').select('date, amount, merchant, type').eq('user_id', user['id']).execute()
    existing_fingerprints = set()
    for row in (existing_res.data or []):
        fp = f"{row['date']}|{float(row['amount']):.2f}|{row['merchant'].strip().lower()}|{row.get('type', 'expense')}"
        existing_fingerprints.add(fp)
        
    new_data = []
    skipped_count = 0
    
    for t in transactions:
        t_dict = t.model_dump(mode="json")
        t_dict['user_id'] = user['id']
        t_dict.pop('user_edited', None)
        
        # Validate minimum bounds
        if float(t_dict.get('amount', 0)) <= 0 or not str(t_dict.get('merchant', '')).strip():
            skipped_count += 1
            continue
            
        t_type = t_dict.get('type', 'expense')
        fp = f"{t_dict['date']}|{float(t_dict['amount']):.2f}|{t_dict['merchant'].strip().lower()}|{t_type}"
        
        if fp in existing_fingerprints:
            skipped_count += 1
            continue
            
        existing_fingerprints.add(fp)
        new_data.append(t_dict)
        
    migrated_count = 0
    if new_data:
        res = supabase.table('transactions').insert(new_data).execute()
        migrated_count = len(res.data) if res.data else len(new_data)
        
    return {
        "migrated": migrated_count,
        "skipped_duplicates": skipped_count,
        "total_received": len(transactions)
    }

@app.patch("/api/transactions/bulk")
def bulk_update_transactions(updates: list[TransactionBulkUpdate], user: dict = Depends(get_current_user)):
    supabase = get_supabase(user['token'])
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
    supabase = get_supabase(user['token'])
    res = supabase.table('transactions').update(update).eq('id', id).eq('user_id', user['id']).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail={"error": {"code": "NOT_FOUND", "message": "Transaction not found"}})
    return res.data[0]

@app.delete("/api/transactions/{id}")
def delete_transaction(id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase(user['token'])
    res = supabase.table('transactions').delete().eq('id', id).eq('user_id', user['id']).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail={"error": {"code": "NOT_FOUND", "message": "Transaction not found"}})
    return {"status": "deleted"}

@app.delete("/api/transactions")
def delete_all_transactions(user: dict = Depends(get_current_user)):
    supabase = get_supabase(user['token'])
    res = supabase.table('transactions').delete().eq('user_id', user['id']).execute()
    return {"status": "deleted"}

# =========================================================================
# BUDGETS (RLS-PROTECTED)
# =========================================================================

def calculate_budget_status(spent: float, limit: float) -> str:
    percentage = (spent / limit) * 100 if limit > 0 else 0
    if percentage >= 100:
        return "exceeded"
    elif percentage >= 80:
        return "warning"
    else:
        return "safe"

@app.get("/api/budgets")
def get_budgets(user: dict = Depends(get_current_user)):
    supabase = get_supabase(user['token'])
    budgets_res = supabase.table('budgets').select('*').eq('user_id', user['id']).execute()
    if not budgets_res.data:
        return []
        
    budgets = budgets_res.data
    import datetime
    today = datetime.date.today()
    start_of_month = today.replace(day=1)
    
    txns_res = supabase.table('transactions').select('amount, category').eq('user_id', user['id']).gte('date', start_of_month.isoformat()).execute()
    
    from collections import defaultdict
    spent_by_category = defaultdict(float)
    for txn in (txns_res.data or []):
        spent_by_category[txn['category']] += float(txn['amount'])
        
    out = []
    for b in budgets:
        spent = spent_by_category.get(b['category'], 0.0)
        limit = float(b['monthly_limit'])
        pct = round((spent / limit) * 100, 1) if limit > 0 else 0.0
        
        out.append(BudgetOut(
            id=b['id'],
            category=Category(b['category']),
            monthly_limit=limit,
            spent_this_month=round(spent, 2),
            remaining=round(max(0, limit - spent), 2),
            percentage=pct,
            status=calculate_budget_status(spent, limit),
            created_at=b['created_at']
        ))
    return out

@app.post("/api/budgets")
def create_budget(budget: BudgetCreate, user: dict = Depends(get_current_user)):
    supabase = get_supabase(user['token'])
    try:
        data = {
            'user_id': user['id'],
            'category': budget.category.value,
            'monthly_limit': budget.monthly_limit
        }
        existing = supabase.table('budgets').select('id').eq('user_id', user['id']).eq('category', budget.category.value).execute()
        if existing.data:
            res = supabase.table('budgets').update({'monthly_limit': budget.monthly_limit}).eq('id', existing.data[0]['id']).execute()
        else:
            res = supabase.table('budgets').insert(data).execute()
            
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create budget")
            
        b = res.data[0]
        
        import datetime
        today = datetime.date.today()
        start_of_month = today.replace(day=1)
        txns_res = supabase.table('transactions').select('amount').eq('user_id', user['id']).eq('category', budget.category.value).gte('date', start_of_month.isoformat()).execute()
        
        spent = sum(float(t['amount']) for t in (txns_res.data or []))
        limit = float(b['monthly_limit'])
        pct = round((spent / limit) * 100, 1) if limit > 0 else 0.0
        
        return BudgetOut(
            id=b['id'],
            category=Category(b['category']),
            monthly_limit=limit,
            spent_this_month=round(spent, 2),
            remaining=round(max(0, limit - spent), 2),
            percentage=pct,
            status=calculate_budget_status(spent, limit),
            created_at=b['created_at']
        )
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": {"code": "INTERNAL", "message": "Failed to save budget"}})

@app.patch("/api/budgets/{id}")
def update_budget(id: str, budget: dict, user: dict = Depends(get_current_user)):
    supabase = get_supabase(user['token'])
    if 'monthly_limit' not in budget:
        return JSONResponse(status_code=400, content={"error": {"code": "BAD_REQUEST", "message": "Missing monthly_limit"}})
        
    res = supabase.table('budgets').update({'monthly_limit': budget['monthly_limit']}).eq('id', id).eq('user_id', user['id']).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Updated successfully"}

@app.delete("/api/budgets/{id}")
def delete_budget(id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase(user['token'])
    res = supabase.table('budgets').delete().eq('id', id).eq('user_id', user['id']).execute()
    return {"message": "Deleted successfully"}
