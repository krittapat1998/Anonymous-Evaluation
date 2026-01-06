import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/adminNavMenu.css';

const AdminNavMenu = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const adminUsername = localStorage.getItem('adminUsername') || 'Admin';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/admin/login', { replace: true });
  };

  const menuItems = [
    { path: '/admin', label: t('admin.nav.dashboard') || 'แผงควบคุม', icon: '🏠' },
    { path: '/admin/surveys', label: t('admin.nav.surveys') || 'จัดการแบบสอบถาม', icon: '📋' },
    { path: '/admin/tokens', label: t('admin.nav.tokens') || 'จัดการโทเคน', icon: '🎫' },
    { path: '/admin/bulk-generate', label: t('admin.nav.bulkTokens') || 'สร้างโทเคนจำนวนมาก', icon: '🔐' },
    { path: '/admin/feedback-options', label: t('admin.nav.feedback') || 'ตัวเลือกข้อเสนอแนะ', icon: '💡' },
    { path: '/admin/results', label: t('admin.nav.results') || 'ผลแบบสอบถาม', icon: '📊' },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-nav-container">
      {/* Mobile Menu Toggle */}
      <button className="admin-nav-toggle" onClick={() => setIsOpen(!isOpen)}>
        <span className="menu-icon">{isOpen ? '✕' : '☰'}</span>
        <span className="menu-text">{t('admin.nav.menu') || 'เมนู'}</span>
      </button>

      {/* Navigation Menu */}
      <nav className={`admin-nav-menu ${isOpen ? 'open' : ''}`}>
        <div className="admin-nav-header">
          <span className="admin-nav-user">👤 {adminUsername}</span>
        </div>
        
        <ul className="admin-nav-list">
          {menuItems.map((item) => (
            <li key={item.path}>
              <button
                className={`admin-nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
          {/* Desktop Logout Button */}
          <li className="desktop-logout-item">
            <button className="admin-nav-item logout-btn" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              <span className="nav-label">{t('nav.logout') || 'ออกจากระบบ'}</span>
            </button>
          </li>
        </ul>

        <div className="admin-nav-footer">
          <button className="admin-nav-logout" onClick={handleLogout}>
            🚪 {t('nav.logout') || 'ออกจากระบบ'}
          </button>
        </div>
      </nav>

      {/* Overlay for mobile */}
      {isOpen && <div className="admin-nav-overlay" onClick={() => setIsOpen(false)} />}
    </div>
  );
};

export default AdminNavMenu;
