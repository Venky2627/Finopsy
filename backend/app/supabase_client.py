import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://rzjuliwodvqrirowywcx.supabase.co')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', os.environ.get('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_kD0A4LnjXqZjiXOSlPiZ7w_7DU2AWXZ'))
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', os.environ.get('SUPABASE_SECRET_KEY', ''))

def get_supabase(token: str | None = None) -> Client:
    """Returns a Supabase client. If token is provided, attaches it for RLS enforcement."""
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    if token:
        try:
            client.postgrest.auth(token)
        except Exception:
            pass
    return client

def get_admin_supabase() -> Client:
    """Returns admin client with service role key for admin-only operations."""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
