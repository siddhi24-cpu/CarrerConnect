import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StudentOverview from './student/StudentOverview';
import StudentDrives from './student/StudentDrives';
import StudentApplications from './student/StudentApplications';
import StudentProfile from './student/StudentProfile';
import ResumeStudio from './student/ResumeStudio';
import CareerCenter from './student/CareerCenter';
import StudentCalendar from './student/StudentCalendar';
import StudentNotifications from './student/StudentNotifications';
import StudentOffers from './student/StudentOffers';

export default function StudentDashboard() {
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="dashboard-main">
        <Routes>
          <Route index                  element={<StudentOverview />} />
          <Route path="drives"          element={<StudentDrives />} />
          <Route path="applications"    element={<StudentApplications />} />
          <Route path="profile"         element={<StudentProfile />} />
          <Route path="career"          element={<CareerCenter />} />
          <Route path="resume"          element={<ResumeStudio />} />
          <Route path="calendar"        element={<StudentCalendar />} />
          <Route path="notifications"   element={<StudentNotifications />} />
          <Route path="offers"          element={<StudentOffers />} />
          <Route path="*"               element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
