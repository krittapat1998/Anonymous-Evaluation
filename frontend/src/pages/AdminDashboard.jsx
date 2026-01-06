import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/adminDashboard.css';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const adminUsername = localStorage.getItem('adminUsername');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-page-container">
      <div className="dashboard-header">
        <div>
          <h1>👨‍💼 {t('admin.dashboard.title')}</h1>
          <p>{t('admin.dashboard.welcome', { name: adminUsername || '' })}</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <Link to="/admin/surveys" className="dashboard-card">
          <div className="card-icon">📋</div>
          <h3>{t('admin.dashboard.surveysTitle')}</h3>
          <p>{t('admin.dashboard.surveysDesc')}</p>
        </Link>

        <Link to="/admin/tokens" className="dashboard-card">
          <div className="card-icon">🎫</div>
          <h3>{t('admin.dashboard.tokensTitle')}</h3>
          <p>{t('admin.dashboard.tokensDesc')}</p>
        </Link>

        <Link to="/admin/feedback-options" className="dashboard-card">
          <div className="card-icon">💡</div>
          <h3>{t('admin.dashboard.feedbackTitle')}</h3>
          <p>{t('admin.dashboard.feedbackDesc')}</p>
        </Link>

        <Link to="/admin/bulk-generate" className="dashboard-card">
          <div className="card-icon">🔐</div>
          <h3>{t('admin.dashboard.bulkTitle')}</h3>
          <p>{t('admin.dashboard.bulkDesc')}</p>
        </Link>

        <Link to="/admin/results" className="dashboard-card">
          <div className="card-icon">📊</div>
          <h3>{t('admin.dashboard.resultsTitle')}</h3>
          <p>{t('admin.dashboard.resultsDesc')}</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
