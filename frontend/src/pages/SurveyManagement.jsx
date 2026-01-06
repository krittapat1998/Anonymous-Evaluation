import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import AdminNavMenu from '../components/AdminNavMenu';
import '../styles/surveyManagement.css';

const SurveyManagement = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expiresAt: '',
    tokenPolicy: 'multi_candidate'
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch surveys
  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const response = await api.getSurveys();
      setSurveys(response.surveys || []);
    } catch (err) {
      setError(err?.response?.data?.error || t('survey.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleCreateSurvey = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError(t('survey.errors.titleRequired'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.createSurvey({
        title: formData.title,
        description: formData.description,
        expiresAt: formData.expiresAt || null,
        tokenPolicy: formData.tokenPolicy
      });
      setSuccessMsg(t('survey.messages.created'));
      setFormData({ title: '', description: '', expiresAt: '', tokenPolicy: 'multi_candidate' });
      setShowCreateModal(false);
      fetchSurveys();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.error || t('survey.errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (survey) => {
    setEditingSurvey(survey);
    setFormData({
      title: survey.title,
      description: survey.description || '',
      expiresAt: survey.expires_at ? survey.expires_at.split('T')[0] : '',
      tokenPolicy: survey.token_policy || 'multi_candidate'
    });
    setShowEditModal(true);
  };

  const handleUpdateSurvey = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError(t('survey.errors.titleRequired'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.updateSurveyData(editingSurvey.id, {
        title: formData.title,
        description: formData.description,
        expiresAt: formData.expiresAt || null,
        tokenPolicy: formData.tokenPolicy
      });
      setSuccessMsg(t('survey.messages.updated'));
      setFormData({ title: '', description: '', expiresAt: '', tokenPolicy: 'multi_candidate' });
      setShowEditModal(false);
      setEditingSurvey(null);
      fetchSurveys();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.error || t('survey.errors.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (surveyId, newStatus) => {
    try {
      await api.updateSurveyStatus(surveyId, { status: newStatus });
      setSuccessMsg(t('survey.messages.statusUpdated'));
      fetchSurveys();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.error || t('survey.errors.statusUpdateFailed'));
    }
  };

  const handleNavigateToTokens = (surveyId) => {
    navigate(`/admin/tokens?surveyId=${surveyId}`);
  };

  const handleNavigateToBulkGenerate = (surveyId) => {
    navigate(`/admin/bulk-generate?surveyId=${surveyId}`);
  };

  const handleNavigateToSurveyResults = (surveyId) => {
    navigate(`/admin/results?surveyId=${surveyId}`);
  };

  const handleNavigateToFeedback = (surveyId) => {
    navigate(`/admin/feedback-options?surveyId=${surveyId}`);
  };

  const getTokenPolicyLabel = (tokenPolicy) => {
    return tokenPolicy === 'single_use'
      ? (t('survey.policy.singleUse') || 'Single-use')
      : (t('survey.policy.multiCandidate') || 'Multi-use');
  };

  const filteredSurveys = surveys.filter(survey =>
    survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    survey.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'status-badge status-active';
      case 'closed':
        return 'status-badge status-closed';
      default:
        return 'status-badge status-draft';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: t('survey.statusDraft') || 'Draft',
      active: t('survey.statusActive') || 'Active',
      closed: t('survey.statusClosed') || 'Closed'
    };
    return labels[status] || status;
  };

  return (
    <div className="survey-management-container">
      <AdminNavMenu />
      
      <div className="survey-header">
        <h1>{t('survey.title') || 'Survey Management'}</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ {t('survey.createNew') || 'Create New Survey'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="survey-search">
        <input
          type="text"
          placeholder={t('survey.searchPlaceholder') || 'Search surveys...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading && <div className="loading">{t('common.loading') || 'Loading...'}</div>}

      {!loading && filteredSurveys.length === 0 ? (
        <div className="no-data">
          <p>{t('survey.noSurveys') || 'No surveys yet. Create one to get started!'}</p>
        </div>
      ) : (
        <div className="surveys-table-wrapper">
          <table className="surveys-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('survey.title') || 'Title'}</th>
                <th>{t('survey.description') || 'Description'}</th>
                <th>{t('survey.status') || 'Status'}</th>
                <th>{t('survey.tokenPolicy') || 'Token Policy'}</th>
                <th>{t('survey.candidates') || 'Candidates'}</th>
                <th>{t('survey.votes') || 'Votes'}</th>
                <th>{t('survey.created') || 'Created'}</th>
                <th>{t('survey.actionsLabel') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSurveys.map((survey, index) => (
                <tr key={survey.id}>
                  <td>{index + 1}</td>
                  <td className="title-cell">{survey.title}</td>
                  <td className="description-cell">{survey.description || '-'}</td>
                  <td>
                    <span className={getStatusBadgeClass(survey.status)}>
                      {getStatusLabel(survey.status)}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge">
                      {getTokenPolicyLabel(survey.token_policy)}
                    </span>
                  </td>
                  <td className="count-cell">{survey.candidate_count || 0}</td>
                  <td className="count-cell">{survey.vote_count || 0}</td>
                  <td className="date-cell">
                    {new Date(survey.created_at).toLocaleDateString(i18n.language)}
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-info"
                        title={t('survey.actions.edit')}
                        onClick={() => handleEditClick(survey)}
                      >
                        ✏️
                      </button>
                      {/* ปุ่มจัดการ candidates - แสดงทุก survey */}
                      <button
                        className="btn btn-sm btn-info"
                        title={t('survey.actions.manageTokens')}
                        onClick={() => handleNavigateToTokens(survey.id)}
                      >
                        🎫
                      </button>
                      {/* ปุ่ม bulk tokens - แสดงเฉพาะ single_use */}
                      {survey.token_policy === 'single_use' && (
                        <button
                          className="btn btn-sm btn-info"
                          title={t('survey.actions.bulkGenerate')}
                          onClick={() => handleNavigateToBulkGenerate(survey.id)}
                        >
                          🔐
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-info"
                        title={t('survey.actions.manageFeedback')}
                        onClick={() => handleNavigateToFeedback(survey.id)}
                      >
                        💬
                      </button>
                      <button
                        className="btn btn-sm btn-info"
                        title={t('survey.actions.viewResults')}
                        onClick={() => handleNavigateToSurveyResults(survey.id)}
                      >
                        📊
                      </button>
                      <select
                        value={survey.status}
                        onChange={(e) => handleStatusChange(survey.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="draft">{t('survey.statusDraft') || 'Draft'}</option>
                        <option value="active">{t('survey.statusActive') || 'Active'}</option>
                        <option value="closed">{t('survey.statusClosed') || 'Closed'}</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Survey Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('survey.createNew') || 'Create New Survey'}</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSurvey}>
              <div className="form-group">
                <label>{t('survey.title') || 'Survey Title'} *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('survey.placeholders.title')}
                  maxLength="200"
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('survey.description') || 'Description'}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('survey.placeholders.description')}
                  maxLength="500"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>{t('survey.expiresAt') || 'Expiration Date'}</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{t('survey.tokenPolicy') || 'Token Policy'}</label>
                <select
                  value={formData.tokenPolicy}
                  onChange={(e) => setFormData({ ...formData, tokenPolicy: e.target.value })}
                >
                  <option value="multi_candidate">{t('survey.policy.multiCandidate') || 'Multi-use'}</option>
                  <option value="single_use">{t('survey.policy.singleUse') || 'Single-use'}</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (t('common.loading') || 'Creating...') : (t('common.create') || 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Survey Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('survey.editSurvey') || 'Edit Survey'}</h2>
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSurvey}>
              <div className="form-group">
                <label>{t('survey.title') || 'Survey Title'} *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('survey.placeholders.title')}
                  maxLength="200"
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('survey.description') || 'Description'}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('survey.placeholders.description')}
                  maxLength="500"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>{t('survey.expiresAt') || 'Expiration Date'}</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{t('survey.tokenPolicy') || 'Token Policy'}</label>
                <select
                  value={formData.tokenPolicy}
                  onChange={(e) => setFormData({ ...formData, tokenPolicy: e.target.value })}
                >
                  <option value="multi_candidate">{t('survey.policy.multiCandidate') || 'Multi-use'}</option>
                  <option value="single_use">{t('survey.policy.singleUse') || 'Single-use'}</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (t('common.loading') || 'Saving...') : (t('common.save') || 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyManagement;
