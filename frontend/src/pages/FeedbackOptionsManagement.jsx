import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api, { surveyAPI } from '../services/api';
import AdminNavMenu from '../components/AdminNavMenu';
import '../styles/feedbackOptionsManagement.css';

export default function FeedbackOptionsManagement() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const surveyIdFromUrl = searchParams.get('surveyId');
  
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(surveyIdFromUrl || '');
  const [feedbackOptions, setFeedbackOptions] = useState({
    strengths: [],
    weaknesses: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('strength'); // 'strength' or 'weakness'
  const [formData, setFormData] = useState({
    optionText: '',
    displayOrder: 0,
  });
  const [editingId, setEditingId] = useState(null);

  const adminToken = localStorage.getItem('adminToken');

  // Load surveys on mount
  useEffect(() => {
    loadSurveys();
  }, []);

  // Load feedback options when survey changes
  useEffect(() => {
    if (selectedSurvey) {
      loadFeedbackOptions();
    }
  }, [selectedSurvey]);

  const loadSurveys = async () => {
    try {
      const data = await surveyAPI.getAllSurveysAdmin();
      setSurveys(data.surveys || []);
    } catch (err) {
      setError(t('admin.feedbackOptions.errors.loadSurveys'));
    }
  };

  const loadFeedbackOptions = async () => {
    setLoading(true);
    try {
      const data = await surveyAPI.getSurveyDetailAdmin(selectedSurvey);
      setFeedbackOptions(data.feedbackOptions || { strengths: [], weaknesses: [] });
    } catch (err) {
      setError(t('admin.feedbackOptions.errors.loadOptions'));
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, option = null) => {
    setModalType(type);
    if (option) {
      setFormData({
        optionText: option.option_text,
        displayOrder: option.display_order,
      });
      setEditingId(option.id);
    } else {
      setFormData({
        optionText: '',
        displayOrder: (type === 'strengths' ? feedbackOptions.strengths.length : feedbackOptions.weaknesses.length),
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ optionText: '', displayOrder: 0 });
  };

  const handleSaveOption = async (e) => {
    e.preventDefault();
    
    if (!formData.optionText.trim()) {
      setError(t('admin.feedbackOptions.errors.textRequired'));
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const optionType = modalType === 'strengths' ? 'strength' : 'weakness';
      
      if (editingId) {
        // Update logic (we'll need to add this to backend)
        setMessage(t('admin.feedbackOptions.messages.updateComingSoon'));
      } else {
        // Create new option
        await api.addFeedbackOption(
          selectedSurvey,
          optionType,
          formData.optionText,
          formData.displayOrder,
          adminToken
        );
        setMessage(t('admin.feedbackOptions.messages.added'));
        closeModal();
        setTimeout(() => loadFeedbackOptions(), 500);
      }
    } catch (err) {
      setError(err.response?.data?.error || t('admin.feedbackOptions.errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOption = async (optionId, type) => {
    if (!window.confirm(t('admin.feedbackOptions.confirm.delete'))) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.deleteFeedbackOption(selectedSurvey, optionId, adminToken);
      setMessage(t('admin.feedbackOptions.messages.deleted'));
      setTimeout(() => loadFeedbackOptions(), 500);
    } catch (err) {
      setError(err.response?.data?.error || t('admin.feedbackOptions.errors.deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-options-container">
      <AdminNavMenu />
      
      <h1 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#1f2937' }}>
        💡 {t('admin.feedbackOptions.title')}
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>{t('admin.feedbackOptions.subtitle')}</p>

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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>
              {editingId ? t('admin.feedbackOptions.modal.editTitle') : t('admin.feedbackOptions.modal.addTitle')}
              {' - '}
              {modalType === 'strengths' ? t('admin.feedbackOptions.types.strength') : t('admin.feedbackOptions.types.weakness')}
            </h3>
            <form onSubmit={handleSaveOption}>
              <div className="form-group">
                <label>{t('admin.feedbackOptions.modal.optionText')} *</label>
                <input
                  type="text"
                  value={formData.optionText}
                  onChange={(e) => setFormData({...formData, optionText: e.target.value})}
                  placeholder={t('admin.feedbackOptions.modal.placeholders.optionText')}
                  disabled={loading}
                  className="form-control"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>{t('admin.feedbackOptions.modal.displayOrder')}</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value)})}
                  disabled={loading}
                  className="form-control"
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading
                    ? t('admin.feedbackOptions.modal.saving')
                    : editingId
                      ? t('admin.feedbackOptions.modal.update')
                      : t('admin.feedbackOptions.modal.add')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeModal}
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
        <div className="feedback-options-content">
          {loading && !feedbackOptions.strengths.length && !feedbackOptions.weaknesses.length ? (
            <div className="loading">{t('admin.feedbackOptions.loading')}</div>
          ) : (
            <div className="options-grid">
              {/* Strengths Column */}
              <div className="options-column">
                <div className="column-header">
                  <h2>{t('admin.feedbackOptions.strengthsTitle')}</h2>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={() => openModal('strengths')}
                    disabled={loading}
                  >
                    ➕ {t('admin.feedbackOptions.addStrength')}
                  </button>
                </div>

                <div className="options-list">
                  {feedbackOptions.strengths && feedbackOptions.strengths.length > 0 ? (
                    feedbackOptions.strengths.map((option, idx) => (
                      <div key={option.id} className="option-item">
                        <div className="option-content">
                          <div className="option-order">#{option.display_order}</div>
                          <div className="option-text">{option.option_text}</div>
                        </div>
                        <div className="option-actions">
                          <button
                            className="btn-action btn-edit"
                            onClick={() => openModal('strengths', option)}
                            title={t('admin.feedbackOptions.actions.edit')}
                            disabled={loading}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => handleDeleteOption(option.id, 'strength')}
                            title={t('admin.feedbackOptions.actions.delete')}
                            disabled={loading}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-message">{t('admin.feedbackOptions.emptyStrengths')}</div>
                  )}
                </div>
              </div>

              {/* Weaknesses Column */}
              <div className="options-column">
                <div className="column-header">
                  <h2>{t('admin.feedbackOptions.weaknessesTitle')}</h2>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={() => openModal('weaknesses')}
                    disabled={loading}
                  >
                    ➕ {t('admin.feedbackOptions.addWeakness')}
                  </button>
                </div>

                <div className="options-list">
                  {feedbackOptions.weaknesses && feedbackOptions.weaknesses.length > 0 ? (
                    feedbackOptions.weaknesses.map((option, idx) => (
                      <div key={option.id} className="option-item">
                        <div className="option-content">
                          <div className="option-order">#{option.display_order}</div>
                          <div className="option-text">{option.option_text}</div>
                        </div>
                        <div className="option-actions">
                          <button
                            className="btn-action btn-edit"
                            onClick={() => openModal('weaknesses', option)}
                            title={t('admin.feedbackOptions.actions.edit')}
                            disabled={loading}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => handleDeleteOption(option.id, 'weakness')}
                            title={t('admin.feedbackOptions.actions.delete')}
                            disabled={loading}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-message">{t('admin.feedbackOptions.emptyWeaknesses')}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <p>{t('admin.feedbackOptions.selectSurvey')}</p>
        </div>
      )}
    </div>
  );
}
