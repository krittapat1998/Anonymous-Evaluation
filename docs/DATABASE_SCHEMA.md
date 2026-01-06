# Database Schema Documentation

## 📊 Database Design Overview

ระบบใช้ PostgreSQL เพื่อเก็บข้อมูลการประเมินแบบไม่ระบุตัวตน โดยออกแบบให้ยืดหยุ่นและปลอดภัย

---

## 🗄️ Table Definitions

### 1. **surveys** - ตารางประเมิน/สำรวจ
```sql
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed')),
  token_policy VARCHAR(50) NOT NULL DEFAULT 'multi_candidate' CHECK (token_policy IN ('multi_candidate', 'single_use')),
  created_by UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status ON surveys(status);
CREATE INDEX idx_created_by ON surveys(created_by);
```

**Purpose**: เก็บข้อมูลการประเมินหรือสำรวจแต่ละครั้ง
- `status`: draft (กำลังสร้าง), active (เปิดรับประเมิน), closed (ปิดรับประเมิน)

---

### 2. **candidates** - ตารางผู้ถูกประเมิน
```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(100),
  department VARCHAR(255),
  access_token_hash VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_survey_id ON candidates(survey_id);
CREATE INDEX idx_access_token_hash ON candidates(access_token_hash);
CREATE UNIQUE INDEX idx_unique_candidate ON candidates(survey_id, name);
```

**Purpose**: เก็บรายชื่อผู้ถูกประเมิน
- `access_token_hash`: Hash ของ token สำหรับให้ผู้ถูกประเมินดูผล
- อย่างปลอดภัยโดยไม่เก็บ token แบบ plain text

---

### 3. **feedback_options** - ตารางตัวเลือกข้อเสนอแนะ
```sql
CREATE TABLE feedback_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('strength', 'weakness')),
  option_text VARCHAR(500) NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_survey_id_type ON feedback_options(survey_id, type);
CREATE UNIQUE INDEX idx_unique_feedback ON feedback_options(survey_id, option_text);
```

**Purpose**: เก็บตัวเลือกของจุดแข็งและจุดที่ควรพัฒนา
- `type`: strength (จุดแข็ง) หรือ weakness (จุดที่ต้องพัฒนา)
- `display_order`: ลำดับการแสดงผล

---

### 4. **votes** - ตารางคะแนนการประเมิน (หัวใจของระบบ)
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  strength_ids JSONB DEFAULT '[]',  -- Array of feedback_option IDs
  weakness_ids JSONB DEFAULT '[]',  -- Array of feedback_option IDs
  feedback_text TEXT,                -- Optional written feedback
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_survey_candidate ON votes(survey_id, candidate_id);
CREATE INDEX idx_created_at ON votes(created_at);
```

**Purpose**: เก็บการประเมินจริง
- **🔐 สำคัญ**: ไม่เก็บข้อมูลผู้ประเมิน (voter identification)
- `strength_ids` และ `weakness_ids`: เก็บเป็น JSON array
- ไม่มีการเชื่อมโยงกับ voter token โดยตรง

---

### 5. **votes_used** - ตารางติดตามการใช้ Token
```sql
CREATE TABLE votes_used (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_survey_token ON votes_used(survey_id, token_hash);
```

**Purpose**: ป้องกันการประเมินซ้ำ
- `token_hash`: Hash ของ voter token
- เก็บเป็น hash เท่านั้น ไม่เก็บ token เดิม
- ทำให้ระบบรู้ว่า token นี้ถูกใช้แล้ว แต่ไม่รู้ว่าใครเป็นเจ้าของ

---

### 6. **admin_users** - ตารางผู้ดูแลระบบ
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'manager')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  
  INDEX idx_username (username),
  INDEX idx_email (email)
);
```

**Purpose**: เก็บข้อมูล Admin
- `role`: admin (สิทธิเต็ม) หรือ manager (สิทธิจำกัด)

---

## 📊 Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│  admin_users    │
│  ─────────────  │
│ id (PK)         │
│ username        │
│ email           │
│ password_hash   │
│ role            │
└────────┬────────┘
         │
         │ creates
         │
    ┌────▼──────────────────┐
    │   surveys             │
    │   ─────────────────   │
    │ id (PK)               │
    │ title                 │
    │ description           │
    │ status                │
    │ created_by (FK)       │──┐
    │ created_at            │  │
    └────┬────────────────┬─┘  │
         │                │    │
    ┌────▼──────┐    ┌────▼──────────────┐
    │ candidates│    │ feedback_options  │
    │ ─────────┤    │ ──────────────────│
    │ id        │    │ id                │
    │ survey_id │    │ survey_id         │
    │ name      │    │ type              │
    │ token_hash│    │ option_text       │
    └────┬──────┘    └────────────────────┘
         │
         │ receives
         │
    ┌────▼────────────┐
    │   votes         │
    │   ────────────  │
    │ id              │
    │ survey_id       │
    │ candidate_id    │
    │ strength_ids    │ (JSON)
    │ weakness_ids    │ (JSON)
    │ feedback_text   │
    │ created_at      │
    └─────────────────┘
         ▲
         │ uses (hash only)
         │
    ┌────┴───────────┐
    │  votes_used     │
    │  ────────────── │
    │ id              │
    │ survey_id       │
    │ token_hash      │
    │ used_at         │
    └─────────────────┘
```

---

## 🔐 Security & Privacy Features

### 1. **No Personal Data in Votes**
```
❌ NEVER stored: voter name, email, ID, IP address
✅ ONLY stored: voting data (strength/weakness selections)
```

### 2. **Token Security**
```
Voter Token Flow:
1. System generates: random_token = "abc123def456..."
2. Voter sees: "abc123def456..."
3. Backend stores: hash(random_token)
4. Comparison: hash(submitted_token) == stored_hash
5. After vote: Mark token_hash as used in votes_used table
```

### 3. **Candidate Access**
```
Candidate Token Flow:
1. System generates: candidate_token = "xyz789..."
2. Candidate sees: "xyz789..."
3. Backend stores: hash(candidate_token) in candidates.access_token_hash
4. When candidate views results: hash(submitted_token) == access_token_hash
5. Show: Only votes for that candidate
```

---

## 📈 Query Examples

### Vote Submission
```sql
-- 1. Check if token already used
SELECT EXISTS (
  SELECT 1 FROM votes_used 
  WHERE survey_id = $1 AND token_hash = $2
) AS already_voted;

-- 2. Insert vote (NO token/voter info)
INSERT INTO votes (survey_id, candidate_id, strength_ids, weakness_ids)
VALUES ($1, $2, $3, $4);

-- 3. Mark token as used
INSERT INTO votes_used (survey_id, token_hash)
VALUES ($1, $2);
```

### Get Results (For Candidate)
```sql
-- Candidate sees only their own results
SELECT 
  strength_ids,
  weakness_ids,
  COUNT(*) as vote_count
FROM votes
WHERE survey_id = $1 AND candidate_id = $2
GROUP BY strength_ids, weakness_ids;
```

### Admin - Get All Results
```sql
-- Admin can see aggregated results
SELECT 
  c.name,
  jsonb_array_length(v.strength_ids) as strength_count,
  jsonb_array_length(v.weakness_ids) as weakness_count,
  COUNT(v.id) as total_votes
FROM candidates c
LEFT JOIN votes v ON c.id = v.candidate_id
WHERE c.survey_id = $1
GROUP BY c.id, c.name;
```

---

## 🚀 SQL Initialization Script

```sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create admin_users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'manager')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  INDEX idx_username (username)
);

-- Create surveys table
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed')),
  created_by UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create candidates table
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(100),
  department VARCHAR(255),
  access_token_hash VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create feedback_options table
CREATE TABLE feedback_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('strength', 'weakness')),
  option_text VARCHAR(500) NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  strength_ids JSONB DEFAULT '[]',
  weakness_ids JSONB DEFAULT '[]',
  feedback_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create votes_used table
CREATE TABLE votes_used (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(survey_id, token_hash)
);

-- Create indexes
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_created_by ON surveys(created_by);
CREATE INDEX idx_candidates_survey ON candidates(survey_id);
CREATE INDEX idx_feedback_survey_type ON feedback_options(survey_id, type);
CREATE INDEX idx_votes_survey_candidate ON votes(survey_id, candidate_id);
CREATE INDEX idx_votes_used_survey_token ON votes_used(survey_id, token_hash);
```

---

## 📝 Notes

- ทุกตาราง `id` ใช้ UUID เพื่อความปลอดภัยสูงขึ้น
- `token_hash` ใช้ `crypt()` function ของ PostgreSQL สำหรับ hashing
- `JSONB` สำหรับ `strength_ids` และ `weakness_ids` ให้ flexibility สูง
- No CASCADE delete ที่จะทำให้สูญเสียข้อมูลการประเมิน
