import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api, { surveyAPI } from '../services/api';
import AdminNavMenu from '../components/AdminNavMenu';
import '../styles/adminTokens.css';
import '../styles/adminDashboard.css';

const AdminTokens = () => {
  const { t } = useTranslation();
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState('');
  const [tokenCount, setTokenCount] = useState(10);
  const [generatedTokens, setGeneratedTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const adminToken = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    loadSurveys();
  }, [adminToken]);

  useEffect(() => {
    if (!surveys?.length) return;

    const surveyId = new URLSearchParams(location.search).get('surveyId');
    if (!surveyId) return;
    if (!surveys.some((s) => s.id === surveyId)) return;

    setSelectedSurvey(surveyId);
  }, [surveys, location.search]);

  const loadSurveys = async () => {
    try {
      const res = await surveyAPI.getAllSurveysAdmin();
      const allSurveys = res.surveys || res || [];
      const singleUseSurveys = (Array.isArray(allSurveys) ? allSurveys : []).filter(
        (s) => s.token_policy === 'single_use'
      );
      setSurveys(singleUseSurveys);
      if (!res.surveys && !Array.isArray(res)) {
        setError(t('admin.bulkTokens.unexpectedResponse'));
      }
    } catch (err) {
      console.error('Survey load error:', err);
      setError(err?.response?.data?.error || t('admin.bulkTokens.failedToLoadSurveys'));
    }
  };

  const loadExistingTokens = async (surveyId) => {
    if (!surveyId) {
      setGeneratedTokens([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.getSurveyBulkTokens(surveyId);
      setGeneratedTokens(res?.tokens || []);
    } catch (err) {
      setError(err?.response?.data?.error || t('admin.bulkTokens.failedToLoadTokens'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedSurvey) {
      setGeneratedTokens([]);
      return;
    }
    loadExistingTokens(selectedSurvey);
  }, [selectedSurvey]);

  const handleGenerateTokens = async () => {
    if (!selectedSurvey || tokenCount < 1) {
      setError(t('admin.bulkTokens.selectSurveyAndCount'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.generateTokens(selectedSurvey, tokenCount);
      const newTokens = res.tokens || [];
      setGeneratedTokens((prev) => [...newTokens, ...(prev || [])]);
    } catch (err) {
      setError(err?.response?.data?.error || t('admin.bulkTokens.failedToGenerate'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (generatedTokens.length === 0) return;

    const csvContent = [
      'Token,Survey ID,Created At,Used',
      ...generatedTokens.map((row) => {
        const createdAt = row?.createdAt ? new Date(row.createdAt).toISOString() : '';
        const used = row?.isUsed ? 'used' : 'unused';
        return `${row?.token || ''},${selectedSurvey},${createdAt},${used}`;
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation_tokens_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
    const text = generatedTokens.map((tk) => tk.token).filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    alert(t('admin.bulkTokens.copied'));
  };

  return (
    <div className="admin-page-container">
      <AdminNavMenu />

      <h1 style={{ fontSize: '1.5rem', marginBottom: '24px', color: '#1f2937' }}>
        🔐 {t('admin.bulkTokens.title')}
      </h1>

      <div className="card">
        <h3>{t('admin.bulkTokens.createForSurvey')}</h3>

        <div className="form-group">
          <label>{t('admin.bulkTokens.selectSurvey')}</label>
          <select value={selectedSurvey} onChange={e => setSelectedSurvey(e.target.value)} disabled={loading}>
            <option value="">{t('admin.bulkTokens.chooseSurvey')}</option>
            {surveys.map(survey => (
              <option key={survey.id} value={survey.id}>
                {survey.title} ({survey.status})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>{t('admin.bulkTokens.tokenCount')}</label>
          <input type="number" min="1" max="500" value={tokenCount} onChange={e => setTokenCount(parseInt(e.target.value))} disabled={loading} />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button onClick={handleGenerateTokens} disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
          {loading ? t('admin.bulkTokens.generating') : t('admin.bulkTokens.generate')}
        </button>
      </div>

      {generatedTokens.length > 0 && (
        <div className="card tokens-display">
          <h3>{t('admin.bulkTokens.generatedTitle')}</h3>
          <p className="warning">{t('admin.bulkTokens.generatedWarning')}</p>

          <div className="token-actions">
            <button onClick={handleCopyToClipboard} className="btn btn-secondary">
              {t('admin.bulkTokens.copyAll')}
            </button>
            <button onClick={handleExportCSV} className="btn btn-secondary">
              {t('admin.bulkTokens.exportCsv')}
            </button>
          </div>

          <div className="tokens-list">
            <h4>{t('admin.bulkTokens.tokenList', { count: generatedTokens.length })}</h4>
            <div style={{ 
              marginBottom: '15px', 
              display: 'flex', 
              gap: '20px', 
              fontSize: '0.95rem',
              padding: '10px 15px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px'
            }}>
              <span style={{ color: '#16a34a', fontWeight: '600' }}>
                ✅ {t('admin.bulkTokens.unusedCount', { count: generatedTokens.filter(tk => !tk.isUsed).length })}
              </span>
              <span style={{ color: '#dc2626', fontWeight: '600' }}>
                ❌ {t('admin.bulkTokens.usedCount', { count: generatedTokens.filter(tk => tk.isUsed).length })}
              </span>
            </div>
            <div className="tokens-grid">
              {generatedTokens.map((row, idx) => (
                <div 
                  key={idx} 
                  className="token-item"
                  style={{ 
                    backgroundColor: row.isUsed ? '#fef2f2' : '#f0fdf4',
                    borderLeft: row.isUsed ? '4px solid #ef4444' : '4px solid #22c55e',
                    padding: '12px 15px',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <code style={{ 
                      textDecoration: row.isUsed ? 'line-through' : 'none',
                      opacity: row.isUsed ? 0.5 : 1,
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      letterSpacing: '0.5px'
                    }}>{row.token}</code>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '4px 10px',
                      borderRadius: '20px',
                      backgroundColor: row.isUsed ? '#ef4444' : '#22c55e',
                      color: 'white',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}>
                      {row.isUsed ? t('admin.bulkTokens.used') : t('admin.bulkTokens.unused')}
                    </span>
                  </div>
                  {row.usedAt && (
                    <div style={{ fontSize: '0.8rem', marginTop: '6px', color: '#6b7280' }}>
                      {t('admin.bulkTokens.usedAt')}: {new Date(row.usedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', background: '#f3f4f6', borderRadius: '6px', fontSize: '0.9rem' }}>
            <strong>{t('admin.bulkTokens.instructionsTitle')}</strong>
            <ol style={{ marginTop: '10px' }}>
              <li>{t('admin.bulkTokens.instructions1')}</li>
              <li>{t('admin.bulkTokens.instructions2')}</li>
              <li>{t('admin.bulkTokens.instructions3')}</li>
              <li>{t('admin.bulkTokens.instructions4')}</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTokens;
