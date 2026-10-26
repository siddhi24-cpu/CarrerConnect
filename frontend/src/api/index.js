import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API = axios.create({ baseURL: BASE_URL });

let isRedirectingToAuth = false;

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler — redirect to login
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const requestUrl = err.config?.url || '';
    const isAuthRequest = requestUrl.includes('/api/auth/');
    const isOnAuthPage = window.location.pathname === '/auth';

    if (status === 401) {
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_user');

      if (!isAuthRequest && !isOnAuthPage && !isRedirectingToAuth) {
        isRedirectingToAuth = true;
        window.location.assign('/auth');
      }
    }

    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────
export const loginUser          = (data)  => API.post('/api/auth/login', data);
export const registerUser       = (data)  => API.post('/api/auth/register', data);
export const fetchMe            = ()      => API.get('/api/auth/me');
export const changePassword     = (data)  => API.post('/api/auth/change-password', data);
export const forgotPassword     = (data)  => API.post('/api/auth/forgot-password', data);
export const resetPassword      = (data)  => API.post('/api/auth/reset-password', data);

// ── Drives ────────────────────────────────────────────────
export const fetchDrives = (params = {}) => {
  if (typeof params === 'string') return API.get('/api/drives', { params: { status: params } });
  return API.get('/api/drives', { params });
};
export const fetchDrive    = (id)    => API.get(`/api/drives/${id}`);
export const createDrive   = (data)  => API.post('/api/drives', data);
export const updateDrive   = (id, d) => API.put(`/api/drives/${id}`, d);
export const deleteDrive   = (id)    => API.delete(`/api/drives/${id}`);
export const applyToDrive  = (id)    => API.post(`/api/drives/${id}/apply`);

// ── Activity / Analytics ──────────────────────────────────
export const fetchActivity           = (params) => API.get('/api/activity', { params });
export const fetchPlacementAnalytics = (year)   => API.get('/api/analytics/placements', { params: { year } });

// ── Students ──────────────────────────────────────────────
export const fetchStudents          = (params) => API.get('/api/students', { params });
export const fetchStudentStats      = ()       => API.get('/api/students/stats');
export const fetchMyProfile         = ()       => API.get('/api/students/me');
export const fetchStudentProfile    = (id)     => API.get(`/api/students/${id}`);
export const updateMyProfile        = (data)   => API.put('/api/students/me', data);
export const fetchMyStudentStats    = ()       => API.get('/api/students/me/stats');
export const fetchMyApplications    = ()       => API.get('/api/students/me/applications');
export const fetchMyApplicationStats= ()       => API.get('/api/students/me/application-stats');
export const updateStudentStatus    = (id, d)  => API.put(`/api/students/${id}/status`, d);

/** Upload resume (multipart/form-data) */
export const uploadResume = (file) => {
  const fd = new FormData();
  fd.append('resume', file);
  return API.post('/api/students/me/resume', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ── TPO Dashboard ─────────────────────────────────────────
export const fetchTpoStats               = (batch) => API.get('/api/tpo/stats', { params: batch ? { batch } : {} });
export const fetchTpoActivity            = (limit = 5) => API.get('/api/tpo/activity', { params: { limit } });
export const fetchTpoPlacementAnalytics  = (year) => API.get('/api/tpo/analytics/placements', { params: { year } });

export default API;

export const createCompanyRecruiter = (data) => API.post('/api/auth/company-recruiter', data);
export const fetchCompanyDashboard = () => API.get('/api/company/dashboard');
export const fetchCompanyDrives = () => API.get('/api/company/drives');
export const createCompanyDrive = (data) => API.post('/api/company/drives', data);
export const fetchCompanyApplicants = (id) => API.get(`/api/company/drives/${id}/applicants`);
export const updateCompanyApplicant = (driveId, studentId, stage) => API.put(`/api/company/drives/${driveId}/applicants/${studentId}`, { stage });
export const scheduleCompanyInterview = (data) => API.post('/api/company/interviews', data);
export const fetchTpoReportSummary = () => API.get('/api/reports/summary');
export const getTpoReportCsvUrl = () => `${BASE_URL}/api/reports/csv`;
export const generateResume = () => API.get('/api/resume/generate', { responseType: 'blob' });

// ── Career Center ─────────────────────────────────────────
export const fetchCareerReadiness = () => API.get('/api/career/readiness');
export const fetchCareerCalendar = () => API.get('/api/career/calendar');
export const fetchNotifications = () => API.get('/api/career/notifications');
export const markAllNotificationsRead = () => API.put('/api/career/notifications/read-all');
export const seedNotifications = () => API.post('/api/career/notifications/seed');
export const fetchMyOffers = () => API.get('/api/career/offers');
export const fetchSkillGap = (driveId) => API.get(`/api/career/skill-gap/${driveId}`);
export const fetchResumeData = () => API.get('/api/resume/data');
export const saveResumeTemplate = (template) => API.put('/api/resume/template', { template });
export const generateResumeTemplate = (template) => API.get(`/api/resume/generate?template=${encodeURIComponent(template)}`, { responseType: 'blob' });
