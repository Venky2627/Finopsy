CREATE TYPE match_method_enum AS ENUM ('exact', 'rule', 'fuzzy', 'user', 'llm');

CREATE TABLE public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clean_name VARCHAR(120) UNIQUE NOT NULL,
    default_category transaction_category NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.merchant_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    raw_pattern VARCHAR(120),
    normalized_pattern VARCHAR(120) NOT NULL,
    match_method match_method_enum NOT NULL,
    confidence NUMERIC(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(merchant_id, normalized_pattern)
);

-- RLS
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_aliases ENABLE ROW LEVEL SECURITY;

-- Global read access for authenticated users
CREATE POLICY "Anyone can read merchants" ON public.merchants FOR SELECT USING (true);
CREATE POLICY "Anyone can read merchant aliases" ON public.merchant_aliases FOR SELECT USING (true);
