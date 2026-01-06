import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import '../styles/adminLogin.css';

const AdminLogin = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if already logged in or session expired
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      // Already logged in, redirect to dashboard
      navigate('/admin', { replace: true });
    }
    
    // Check if session expired
    const expired = localStorage.getItem('sessionExpired');
    if (expired === 'true') {
      setSessionExpiredMsg(t('admin.login.sessionExpired') || 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
      localStorage.removeItem('sessionExpired');
    }
  }, [navigate, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.adminLogin(username, password);
      localStorage.setItem('adminToken', res.token);
      localStorage.setItem('adminUsername', res.username);
      localStorage.setItem('adminRole', res.role);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || t('admin.login.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-container">
        <div className="login-header">
          <h2>{t('admin.login.title')}</h2>
          <p>{t('admin.login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">{t('admin.login.username')}</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={t('admin.login.usernamePlaceholder')}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('admin.login.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('admin.login.passwordPlaceholder')}
              disabled={loading}
              required
            />
          </div>

          {sessionExpiredMsg && (
            <div className="warning-message" style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              color: '#92400e',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠️ {sessionExpiredMsg}
            </div>
          )}

          {error && <div className="error-message">❌ {error}</div>}

          <button type="submit" disabled={loading} className="btn btn-primary login-btn">
            {loading ? t('admin.login.signingIn') : t('admin.login.signIn')}
          </button>
        </form>

        <div className="login-footer">
          <p>{t('admin.login.footer')}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
