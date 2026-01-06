import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TokenInput from '../components/TokenInput';
import VotingForm from '../components/VotingForm';
import { voteAPI, surveyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const safeJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const VotingPage = () => {
  const { token, setToken } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const surveyIdFromUrl = searchParams.get('surveyId') || '';
  const initialStep = 'token';

  const [step, setStep] = useState(initialStep);
  const [surveys, setSurveys] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState(surveyIdFromUrl);
  const [eligibleSurveyIds, setEligibleSurveyIds] = useState(null);

  const [survey, setSurvey] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [feedbackOptions, setFeedbackOptions] = useState({});
  const [myVotesByCandidate, setMyVotesByCandidate] = useState({});
  const [tokenOwner, setTokenOwner] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [tokenUsed, setTokenUsed] = useState(false); // สำหรับ single-use token ที่ใช้แล้ว

  const visibleCandidates = useMemo(() => {
    if (!tokenOwner?.id) return candidates;
    return (candidates || []).filter((c) => c.id !== tokenOwner.id);
  }, [candidates, tokenOwner]);

  const handleChangeToken = () => {
    setToken('');
    setError('');
    setSubmitSuccess(false);
    setSurvey(null);
    setCandidates([]);
    setFeedbackOptions({});
    setMyVotesByCandidate({});
    setTokenOwner(null);
    setEligibleSurveyIds(null);
    setTokenUsed(false);
    setStep('token');
  };

  const activeSurveys = useMemo(() => (surveys || []).filter((s) => s.status === 'active'), [surveys]);

  const eligibleActiveSurveys = useMemo(() => {
    if (!eligibleSurveyIds) return activeSurveys;
    const idSet = new Set(eligibleSurveyIds);
    return activeSurveys.filter((s) => idSet.has(s.id));
  }, [activeSurveys, eligibleSurveyIds]);

  useEffect(() => {
    const loadSurveys = async () => {
      try {
        const data = await surveyAPI.getAllSurveys();
        setSurveys(data.surveys || []);
      } catch (err) {
        setError(t('voting.errorLoading'));
      }
    };
    loadSurveys();
  }, [t]);

  useEffect(() => {
    const validateTokenForSurvey = async () => {
      if (step !== 'survey') return;
      if (!token || !selectedSurveyId) return;

      setLoading(true);
      setError('');
      try {
        const status = await voteAPI.checkVoteStatus(selectedSurveyId, token);
        setTokenOwner(status?.tokenOwner || null);
      } catch (err) {
        setError(t('voting.invalidToken'));
        setTokenOwner(null);
        setStep('token');
      } finally {
        setLoading(false);
      }
    };

    validateTokenForSurvey();
  }, [selectedSurveyId, step, t, token]);

  useEffect(() => {
    const loadSurveyDetail = async () => {
      if (step !== 'survey') return;
      if (!selectedSurveyId) return;

      setLoading(true);
      setError('');
      try {
        const data = await surveyAPI.getSurveyDetail(selectedSurveyId);
        setSurvey(data.survey || null);
        setCandidates(data.candidates || []);
        setFeedbackOptions(data.feedbackOptions || {});
      } catch (err) {
        setError(t('voting.errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    loadSurveyDetail();
  }, [selectedSurveyId, step, t]);

  useEffect(() => {
    const loadMyVotes = async () => {
      if (step !== 'survey') return;
      if (!token || !selectedSurveyId) return;

      try {
        const myVotesData = await voteAPI.getMyVotes(selectedSurveyId, token);
        const votes = myVotesData.votes || [];
        const byCandidate = {};
        votes.forEach((v) => {
          if (!v?.candidate_id) return;
          byCandidate[v.candidate_id] = {
            strengthIds: safeJsonArray(v.strength_ids),
            weaknessIds: safeJsonArray(v.weakness_ids),
            feedbackText: v.feedback_text || '',
          };
        });
        setMyVotesByCandidate(byCandidate);
      } catch (err) {
        // silently fail - votes will just be empty
      }
    };

    loadMyVotes();
  }, [selectedSurveyId, step, token]);

  const handleTokenSubmit = async (submittedToken) => {
    setError('');
    setSubmitSuccess(false);
    setSurvey(null);
    setCandidates([]);
    setFeedbackOptions({});
    setMyVotesByCandidate({});
    setTokenOwner(null);
    setEligibleSurveyIds(null);
    setTokenUsed(false);
    setToken(submittedToken);

    // Determine which surveys this token is valid for
    const candidates = activeSurveys;
    if (!candidates.length) {
      setEligibleSurveyIds([]);
      setStep('survey-select');
      return;
    }

    setLoading(true);
    try {
      const checks = await Promise.all(
        candidates.map(async (s) => {
          try {
            const status = await voteAPI.checkVoteStatus(s.id, submittedToken);
            return { surveyId: s.id, ok: true, status, tokenUsed: false };
          } catch (err) {
            // ตรวจสอบว่า token ถูกใช้แล้ว (403 + tokenUsed)
            const isTokenUsed = err.response?.status === 403 && err.response?.data?.tokenUsed;
            return { surveyId: s.id, ok: false, status: null, tokenUsed: isTokenUsed };
          }
        })
      );

      const okOnes = checks.filter((x) => x.ok);
      const usedOnes = checks.filter((x) => x.tokenUsed);
      const okIds = okOnes.map((x) => x.surveyId);
      setEligibleSurveyIds(okIds);

      if (okOnes.length === 1) {
        const only = okOnes[0];
        setSelectedSurveyId(only.surveyId);
        setTokenOwner(only.status?.tokenOwner || null);
        setStep('survey');
        return;
      }

      if (okOnes.length === 0) {
        // ถ้ามี token ที่ใช้แล้ว ให้แสดงข้อความพิเศษ
        if (usedOnes.length > 0) {
          setTokenUsed(true);
          setError(t('voting.tokenAlreadyUsed') || 'โทเคนนี้ถูกใช้งานแล้ว');
        } else {
          setError(t('voting.noMatchingSurveyForToken'));
        }
        setStep('token');
        return;
      }

      // More than one match (rare) => let user choose
      setStep('survey-select');
    } finally {
      setLoading(false);
    }
  };

  const handleSurveySelect = async (surveyId) => {
    setError('');
    setSubmitSuccess(false);
    setSurvey(null);
    setCandidates([]);
    setFeedbackOptions({});
    setMyVotesByCandidate({});
    setTokenOwner(null);
    setSelectedSurveyId(surveyId);

    if (!token) {
      setStep('token');
      return;
    }

    setLoading(true);
    try {
      const status = await voteAPI.checkVoteStatus(surveyId, token);
      setTokenOwner(status?.tokenOwner || null);
      setTokenUsed(false);
      setStep('survey');
    } catch (err) {
      // ตรวจสอบว่า token ถูกใช้แล้วหรือไม่ (403 + tokenUsed)
      if (err.response?.status === 403 && err.response?.data?.tokenUsed) {
        setTokenUsed(true);
        setError(t('voting.tokenAlreadyUsed') || 'โทเคนนี้ถูกใช้งานแล้ว');
      } else {
        setError(t('voting.invalidToken'));
      }
      setTokenOwner(null);
      setStep('token');
    } finally {
      setLoading(false);
    }
  };

  const handleVoteSubmit = async ({ candidateId, strengthIds, weaknessIds, feedbackText }) => {
    setLoading(true);
    setError('');
    setSubmitSuccess(false);

    try {
      await voteAPI.submitVote(
        selectedSurveyId,
        candidateId,
        strengthIds,
        weaknessIds,
        token,
        feedbackText
      );

      setMyVotesByCandidate((prev) => ({
        ...prev,
        [candidateId]: { strengthIds, weaknessIds, feedbackText },
      }));
      setSubmitSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || t('voting.errorSubmitting'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {!!token && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px',
          padding: '10px 15px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {/* แสดงข้อมูลเจ้าของ token */}
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {tokenOwner ? (
              <span>
                <strong>{t('voting.tokenOf') || 'โทเคนของ'}:</strong>{' '}
                {tokenOwner.name}
                {tokenOwner.employee_id && ` (${tokenOwner.employee_id})`}
                {tokenOwner.department && ` - ${tokenOwner.department}`}
              </span>
            ) : (
              token && (
                <span>
                  <strong>{t('voting.currentToken') || 'โทเคนปัจจุบัน'}:</strong>{' '}
                  <code style={{ 
                    backgroundColor: '#e2e8f0', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    fontSize: '0.85rem'
                  }}>
                    {token.substring(0, 8)}...
                  </code>
                </span>
              )
            )}
          </div>
          
          <button className="btn btn-secondary" type="button" onClick={handleChangeToken}>
            {t('common.changeToken')}
          </button>
        </div>
      )}

      {step === 'token' && !token && (
        <>
          <div className="header">
            <h1>{t('voting.title')}</h1>
            <p>{t('voting.subtitle')}</p>
          </div>
          <TokenInput onSubmit={handleTokenSubmit} type="voter" />
          {error && (
            <div 
              className={tokenUsed ? "warning-message" : "error-message"} 
              style={{ 
                maxWidth: '600px', 
                margin: '0 auto',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: tokenUsed ? '#fef3c7' : '#fee2e2',
                border: tokenUsed ? '1px solid #f59e0b' : '1px solid #ef4444',
                color: tokenUsed ? '#92400e' : '#991b1b',
                textAlign: 'center'
              }}
            >
              {tokenUsed && <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</div>}
              {error}
            </div>
          )}
        </>
      )}

      {step === 'token' && token && (
        <>
          <div className="header">
            <h1>{t('voting.title')}</h1>
            <p>{t('voting.subtitle')}</p>
          </div>
          {loading && <div style={{ textAlign: 'center', padding: '20px' }}>{t('common.loading') || 'กำลังโหลด...'}</div>}
          {error && <div className="error-message" style={{ maxWidth: '600px', margin: '0 auto' }}>{error}</div>}
        </>
      )}

      {step === 'survey-select' && (
        <>
          <div className="header">
            <h1>{t('voting.selectSurveyTitle')}</h1>
            <p>{t('voting.selectSurveySubtitle')}</p>
          </div>
          <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {eligibleActiveSurveys.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSurveySelect(s.id)}
                  style={{
                    padding: '16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                >
                  <h3 style={{ margin: '0 0 5px 0' }}>{s.title}</h3>
                  <p style={{ margin: '0', color: 'var(--text-light)', fontSize: '0.9rem' }}>{s.description}</p>
                </div>
              ))}
            </div>

            {eligibleActiveSurveys.length === 0 && (
              <div style={{ marginTop: '12px', color: 'var(--text-light)' }}>
                {t('voting.noSurveysForToken')}
              </div>
            )}

            {error && <div className="error-message" style={{ marginTop: '16px' }}>{error}</div>}
          </div>
        </>
      )}

      {step === 'survey' && survey && (
        <>
          <div className="header">
            <h1>{t('voting.formTitle')}</h1>
            <p>{survey?.title || t('voting.formSubtitle')}</p>
          </div>
          <VotingForm
            survey={survey}
            candidates={visibleCandidates}
            feedbackOptions={feedbackOptions}
            myVotesByCandidate={myVotesByCandidate}
            onSubmit={handleVoteSubmit}
            loading={loading}
          />
          {submitSuccess && (
            <div className="card" style={{ marginTop: '12px' }}>
              <div style={{ color: 'var(--success-color)' }}>{t('voting.savedContinue')}</div>
            </div>
          )}
          {error && <div className="error-message" style={{ maxWidth: '900px', margin: '12px auto 0' }}>{error}</div>}
        </>
      )}

      {!loading && step === 'survey' && !survey && selectedSurveyId && !error && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          {t('common.loading')}
        </div>
      )}
    </div>
  );
};

export default VotingPage;
