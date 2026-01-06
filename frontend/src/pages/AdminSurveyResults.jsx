import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { surveyAPI } from '../services/api';
import AdminNavMenu from '../components/AdminNavMenu';
import '../styles/adminSurveyResults.css';

function normalizeIdArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.includes(',')) {
        return trimmed
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [trimmed];
    }
  }

  return [];
}

const AdminSurveyResults = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState('');
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState('');

  const [rows, setRows] = useState([]);
  const [feedbackOptions, setFeedbackOptions] = useState({});

  const adminToken = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    const load = async () => {
      setLoadingSurveys(true);
      setError('');
      try {
        const res = await surveyAPI.getAllSurveysAdmin();
        const list = res?.surveys || res || [];
        setSurveys(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Survey load error:', err);
        setError(err?.response?.data?.error || t('admin.results.failedToLoadSurveys'));
      } finally {
        setLoadingSurveys(false);
      }
    };

    load();
  }, [adminToken]);

  useEffect(() => {
    if (!surveys?.length) return;

    const surveyId = new URLSearchParams(location.search).get('surveyId');
    if (!surveyId) return;
    if (!surveys.some((s) => s.id === surveyId)) return;

    setSelectedSurvey(surveyId);
  }, [surveys, location.search]);

  useEffect(() => {
    if (!selectedSurvey) {
      setRows([]);
      setFeedbackOptions({});
      return;
    }

    const load = async () => {
      setLoadingResults(true);
      setError('');
      try {
        const res = await surveyAPI.getAllResults(selectedSurvey);
        setRows(res?.results || []);
        setFeedbackOptions(res?.feedbackOptions || {});
      } catch (err) {
        console.error('Results load error:', err);
        setError(err?.response?.data?.error || t('admin.results.failedToLoadResults'));
      } finally {
        setLoadingResults(false);
      }
    };

    load();
  }, [selectedSurvey]);

  const candidates = useMemo(() => {
    const byCandidate = new Map();

    for (const r of rows || []) {
      const candidateId = r.candidate_id;
      if (!candidateId) continue;

      const candidateName = r.candidate_name || candidateId;
      const totalVotesForRow = Number(r.total_votes) || 0;
      const strengthIds = normalizeIdArray(r.strength_ids);
      const weaknessIds = normalizeIdArray(r.weakness_ids);

      if (!byCandidate.has(candidateId)) {
        byCandidate.set(candidateId, {
          candidateId,
          candidateName,
          totalVotes: 0,
          strengths: new Map(),
          weaknesses: new Map(),
        });
      }

      const bucket = byCandidate.get(candidateId);
      bucket.totalVotes += totalVotesForRow;

      for (const id of strengthIds) {
        bucket.strengths.set(id, (bucket.strengths.get(id) || 0) + totalVotesForRow);
      }
      for (const id of weaknessIds) {
        bucket.weaknesses.set(id, (bucket.weaknesses.get(id) || 0) + totalVotesForRow);
      }
    }

    const toSortedList = (m) => {
      return Array.from(m.entries())
        .map(([id, count]) => ({
          id,
          text: feedbackOptions?.[id]?.text || id,
          count,
        }))
        .sort((a, b) => b.count - a.count);
    };

    return Array.from(byCandidate.values())
      .map((c) => ({
        ...c,
        strengths: toSortedList(c.strengths),
        weaknesses: toSortedList(c.weaknesses),
      }))
      .sort((a, b) => a.candidateName.localeCompare(b.candidateName));
  }, [rows, feedbackOptions]);

  return (
    <div className="admin-results-container">
      <AdminNavMenu />

      <h1 style={{ fontSize: '1.5rem', marginBottom: '24px', color: '#1f2937' }}>
        📊 {t('admin.results.title')}
      </h1>

      <div className="card survey-selector-card">
        <h3>{t('admin.results.selectSurvey')}</h3>

        <div className="form-group">
          <label>{t('admin.results.survey')}</label>
          <select
            value={selectedSurvey}
            onChange={(e) => setSelectedSurvey(e.target.value)}
            disabled={loadingSurveys || loadingResults}
          >
            <option value="">{t('admin.results.chooseSurvey')}</option>
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.status})
              </option>
            ))}
          </select>
        </div>

        {(loadingSurveys || loadingResults) && (
          <div className="loading">{t('common.loading')}</div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>

      {selectedSurvey && !loadingResults && !error && (
        <div className="card results-card">
          <h3 className="results-title">
            📊 {t('admin.results.overview')}
          </h3>

          {candidates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p>{t('admin.results.noResults')}</p>
            </div>
          ) : (
            <div className="candidate-results-list">
              {candidates.map((c) => (
                <div key={c.candidateId} className="candidate-result-card">
                  {/* Header: ชื่อ + จำนวนการประเมิน */}
                  <div className="candidate-header">
                    <div className="candidate-header-content">
                      <div className="candidate-avatar">
                        {c.candidateName.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="candidate-name">
                        {c.candidateName}
                      </h3>
                      <div className="vote-count-badge">
                        🗳️ {c.totalVotes} {t('results.votes') || 'ครั้ง'}
                      </div>
                    </div>
                  </div>

                  {/* Content: จุดแข็ง + จุดที่ต้องพัฒนา */}
                  <div className="feedback-sections">
                    {/* จุดแข็ง */}
                    <div className="feedback-section strengths">
                      <h4 className="section-title strengths">
                        ✅ {t('results.strengths')}
                      </h4>
                      {c.strengths.length ? (
                        <div className="feedback-items">
                          {c.strengths.map((s) => (
                            <div key={s.id} className="feedback-item">
                              <span className="feedback-item-text">{s.text}</span>
                              <span className="feedback-item-count strength">
                                {s.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-feedback">
                          ยังไม่มีข้อมูล
                        </p>
                      )}
                    </div>

                    {/* จุดที่ต้องพัฒนา */}
                    <div className="feedback-section weaknesses">
                      <h4 className="section-title weaknesses">
                        ⚠️ {t('results.weaknesses')}
                      </h4>
                      {c.weaknesses.length ? (
                        <div className="feedback-items">
                          {c.weaknesses.map((w) => (
                            <div key={w.id} className="feedback-item">
                              <span className="feedback-item-text">{w.text}</span>
                              <span className="feedback-item-count weakness">
                                {w.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-feedback">
                          ยังไม่มีข้อมูล
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSurveyResults;
