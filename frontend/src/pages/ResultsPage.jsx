import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TokenInput from '../components/TokenInput';
import ResultsChart from '../components/ResultsChart';
import { voteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ResultsPage = () => {
  const { candidateToken, setCandidateToken } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState(candidateToken ? 'results' : 'token');
  const [results, setResults] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputToken, setInputToken] = useState(''); // เก็บ token ที่พิมพ์ไว้แสดงด้านบน

  const handleChangeToken = () => {
    setCandidateToken('');
    setInputToken('');
    setStep('token');
    setResults(null);
    setCandidateName('');
    setComments([]);
    setError('');
  };

  const handleTokenSubmit = async (token) => {
    setInputToken(token); // เก็บ token ไว้แสดงด้านบน
    try {
      setLoading(true);
      setError('');

      // Verify token and get results (token-only)
      const data = await voteAPI.getMyCandidateResults(token);

      setCandidateToken(token);
      setResults({ ...data.summary, totalVotes: data.totalVotes });
      setCandidateName(data.candidate?.name || data.candidateId);
      setComments(data.comments || []);
      setStep('results');
    } catch (err) {
      // Check if this is a non-candidate token error
      const errorData = err.response?.data;
      if (errorData?.reason === 'not_candidate_token') {
        setError(t('results.notCandidateToken'));
      } else {
        setError(errorData?.error || t('results.invalidToken'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchIfTokenExists = async () => {
      if (!candidateToken || results || loading) return;
      try {
        setLoading(true);
        setError('');
        const data = await voteAPI.getMyCandidateResults(candidateToken);
        setResults({ ...data.summary, totalVotes: data.totalVotes });
        setCandidateName(data.candidate?.name || data.candidateId);
        setComments(data.comments || []);
        setStep('results');
      } catch (err) {
        // Check if this is a non-candidate token error
        const errorData = err.response?.data;
        setCandidateToken('');
        setStep('token');
        setResults(null);
        setCandidateName('');
        setComments([]);
        if (errorData?.reason === 'not_candidate_token') {
          setError(t('results.notCandidateToken'));
        } else {
          setError(errorData?.error || t('results.invalidToken'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchIfTokenExists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateToken]);

  return (
    <div className="container">
      {/* แสดงข้อมูล Token ที่ด้านบน เหมือนหน้า Vote */}
      {(!!candidateToken || !!inputToken) && (
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
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {step === 'results' && candidateName ? (
              <span>
                <strong>{t('results.viewingResultsFor') || 'ดูผลของ'}:</strong>{' '}
                {candidateName}
              </span>
            ) : (
              <span>
                <strong>{t('voting.currentToken') || 'โทเคนปัจจุบัน'}:</strong>{' '}
                <code style={{ 
                  backgroundColor: '#e2e8f0', 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  fontSize: '0.85rem'
                }}>
                  {(candidateToken || inputToken).substring(0, 8)}...
                </code>
              </span>
            )}
          </div>
          
          <button className="btn btn-secondary" type="button" onClick={handleChangeToken}>
            {t('common.changeToken')}
          </button>
        </div>
      )}

      {step === 'token' && !inputToken && (
        <>
          <div className="header">
            <h1>{t('results.title')}</h1>
            <p>{t('results.subtitle')}</p>
          </div>
          <TokenInput onSubmit={handleTokenSubmit} type="candidate" />
        </>
      )}

      {/* แสดง error เมื่อกรอก token แล้วแต่ไม่ใช่ candidate token - ซ่อน TokenInput */}
      {step === 'token' && inputToken && error && (
        <>
          <div className="header">
            <h1>{t('results.title')}</h1>
            <p>{t('results.subtitle')}</p>
          </div>
          <div 
            style={{ 
              maxWidth: '600px', 
              margin: '0 auto',
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              color: '#92400e',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>ℹ️</div>
            {error}
          </div>
        </>
      )}

      {step === 'results' && results && (
        <>
          <div className="header">
            <h1>{t('results.yourResults')}</h1>
            <p>{t('results.anonFeedback')}</p>
          </div>
          <ResultsChart
            results={results}
            candidateName={candidateName}
            comments={comments}
          />
        </>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p>{t('results.loadingResults')}</p>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
