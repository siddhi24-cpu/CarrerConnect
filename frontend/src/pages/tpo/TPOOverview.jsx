import { useState, useEffect } from 'react';
import {
  fetchDrives,
  fetchTpoStats,
  fetchTpoActivity,
  fetchTpoPlacementAnalytics,
} from '../../api';
import StatCard from '../../components/StatCard';
import DriveTable from '../../components/DriveTable';
import { useNavigate } from 'react-router-dom';

const FALLBACK_BAR_DATA = [
  { l: 'Jan', v: 0 }, { l: 'Feb', v: 0 }, { l: 'Mar', v: 0 },
  { l: 'Apr', v: 0 }, { l: 'May', v: 0 }, { l: 'Jun', v: 0 },
];

const DEFAULT_STATS = {
  total: 0,
  eligible: 0,
  placed: 0,
  companiesVisited: 0,
  newCompaniesThisMonth: 0,
  avgPackageLPA: 0,
  yoyPackageGrowthLPA: 0,
};

const BATCH_OPTIONS = ['All', '2023', '2024', '2025', '2026', '2027'];

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

export default function TPOOverview() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [batch, setBatch] = useState('All');

  const [drives, setDrives]   = useState([]);
  const [stats, setStats]     = useState(DEFAULT_STATS);
  const [activity, setActivity] = useState([]);
  const [barData, setBarData] = useState(FALLBACK_BAR_DATA);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState('');

  useEffect(() => {
    const batchParam = batch === 'All' ? '' : batch;

    Promise.all([
      fetchDrives(),
      fetchTpoStats(batchParam),
      fetchTpoActivity(5),
      fetchTpoPlacementAnalytics(currentYear),
    ])
      .then(([dRes, statsRes, activityRes, analyticsRes]) => {
        setDrives(Array.isArray(dRes.data) ? dRes.data : []);
        setStats(statsRes.data?.data || DEFAULT_STATS);
        setActivity(Array.isArray(activityRes.data?.data) ? activityRes.data.data : []);

        const chartData = Array.isArray(analyticsRes.data?.data)
          ? analyticsRes.data.data.map((item) => ({ l: item.month, v: item.count }))
          : [];

        setBarData(chartData.length ? chartData : FALLBACK_BAR_DATA);
      })
      .catch(() => {
        setDrives([]);
        setStats(DEFAULT_STATS);
        setActivity([]);
        setBarData(FALLBACK_BAR_DATA);
      })
      .finally(() => setLoading(false));
  }, [batch, currentYear]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const placePct = stats.total
    ? Math.round((stats.placed / stats.total) * 100)
    : 0;

  return (
    <>
      {toast && (
        <div className="fixed bottom-8 right-8 px-5 py-3 rounded-xl text-sm text-white z-50" style={{ background: 'var(--matte)' }}>
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="font-serif text-3xl" style={{ color: 'var(--text-dark)' }}>TPO Dashboard</h2>
          <p className="mt-1 text-sm font-light" style={{ color: 'var(--text-mid)' }}>
            {batch === 'All' ? 'All Batches Placement Overview' : `Batch ${batch} Placement Overview`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="px-4 py-2 rounded-full text-sm"
            style={{
              background: 'var(--glass)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-dark)',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {BATCH_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt === 'All' ? 'All batches' : opt}</option>
            ))}
          </select>
          <button
            onClick={() => navigate('/tpo/drives')}
            className="px-5 py-2.5 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-85"
            style={{ background: 'var(--matte)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + Add Drive
          </button>
        </div>
      </div>

      <div className="grid gap-5 mb-10" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <StatCard icon="🎓" label="Total Students"  value={stats.total}   badge={`Eligible: ${stats.eligible}`}                badgeType="neutral" />
        <StatCard icon="🏢" label="Companies"        value={stats.companiesVisited || drives.length} badge={`↑ ${stats.newCompaniesThisMonth} new`} badgeType="up" />
        <StatCard icon="✅" label="Placed"           value={stats.placed}  badge={`${placePct}%`}                                 badgeType="up" />
        <StatCard icon="💰" label="Avg. Package"     value={`₹${stats.avgPackageLPA || 0}L`} badge={`↑ ₹${stats.yoyPackageGrowthLPA || 0}L YoY`} badgeType="up" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-serif text-xl">Active Placement Drives</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>Requiring your attention</p>
        </div>
        <button
          onClick={() => navigate('/tpo/drives')}
          className="px-4 py-2 rounded-full text-white text-xs font-semibold transition-opacity hover:opacity-85"
          style={{ background: 'var(--matte)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Manage All
        </button>
      </div>

      <DriveTable
        drives={drives}
        loading={loading}
        isTPO
        onEdit={(d) => showToast(`Editing ${d.company} drive...`)}
        onDelete={(id) => showToast('Drive archived.')}
      />

      <div className="grid gap-6 mt-8" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="glass-card p-6">
          <p className="font-serif text-xl mb-5">Recent Activity</p>
          {(activity.length ? activity : [{ _id: 'act_empty', colorCode: '#B0C4DE', content: 'No recent activity yet.', createdAt: null }]).map((a, i, arr) => (
            <div key={a._id || i} className="flex gap-3 py-3" style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.35)' : 'none' }}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: a.colorCode || '#B0C4DE' }} />
              <div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }} dangerouslySetInnerHTML={{ __html: a.content || '' }} />
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>{getRelativeTime(a.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card p-6">
          <p className="font-serif text-xl mb-1">Monthly Placements ({currentYear})</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-light)' }}>Students confirmed placed</p>
          <div className="flex items-end gap-2" style={{ height: '110px' }}>
            {barData.map(({ l, v }) => (
              <div key={l} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-mid)' }}>{v}</span>
                <div
                  className="w-full rounded-t-md"
                  style={{ height: `${v * 5}px`, background: 'linear-gradient(to top, var(--pastel-blue), var(--pastel-green))' }}
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
