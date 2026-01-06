import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import '../styles/components.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ResultsChart = ({ results, feedbackOptions, candidateName, comments = [] }) => {
  const { t } = useTranslation();
  const strengthData = results?.strengths || [];
  const weaknessData = results?.weaknesses || [];

  if (!strengthData.length && !weaknessData.length) {
    return (
      <div className="results-empty">
        <p>{t('results.noVotes')}</p>
      </div>
    );
  }

  // Prepare data for strengths chart
  const strengthChartData = {
    labels: strengthData.map((item) => item.text || item.id || 'Unknown'),
    datasets: [
      {
        label: t('results.strengths'),
        data: strengthData.map((item) => item.count),
        backgroundColor: 'rgba(75, 192, 75, 0.7)',
        borderColor: 'rgba(75, 192, 75, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for weaknesses chart
  const weaknessChartData = {
    labels: weaknessData.map((item) => item.text || item.id || 'Unknown'),
    datasets: [
      {
        label: t('results.weaknesses'),
        data: weaknessData.map((item) => item.count),
        backgroundColor: 'rgba(255, 193, 7, 0.7)',
        borderColor: 'rgba(255, 193, 7, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="results-container">
      <h2 className="results-title">{t('results.yourResults')}</h2>

      {candidateName && (
        <div className="candidate-info">
          <p>
            <strong>{t('results.candidateName')}</strong> {candidateName}
          </p>
          <p className="total-votes">
            <strong>{t('results.totalVotes')}</strong> {results?.totalVotes || 0}
          </p>
        </div>
      )}

      {strengthData.length > 0 && (
        <div className="chart-section">
          <h3>{t('results.strengths')}</h3>
          <div className="chart-wrapper">
            <Bar data={strengthChartData} options={chartOptions} />
          </div>
          <div className="strength-list">
            {strengthData.map((item, index) => (
              <div key={index} className="strength-item">
                <span className="strength-text">{item.text || item.id}</span>
                <span className="strength-count">{item.count} {t('results.votes')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {weaknessData.length > 0 && (
        <div className="chart-section">
          <h3>{t('results.weaknesses')}</h3>
          <div className="chart-wrapper">
            <Bar data={weaknessChartData} options={chartOptions} />
          </div>
          <div className="weakness-list">
            {weaknessData.map((item, index) => (
              <div key={index} className="weakness-item">
                <span className="weakness-text">{item.text || item.id}</span>
                <span className="weakness-count">{item.count} {t('results.votes')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginTop: 0 }}>{t('results.commentsTitle')}</h3>
        {comments?.length ? (
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {comments.map((c, idx) => (
              <li key={idx} style={{ marginBottom: '8px' }}>{c}</li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0 }}>{t('results.noComments')}</p>
        )}
      </div>

      <div className="results-note">
        <p>
          📊 <strong>{t('results.note')}</strong>
        </p>
      </div>
    </div>
  );
};

export default ResultsChart;
