-- Phase 4: Splitting confidence into extraction_confidence and category_confidence
-- and dropping the old confidence column.

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS extraction_confidence REAL DEFAULT 1.0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category_confidence REAL DEFAULT 1.0;

-- Backfill data from existing confidence column if it exists
DO $$ 
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='confidence') THEN
    UPDATE transactions SET 
      extraction_confidence = confidence,
      category_confidence = confidence;
      
    ALTER TABLE transactions DROP COLUMN confidence;
  END IF;
END $$;
