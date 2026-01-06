# 📊 Database Setup Guide - วิธีสร้าง Tables

## 🎯 หนึ่งบรรทัดคำสั่ง (ง่ายสุด)

### สร้าง Database
```bash
createdb -U postgres anonymous_voting_db
```

### สร้าง Tables ทั้งหมด
```bash
psql -U voting_user -d anonymous_voting_db < database/init.sql
```

เสร็จ! ✅

---

## 📋 ขั้นตอนละเอียด

### Step 1: สร้าง Database
```bash
createdb -U postgres anonymous_voting_db
```

### Step 2: สร้าง User
```bash
psql -U postgres
CREATE USER voting_user WITH PASSWORD 'votingpass123';
GRANT ALL PRIVILEGES ON DATABASE anonymous_voting_db TO voting_user;
\q
```

### Step 3: รัน SQL Script
```bash
psql -U voting_user -d anonymous_voting_db < database/init.sql
```

### Step 3.1 (อัปเดตระบบ): เพิ่ม Token Policy ของ Survey
ถ้าต้องการให้ Survey บางอันเป็น "ใช้ได้ครั้งเดียว" (Single-use token) ให้รัน migration นี้:
```bash
psql -U voting_user -d anonymous_voting_db < database/migrations/2025-12-31_token_policy.sql
```

### Step 3.2 (อัปเดตระบบ): เพิ่มตาราง voter_tokens (สำหรับ Bulk Generate + สถานะใช้งาน)
Backend ปัจจุบันใช้ตาราง `voter_tokens` เพื่อเก็บโทเคนและสถานะ used/unused:
```bash
psql -U voting_user -d anonymous_voting_db < database/migrations/2025-12-31_voter_tokens.sql
```

### Step 4: ตรวจสอบ
```bash
psql -U voting_user -d anonymous_voting_db
SELECT * FROM surveys;
\dt
\q
```

---

## 🔍 SQL File มีอะไรบ้าง

ไฟล์ `database/init.sql` มี:

### 1. Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2. Tables (8 อัน)
```
✅ surveys           - บันทึกการสำรวจ
✅ candidates        - บันทึกผู้ถูกประเมิน
✅ feedback_options  - บันทึกตัวเลือกข้อเสนะแนะ
✅ votes             - บันทึกการประเมิน (ไม่ระบุตัวตน)
✅ votes_used        - ติดตามเมื่อใช้ Token
✅ admin_users       - ผู้ดูแลระบบ
```

### 3. Indexes (เร็ว)
```sql
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_candidates_survey_id ON candidates(survey_id);
...
```

### 4. Functions
```sql
get_candidate_results() - ดึงผลลัพธ์ของ candidate
```

### 5. Permissions
```sql
GRANT privileges to voting_user
```

---

## 📁 File Location

```
AnonymousPersonal/
└── database/
    └── init.sql  ← File นี้ที่เรากำลังใช้
```

---

## 🏃 ทำที่ละขั้นตอน

### Terminal 1: สร้าง Database
```bash
$ cd /Users/krittapatseangsomjai/WebApp/CodeReact/AnonymousPersonal
$ createdb -U postgres anonymous_voting_db
```

### Terminal 1: สร้าง User (ถ้ายังไม่มี)
```bash
$ psql -U postgres
postgres=# CREATE USER voting_user WITH PASSWORD 'votingpass123';
postgres=# GRANT ALL PRIVILEGES ON DATABASE anonymous_voting_db TO voting_user;
postgres=# \q
```

### Terminal 1: รัน SQL Script
```bash
$ psql -U voting_user -d anonymous_voting_db < database/init.sql
```

Output ควรเป็น:
```
CREATE EXTENSION
CREATE EXTENSION
CREATE TABLE
CREATE INDEX
CREATE TABLE
...
GRANT CONNECT
GRANT USAGE
GRANT ALL PRIVILEGES
```

---

## ✅ ตรวจสอบว่าสำเร็จ

### ดู Tables ที่สร้าง
```bash
$ psql -U voting_user -d anonymous_voting_db
anonymous_voting_db=# \dt
```

Output:
```
              List of relations
 Schema |       Name       | Type  |   Owner
--------+------------------+-------+-----------
 public | admin_users      | table | voting_user
 public | candidates       | table | voting_user
 public | feedback_options | table | voting_user
 public | surveys          | table | voting_user
 public | votes            | table | voting_user
 public | votes_used       | table | voting_user
(6 rows)
```

### ดู Columns ของ Table
```bash
anonymous_voting_db=# \d surveys

                     Table "public.surveys"
   Column   |            Type             |
------------+-----------------------------+
 id         | uuid                        |
 title      | character varying(255)      |
 description| text                        |
 status     | character varying(50)       |
 created_by | uuid                        |
 created_at | timestamp without time zone |
 updated_at | timestamp without time zone |
```

### ออกจาก psql
```bash
anonymous_voting_db=# \q
```

---

## 📝 Manual SQL Creation (ถ้าไม่อยากใช้ Script)

### สร้าง Surveys Table
```sql
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### สร้าง Candidates Table
```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id),
  name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(100),
  department VARCHAR(100),
  access_token_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### สร้าง Votes Table
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  strength_ids JSONB,
  weakness_ids JSONB,
  feedback_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### สร้าง Votes_Used Table
```sql
CREATE TABLE votes_used (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id),
  token_hash VARCHAR(255) NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(survey_id, token_hash)
);
```

---

## 🆘 แก้ไขปัญหา

### Error: database "anonymous_voting_db" already exists
```
ลบแล้วสร้างใหม่:
$ dropdb -U postgres anonymous_voting_db
$ createdb -U postgres anonymous_voting_db
```

### Error: role "voting_user" does not exist
```
สร้าง user ก่อน:
$ psql -U postgres -c "CREATE USER voting_user WITH PASSWORD 'votingpass123';"
```

### Error: permission denied
```
ให้สิทธิ์:
$ psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE anonymous_voting_db TO voting_user;"
```

### Error: file not found (init.sql)
```
ตรวจสอบ path:
$ ls -la database/init.sql
```

---

## 🔐 ข้อมูล Connection

```
Host: localhost
Port: 5432
Database: anonymous_voting_db
User: voting_user
Password: votingpass123
```

ใช้เมื่อ:
- Connect จาก App
- DBeaver/TablePlus
- Any database client

---

## 🎯 Database Design

### Tables Relationships:
```
surveys (1) ──── (N) candidates
   ║                    ║
   ║                    └─── votes
   ║
   └─── feedback_options
   
surveys (1) ──── (N) votes_used
```

### Key Features:
- ✅ UUID primary keys (ปลอดภัย)
- ✅ Timestamps (created_at, updated_at)
- ✅ Indexes (เร็ว)
- ✅ Foreign keys (integrity)
- ✅ Constraints (data validation)
- ✅ JSONB for flexibility

---

## 📊 Insert Test Data

ยกเลิกหมายเหตุใน init.sql หรือ:

```sql
-- Create survey
INSERT INTO surveys (id, title, description, status)
VALUES ('survey-1', 'Q4 2024 Feedback', 'Team survey', 'active');

-- Create candidates
INSERT INTO candidates (id, survey_id, name, employee_id, department, access_token_hash)
VALUES
  ('cand-1', 'survey-1', 'John Doe', 'EMP1001', 'Engineering', 'c8d607fce6a401a39a393d8b2d2a5002beebe499557ae592a4b43b9d9559c9e9'),
  ('cand-2', 'survey-1', 'Jane Smith', 'EMP1002', 'Marketing', '1ca7b8d4887a67996de99573a9bba7bac47e758b0da6347b6ab881da28d114a6');

-- Create feedback options
INSERT INTO feedback_options (id, survey_id, type, option_text, display_order)
VALUES
  ('str1', 'survey-1', 'strength', 'Great communication skills', 1),
  ('str2', 'survey-1', 'strength', 'Strong problem-solving', 2),
  ('weak1', 'survey-1', 'weakness', 'Could improve time management', 1);
```

---

## 🎊 เสร็จแล้ว!

ตอนนี้ database พร้อมใช้แล้ว! ✅

### ขั้นตอนต่อ:
1. ✅ Database & Tables สร้างแล้ว
2. ✅ Insert test data (optional)
3. ✅ Backend กำลัง connect
4. ✅ Frontend พร้อม

**เริ่มใช้ได้เลย!** 🚀
