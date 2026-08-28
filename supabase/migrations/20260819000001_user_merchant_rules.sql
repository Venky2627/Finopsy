CREATE TABLE public.user_merchant_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_pattern VARCHAR(120) NOT NULL,
    category transaction_category NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, merchant_pattern)
);

ALTER TABLE public.user_merchant_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own rules" ON public.user_merchant_rules
    FOR ALL USING (auth.uid() = user_id);
