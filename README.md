<img width="1470" height="751" alt="image" src="https://github.com/user-attachments/assets/d9bcdcea-7985-4529-bb62-6e6086b28544" /># Anonymous Personal Feedback & Evaluation System

## 📋 ภาพรวมระบบ
<img width="1470" height="751" alt="image" src="https://github.com/user-attachments/assets/84f0ba58-c797-4adf-b154-57d781a11871" />
<img width="1470" height="752" alt="image" src="https://github.com/user-attachments/assets/7dee6eb6-6b52-4105-8c4c-82f4df73f7e1" />
<img width="1470" height="750" alt="image" src="https://github.com/user-attachments/assets/c9786c05-d33c-4a6d-9c46-65c2573b070c" />
<img width="1470" height="753" alt="image" src="https://github.com/user-attachments/assets/9449845b-d6ca-41de-8043-1340be5257a1" />
<img width="462" height="917" alt="image" src="https://github.com/user-attachments/assets/b3b25587-11eb-4266-aad4-4c9ae95d2203" />


ระบบประเมินแบบไม่ระบุตัวตน (Anonymous Feedback/Evaluation System) ที่ออกแบบสำหรับการประเมินผลในทีมหรือองค์กร โดยมีความเป็นส่วนตัวสูงสุดและความปลอดภัย

### 🎯 วัตถุประสงค์หลัก
- ประเมินแบบไม่ระบุตัวตน (Anonymous)
- รองรับ 2 รูปแบบ Token Policy:
  - **Multi-candidate**: ใช้ Token เดียวประเมินหลายคนได้
  - **Single-use**: Token ใช้ได้ครั้งเดียว (สำหรับ Bulk Generate)
- ผู้ถูกประเมินสามารถดูผลของตัวเองได้เท่านั้น
- Admin สามารถจัดการการประเมินและดูผลรวม
- รองรับ 2 ภาษา: ไทย และ อังกฤษ

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AnonymousPersonal System                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────┐         ┌──────────────────────┐   │
│  │  Frontend (React)  │         │  Backend (Node.js)   │   │
│  │  Port: 5173        │◄───────►│  Port: 5001          │   │
│  │  - Voting Page     │         │  - Express API       │   │
│  │  - Results Page    │         │  - Token Auth        │   │
│  │  - Admin Panel     │         │  - Vote Logic        │   │
│  └────────────────────┘         └──────────────────────┘   │
│                                           ▲                 │
│                                           │                 │
│                                  ┌────────▼──────────┐     │
│                                  │  PostgreSQL DB    │     │
│                                  │  - surveys        │     │
│                                  │  - candidates     │     │
│                                  │  - voter_tokens   │     │
│                                  │  - votes          │     │
│                                  │  - admin_users    │     │
│                                  └───────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 User Roles & Flows

### 1. **Evaluator (ผู้ประเมิน)**
```
Token ──► Enter Voting Page ──► Select Candidate ──► Select Strengths
                                                 ├─ Select Weaknesses
                                                 ├─ Add Comment (Optional)
                                                 └─ Submit Evaluation
```

### 2. **Candidate (ผู้ถูกประเมิน)**
```
Candidate Token ──► View Results Page ──► See Your Feedback
                                         ├─ Strengths Chart
                                         ├─ Weaknesses Chart
                                         └─ Anonymous Comments
```

### 3. **Admin (ผู้ดูแล)**
```
Login ──► Dashboard ──► Survey Management ──► Token Management
                              │                      │
                    ┌─────────▼──────────┐   ┌──────▼───────┐
                    │ Create/Edit Survey │   │ Bulk Generate│
                    │ Add Candidates     │   │ View Tokens  │
                    │ Feedback Options   │   └──────────────┘
                    └────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Survey Results    │
                    │  View All Feedback │
                    └────────────────────┘
```

---

## 📁 Folder Structure

```
AnonymousPersonal/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── surveyController.js
│   │   │   ├── voteController.js
│   │   │   └── adminController.js
│   │   ├── routes/
│   │   │   ├── surveys.js
│   │   │   ├── votes.js
│   │   │   ├── admin.js
│   │   │   └── publicSurveys.js
│   │   ├── middleware/
│   │   │   ├── tokenAuth.js
│   │   │   └── adminAuth.js
│   │   └── app.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── VotingPage.jsx
│   │   │   ├── ResultsPage.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminTokens.jsx
│   │   │   ├── AdminSurveyResults.jsx
│   │   │   ├── SurveyManagement.jsx
│   │   │   ├── TokenManagementDashboard.jsx
│   │   │   └── FeedbackOptionsManagement.jsx
│   │   ├── components/
│   │   │   ├── TokenInput.jsx
│   │   │   ├── VotingForm.jsx
│   │   │   ├── ResultsChart.jsx
│   │   │   ├── AdminNavMenu.jsx
│   │   │   ├── LanguageSwitcher.jsx
│   │   │   └── ProtectedAdminRoute.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── locales/
│   │   │   ├── en.json
│   │   │   └── th.json
│   │   ├── styles/
│   │   │   └── *.css
│   │   ├── i18n.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── database/
│   ├── init.sql
│   └── migrations/
│       ├── 2025-12-31_token_policy.sql
│       └── 2025-12-31_voter_tokens.sql
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT.md
│   └── MULTILINGUAL.md
│
├── DATABASE_SETUP.md
├── QUICKSTART.md
├── USER_GUIDE_TH.md
├── USER_GUIDE_EN.md
└── README.md
```

---

## 🗄️ Database Schema

### Tables

**1. surveys**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| title | VARCHAR | Survey name |
| description | TEXT | Survey description |
| status | VARCHAR | draft / active / closed |
| token_policy | VARCHAR | multi_candidate / single_use |
| expires_at | TIMESTAMP | Expiration date |
| created_by | UUID | Admin who created |
| created_at | TIMESTAMP | Creation time |

**2. candidates**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| survey_id | UUID | FK to surveys |
| name | VARCHAR | Candidate name |
| employee_id | VARCHAR | Employee ID (optional) |
| department | VARCHAR | Department (optional) |
| access_token_hash | VARCHAR | Hashed access token |

**3. voter_tokens**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| survey_id | UUID | FK to surveys |
| candidate_id | UUID | FK to candidates (nullable) |
| token_hash | VARCHAR | Hashed token value |
| is_used | BOOLEAN | Whether token is used |
| used_at | TIMESTAMP | When token was used |

**4. feedback_options**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| survey_id | UUID | FK to surveys |
| type | VARCHAR | strength / weakness |
| option_text | VARCHAR | Feedback option text |

**5. votes**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| survey_id | UUID | FK to surveys |
| candidate_id | UUID | FK to candidates |
| strength_ids | JSONB | Array of selected strengths |
| weakness_ids | JSONB | Array of selected weaknesses |
| feedback_text | TEXT | Optional comment |
| *Note: NO voter identification stored* |

**6. admin_users**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| username | VARCHAR | Admin username |
| password_hash | VARCHAR | Hashed password |

---

## 🔑 Key Security Features

✅ **No Personal Data Stored**
- Tokens are hashed (bcrypt) before storage
- No voter identification in votes table
- Anonymous voting guaranteed

✅ **Token Policy Options**
- Multi-candidate: One token, vote for multiple people
- Single-use: One token, one vote (for bulk generation)

✅ **Role-Based Access Control**
- Token Auth: Voters & Candidates
- Admin Auth: JWT-based session management

✅ **Data Privacy**
- Candidates only see their own results
- Voters can't see other's votes
- Admin can view all survey results

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- npm

### Quick Start

```bash
# 1. Setup Database
createdb anonymous_voting_db
psql -d anonymous_voting_db < database/init.sql
psql -d anonymous_voting_db < database/migrations/2025-12-31_token_policy.sql
psql -d anonymous_voting_db < database/migrations/2025-12-31_voter_tokens.sql

# 2. Backend Setup
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm start

# 3. Frontend Setup (new terminal)
cd frontend
npm install
npm run dev
```

### Access URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001
- Admin Login: http://localhost:5173/admin/login

---

## 📡 API Endpoints

### Vote Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/votes | Submit a vote |
| GET | /api/votes/status | Check vote status |
| GET | /api/votes/my-candidate-results | Get candidate's own results |

### Survey Endpoints (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/surveys/:id/public | Get survey details for voting |

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/admin/login | Admin login |
| GET | /api/admin/surveys | List all surveys |
| POST | /api/admin/surveys | Create survey |
| PUT | /api/admin/surveys/:id | Update survey |
| DELETE | /api/admin/surveys/:id | Delete survey |
| GET | /api/admin/surveys/:id/results | Get survey results |
| POST | /api/admin/tokens/generate | Generate tokens |
| POST | /api/admin/tokens/bulk-generate | Bulk generate tokens |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL |
| **Auth** | JWT + bcrypt Token Hash |
| **Charts** | Chart.js |
| **i18n** | i18next |
| **Styling** | Custom CSS |

---

## 📝 Environment Variables

### Backend (.env)
```
PORT=5001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anonymous_voting_db
DB_USER=voting_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## 🌐 Multilingual Support

The system supports **Thai (ไทย)** and **English** with a language switcher button (🌐) in the navigation bar.

- Translation files: `frontend/src/locales/en.json`, `th.json`
- Default language: Thai
- Preference saved to localStorage

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](./QUICKSTART.md) | Step-by-step setup guide |
| [DATABASE_SETUP.md](./DATABASE_SETUP.md) | Database setup instructions |
| [USER_GUIDE_TH.md](./USER_GUIDE_TH.md) | Thai user guide |
| [USER_GUIDE_EN.md](./USER_GUIDE_EN.md) | English user guide |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture |
| [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) | Full API reference |
| [docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) | Database schema details |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Production deployment |

---

## ✅ Features Checklist

- [x] Anonymous voting (no personal data stored)
- [x] Multi-candidate token policy
- [x] Single-use token policy (bulk generation)
- [x] Voters can't see other's votes
- [x] Candidates see only their own results
- [x] Admin dashboard with full survey management
- [x] Bulk token generation
- [x] Survey results report with visual charts
- [x] Thai and English language support
- [x] Secure token handling (bcrypt hashing)
- [x] Session expiry handling
- [x] Responsive UI design

---

**Version**: 2.0.0  
**Last Updated**: January 2026
