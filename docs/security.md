# Finopsy Security Checklist

- `[x]` RLS enabled on profiles
- `[x]` RLS enabled on transactions
- `[x]` SELECT isolation tested
- `[x]` INSERT isolation tested
- `[x]` UPDATE isolation tested
- `[x]` DELETE isolation tested
- `[x]` Ownership cannot be changed (WITH CHECK + user_id reassignment test)
- `[ ]` Service-role key never exposed to frontend (verified at deployment)
- `[x]` Auth user deletion cascades correctly (ON DELETE CASCADE)
- `[x]` No financial data exposed through logs
