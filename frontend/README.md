# Anonymous Voting System - Frontend

React + Vite web application for the Anonymous Personal Feedback & Voting System.

## 📋 Features

- ✅ Modern React 18 with Hooks
- ✅ Vite fast development server
- ✅ Token-based authentication UI
- ✅ Interactive voting form
- ✅ Real-time results visualization
- ✅ Chart.js integration
- ✅ Responsive design
- ✅ Local storage for tokens

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Start development server
npm run dev

# Browser opens at http://localhost:5173
```

## 📚 Project Structure

```
src/
├── main.jsx               # Entry point
├── App.jsx                # Main component & routing
├── pages/
│   ├── VotingPage.jsx     # Voting interface
│   └── ResultsPage.jsx    # Results display
├── components/
│   ├── TokenInput.jsx     # Token input form
│   ├── VotingForm.jsx     # Voting form
│   └── ResultsChart.jsx   # Charts visualization
├── services/
│   └── api.js             # API client
├── context/
│   └── AuthContext.jsx    # Auth state management
└── styles/
    ├── main.css           # Global styles
    └── components.css     # Component styles
```

## 🎨 Pages

### Home Page
- Overview of the voting system
- Navigation to voting and results
- Feature highlights
- Privacy & security info

### Voting Page
1. Token input
2. Survey information
3. Candidate selection
4. Strength & weakness selection
5. Optional feedback text
6. Success confirmation

### Results Page
1. Token input
2. Personal results display
3. Strength/weakness charts
4. Vote count statistics

## 🔐 Authentication

Tokens are stored in localStorage:
- `voter_token` - For voting
- `candidate_token` - For viewing results
- `admin_token` - For admin panel (future)

## 🛠️ Development

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Dependencies

- react - UI library
- react-dom - React rendering
- react-router-dom - Client-side routing
- axios - HTTP client
- chart.js - Chart library
- react-chartjs-2 - React Chart.js wrapper

## ⚙️ Configuration

Create `.env` file:

```env
VITE_API_URL=http://localhost:5001/api
VITE_APP_NAME=Anonymous Voting System
VITE_APP_VERSION=1.0.0
```

## 🎯 Key Components

### TokenInput
Handles token input and validation.

Props:
- `onSubmit` - Callback when token is submitted
- `type` - 'voter' or 'candidate'

### VotingForm
Interactive voting form.

Props:
- `survey` - Survey object
- `candidates` - Array of candidates
- `feedbackOptions` - Strength & weakness options
- `onSubmit` - Vote submission callback
- `loading` - Loading state

### ResultsChart
Displays voting results with charts.

Props:
- `results` - Aggregated results
- `feedbackOptions` - Option definitions
- `candidateName` - Candidate name

## 🎨 Styling

Global styles in `src/styles/main.css`:
- CSS custom properties for colors
- Responsive grid layouts
- Dark/light theme support
- Component-specific styles in `components.css`

### Color Palette
```
--primary-color: #2563eb (Blue)
--success-color: #16a34a (Green)
--warning-color: #ffc107 (Yellow)
--danger-color: #dc2626 (Red)
--info-color: #0891b2 (Cyan)
```

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: 768px, 480px
- Flexbox and CSS Grid layouts
- Touch-friendly buttons and forms

## 🔌 API Integration

API client in `src/services/api.js`:

```javascript
import { voteAPI, surveyAPI } from './services/api';

// Submit vote
await voteAPI.submitVote(
  surveyId,
  candidateId,
  strengthIds,
  weaknessIds,
  token,
  feedbackText
);

// Get results
await voteAPI.getCandidateResults(surveyId, token);
```

## 🔒 Security

- Tokens sent in Authorization header
- Tokens stored in localStorage (consider secure cookies)
- Input validation on form
- HTTPS recommended for production
- No sensitive data in local storage

## 🧪 Testing

Future improvements:
- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Cypress

## 📖 Documentation

- `docs/ARCHITECTURE.md` - System design
- `docs/API_DOCUMENTATION.md` - Backend API
- `QUICKSTART.md` - Getting started guide

## 🚀 Building for Production

```bash
# Build optimized bundle
npm run build

# Output: dist/
# - Minified JavaScript
# - Optimized CSS
# - Compressed assets

# Deploy dist/ to static hosting
# Configure backend API URL in .env
```

## 🐛 Troubleshooting

**CORS Error?**
- Check backend CORS_ORIGIN matches frontend URL

**Can't connect to backend?**
- Check VITE_API_URL in .env
- Verify backend is running on correct port

**Styles not loading?**
- Clear browser cache
- Check CSS file imports

## 📝 License

MIT

## 👨‍💻 Author

Created for Anonymous Personal Feedback System

---

**Version:** 1.0.0
