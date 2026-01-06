import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * ProtectedAdminRoute - Wrapper component ที่เช็ค admin token
 * ถ้ามี token จะแสดงหน้า ถ้าไม่มีจะ redirect ไป login
 */
const ProtectedAdminRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(null); // null = checking, true = authorized, false = not authorized

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    
    if (!adminToken) {
      // No token, redirect to login
      setIsAuthorized(false);
      navigate('/admin/login', { replace: true });
    } else {
      // Token exists, show page
      setIsAuthorized(true);
    }
  }, [navigate]);

  // While checking token
  if (isAuthorized === null) {
    return (
      <div className="container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        color: '#667eea'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <p>Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Not authorized, will redirect
  if (!isAuthorized) {
    return null;
  }

  // Authorized, show children
  return children;
};

export default ProtectedAdminRoute;
