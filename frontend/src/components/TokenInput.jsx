import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/components.css';

const TokenInput = ({ onSubmit, type = 'voter' }) => {
  const { t } = useTranslation();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError(t('voting.missingToken'));
      return;
    }

    onSubmit(token);
  };

  return (
    <div className="token-input-container">
      <form onSubmit={handleSubmit} className="token-form">
        <div className="form-group">
          <label htmlFor="token">
            {type === 'voter'
              ? t('voting.enterToken')
              : t('results.enterToken')}
          </label>
          <input
            id="token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={t('voting.tokenPlaceholder')}
            className="token-input"
            disabled={false}
          />
          <small className="help-text">
            {type === 'voter'
              ? t('voting.tokenHelp')
              : t('results.tokenHelp')}
          </small>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="btn btn-primary">
          {type === 'voter' ? t('voting.startVoting') : t('results.viewResults')}
        </button>
      </form>
    </div>
  );
};

export default TokenInput;
