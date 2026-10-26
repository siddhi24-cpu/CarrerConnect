import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TPOOverview from './tpo/TPOOverview';
import TPODrives from './tpo/TPODrives';
import TPOStudents from './tpo/TPOStudents';
import TPOReports from './tpo/TPOReports';
import TPORecruiters from './tpo/TPORecruiters';
import StudentProfile from './student/StudentProfile';

export default function TPODashboard() {
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="dashboard-main">
        <Routes>
          <Route index             element={<TPOOverview />} />
          <Route path="drives"     element={<TPODrives />} />
          <Route path="students"   element={<TPOStudents />} />
          <Route path="students/:id" element={<StudentProfile readOnly />} />
          <Route path="reports"    element={<TPOReports />} />
          <Route path="recruiters" element={<TPORecruiters />} />
          <Route path="*"          element={<Navigate to="/tpo" replace />} />
        </Routes>
      </main>
    </div>
  );
}
