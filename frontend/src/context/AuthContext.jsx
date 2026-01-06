import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('voter_token') || '';
  });

  const [candidateToken, setCandidateToken] = useState(() => {
    return localStorage.getItem('candidate_token') || '';
  });

  const [adminToken, setAdminToken] = useState(() => {
    return localStorage.getItem('admin_token') || '';
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('user_role') || null;
  });

  // Save tokens to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('voter_token', token);
    } else {
      localStorage.removeItem('voter_token');
    }
  }, [token]);

  useEffect(() => {
    if (candidateToken) {
      localStorage.setItem('candidate_token', candidateToken);
    } else {
      localStorage.removeItem('candidate_token');
    }
  }, [candidateToken]);

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('admin_token', adminToken);
    } else {
      localStorage.removeItem('admin_token');
    }
  }, [adminToken]);

  useEffect(() => {
    if (userRole) {
      localStorage.setItem('user_role', userRole);
    } else {
      localStorage.removeItem('user_role');
    }
  }, [userRole]);

  const logout = () => {
    setToken('');
    setCandidateToken('');
    setAdminToken('');
    setUserRole(null);
    localStorage.removeItem('voter_token');
    localStorage.removeItem('candidate_token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user_role');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        candidateToken,
        setCandidateToken,
        adminToken,
        setAdminToken,
        userRole,
        setUserRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
