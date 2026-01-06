import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './styles/main.css';
import './styles/components.css';
import VotingPage from './pages/VotingPage';
import ResultsPage from './pages/ResultsPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminTokens from './pages/AdminTokens';
import TokenManagementDashboard from './pages/TokenManagementDashboard';
import FeedbackOptionsManagement from './pages/FeedbackOptionsManagement';
import SurveyManagement from './pages/SurveyManagement';
import AdminSurveyResults from './pages/AdminSurveyResults';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import LanguageSwitcher from './components/LanguageSwitcher';

function Navigation() {
  const { logout, userRole } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="main-navbar">
      <div className="navbar-brand">
        <Link to="/" onClick={closeMobileMenu}>
          {t('nav.title')}
        </Link>
      </div>
      
      <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
        {mobileMenuOpen ? '✕' : '☰'}
      </button>
      
      <div className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={closeMobileMenu}>{t('nav.home')}</Link>
        <Link to="/vote" onClick={closeMobileMenu}>{t('nav.vote')}</Link>
        <Link to="/results" onClick={closeMobileMenu}>{t('nav.results')}</Link>
        <LanguageSwitcher />
        <Link to="/admin/login" onClick={closeMobileMenu} className="admin-link">
          {t('nav.admin')}
        </Link>
        {userRole && (
          <button onClick={() => { logout(); closeMobileMenu(); }} className="navbar-logout-btn">
            {t('nav.logout')}
          </button>
        )}
      </div>
      
      {mobileMenuOpen && <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>}
    </nav>
  );
}

function HomePage() {
  const { t } = useTranslation();
  
  return (
    <div className="container">
      <div className="header">
        <h1>{t('home.title')}</h1>
        <p>{t('home.subtitle')}</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div className="card">
          <h3 style={{ marginBottom: '10px', color: '#2563eb' }}>{t('home.submitFeedback')}</h3>
          <p>{t('home.submitFeedbackDesc')}</p>
          <Link to="/vote" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: '15px' }}>
            {t('home.submitFeedbackBtn')}
          </Link>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '10px', color: '#2563eb' }}>{t('home.viewResults')}</h3>
          <p>{t('home.viewResultsDesc')}</p>
          <Link to="/results" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: '15px' }}>
            {t('home.viewResultsBtn')}
          </Link>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '10px', color: '#2563eb' }}>{t('home.privacy')}</h3>
          <p>{t('home.privacyDesc')}</p>
          <Link to="/privacy" className="btn btn-secondary" style={{ display: 'block', textAlign: 'center', marginTop: '15px' }}>
            {t('home.learnMore')}
          </Link>
        </div>
      </div>

      <div style={{ 
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        marginBottom: '40px'
      }}>
        <h2>{t('home.howItWorks')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', marginTop: '20px' }}>
          <div>
            <h4>{t('home.step1')}</h4>
            <p>{t('home.step1Desc')}</p>
          </div>
          <div>
            <h4>{t('home.step2')}</h4>
            <p>{t('home.step2Desc')}</p>
          </div>
          <div>
            <h4>{t('home.step3')}</h4>
            <p>{t('home.step3Desc')}</p>
          </div>
        </div>
      </div>

      <div style={{ 
        background: '#e0f2fe',
        border: '2px solid #0891b2',
        padding: '20px',
        borderRadius: '8px',
        color: '#0c4a6e'
      }}>
        <strong>{t('home.keyFeatures')}</strong>
        <ul style={{ marginTop: '10px' }}>
          <li>{t('home.feature1')}</li>
          <li>{t('home.feature2')}</li>
          <li>{t('home.feature3')}</li>
          <li>{t('home.feature4')}</li>
          <li>{t('home.feature5')}</li>
        </ul>
      </div>
    </div>
  );
}

function PrivacyPage() {
  const { t } = useTranslation();
  
  return (
    <div className="container">
      <div className="header">
        <h1>{t('privacy.title')}</h1>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card">
          <h3>{t('privacy.howWeProtect')}</h3>
          <ul>
            <li><strong>{t('privacy.noPersonalData')}</strong></li>
            <li><strong>{t('privacy.tokenBased')}</strong></li>
            <li><strong>{t('privacy.hashedTokens')}</strong></li>
            <li><strong>{t('privacy.oneVote')}</strong></li>
            <li><strong>{t('privacy.anonVoting')}</strong></li>
          </ul>
        </div>

        <div className="card">
          <h3>{t('privacy.whatPeersSee')}</h3>
          <p>{t('privacy.peerDesc')}</p>
          <ul>
            <li>{t('privacy.strengths')}</li>
            <li>{t('privacy.weaknesses')}</li>
            <li>{t('privacy.optionalFeedback')}</li>
          </ul>
          <p style={{ marginTop: '10px' }}>
            <strong>{t('privacy.noVoterInfo')}</strong>
          </p>
        </div>

        <div className="card">
          <h3>{t('privacy.whatYouSee')}</h3>
          <ul>
            <li>{t('privacy.seeVoteCount')}</li>
            <li>{t('privacy.seeFeedback')}</li>
            <li>{t('privacy.seeComments')}</li>
            <li><strong>{t('privacy.seeOnlyYours')}</strong></li>
          </ul>
        </div>

        <div className="card">
          <h3>{t('privacy.questions')}</h3>
          <p>
            {t('privacy.contactAdmin')}
          </p>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/vote" element={<VotingPage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={
        <ProtectedAdminRoute>
          <AdminDashboard />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/surveys" element={
        <ProtectedAdminRoute>
          <SurveyManagement />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/tokens" element={
        <ProtectedAdminRoute>
          <TokenManagementDashboard />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/feedback-options" element={
        <ProtectedAdminRoute>
          <FeedbackOptionsManagement />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/bulk-generate" element={
        <ProtectedAdminRoute>
          <AdminTokens />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/results" element={
        <ProtectedAdminRoute>
          <AdminSurveyResults />
        </ProtectedAdminRoute>
      } />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Navigation />
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
