# 📖 User Guide - Anonymous Voting System

## 🎯 How to Use This System?

This is an anonymous peer feedback system where colleagues provide honest feedback to each other. It has 3 simple steps:

### Step 1️⃣: Get Your Token
- Admin sends you a **Voting Token** to give feedback
- Admin sends you an **Access Token** to view your results

### Step 2️⃣: Give Feedback
- Use your Voting Token
- Select a colleague
- Choose their strengths and areas to improve
- Submit

### Step 3️⃣: View Your Results
- Use your Access Token
- See feedback from peers (you won't know who wrote it)

---

## 🔑 What is a Token?

A **Token** = A special code to access the system

### Types of Tokens:

#### 1️⃣ **Voting Token** (Feedback Token)
- Used to **vote/give feedback** to others
- Can be used **only ONCE** per survey
- After use, it expires and cannot be used again
- Example: `voting_token_john_d47c3`

#### 2️⃣ **Access Token** (Results Token)
- Used to **view your own results**
- Can be used **multiple times**
- Does not expire after use
- Example: `access_token_jane_a92f1`

---

## 🎯 Quick Start Guide

### Scenario 1: You Want to Give Feedback

```
1. Open http://localhost:5173
2. Click "Vote Now"
3. Paste your Voting Token
4. Select 1 colleague
5. Click 1-2 strengths
6. Click 1-2 areas to improve
7. (Optional) Write additional comments
8. Click "Submit Vote"
✅ Done!
```

### Scenario 2: You Want to View Your Results

```
1. Open http://localhost:5173
2. Click "View Results"
3. Paste your Access Token
4. Click "View Results"
✅ See your feedback chart!
```

---

## 🧪 Test the System with Demo Tokens

Since there's no admin yet, you can use **demo tokens** to test:

### Demo Voting Tokens (to give feedback)
```
voter_token_1
voter_token_2
voter_token_3
voter_token_4
voter_token_5
```

### Demo Access Tokens (to view results)
```
access_token_john
access_token_jane
access_token_mike
access_token_sarah
access_token_tom
```

### How to Test:

#### 📋 Step 1: Give Feedback
1. Open http://localhost:5173
2. Click **"Vote Now"**
3. Paste token: `voter_token_1`
4. Select colleague: **John Doe**
5. Strengths: Click ✓ "Great communication skills"
6. Areas to improve: Click ✓ "Could improve time management"
7. (Optional) Type: "Good job!" in Comments
8. Click **"Submit Vote"**
9. ✅ Success! You see "Vote Submitted Successfully!"

#### ⚠️ Token `voter_token_1` is Now Used Up!

#### 📊 Step 2: View John's Results
1. Click **"View Results"**
2. Paste token: `access_token_john`
3. Click **"View Results"**
4. ✅ See chart showing John received:
   - "Great communication skills" = 1 vote
   - "Could improve time management" = 1 vote

#### 🔄 Repeat with Other Tokens
Use `voter_token_2`, `voter_token_3` for other colleagues!

---

## 🌐 Change Language

Look for the **🌐 button** in the top-right corner:

```
🌐 ไทย   ← Click to switch to English
🌐 EN    ← Click to switch to Thai
```

The entire page changes instantly! 🎉

---

## 💡 Real-World Example

### In a Company:
```
📅 Friday: Management sends tokens to all employees
📧 Everyone receives 2 tokens:
   - voting_token: Give feedback to colleagues
   - access_token: View your own results

🗳️ All employees use voting_token to give feedback
📊 2 weeks later: People view access_token for their results

✨ Management sees trends (without knowing who voted)
💪 Employees get feedback to improve themselves
```

---

## 🔒 Security - Why is This Safe?

### Tokens Don't Reveal Identity
```
❌ We don't store the name of voters
❌ We don't store the IP address of voters
✅ We only know "someone gave this feedback"
```

### Voting Token Can Only Be Used Once
```
voter_token_1 (used) → Cannot vote twice ✓
```

### Access Tokens Only Show Your Own Results
```
John (access_token_john) → Sees only John's results
Jane (access_token_jane) → Sees only Jane's results
✅ Jane cannot see John's results!
```

---

## 📱 Mobile Access

This system works on mobile phones:

```
📲 Open Chrome/Safari on your phone
📲 Type: http://localhost:5173
📲 (or your computer's IP: http://192.168.x.x:5173)
📲 Buttons and forms automatically adjust
✅ Ready to use!
```

---

## ⚙️ For System Administrators

### Generate Custom Tokens

#### Option A: Using Database
```sql
-- Create voting token for John
INSERT INTO candidates (id, survey_id, name, access_token_hash, created_at)
VALUES (
  'cand-john-1',
  'survey-1',
  'John Doe',
  SHA256('my_custom_voting_token_john'),
  NOW()
);
```

#### Option B: Using Backend API
```bash
curl -X POST http://localhost:5001/api/admin/surveys/survey-1/candidates \
  -H "Authorization: Bearer ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@company.com",
    "department": "Engineering"
  }'
```

#### Option C: Simple Method
```
Token = survey_id + candidate_name + secret_key

Example:
survey-1 + john_doe + secret_key_123
= voting_token_john_doe_a7f3c

Send to John via Email/Message
```

---

## 🐛 Common Issues & Solutions

### ❌ "Token has already voted"
```
⚠️  Meaning: This token was already used to vote
✅ Solution: Use a different voting token
```

### ❌ "Invalid token"
```
⚠️  Meaning: This token doesn't exist in the system
✅ Solution:
   1. Check spelling (CASE SENSITIVE)
   2. Request a new token from admin
```

### ❌ "Please select at least one strength or weakness"
```
⚠️  Meaning: You must select at least 1 item
✅ Solution: Click ✓ at least 1 checkbox, then try again
```

### ❌ "CORS error" (on mobile)
```
⚠️  Meaning: Phone cannot connect to Backend
✅ Solution:
   1. Check Backend is running
   2. Use your computer's IP instead of localhost
   3. Check same WiFi network
```

---

## 📊 View All Feedback (Admin Only)

Backend has an API to see all results:

```bash
curl http://localhost:5001/api/admin/surveys/survey-1/results \
  -H "Authorization: Bearer ADMIN_JWT"
```

Response:
```json
{
  "surveyId": "survey-1",
  "candidates": [
    {
      "candidateId": "cand-john",
      "candidateName": "John Doe",
      "totalVotes": 5,
      "strengths": [
        {"text": "Great communication", "count": 3},
        {"text": "Good teamwork", "count": 2}
      ],
      "weaknesses": [
        {"text": "Time management", "count": 2}
      ]
    }
  ]
}
```

---

## 🎓 For Developers

### System URLs:
```
Frontend: http://localhost:5173
Backend API: http://localhost:5001/api
Database: localhost:5432
```

### API Endpoints:

#### 1. Check Token Status
```bash
POST /api/votes/status
{
  "surveyId": "survey-1",
  "token": "voter_token_1"
}
```

#### 2. Submit Vote
```bash
POST /api/votes
Headers: 
  Authorization: Bearer voter_token_1
{
  "surveyId": "survey-1",
  "candidateId": "cand-1",
  "strengthIds": ["str1", "str2"],
  "weaknessIds": ["weak1"],
  "feedbackText": "Great work!"
}
```

#### 3. View Candidate Results
```bash
POST /api/votes/candidate-results
Headers:
  Authorization: Bearer access_token_john
{
  "surveyId": "survey-1"
}
```

---

## 📚 Important Files

### Frontend:
- `frontend/src/pages/VotingPage.jsx` - Voting page
- `frontend/src/pages/ResultsPage.jsx` - Results page
- `frontend/src/locales/th.json` - Thai translations
- `frontend/src/locales/en.json` - English translations

### Backend:
- `backend/src/controllers/voteController.js` - Voting logic
- `backend/src/middleware/tokenAuth.js` - Token verification

---

## ✅ Setup Checklist

- [ ] Frontend running at http://localhost:5173
- [ ] Backend running at http://localhost:5001
- [ ] Test with `voter_token_1`
- [ ] Successfully submit feedback
- [ ] Test with `access_token_john`
- [ ] Successfully view results
- [ ] Switch language with 🌐 button
- [ ] Test on mobile (optional)

---

## 🎉 All Done!

The system is ready to use! For more details, see:
- `docs/API_DOCUMENTATION.md` - All API endpoints
- `docs/ARCHITECTURE.md` - System architecture
- `docs/MULTILINGUAL.md` - Language configuration

**Happy Voting! 🗳️**
