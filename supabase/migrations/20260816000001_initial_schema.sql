-- 1. Custom Types
CREATE TYPE transaction_category AS ENUM ('Food', 'Transport', 'Education', 'Shopping', 'Entertainment', 'Subscriptions', 'Rent & Bills', 'Groceries', 'Healthcare', 'Family', 'Other');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer', 'refund');
CREATE TYPE transaction_source AS ENUM ('manual', 'statement');

-- 2. Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(20) UNIQUE CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$' AND length(trim(username)) > 0),
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Automatic Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- 4. Transactions Table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    merchant VARCHAR(120) NOT NULL CHECK (length(trim(merchant)) > 0),
    description TEXT,
    category transaction_category DEFAULT 'Other'::transaction_category NOT NULL,
    type transaction_type DEFAULT 'expense'::transaction_type NOT NULL,
    source transaction_source DEFAULT 'manual'::transaction_source NOT NULL,
    confidence NUMERIC(4,3) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);

-- 5. Table-level grants (RLS policies control row-level access on top of these)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
