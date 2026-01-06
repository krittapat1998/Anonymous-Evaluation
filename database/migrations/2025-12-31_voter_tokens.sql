-- Adds voter_tokens table used by the current backend.
-- Supports 2 token types:
-- 1) Candidate-tied tokens: candidate_id IS NOT NULL (used for per-candidate token management)
-- 2) Bulk (anonymous) tokens: candidate_id IS NULL (used for /admin/bulk-generate)
--
-- Note: This schema stores `token` in plaintext to support admin re-display.
-- If you need stronger security, remove `token` storage and only show tokens once.

CREATE TABLE IF NOT EXISTS voter_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Backfill/alter if table already existed in another shape
ALTER TABLE voter_tokens
  ADD COLUMN IF NOT EXISTS survey_id UUID;
ALTER TABLE voter_tokens
  ADD COLUMN IF NOT EXISTS candidate_id UUID;
ALTER TABLE voter_tokens
  ADD COLUMN IF NOT EXISTS token VARCHAR(255);
ALTER TABLE voter_tokens
  ADD COLUMN IF NOT EXISTS token_hash VARCHAR(255);
ALTER TABLE voter_tokens
  ADD COLUMN IF NOT EXISTS is_used BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE voter_tokens
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMP;
ALTER TABLE voter_tokens
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Constraints/indexes
CREATE INDEX IF NOT EXISTS idx_voter_tokens_survey_id ON voter_tokens(survey_id);
CREATE INDEX IF NOT EXISTS idx_voter_tokens_candidate_id ON voter_tokens(candidate_id);
CREATE INDEX IF NOT EXISTS idx_voter_tokens_is_used ON voter_tokens(is_used);
CREATE INDEX IF NOT EXISTS idx_voter_tokens_created_at ON voter_tokens(created_at DESC);

-- Optional uniqueness: prevent duplicate plaintext tokens per survey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'voter_tokens_unique_token_per_survey'
  ) THEN
    ALTER TABLE voter_tokens
      ADD CONSTRAINT voter_tokens_unique_token_per_survey UNIQUE (survey_id, token);
  END IF;
END $$;
