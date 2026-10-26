import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchDrives,
  applyToDrive,
  fetchMyStudentStats,
  fetchActivity,
  fetchPlacementAnalytics,
} from '../../api';
import StatCard from '../../components/StatCard';
import DriveTable from '../../components/DriveTable';

const FALLBACK_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const getRelativeTime = (date) => {
  if (!date) return 'Just now';
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function StudentOverview() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const [drives, setDrives]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState('');
  const [search, setSearch]   = useState('');
  const [stats, setStats]     = useState({
    appliedCount: 0,
    shortlistedCount: 0,
    shortlistedCompanies: [],
    profileScore: 0,
  });
  const [activity, setActivity] = useState([]);
  const [barData, setBarData]   = useState([]);

  const loadDrives = async (query = '') => {
    setLoading(true);
    try {
      const params = query ? { search: query } : {};
      const { data } = await fetchDrives(params);
      setDrives(Array.isArray(data) ? data : []);
    } catch {
      setDrives([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSummaryCards = async () => {
    try {
      const { data } = await fetchMyStudentStats();
      setStats(data?.data || { appliedCount: 0, shortlistedCount: 0, shortlistedCompanies: [], profileScore: 0 });
    } catch {
      setStats({ appliedCount: 0, shortlistedCount: 0, shortlistedCompanies: [], profileScore: 0 });
    }
  };

  const loadActivityFeed = async () => {
    try {
      const { data } = await fetchActivity({ page: 1, limit: 4 });
      setActivity(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setActivity([]);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data } = await fetchPlacementAnalytics(currentYear);
      const apiData = Array.isArray(data?.data) ? data.data : [];

      if (apiData.length > 0) {
        setBarData(apiData.map((item) => ({ l: item.month, v: item.count })));
      } else {
        setBarData(FALLBACK_MONTHS.map((m) => ({ l: m, v: 0 })));
      }
    } catch {
      setBarData(FALLBACK_MONTHS.map((m) => ({ l: m, v: 0 })));
    }
  };

  useEffect(() => {
    Promise.all([loadSummaryCards(), loadActivityFeed(), loadAnalytics()]);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDrives(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const maxBarValue = useMemo(() => {
    const values = barData.map((item) => item.v);
    return Math.max(1, ...values);
  }, [barData]);

  const profileBadge = stats.profileScore >= 80 ? 'Strong' : stats.profileScore >= 60 ? 'Average' : 'Improve';

  const shownDrives = drives.slice(0, 4);

  const activityItems = activity.length
    ? activity
    : [{ id: 'empty', text: 'No recent activity yet.', colorCode: '#B0C4DE', createdAt: null }];

  const chartData = barData.length
    ? barData
    : FALLBACK_MONTHS.map((l) => ({ l, v: 0 }));

  const firstName = user?.name?.split(' ')[0] || 'there';

  const refreshAfterApply = () => {
    loadDrives(search.trim());
    loadSummaryCards();
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  const handleApply = async (id) => {
    try {
      await applyToDrive(id);
      showToast('Applied successfully! ✓');
      refreshAfterApply();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not apply.');
    }
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-8 right-8 px-5 py-3 rounded-xl text-sm text-white z-50 transition-all"
          style={{ background: 'var(--matte)' }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="font-serif text-3xl" style={{ color: 'var(--text-dark)' }}>
            Hello {firstName}
          </h2>
          <p className="mt-1 text-sm font-light" style={{ color: 'var(--text-mid)' }}>
            Here's your placement journey at a glance
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
          style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-mid)', backdropFilter: 'blur(8px)' }}
        >
          🔍 <input
            placeholder="Search drives..."
            className="bg-transparent border-none outline-none text-sm"
            style={{ color: 'var(--text-dark)', width: '180px', fontFamily: 'inherit' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-5 mb-10" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <StatCard icon="📢" label="Active Drives"  value={loading ? '—' : drives.filter((d) => d.status === 'open').length} badge="Open now"      badgeType="neutral" />
        <StatCard icon="📝" label="Applied"        value={stats.appliedCount}                                                badge="In review"     badgeType="neutral" />
        <StatCard icon="📈" label="Profile Score"  value={`${stats.profileScore}%`}                                          badge={profileBadge}   badgeType="neutral" />
      </div>

      {/* Drives table */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-serif text-xl">Available Drives</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>
            Showing {shownDrives.length} of {drives.length} drives
          </p>
        </div>
      </div>
      <DriveTable
        drives={shownDrives}
        loading={loading}
        onApply={handleApply}
      />

      {/* Bottom grid */}
      <div className="grid gap-6 mt-8" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Activity feed */}
        <div className="glass-card p-6">
          <p className="font-serif text-xl mb-5">Recent Activity</p>
          {activityItems.map((a, i) => (
            <div
              key={a.id || i}
              className="flex gap-3 py-3"
              style={{ borderBottom: i < activityItems.length - 1 ? '1px solid rgba(255,255,255,0.35)' : 'none' }}
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: a.colorCode || '#B0C4DE' }} />
              <div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text-mid)' }}
                  dangerouslySetInnerHTML={{ __html: a.text }}
                />
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>{getRelativeTime(a.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="glass-card p-6">
          <p className="font-serif text-xl mb-1">Placements in {currentYear}</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-light)' }}>Students placed per month</p>
          <div className="flex items-end gap-2" style={{ height: '110px' }}>
            {chartData.map(({ l, v }) => (
              <div key={l} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-mid)' }}>{v}</span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${Math.max(10, Math.round((v / maxBarValue) * 80))}px`,
                    background: 'var(--pastel-blue)',
                  }}
                />
                <span className="text-xs" style={{ color: 'var(--text-light)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
