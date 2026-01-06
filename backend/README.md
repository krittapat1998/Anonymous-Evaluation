# Anonymous Voting System - Backend

Node.js/Express API server for the Anonymous Personal Feedback & Voting System.

## 📋 Features

- ✅ Token-based authentication (voter & candidate)
- ✅ JWT-based admin authentication
- ✅ RESTful API endpoints
- ✅ PostgreSQL database integration
- ✅ Anonymous vote submission
- ✅ Results aggregation
- ✅ Survey management
- ✅ CORS support

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Configure database (edit .env)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=anonymous_voting_db
# DB_USER=voting_user
# DB_PASSWORD=your_password

# 4. Start development server
npm run dev

# Server running on http://localhost:5001
```

## 📚 Project Structure

```
src/
├── app.js                 # Express application
├── server.js              # Entry point (use in backend/..)
├── config/
│   └── database.js        # PostgreSQL connection
├── middleware/
│   ├── tokenAuth.js       # Token validation
│   └── adminAuth.js       # JWT validation
├── controllers/
│   ├── voteController.js  # Vote logic
│   └── surveyController.js # Survey management
└── routes/
    ├── votes.js           # Vote endpoints
    └── surveys.js         # Survey endpoints
```

## 🔌 API Endpoints

### Voting
- `POST /api/votes` - Submit a vote
- `POST /api/votes/status` - Check vote status
- `GET /api/votes/results/:surveyId` - Get candidate results

### Admin Survey Management
- `POST /api/admin/surveys` - Create survey
- `GET /api/admin/surveys` - List surveys
- `GET /api/admin/surveys/:id` - Get survey details
- `PATCH /api/admin/surveys/:id` - Update survey
- `POST /api/admin/surveys/:surveyId/candidates` - Add candidate
- `POST /api/admin/surveys/:surveyId/feedback-options` - Add feedback option
- `GET /api/admin/surveys/:surveyId/all-results` - Get all results

## 🔐 Authentication

### Voter Token
```bash
Authorization: Bearer voter_token_here
```

### Candidate Token
```bash
Authorization: Bearer candidate_access_token_here
```

### Admin Token
```bash
Authorization: Bearer jwt_admin_token_here
```

## 🗄️ Database

Requires PostgreSQL v12+

**Tables:**
- surveys
- candidates
- feedback_options
- votes (no voter info)
- votes_used (token tracking)
- admin_users

See `docs/DATABASE_SCHEMA.md` for details.

## 🛠️ Development

```bash
# Hot-reload with nodemon
npm run dev

# Production mode
npm start

# Initialize database
npm run seed
```

## 📖 Documentation

- `docs/API_DOCUMENTATION.md` - Complete API reference
- `docs/DATABASE_SCHEMA.md` - Database design
- `docs/ARCHITECTURE.md` - System architecture
- `docs/DEPLOYMENT.md` - Production deployment

## 🔒 Security

- Token-based authentication
- Hashed token storage
- No voter identification data
- SQL parameterization
- CORS protection
- Input validation

## 📦 Dependencies

- express - Web framework
- pg - PostgreSQL client
- jsonwebtoken - JWT authentication
- dotenv - Environment variables
- cors - CORS support

## ⚙️ Configuration

Create `.env` file:

```env
PORT=5001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anonymous_voting_db
DB_USER=voting_user
DB_PASSWORD=yourpassword
JWT_SECRET=your-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
CORS_ORIGIN=http://localhost:5173
```

## 📝 License

MIT

## 👨‍💻 Author

Created for Anonymous Personal Feedback System

---

**Version:** 1.0.0
