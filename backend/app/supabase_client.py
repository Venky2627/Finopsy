import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'http://127.0.0.1:54321')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU')

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
