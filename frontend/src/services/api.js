import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Admin API instance with auth interceptor
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add admin auth token to all admin requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors - token expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      const currentPath = window.location.pathname;
      
      // Only redirect if we're on an admin page
      if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
        // Clear expired token
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUsername');
        
        // Store message to show on login page
        localStorage.setItem('sessionExpired', 'true');
        
        // Redirect to login
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Public API instance for voter endpoints (no auth interceptor)
const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Admin API
 */
api.adminLogin = async (username, password) => {
  const response = await api.post('/admin/login', { username, password });
  return response.data;
};

api.generateTokens = async (surveyId, count) => {
  const response = await api.post('/admin/generate-tokens', { surveyId, count });
  return response.data;
};

api.generateTokenForCandidate = async (surveyId, candidateId) => {
  const response = await api.post('/admin/generate-token', { surveyId, candidateId });
  return response.data;
};

api.createCandidateWithToken = async (surveyId, name, employeeId, department) => {
  const response = await api.post('/admin/candidates/create-with-token', 
    { surveyId, name, employeeId, department }
  );
  return response.data;
};

api.getSurveyTokens = async (surveyId) => {
  const response = await api.get(`/admin/surveys/${surveyId}/tokens`);
  return response.data;
};

api.getSurveyBulkTokens = async (surveyId) => {
  const response = await api.get(`/admin/surveys/${surveyId}/bulk-tokens`);
  return response.data;
};

api.regenerateTokenForCandidate = async (surveyId, candidateId) => {
  const response = await api.post('/admin/regenerate-token', { surveyId, candidateId });
  return response.data;
};

api.deleteCandidate = async (surveyId, candidateId) => {
  const response = await api.delete(`/admin/surveys/${surveyId}/candidates/${candidateId}`);
  return response.data;
};

api.addFeedbackOption = async (surveyId, type, optionText, displayOrder) => {
  const response = await api.post(`/admin/surveys/${surveyId}/feedback-options`, 
    { type, optionText, displayOrder }
  );
  return response.data;
};

api.deleteFeedbackOption = async (surveyId, optionId) => {
  const response = await api.delete(`/admin/surveys/${surveyId}/feedback-options/${optionId}`);
  return response.data;
};

/**
 * Vote API (Public - no admin auth required)
 */
export const voteAPI = {
  /**
   * Submit a vote
   */
  submitVote: async (surveyId, candidateId, strengthIds, weaknessIds, token, feedbackText = '') => {
    const response = await publicApi.post('/votes', {
      surveyId,
      candidateId,
      strengthIds,
      weaknessIds,
      feedbackText,
      token,
    });
    return response.data;
  },

  /**
   * Check if a token has already voted
   */
  checkVoteStatus: async (surveyId, token) => {
    const response = await publicApi.post('/votes/status', {
      surveyId,
      token,
    });
    return response.data;
  },

  /**
   * Get this token's existing votes for a survey
   */
  getMyVotes: async (surveyId, token) => {
    const response = await publicApi.post('/votes/mine', {
      surveyId,
      token,
    });
    return response.data;
  },

  /**
   * Get candidate's voting results
   */
  getCandidateResults: async (surveyId, token) => {
    const response = await publicApi.get(`/votes/results/${surveyId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  /**
   * Get candidate's own results (token-only)
   */
  getMyCandidateResults: async (token) => {
    const response = await publicApi.post('/votes/results/my', { token });
    return response.data;
  },
};

/**
 * Survey API - Public endpoints for voters
 */
export const surveyAPI = {
  /**
   * Get all active surveys (public)
   */
  getAllSurveys: async () => {
    const response = await publicApi.get('/surveys');
    return response.data;
  },

  /**
   * Get survey details for voting (public)
   */
  getSurveyDetail: async (surveyId) => {
    const response = await publicApi.get(`/surveys/${surveyId}`);
    return response.data;
  },

  /**
   * Create survey (admin only)
   */
  createSurvey: async (title, description) => {
    const response = await api.post('/admin/surveys', {
      title,
      description,
    });
    return response.data;
  },

  /**
   * Get all surveys (admin only)
   */
  getAllSurveysAdmin: async () => {
    const response = await api.get('/admin/surveys');
    return response.data;
  },

  /**
   * Get survey details (admin only)
   */
  getSurveyDetailAdmin: async (surveyId) => {
    const response = await api.get(`/admin/surveys/${surveyId}`);
    return response.data;
  },

  /**
   * Update survey status
   */
  updateSurveyStatus: async (surveyId, status) => {
    const response = await api.patch(`/admin/surveys/${surveyId}`, {
      status,
    });
    return response.data;
  },

  /**
   * Add candidate
   */
  addCandidate: async (surveyId, name, employeeId, department) => {
    const response = await api.post(`/admin/surveys/${surveyId}/candidates`, {
      name,
      employeeId,
      department,
    });
    return response.data;
  },

  /**
   * Add feedback option
   */
  addFeedbackOption: async (surveyId, type, optionText, displayOrder) => {
    const response = await api.post(`/admin/surveys/${surveyId}/feedback-options`, {
      type,
      optionText,
      displayOrder,
    });
    return response.data;
  },

  /**
   * Get all results (admin only)
   */
  getAllResults: async (surveyId) => {
    const response = await api.get(`/admin/surveys/${surveyId}/all-results`);
    return response.data;
  },
};

/**
 * Updated API functions (simplified with interceptor)
 */
api.createSurvey = async (surveyData) => {
  const response = await api.post('/admin/surveys', surveyData);
  return response.data;
};

api.getSurveys = async () => {
  const response = await api.get('/admin/surveys');
  return response.data;
};

api.getSurveyDetail = async (surveyId) => {
  const response = await api.get(`/admin/surveys/${surveyId}`);
  return response.data;
};

api.updateSurveyStatus = async (surveyId, statusData) => {
  const response = await api.patch(`/admin/surveys/${surveyId}`, statusData);
  return response.data;
};

api.updateSurveyData = async (surveyId, surveyData) => {
  const response = await api.patch(`/admin/surveys/${surveyId}`, surveyData);
  return response.data;
};

export default api;
