# Architecture

## Applications

- `frontend`: Next.js App Router client. It renders product UI and calls FastAPI via `NEXT_PUBLIC_API_URL`.
- `backend`: FastAPI API. It owns import normalization, categorization and deterministic financial analysis.
- Supabase will own authenticated users and persisted transactions once credentials and schema migrations are configured. The current API is intentionally stateless for the demo flow.

## Shared transaction contract

`Transaction` fields: `id`, optional `user_id`, `date`, positive `amount`, `merchant`, optional `description`, `category`, `type`, optional `payment_method`, `source`, `confidence`, `created_at`.

`type` is `income | expense | transfer | refund`; `source` is `manual | statement`. Categories are the controlled enum defined in `backend/app/models.py`.

## Financial rules

Only expenses count toward total spending and category breakdown. Income and refunds add to available funds; transfers do not. The engine must not use an LLM, and all behavior needs tests.
