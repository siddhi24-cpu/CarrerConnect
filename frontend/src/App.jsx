import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import TPODashboard from './pages/TPODashboard';
import CompanyDashboard from './pages/CompanyDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"        element={<LandingPage />} />
        <Route path="/auth"    element={<AuthPage />} />

        {/* Student-only routes */}
        <Route element={<ProtectedRoute allowedRole="student" />}>
          <Route path="/dashboard/*" element={<StudentDashboard />} />
        </Route>

        {/* TPO-only routes */}
        <Route element={<ProtectedRoute allowedRole="tpo" />}>
          <Route path="/tpo/*" element={<TPODashboard />} />
        </Route>

        {/* Company Recruiter-only routes */}
        <Route element={<ProtectedRoute allowedRole="company" />}>
          <Route path="/company/*" element={<CompanyDashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
