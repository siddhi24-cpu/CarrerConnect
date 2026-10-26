/**
 * StatCard
 * Reusable metric card for dashboard stat grids.
 *
 * Props:
 *   icon      - emoji or string icon
 *   label     - short uppercase label text
 *   value     - large display number / string
 *   badge     - optional small badge text
 *   badgeType - 'up' | 'neutral' | 'down'  (controls badge colour)
 */
export default function StatCard({ icon, label, value, badge, badgeType = 'neutral' }) {
  const badgeColors = {
    up:      'bg-[#d4ede4] text-[#1a6b4a]',
    neutral: 'bg-[#D6E4F0] text-[#3a5f8a]',
    down:    'bg-[#fce4e4] text-[#9a2a2a]',
  };

  return (
    <div
      className="glass-card p-6 transition-transform duration-200 hover:-translate-y-1"
      style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}
    >
      {icon && <div className="text-2xl mb-3">{icon}</div>}

      <p
        className="text-xs font-semibold uppercase tracking-wide mb-3"
        style={{ color: 'var(--text-light)' }}
      >
        {label}
      </p>

      <p
        className="font-serif text-4xl leading-none"
        style={{ color: 'var(--text-dark)' }}
      >
        {value}
      </p>

      {badge && (
        <span
          className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-semibold ${badgeColors[badgeType]}`}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
