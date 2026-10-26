import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStudents } from '../../api';

const FILTERS = ['All', 'Placed', 'Applied', 'Eligible'];
const STATUS_STYLE = {
  placed:      'pill-open',
  applied:     'pill-soon',
  eligible:    'bg-[rgba(176,196,222,0.2)] text-[#3a5f8a]',
  not_eligible: 'pill-closed',
};

export default function TPOStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const [search, setSearch]     = useState('');
  const [total, setTotal]       = useState(0);

  useEffect(() => {
    fetchStudents({ limit: 1000 })
      .then(({ data }) => {
        const list = Array.isArray(data)
          ? data
          : (data?.data || data?.students || []);
        setStudents(list);
        setTotal(Number(data?.total || list.length || 0));
      })
      .catch(() => {
        setStudents([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = (Array.isArray(students) ? students : []).filter((s) => {
    const matchFilter =
      filter === 'All' ||
      (filter === 'Placed'   && s.placementStatus === 'placed') ||
      (filter === 'Applied'  && s.placementStatus === 'applied') ||
      (filter === 'Eligible' && s.placementStatus === 'eligible');
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.rollNumber || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="font-serif text-3xl" style={{ color: 'var(--text-dark)' }}>Students</h2>
          <p className="mt-1 text-sm font-light" style={{ color: 'var(--text-mid)' }}>
            All batches overview — {total || students.length} registered
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
          style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-mid)', backdropFilter: 'blur(8px)' }}
        >
          🔍
          <input
            placeholder="Search by name or roll..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm"
            style={{ color: 'var(--text-dark)', width: '200px', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: filter === f ? 'var(--matte)' : 'rgba(176,196,222,0.15)',
              color: filter === f ? '#fff' : 'var(--text-mid)',
              border: filter === f ? 'none' : '1.5px solid rgba(176,196,222,0.3)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(10px)' }}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Name', 'Roll No.', 'Branch', 'CGPA', 'Status', 'Company', 'Profile'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-light)', borderBottom: '1px solid rgba(255,255,255,0.5)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-3 rounded-full animate-pulse" style={{ background: 'rgba(176,196,222,0.3)', width: '75%' }} /></td>
                  ))}</tr>
                ))
              : visible.map((s, i) => (
                  <tr
                    key={s._id || i}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-5 py-4 text-sm font-semibold">{s.name}</td>
                    <td className="px-5 py-4 text-sm font-mono" style={{ color: 'var(--text-mid)' }}>{s.rollNumber}</td>
                    <td className="px-5 py-4 text-sm">{s.branch}</td>
                    <td className="px-5 py-4 text-sm font-bold" style={{ color: (s.cgpa >= 9) ? '#1a6b4a' : (s.cgpa >= 8) ? '#3a5f8a' : 'var(--text-dark)' }}>
                      {s.cgpa}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[s.placementStatus] || ''}`}>
                        {s.placementStatus?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-mid)' }}>{s.placedAt || '—'}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => s._id && navigate(`/tpo/students/${s._id}`)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                        style={{ background: 'var(--matte)', color: '#fff' }}
                        disabled={!s._id}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && visible.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--text-light)' }}>No students found.</div>
        )}
      </div>
    </>
  );
}
