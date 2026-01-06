# System Architecture Documentation

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Browser (User Interface)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React + Vite Application                │   │
│  │  - Token Input Component                             │   │
│  │  - Voting Form Component                             │   │
│  │  - Results Display Component                         │   │
│  │  - Navigation & Routing                              │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP/HTTPS
                         │ REST API Calls
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Node.js/Express Backend Server                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           API Routes & Controllers                   │   │
│  │  - POST /api/votes (submit vote)                     │   │
│  │  - GET /api/votes/results (get results)              │   │
│  │  - POST /api/admin/surveys (manage surveys)          │   │
│  │  - etc.                                               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Middleware Layer                              │   │
│  │  - Token Authentication (voter, candidate)           │   │
│  │  - Admin Authentication (JWT)                        │   │
│  │  - Error Handling                                    │   │
│  │  - CORS                                               │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │ SQL Queries
                         │ Connection Pooling
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database Server                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Database Tables                         │   │
│  │  - surveys (survey definitions)                      │   │
│  │  - candidates (people to be voted on)                │   │
│  │  - feedback_options (predefined feedback choices)    │   │
│  │  - votes (actual votes - NO voter info)              │   │
│  │  - votes_used (token usage tracking)                 │   │
│  │  - admin_users (admin credentials)                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Architecture

### Token Flow

#### 1. **Voter Token Flow**
```
Admin generates → Voter receives → Voter enters in UI → Hash created
                                                              ↓
                                                   Backend compares hash
                                                              ↓
                                                      Token validated
                                                              ↓
                                                      Vote submitted
                                                              ↓
                                                   Token marked as used
                                                   (hashed version only)
```

#### 2. **Candidate Access Token Flow**
```
Admin generates → Candidate receives → Candidate enters in UI → Hash created
                                                                     ↓
                                                            Backend looks up
                                                            candidate by hash
                                                                     ↓
                                                           Candidate found
                                                                     ↓
                                                      Show only their results
```

### Authentication Matrix

| User Type | Authentication Method | Token Storage | Can View |
|-----------|----------------------|----------------|----------|
| Voter | Random Token (hashed) | localStorage | Only voting interface |
| Candidate | Random Access Token (hashed) | localStorage | Only own results |
| Admin | JWT (password-based) | localStorage | All results, survey management |

---

## 📊 Data Flow Diagrams

### Voting Data Flow

```
1. User enters voting token
    ↓
2. Frontend validates token format
    ↓
3. Frontend checks vote status
    ↓
4. Backend verifies token hasn't voted before
    ↓ YES → Show "Already voted" error
    ↓ NO
5. User selects candidate and feedback
    ↓
6. Frontend submits:
   - Survey ID
   - Candidate ID
   - Strength selections
   - Weakness selections
   - Optional feedback text
   - [Token in Authorization header]
    ↓
7. Backend verifies token (hasn't voted)
    ↓
8. Backend validates:
   - Survey exists and is active
   - Candidate exists
   - Required fields present
    ↓
9. BEGIN TRANSACTION:
   a. Insert vote (NO token info stored)
   b. Insert token usage record (hash only)
   c. COMMIT
    ↓
10. Return success response
    ↓
11. Clear token from UI
    ↓
12. Show success message
```

### Results Viewing Data Flow

```
1. User enters candidate access token
    ↓
2. Frontend validates token format
    ↓
3. Frontend requests results with token
    ↓
4. Backend:
   a. Hash token
   b. Look up candidate by token hash
   c. Get all votes for that candidate
    ↓ NOT FOUND → Show "Invalid token" error
    ↓ FOUND
5. Backend aggregates votes:
   - Count strength votes per option
   - Count weakness votes per option
   - Organize by vote count (descending)
    ↓
6. Return aggregated results
    ↓
7. Frontend displays:
   - Total vote count
   - Bar chart for strengths
   - Bar chart for weaknesses
   - Individual vote list
    ↓
8. Display "These are YOUR results only"
```

---

## 🗄️ Component Hierarchy

### Frontend Components

```
App
├── Navigation
├── Routes
│   ├── HomePage
│   ├── VotingPage
│   │   ├── TokenInput
│   │   └── VotingForm
│   │       └── VotingForm (sub-components)
│   ├── ResultsPage
│   │   ├── TokenInput
│   │   └── ResultsChart
│   │       └── BarChart (Chart.js)
│   └── PrivacyPage
└── AuthContext
    └── useAuth hook
```

### Backend Structure

```
server.js (entry point)
│
└── src/app.js (Express app setup)
    ├── middleware/
    │   ├── tokenAuth.js (voter & candidate verification)
    │   └── adminAuth.js (admin JWT verification)
    │
    ├── routes/
    │   ├── votes.js (voting & results endpoints)
    │   └── surveys.js (admin endpoints)
    │
    ├── controllers/
    │   ├── voteController.js (vote logic)
    │   └── surveyController.js (survey management)
    │
    ├── config/
    │   └── database.js (PostgreSQL connection)
    │
    └── models/
        └── (database queries & models)
```

---

## 🔄 API Request/Response Cycle

### Example: Submit Vote

**Frontend Initiates:**
```javascript
POST /api/votes
Authorization: Bearer voter_token_xyz123
Content-Type: application/json

{
  "surveyId": "survey-1",
  "candidateId": "cand-1",
  "strengthIds": ["str1", "str2"],
  "weaknessIds": ["weak1"],
  "feedbackText": "Great job!"
}
```

**Backend Processing:**
1. Extract token from header
2. Middleware: `verifyVoterToken`
   - Check if token has already voted
   - Store hash for later use
3. Controller: `submitVote`
   - Validate required fields
   - Check survey status
   - Check candidate exists
   - Insert vote (NO token reference)
   - Mark token as used
4. Return response

**Response:**
```json
{
  "success": true,
  "message": "Vote submitted successfully",
  "voteId": "vote-uuid-123"
}
```

---

## 💾 Database Connection Pattern

```
App Initialization
       ↓
Create Connection Pool (10 connections default)
       ↓
Each Request
    ├── Acquire connection from pool
    ├── Execute query
    ├── Release connection back to pool
    └── Pool reuses connection for next request
       ↓
Application Shutdown
       ↓
Close all connections gracefully
```

---

## 🚀 Deployment Architecture

### Development Setup
```
Frontend: localhost:5173 (Vite dev server)
Backend: localhost:5001 (Node.js server)
Database: localhost:5432 (PostgreSQL)
```

### Production Setup
```
┌─────────────────────────────────────────┐
│          Nginx (Reverse Proxy)          │
│        (SSL/TLS Certificate)            │
└────────────────┬────────────────────────┘
                 │
     ┌───────────┴────────────┐
     ↓                        ↓
┌──────────────┐      ┌──────────────┐
│  Frontend    │      │   Backend    │
│  (Static)    │      │  (Node.js)   │
│  dist/       │      │  Cluster     │
│  (nginx)     │      │  mode        │
└──────────────┘      └──────┬───────┘
                             │
                      ┌──────▼──────┐
                      │ PostgreSQL  │
                      │ (Replicated)│
                      └─────────────┘
```

---

## 🔒 Security Layers

### Layer 1: Network Security
- HTTPS/TLS encryption in production
- CORS configured for specific origins
- Rate limiting (to be implemented)

### Layer 2: Input Validation
- Frontend validation (user experience)
- Backend validation (security)
- SQL parameterization (prevent injection)

### Layer 3: Token Security
- Random token generation (16+ bytes)
- SHA-256 hashing before storage
- Hash comparison for verification
- One-time use per survey per token

### Layer 4: Database
- No personal data storage
- Parameterized queries
- Connection pooling
- Transaction support

### Layer 5: Application Logic
- Middleware authentication
- Role-based access control
- Error handling (no sensitive info exposed)
- Logging (for debugging, not exposure)

---

## 📈 Scalability Considerations

### Current Design Supports
- ✅ Hundreds of simultaneous users
- ✅ Thousands of votes per survey
- ✅ Multiple surveys
- ✅ Horizontal scaling of backend

### Future Improvements
- 🔄 Caching layer (Redis) for results
- 🔄 Database read replicas
- 🔄 Load balancing for backend
- 🔄 CDN for static frontend files
- 🔄 Message queue for async operations

---

## 🛠️ Technology Choices & Rationale

| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend | React | Component-based, reusable, large ecosystem |
| Build Tool | Vite | Fast dev server, optimized build, ES modules |
| Backend | Node.js/Express | JavaScript full-stack, event-driven, lightweight |
| Database | PostgreSQL | Robust, ACID compliant, JSON support (JSONB) |
| Auth | Token + Hash | Simple, stateless, scalable |
| Charts | Chart.js + React | Lightweight, responsive, good UX |

---

## 📝 Environment Variables

### Backend (.env)
```
PORT=5001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anonymous_voting_db
DB_USER=postgres
DB_PASSWORD=***
JWT_SECRET=***
ADMIN_USERNAME=admin
ADMIN_PASSWORD=***
CORS_ORIGIN=http://localhost:5173
TOKEN_LENGTH=32
TOKEN_EXPIRATION_DAYS=7
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5001/api
VITE_APP_NAME=Anonymous Voting System
VITE_APP_VERSION=1.0.0
```

---

## 🔄 Development Workflow

### Making a Change

1. **Frontend Change**
   ```bash
   # 1. Edit React component
   # 2. Hot reload automatically (Vite)
   # 3. Test in browser
   # 4. Run build for production
   npm run build
   ```

2. **Backend Change**
   ```bash
   # 1. Edit Node.js file
   # 2. Server restarts automatically (nodemon)
   # 3. Test with API client (Postman, curl, etc.)
   ```

3. **Database Schema Change**
   ```bash
   # 1. Create SQL migration
   # 2. Run migration: npm run seed
   # 3. Update TypeScript types if needed
   ```

---

## 🧪 Testing Strategy

### Unit Tests (to implement)
- Utility functions
- Token hashing
- Data validation

### Integration Tests (to implement)
- API endpoints
- Database operations
- Complete voting flow

### E2E Tests (to implement)
- User workflows
- Browser compatibility
- Mobile responsiveness

---

## 📊 Monitoring & Logging

### What to Log
- ✓ API requests (method, path, status)
- ✓ Authentication attempts
- ✓ Database errors
- ✗ User tokens (never!)
- ✗ Voting data details

### Recommended Tools
- Winston (logging)
- Sentry (error tracking)
- DataDog (monitoring)
- ELK Stack (log aggregation)

---

**Version:** 1.0.0  
**Last Updated:** December 2024
