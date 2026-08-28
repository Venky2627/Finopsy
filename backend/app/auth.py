from fastapi import Depends, HTTPException, Request
from app.supabase_client import get_supabase

async def get_current_user(request: Request) -> dict:
    """Extract user from Supabase JWT. Returns user dict with 'id', 'email', and 'token'."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail={"error": {"code": "UNAUTHORIZED", "message": "Missing authentication"}})
    token = auth_header.split(' ')[1]
    
    supabase = get_supabase()
    try:
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail={"error": {"code": "UNAUTHORIZED", "message": "Invalid authentication credentials"}})
        return {"id": response.user.id, "email": response.user.email, "token": token}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail={"error": {"code": "UNAUTHORIZED", "message": str(e)}})

async def optional_current_user(request: Request) -> dict | None:
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    try:
        return await get_current_user(request)
    except HTTPException:
        return None
