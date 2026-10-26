import { useState, useEffect } from 'react';
import { fetchDrives, applyToDrive } from '../../api';
import DriveTable from '../../components/DriveTable';

const FILTERS = ['All', 'Open', 'Upcoming', 'Closed'];

export default function StudentDrives() {
  const [drives, setDrives]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const [toast, setToast]       = useState('');

  useEffect(() => {
    fetchDrives()
      .then(({ data }) => setDrives(data))
      .catch(() => setDrives([]))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const handleApply = async (id) => {
    try {
      await applyToDrive(id);
      showToast('Applied successfully! ✓');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not apply.');
    }
  };

  const filtered = drives.filter((d) => {
    if (filter === 'All')      return true;
    if (filter === 'Open')     return d.status === 'open';
    if (filter === 'Upcoming') return d.status === 'soon';
    if (filter === 'Closed')   return d.status === 'closed';
    return true;
  });

  return (
    <>
      {toast && (
        <div className="fixed bottom-8 right-8 px-5 py-3 rounded-xl text-sm text-white z-50" style={{ background: 'var(--matte)' }}>
          {toast}
        </div>
      )}

      <div className="mb-10">
        <h2 className="font-serif text-3xl" style={{ color: 'var(--text-dark)' }}>Placement Drives</h2>
        <p className="mt-1 text-sm font-light" style={{ color: 'var(--text-mid)' }}>All active and upcoming drives</p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: filter === f ? 'var(--matte)' : 'rgba(176,196,222,0.15)',
              color: filter === f ? '#fff' : 'var(--text-mid)',
              border: filter === f ? 'none' : '1.5px solid rgba(176,196,222,0.3)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <DriveTable drives={filtered} loading={loading} onApply={handleApply} />
    </>
  );
}
