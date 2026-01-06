import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api, { surveyAPI } from '../services/api';
import AdminNavMenu from '../components/AdminNavMenu';
import '../styles/tokenManagementDashboard.css';

export default function TokenManagementDashboard() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const surveyIdFromUrl = searchParams.get('surveyId');
  
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(surveyIdFromUrl || '');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    department: '',
  });
  const [showToken, setShowToken] = useState(null);

  const adminToken = localStorage.getItem('adminToken');

  // Load surveys on mount
  useEffect(() => {
    loadSurveys();
  }, []);

  // Load candidates when survey changes
  useEffect(() => {
    if (selectedSurvey) {
      loadCandidates();
    }
  }, [selectedSurvey]);

  const loadSurveys = async () => {
    try {
      const data = await surveyAPI.getAllSurveysAdmin();
      setSurveys(data.surveys || []);
    } catch (err) {
      setError(t('admin.tokenMgmt.errors.loadSurveys'));
    }
  };

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const data = await surveyAPI.getSurveyDetailAdmin(selectedSurvey);
      const candidatesWithTokens = await Promise.all(
        (data.candidates || []).map(async (candidate) => {
          try {
            const tokenData = await api.getSurveyTokens(selectedSurvey, adminToken);
            const candidateToken = tokenData.tokens.find(t => t.candidate_id === candidate.id);
            return {
              ...candidate,
              token: candidateToken?.id,
              tokenCreatedAt: candidateToken?.created_at,
            };
          } catch {
            return candidate;
          }
        })
      );
      setCandidates(candidatesWithTokens);
    } catch (err) {
      setError(t('admin.tokenMgmt.errors.loadCandidates'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(t('admin.tokenMgmt.errors.candidateNameRequired'));
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await api.createCandidateWithToken(
        selectedSurvey,
        formData.name,
        formData.employeeId || null,
        formData.department || null,
        adminToken
      );

      if (result.success) {
        setShowToken(result.token);
        setMessage(t('admin.tokenMgmt.messages.created'));
        setFormData({ name: '', employeeId: '', department: '' });
        setShowCreateModal(false);
        
        // Copy token to clipboard
        navigator.clipboard.writeText(result.token);
        
        // Reload candidates
        setTimeout(() => loadCandidates(), 500);
      }
    } catch (err) {
      setError(err.response?.data?.error || t('admin.tokenMgmt.errors.createCandidate'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditCandidate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Since we can only update via regenerate, we'll just show message
      setMessage(t('admin.tokenMgmt.messages.editComingSoon'));
      setShowEditModal(false);
      setEditingCandidate(null);
    } catch (err) {
      setError(t('admin.tokenMgmt.errors.updateCandidate'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateToken = async (candidateId) => {
    if (!window.confirm(t('admin.tokenMgmt.confirm.regenerate'))) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.regenerateTokenForCandidate(
        selectedSurvey,
        candidateId,
        adminToken
      );

      setShowToken(result.token);
      setMessage(t('admin.tokenMgmt.messages.regenerated'));
      navigator.clipboard.writeText(result.token);
      
      setTimeout(() => loadCandidates(), 500);
    } catch (err) {
      setError(err.response?.data?.error || t('admin.tokenMgmt.errors.regenerate'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    if (!window.confirm(t('admin.tokenMgmt.confirm.delete'))) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call delete endpoint (we'll need to add this to backend)
      await api.deleteCandidate(selectedSurvey, candidateId, adminToken);
      setMessage(t('admin.tokenMgmt.messages.deleted'));
      
      setTimeout(() => loadCandidates(), 500);
    } catch (err) {
      setError(err.response?.data?.error || t('admin.tokenMgmt.errors.deleteCandidate'));
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.employee_id && c.employee_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="token-management-container">
      <AdminNavMenu />
      
      <h1 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#1f2937' }}>
        🎫 {t('admin.tokenMgmt.title')}
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>{t('admin.tokenMgmt.subtitle')}</p>

      {/* Survey Selection */}
      <div className="survey-selector">
        <select
          value={selectedSurvey}
          onChange={(e) => setSelectedSurvey(e.target.value)}
          className="form-control"
        >
          <option value="">{t('common.selectSurvey')}</option>
          {surveys.map(survey => (
            <option key={survey.id} value={survey.id}>
              {survey.title}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {/* Show Token Modal */}
      {showToken && (
        <div className="modal-overlay" onClick={() => setShowToken(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{t('admin.tokenMgmt.generatedTokenTitle')}</h3>
            <div className="token-display-modal">
              <div className="token-value">{showToken}</div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  navigator.clipboard.writeText(showToken);
                  alert(t('admin.tokenMgmt.copied'));
                }}
              >
                {t('admin.tokenMgmt.copyToken')}
              </button>
            </div>
            <button className="btn btn-secondary" onClick={() => setShowToken(null)}>
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{t('admin.tokenMgmt.createCandidateTitle')}</h3>
            <form onSubmit={handleCreateCandidate}>
              <div className="form-group">
                <label>{t('admin.tokenMgmt.candidateName')} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder={t('admin.tokenMgmt.placeholders.name')}
                  disabled={loading}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>{t('admin.tokenMgmt.employeeId')}</label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  placeholder={t('admin.tokenMgmt.placeholders.optional')}
                  disabled={loading}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>{t('admin.tokenMgmt.department')}</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder={t('admin.tokenMgmt.placeholders.optional')}
                  disabled={loading}
                  className="form-control"
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? t('admin.tokenMgmt.creating') : t('admin.tokenMgmt.createAndGenerate')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={loading}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      {selectedSurvey ? (
        <div className="token-management-content">
          <div className="content-header">
            <div className="search-box">
              <input
                type="text"
                placeholder={t('admin.tokenMgmt.placeholders.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
            </div>
            <button
              className="btn btn-primary btn-create"
              onClick={() => setShowCreateModal(true)}
              disabled={loading}
            >
              ➕ {t('admin.tokenMgmt.createCandidateAndToken')}
            </button>
          </div>

          {loading ? (
            <div className="loading">{t('admin.tokenMgmt.loadingCandidates')}</div>
          ) : (
            <div className="candidates-table-wrapper">
              <table className="candidates-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('admin.tokenMgmt.table.name')}</th>
                    <th>{t('admin.tokenMgmt.table.employeeId')}</th>
                    <th>{t('admin.tokenMgmt.table.department')}</th>
                    <th>{t('admin.tokenMgmt.table.createdAt')}</th>
                    <th>{t('admin.tokenMgmt.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate, idx) => (
                      <tr key={candidate.id}>
                        <td>{idx + 1}</td>
                        <td><strong>{candidate.name}</strong></td>
                        <td>{candidate.employee_id || '-'}</td>
                        <td>{candidate.department || '-'}</td>
                        <td className="small-text">
                          {candidate.tokenCreatedAt ? 
                            new Date(candidate.tokenCreatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '-'
                          }
                        </td>
                        <td className="actions-cell">
                          <button
                            className="btn-action btn-regenerate"
                            onClick={() => handleRegenerateToken(candidate.id)}
                            title={t('admin.tokenMgmt.actions.regenerate')}
                            disabled={loading}
                          >
                            🔄
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => handleDeleteCandidate(candidate.id)}
                            title={t('admin.tokenMgmt.actions.delete')}
                            disabled={loading}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        {t('admin.tokenMgmt.noCandidates')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <p>{t('admin.tokenMgmt.selectSurveyToManage')}</p>
        </div>
      )}
    </div>
  );
}
