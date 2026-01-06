-- Adds per-survey token policy.
-- Policy values:
-- - multi_candidate: a token can evaluate multiple candidates (1 evaluation per candidate)
-- - single_use: a token can submit exactly 1 evaluation total for the survey

ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS token_policy VARCHAR(50) NOT NULL DEFAULT 'multi_candidate';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'surveys_token_policy_check'
  ) THEN
    ALTER TABLE surveys
      ADD CONSTRAINT surveys_token_policy_check
      CHECK (token_policy IN ('multi_candidate', 'single_use'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_surveys_token_policy ON surveys(token_policy);
