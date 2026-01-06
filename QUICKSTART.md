# Getting Started Guide

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js v16+ ([Download](https://nodejs.org))
- PostgreSQL v12+ ([Download](https://www.postgresql.org/download))
- npm or yarn
- Git

### Step 1: Setup Database

```bash
# Create database and user
createdb anonymous_voting_db
createuser -P voting_user

# Enter a password when prompted (e.g., votingpass123)

# Grant privileges
psql -d anonymous_voting_db
```

In PostgreSQL prompt:
```sql
GRANT ALL PRIVILEGES ON DATABASE anonymous_voting_db TO voting_user;
GRANT ALL ON SCHEMA public TO voting_user;
\q
```

### Step 2: Setup Backend

```bash
# Navigate to backend
cd AnonymousPersonal/backend

# Copy environment file
cp .env.example .env

# Edit .env
# DB_PASSWORD=votingpass123 (the password you created)
```

Edit `.env`:
```
PORT=5001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anonymous_voting_db
DB_USER=voting_user
DB_PASSWORD=votingpass123
JWT_SECRET=your-super-secret-key-123
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
CORS_ORIGIN=http://localhost:5173
TOKEN_LENGTH=32
TOKEN_EXPIRATION_DAYS=7
```

```bash
# Install dependencies
npm install

# Start backend
npm run dev

# Should see:
# ✓ Database connected
# Anonymous Voting System - Backend Server running on port 5001
```

### Step 3: Setup Frontend

In a new terminal:

```bash
# Navigate to frontend
cd AnonymousPersonal/frontend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start frontend dev server
npm run dev

# Should see:
# VITE v5.0.0  ready in XXX ms
# ➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser.

### Step 4: Create Test Data

In a new terminal:

```bash
# Connect to database
psql -U voting_user -d anonymous_voting_db

# Insert test data
INSERT INTO surveys (id, title, description, status, created_at, updated_at)
VALUES ('survey-1', 'Q4 2024 Feedback', 'Team feedback survey', 'active', NOW(), NOW());

INSERT INTO candidates (id, survey_id, name, access_token_hash, created_at)
VALUES 
  ('cand-1', 'survey-1', 'John Doe', '9d5e4c3b8f7a2c1d9e5b3a4c8f7e6d5c', NOW()),
  ('cand-2', 'survey-1', 'Jane Smith', 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', NOW()),
  ('cand-3', 'survey-1', 'Mike Johnson', 'q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6', NOW());

INSERT INTO feedback_options (id, survey_id, type, option_text, display_order, created_at)
VALUES
  ('str1', 'survey-1', 'strength', 'Great communication skills', 1, NOW()),
  ('str2', 'survey-1', 'strength', 'Strong problem-solving', 2, NOW()),
  ('str3', 'survey-1', 'strength', 'Excellent teamwork', 3, NOW()),
  ('weak1', 'survey-1', 'weakness', 'Could improve time management', 1, NOW()),
  ('weak2', 'survey-1', 'weakness', 'Should improve delegation', 2, NOW());

\q
```

### Step 5: Test the Application

1. **Open http://localhost:5173**

2. **Try Voting:**
   - Click "Vote Now"
   - Token: `test_voter_token_123` (any string works in dev)
   - Select a candidate
   - Select strengths and weaknesses
   - Submit

3. **Try Viewing Results:**
   - Click "View Results"
   - Token: Same as above
   - See results for your votes

---

## 📋 File Structure Reference

```
AnonymousPersonal/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express app
│   │   ├── server.js              # Entry point
│   │   ├── config/
│   │   │   └── database.js        # DB connection
│   │   ├── middleware/
│   │   │   ├── tokenAuth.js       # Token verification
│   │   │   └── adminAuth.js       # Admin JWT
│   │   ├── controllers/
│   │   │   ├── voteController.js  # Vote logic
│   │   │   └── surveyController.js # Survey mgmt
│   │   └── routes/
│   │       ├── votes.js           # Vote routes
│   │       └── surveys.js         # Survey routes
│   ├── package.json
│   ├── .env.example
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx               # Entry point
│   │   ├── App.jsx                # Main component
│   │   ├── pages/
│   │   │   ├── VotingPage.jsx
│   │   │   └── ResultsPage.jsx
│   │   ├── components/
│   │   │   ├── TokenInput.jsx
│   │   │   ├── VotingForm.jsx
│   │   │   └── ResultsChart.jsx
│   │   ├── services/
│   │   │   └── api.js             # API calls
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Token state
│   │   └── styles/
│   │       ├── main.css
│   │       └── components.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
└── docs/
    ├── README.md                  # This file
    ├── ARCHITECTURE.md
    ├── DATABASE_SCHEMA.md
    ├── API_DOCUMENTATION.md
    └── DEPLOYMENT.md
```

---

## 🔧 Common Commands

### Backend

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Initialize database
npm run seed
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🧪 Testing Workflows

### Workflow 1: Complete Voting Flow

1. **Go to Home Page:** http://localhost:5173
2. **Click "Vote Now"**
3. **Enter token:** `voter_token_test_123`
4. **Select candidate:** John Doe
5. **Select strengths:** Check "Great communication skills"
6. **Select weaknesses:** Check "Could improve time management"
7. **Submit vote**
8. **See success message**

### Workflow 2: View Results

1. **Click "View Results"**
2. **Enter same token:** `voter_token_test_123`
3. **See results chart** showing votes for John Doe
4. **See strength/weakness counts**

### Workflow 3: Try Voting Again

1. **Click "Vote Now"**
2. **Enter same token:** `voter_token_test_123`
3. **Should see error:** "Token has already voted"

---

## 🐛 Troubleshooting

### Backend won't start

**Error:** `Cannot connect to database`

```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Check database exists
psql -l | grep anonymous_voting_db

# Check connection string in .env
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=anonymous_voting_db
# DB_USER=voting_user
# DB_PASSWORD=votingpass123
```

### Frontend shows blank page

**Error:** `VITE_API_URL is undefined`

```bash
# Check .env file exists
cat frontend/.env

# Should contain:
# VITE_API_URL=http://localhost:5001/api

# If missing, create it:
cd frontend
cp .env.example .env
```

### CORS error

**Error:** `Access to XMLHttpRequest blocked by CORS`

```bash
# Check backend .env
grep CORS_ORIGIN backend/.env

# Should be:
# CORS_ORIGIN=http://localhost:5173

# Restart backend after changing .env
```

### Token validation failed

**Error:** `Invalid token or Token already used`

```bash
# Backend tokens are hashed, so exact token must match
# Make sure you're using same token in both voting and viewing results

# In development, any token string works as long as it's not used twice
```

---

## 📚 Next Steps

1. **Read the Architecture** - Understand how system works
   ```
   cat docs/ARCHITECTURE.md
   ```

2. **Explore API Docs** - See all endpoints
   ```
   cat docs/API_DOCUMENTATION.md
   ```

3. **Review Database Schema** - Understand data structure
   ```
   cat docs/DATABASE_SCHEMA.md
   ```

4. **Setup Production** - Deploy to server
   ```
   cat docs/DEPLOYMENT.md
   ```

---

## 💡 Tips for Development

### Enable hot reload
Both frontend and backend support auto-reload:
- Frontend: Edit React files → auto-refresh in browser
- Backend: Edit Node files → server auto-restarts

### Use browser DevTools
- Check Console for frontend errors
- Check Network tab for API requests
- Check Application tab for localStorage tokens

### Use cURL to test API
```bash
# Check vote status
curl -X POST http://localhost:5001/api/votes/status \
  -H "Content-Type: application/json" \
  -d '{"surveyId":"survey-1","token":"test_token"}'

# Submit vote
curl -X POST http://localhost:5001/api/votes \
  -H "Authorization: Bearer test_token" \
  -H "Content-Type: application/json" \
  -d '{
    "surveyId":"survey-1",
    "candidateId":"cand-1",
    "strengthIds":["str1"],
    "weaknessIds":["weak1"]
  }'
```

---

## 🆘 Getting Help

1. **Check logs** - Look at terminal output
2. **Check docs** - Read ARCHITECTURE.md or API_DOCUMENTATION.md
3. **Test with cURL** - Isolate backend vs frontend issues
4. **Check database** - Verify data was inserted

---

## 🎉 Success Checklist

- [ ] PostgreSQL running
- [ ] Backend server starts without errors
- [ ] Frontend loads on http://localhost:5173
- [ ] Can submit a vote
- [ ] Can view results
- [ ] Can't vote twice with same token
- [ ] HTTPS redirect configured (for production)

---

**Version:** 1.0.0  
**Last Updated:** December 2024

👉 **Ready to deploy?** Check `docs/DEPLOYMENT.md` for production setup
