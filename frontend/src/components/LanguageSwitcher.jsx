import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/languageSwitcher.css';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'th' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button 
      className="language-switcher"
      onClick={toggleLanguage}
      title={i18n.language === 'en' ? 'สลับเป็นไทย' : 'Switch to English'}
    >
      <span className="lang-icon">🌐</span>
      <span className="lang-text">
        {i18n.language === 'en' ? 'ไทย' : 'EN'}
      </span>
    </button>
  );
}
