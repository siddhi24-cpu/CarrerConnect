import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STUDENT_LINKS = [
  { to: '/dashboard/overview',      icon: '◈', label: 'Overview'          },
  { to: '/dashboard/drives',        icon: '◉', label: 'Placement Drives'  },
  { to: '/dashboard/applications',  icon: '◎', label: 'My Applications'   },
  { to: '/dashboard/profile',       icon: '◌', label: 'My Profile'        },
  { to: '/dashboard/career',        icon: '✦', label: 'Career Center'      },
  { to: '/dashboard/resume',        icon: '▣', label: 'Resume Studio'      },
  { to: '/dashboard/calendar',      icon: '◫', label: 'Placement Calendar' },
  { to: '/dashboard/notifications', icon: '◍', label: 'Notifications'     },
  { to: '/dashboard/offers',        icon: '★', label: 'Offer Vault'        },
];

const COMPANY_LINKS = [
  { to: '/company/overview', icon: '◈', label: 'Overview' },
  { to: '/company/drives', icon: '◉', label: 'Placement Drives' },
];

const TPO_LINKS = [
  { to: '/tpo/overview',   icon: '◈', label: 'Overview'  },
  { to: '/tpo/drives',     icon: '◉', label: 'Drives'    },
  { to: '/tpo/students',   icon: '◎', label: 'Students'  },
  { to: '/tpo/reports',    icon: '◌', label: 'Reports'   },
  { to: '/tpo/recruiters', icon: '◍', label: 'Recruiters' },
];

export default function Sidebar() {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const navigate  = useNavigate();
  const links     = user?.role === 'tpo' ? TPO_LINKS : user?.role === 'company' ? COMPANY_LINKS : STUDENT_LINKS;
  const initials  = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <aside
      style={{
        width: '220px',
        minHeight: '100vh',
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 0',
        flexShrink: 0,
        transition: 'background 0.3s ease',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '0 24px 32px' }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 600, color: '#fff', margin: 0 }}>
          Career<span style={{ color: 'var(--pastel-blue)' }}>Connect</span>
        </p>
        <p style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--sidebar-text)', margin: '2px 0 0', textTransform: 'uppercase' }}>
          {user?.role === 'tpo' ? 'TPO Portal' : user?.role === 'company' ? 'Recruiter Portal' : 'Student Portal'}
        </p>
      </div>

      {/* Nav section */}
      <p style={{ padding: '0 24px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '8px' }}>
        Main Menu
      </p>

      <nav style={{ flex: 1 }}>
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 24px',
              fontSize: '13px',
              fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--sidebar-active)' : 'var(--sidebar-text)',
              background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--pastel-blue)' : '2px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.18s ease',
            })}
          >
            <span style={{ fontSize: '16px', opacity: 0.7 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Account section */}
      <div style={{ padding: '0 24px', marginTop: '24px' }}>
        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Account
        </p>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '10px 0',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            color: 'var(--sidebar-text)',
            borderLeft: '2px solid transparent',
            textAlign: 'left',
            transition: 'color 0.18s',
          }}
        >
          <span style={{ fontSize: '16px', opacity: 0.7 }}>{darkMode ? '☀' : '☾'}</span>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '10px 0',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            color: 'var(--sidebar-text)',
            borderLeft: '2px solid transparent',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: '16px', opacity: 0.7 }}>↩</span>
          Sign Out
        </button>
      </div>

      {/* User info at bottom */}
      <div
        style={{
          margin: '20px 16px 0',
          padding: '12px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--pastel-blue), var(--pastel-green))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 600,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name || 'User'}
          </p>
          <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.email?.split('@')[0] || ''} · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </aside>
  );
}
