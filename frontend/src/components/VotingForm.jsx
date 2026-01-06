import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/components.css';

const VotingForm = ({ survey, candidates, feedbackOptions, myVotesByCandidate = {}, onSubmit, loading = false }) => {
  const { t } = useTranslation();
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedStrengths, setSelectedStrengths] = useState([]);
  const [selectedWeaknesses, setSelectedWeaknesses] = useState([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedCandidate) return;
    const existing = myVotesByCandidate[selectedCandidate];
    if (!existing) {
      setSelectedStrengths([]);
      setSelectedWeaknesses([]);
      setFeedbackText('');
      return;
    }

    setSelectedStrengths(existing.strengthIds || []);
    setSelectedWeaknesses(existing.weaknessIds || []);
    setFeedbackText(existing.feedbackText || '');
  }, [selectedCandidate, myVotesByCandidate]);

  const handleStrengthChange = (id) => {
    setSelectedStrengths((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleWeaknessChange = (id) => {
    setSelectedWeaknesses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedCandidate) {
      setError(t('voting.missingCandidate'));
      return;
    }

    if (selectedStrengths.length === 0 && selectedWeaknesses.length === 0) {
      setError(t('voting.missingFeedback'));
      return;
    }

    onSubmit({
      candidateId: selectedCandidate,
      strengthIds: selectedStrengths,
      weaknessIds: selectedWeaknesses,
      feedbackText,
    });
  };

  return (
    <div className="voting-form-container">
      <div className="survey-header">
        <h2>{survey.title}</h2>
        {survey.description && <p className="description">{survey.description}</p>}
      </div>

      <form onSubmit={handleSubmit} className="voting-form">
        {/* Candidate Selection */}
        <div className="form-section">
          <label className="section-label">{t('voting.selectCandidate')}</label>
          <div className="candidates-grid">
            {candidates.map((candidate) => (
              <label
                key={candidate.id}
                className="candidate-option"
                style={
                  myVotesByCandidate[candidate.id]
                    ? {
                        borderColor: 'var(--success-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                      }
                    : undefined
                }
              >
                <input
                  type="radio"
                  name="candidate"
                  value={candidate.id}
                  checked={selectedCandidate === candidate.id}
                  onChange={(e) => setSelectedCandidate(e.target.value)}
                />
                <span className="candidate-name">
                  {candidate.name}{' '}
                  {myVotesByCandidate[candidate.id] ? (
                    <span style={{ color: 'var(--success-color)', fontSize: '0.85em' }}>
                      (ประเมินแล้ว)
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
          <div style={{ marginTop: '8px', color: 'var(--text-light)', fontSize: '0.85rem' }}>
            สีเขียว = เคยประเมินแล้ว (แก้ไขได้ถ้าแบบสอบถามยังไม่ปิด)
          </div>
        </div>

        {/* Strengths Selection */}
        {feedbackOptions.strengths && feedbackOptions.strengths.length > 0 && (
          <div className="form-section">
            <label className="section-label">{t('voting.strengths')}</label>
            <div className="feedback-options">
              {feedbackOptions.strengths.map((option) => (
                <label key={option.id} className="feedback-option">
                  <input
                    type="checkbox"
                    checked={selectedStrengths.includes(option.id)}
                    onChange={() => handleStrengthChange(option.id)}
                  />
                  <span className="option-text">{option.option_text || option.text}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Weaknesses Selection */}
        {feedbackOptions.weaknesses && feedbackOptions.weaknesses.length > 0 && (
          <div className="form-section">
            <label className="section-label">
              {t('voting.weaknesses')}
            </label>
            <div className="feedback-options">
              {feedbackOptions.weaknesses.map((option) => (
                <label key={option.id} className="feedback-option">
                  <input
                    type="checkbox"
                    checked={selectedWeaknesses.includes(option.id)}
                    onChange={() => handleWeaknessChange(option.id)}
                  />
                  <span className="option-text">{option.option_text || option.text}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Optional Feedback Text */}
        <div className="form-section">
          <label htmlFor="feedback" className="section-label">
            {t('voting.comments')}
          </label>
          <textarea
            id="feedback"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder={t('voting.commentPlaceholder')}
            className="feedback-textarea"
            rows="4"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="btn btn-primary btn-submit" disabled={loading}>
          {loading ? t('voting.submitting') : t('voting.submitVote')}
        </button>
      </form>
    </div>
  );
};

export default VotingForm;
