import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 * Wraps routes that require authentication.
 * Optionally restricts to a specific role ('student' | 'tpo').
 *
 * Usage in App.jsx:
 *   <Route element={<ProtectedRoute allowedRole="student" />}>
 *     <Route path="/dashboard" element={<StudentDashboard />} />
 *   </Route>
 */
export default function ProtectedRoute({ allowedRole }) {
  const { user, loading } = useAuth();

  // Wait for localStorage rehydration before deciding
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-beige">
        <div className="text-text-mid text-sm">Loading...</div>
      </div>
    );
  }

  // Not logged in → redirect to auth
  if (!user) return <Navigate to="/auth" replace />;

  // Wrong role → redirect to their correct dashboard
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'tpo' ? '/tpo' : user.role === 'company' ? '/company' : '/dashboard'} replace />;
  }

  // All good — render the child route
  return <Outlet />;
}
