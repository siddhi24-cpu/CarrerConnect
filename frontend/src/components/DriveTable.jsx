/**
 * DriveTable
 * Renders a table of placement drives.
 *
 * Props:
 *   drives      - array of drive objects from the API
 *   isTPO       - boolean; shows management actions when true
 *   onApply     - (driveId) => void  — called when student clicks Apply
 *   onEdit      - (drive)   => void  — called when TPO clicks Edit
 *   onDelete    - (driveId) => void  — called when TPO clicks Delete
 *   loading     - boolean; shows skeleton rows
 */

const STATUS_STYLES = {
  open:   'pill-open',
  closed: 'pill-closed',
  soon:   'pill-soon',
};

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 rounded-full bg-[rgba(176,196,222,0.3)] animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export default function DriveTable({
  drives = [],
  isTPO = false,
  onApply,
  onEdit,
  onDelete,
  loading = false,
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(10px)' }}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {['Company', 'Role', 'Package', 'Deadline', 'Status', isTPO ? 'Applicants' : 'Eligible', ''].map(
              (h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{
                    color: 'var(--text-light)',
                    borderBottom: '1px solid rgba(255,255,255,0.5)',
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            : drives.map((drive) => (
                <tr
                  key={drive._id || drive.company}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-5 py-4 font-semibold text-sm" style={{ color: 'var(--text-dark)' }}>
                    {drive.company}
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-mid)' }}>
                    {drive.role}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold" style={{ color: '#3a5f8a' }}>
                    {drive.package}
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-mid)' }}>
                    {drive.deadline
                      ? new Date(drive.deadline).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short',
                        })
                      : drive.deadlineLabel || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[drive.status]}`}>
                      {drive.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
                    {isTPO
                      ? drive.applicants?.length ?? 0
                      : drive.eligible !== false
                      ? <span style={{ color: '#1a6b4a' }}>Yes</span>
                      : <span style={{ color: '#9a2a2a' }}>No</span>}
                  </td>
                  <td className="px-5 py-4">
                    {isTPO ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit?.(drive)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity"
                          style={{ background: 'var(--matte)', color: '#fff' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete?.(drive._id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity"
                          style={{ background: '#fce4e4', color: '#9a2a2a' }}
                        >
                          Delete
                        </button>
                      </div>
                    ) : drive.status !== 'closed' && drive.eligible !== false ? (
                      <button
                        onClick={() => onApply?.(drive._id || drive.company)}
                        className="text-xs font-semibold px-4 py-1.5 rounded-full transition-opacity hover:opacity-80"
                        style={{ background: 'var(--matte)', color: '#fff' }}
                      >
                        Apply
                      </button>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-light)' }}>
                        {drive.status === 'closed' ? 'Closed' : 'Ineligible'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>

      {!loading && drives.length === 0 && (
        <div className="py-12 text-center text-sm" style={{ color: 'var(--text-light)' }}>
          No drives found.
        </div>
      )}
    </div>
  );
}
