-- ============================================
-- Anonymous Voting System - Database Setup
-- ============================================
-- PostgreSQL Database Initialization Script
-- Run this to create all tables and schema

-- ============================================
-- 1. CREATE DATABASE
-- ============================================
-- Run this FIRST if database doesn't exist:
-- createdb -U postgres anonymous_voting_db

-- Then connect:
-- psql -U voting_user -d anonymous_voting_db

-- ============================================
-- 2. CREATE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 3. SURVEYS TABLE
-- ============================================
-- Stores survey information
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, closed
  token_policy VARCHAR(50) NOT NULL DEFAULT 'multi_candidate', -- multi_candidate, single_use
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT status_check CHECK (status IN ('draft', 'active', 'closed')),
  CONSTRAINT token_policy_check CHECK (token_policy IN ('multi_candidate', 'single_use'))
);

CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_created_at ON surveys(created_at DESC);
CREATE INDEX idx_surveys_token_policy ON surveys(token_policy);

-- ============================================
-- 4. CANDIDATES TABLE
-- ============================================
-- Stores candidate information with access token hash
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(100),
  department VARCHAR(100),
  access_token_hash VARCHAR(255) NOT NULL, -- SHA-256 hash of access token
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_candidate_per_survey UNIQUE(survey_id, name)
);

CREATE INDEX idx_candidates_survey_id ON candidates(survey_id);
CREATE INDEX idx_candidates_access_token_hash ON candidates(access_token_hash);

-- ============================================
-- 5. FEEDBACK OPTIONS TABLE
-- ============================================
-- Stores predefined feedback options (strengths & weaknesses)
CREATE TABLE IF NOT EXISTS feedback_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'strength' or 'weakness'
  option_text VARCHAR(500) NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT type_check CHECK (type IN ('strength', 'weakness'))
);

CREATE INDEX idx_feedback_options_survey_id ON feedback_options(survey_id);
CREATE INDEX idx_feedback_options_type ON feedback_options(type);

-- ============================================
-- 6. VOTES TABLE
-- ============================================
-- Stores individual votes (anonymous)
-- NO voter identification stored - complete anonymity!
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  strength_ids JSONB, -- Array of selected strength IDs: ["str1", "str2"]
  weakness_ids JSONB, -- Array of selected weakness IDs: ["weak1", "weak2"]
  feedback_text TEXT, -- Optional written feedback
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT no_empty_feedback CHECK (
    (strength_ids IS NOT NULL AND jsonb_array_length(strength_ids) > 0) OR
    (weakness_ids IS NOT NULL AND jsonb_array_length(weakness_ids) > 0)
  )
);

CREATE INDEX idx_votes_survey_id ON votes(survey_id);
CREATE INDEX idx_votes_candidate_id ON votes(candidate_id);
CREATE INDEX idx_votes_created_at ON votes(created_at);

-- ============================================
-- 7. VOTES_USED TABLE
-- ============================================
-- Tracks which tokens have been used (one-time use enforcement)
-- Stores ONLY token hash - no voter identification
CREATE TABLE IF NOT EXISTS votes_used (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL, -- SHA-256 hash of voting token
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_token_per_survey UNIQUE(survey_id, token_hash)
);

CREATE INDEX idx_votes_used_survey_id ON votes_used(survey_id);
CREATE INDEX idx_votes_used_token_hash ON votes_used(token_hash);

-- ============================================
-- 7.1 VOTER_TOKENS TABLE (Current backend)
-- ============================================
-- Stores evaluator tokens (bcrypt) and their usage status.
-- candidate_id:
--   - NOT NULL: candidate-tied tokens (admin token management)
--   - NULL: bulk-generated tokens (admin/bulk-generate)
-- NOTE: Stores `token` in plaintext so admin can re-display bulk tokens.
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

CREATE INDEX IF NOT EXISTS idx_voter_tokens_survey_id ON voter_tokens(survey_id);
CREATE INDEX IF NOT EXISTS idx_voter_tokens_candidate_id ON voter_tokens(candidate_id);
CREATE INDEX IF NOT EXISTS idx_voter_tokens_is_used ON voter_tokens(is_used);
CREATE INDEX IF NOT EXISTS idx_voter_tokens_created_at ON voter_tokens(created_at DESC);

-- Prevent duplicate plaintext tokens per survey
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

-- ============================================
-- 8. ADMIN USERS TABLE
-- ============================================
-- Stores admin user credentials for API authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt hashed
  role VARCHAR(50) DEFAULT 'admin', -- admin, moderator
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- ============================================
-- 9. INSERT TEST DATA (Optional)
-- ============================================
-- Uncomment to insert sample data

-- Insert survey
-- INSERT INTO surveys (id, title, description, status)
-- VALUES (
--   'survey-1',
--   'Q4 2024 Feedback',
--   'Team feedback survey for Q4 2024',
--   'active'
-- );

-- Insert candidates with hashed access tokens
-- INSERT INTO candidates (id, survey_id, name, employee_id, department, access_token_hash)
-- VALUES
--   ('cand-1', 'survey-1', 'John Doe', 'EMP1001', 'Engineering', 'c8d607fce6a401a39a393d8b2d2a5002beebe499557ae592a4b43b9d9559c9e9'),
--   ('cand-2', 'survey-1', 'Jane Smith', 'EMP1002', 'Marketing', '1ca7b8d4887a67996de99573a9bba7bac47e758b0da6347b6ab881da28d114a6'),
--   ('cand-3', 'survey-1', 'Mike Johnson', 'EMP1003', 'Sales', '13ddb2f4f9d46ea8afb03bd3256c8ac983d7966ba2601a8b407e14832e95b2e6');

-- Insert feedback options
-- INSERT INTO feedback_options (id, survey_id, type, option_text, display_order)
-- VALUES
--   ('str1', 'survey-1', 'strength', 'Great communication skills', 1),
--   ('str2', 'survey-1', 'strength', 'Strong problem-solving abilities', 2),
--   ('str3', 'survey-1', 'strength', 'Excellent teamwork', 3),
--   ('weak1', 'survey-1', 'weakness', 'Could improve time management', 1),
--   ('weak2', 'survey-1', 'weakness', 'Needs better delegation skills', 2);

-- ============================================
-- 10. CREATE FUNCTIONS (Optional)
-- ============================================

-- Function to get vote results for a candidate
CREATE OR REPLACE FUNCTION get_candidate_results(
  p_survey_id UUID,
  p_candidate_id UUID
)
RETURNS TABLE (
  strength_text VARCHAR,
  strength_count BIGINT,
  weakness_text VARCHAR,
  weakness_count BIGINT,
  total_votes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH strength_votes AS (
    SELECT fo.option_text, COUNT(*) as count
    FROM votes v
    CROSS JOIN LATERAL jsonb_array_elements(v.strength_ids) AS strength_id
    JOIN feedback_options fo ON fo.id::text = strength_id::text
    WHERE v.survey_id = p_survey_id AND v.candidate_id = p_candidate_id
    GROUP BY fo.option_text
  ),
  weakness_votes AS (
    SELECT fo.option_text, COUNT(*) as count
    FROM votes v
    CROSS JOIN LATERAL jsonb_array_elements(v.weakness_ids) AS weakness_id
    JOIN feedback_options fo ON fo.id::text = weakness_id::text
    WHERE v.survey_id = p_survey_id AND v.candidate_id = p_candidate_id
    GROUP BY fo.option_text
  )
  SELECT
    sv.option_text as strength_text,
    sv.count as strength_count,
    wv.option_text as weakness_text,
    wv.count as weakness_count,
    (SELECT COUNT(*) FROM votes WHERE survey_id = p_survey_id AND candidate_id = p_candidate_id) as total_votes
  FROM strength_votes sv
  FULL OUTER JOIN weakness_votes wv ON true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. PERMISSIONS
-- ============================================
-- Grant permissions to voting user
GRANT CONNECT ON DATABASE anonymous_voting_db TO voting_user;
GRANT USAGE ON SCHEMA public TO voting_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO voting_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO voting_user;

-- ============================================
-- 12. VERIFY SETUP
-- ============================================
-- Run these commands to verify everything was created:
--
-- \dt                    -- List all tables
-- \d surveys             -- Describe surveys table
-- SELECT * FROM surveys; -- Query sample data
-- SELECT version();      -- Check PostgreSQL version

-- ============================================
-- DONE! Database setup is complete
-- ============================================
