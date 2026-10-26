import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CompanyOverview from './company/CompanyOverview';
import CompanyDrives from './company/CompanyDrives';

export default function CompanyDashboard() {
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="dashboard-main">
        <Routes>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<CompanyOverview />} />
          <Route path="drives" element={<CompanyDrives />} />
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Routes>
      </main>
    </div>
  );
}
