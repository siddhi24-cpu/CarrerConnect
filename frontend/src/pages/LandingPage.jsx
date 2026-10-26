import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--beige)', minHeight: '100vh' }}>
      {/* ── Sticky Nav ─────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10"
        style={{
          height: '60px',
          background: 'rgba(253,251,247,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(176,196,222,0.25)',
        }}
      >
        <div className="font-serif text-xl" style={{ color: 'var(--text-dark)' }}>
          Career<span style={{ color: '#6a8fbe' }}>Connect</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="#features" className="text-sm font-medium" style={{ color: 'var(--text-mid)', textDecoration: 'none' }}>
            About
          </a>
          <button
            onClick={() => navigate('/auth')}
            className="px-5 py-2 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-85"
            style={{ background: 'var(--matte)' }}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 relative overflow-hidden"
        style={{ minHeight: '100vh' }}
      >
        {/* Background glows */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '600px', height: '600px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(176,196,222,0.35) 0%, transparent 70%)',
            top: '-100px', right: '-100px',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(184,216,200,0.3) 0%, transparent 70%)',
            bottom: '-50px', left: '-80px',
          }}
        />

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-7"
          style={{ background: 'var(--pastel-blue-light)', color: '#3a5f8a' }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6a8fbe', display: 'inline-block' }} />
          Training & Placement Office Portal
        </div>

        {/* Headline */}
        <h1
          className="font-serif leading-tight mb-5"
          style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)', color: 'var(--text-dark)', maxWidth: '700px' }}
        >
          Your Future <em style={{ color: '#6a8fbe' }}>Starts</em>
          <br />Right Here
        </h1>

        <p
          className="mb-10 font-light leading-relaxed"
          style={{ fontSize: '1.1rem', color: 'var(--text-mid)', maxWidth: '480px' }}
        >
          The modern bridge between students and career opportunities. Build your profile,
          explore placement drives, and get placed.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-3.5 rounded-full text-white font-medium transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--matte)' }}
          >
            Get Started →
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="px-7 py-3.5 rounded-full font-medium transition-all hover:-translate-y-0.5"
            style={{
              background: 'transparent',
              color: 'var(--text-dark)',
              border: '1.5px solid rgba(26,26,46,0.2)',
            }}
          >
            Explore Drives
          </button>
        </div>

        {/* Orbital shape */}
        <div className="relative mt-16" style={{ width: '220px', height: '220px' }}>
          {[
            { size: 220, dur: '12s', dir: 'normal',  border: 'rgba(176,196,222,0.5)' },
            { size: 170, dur: '8s',  dir: 'reverse', border: 'rgba(184,216,200,0.6)' },
            { size: 110, dur: '6s',  dir: 'normal',  border: 'rgba(242,196,196,0.5)' },
          ].map(({ size, dur, dir, border }) => (
            <div
              key={size}
              className="absolute rounded-full"
              style={{
                width: size, height: size,
                border: `2px solid ${border}`,
                top: (220 - size) / 2, left: (220 - size) / 2,
                animation: `spinRing ${dur} linear infinite ${dir}`,
              }}
            />
          ))}
          <div
            className="absolute rounded-full"
            style={{
              width: 70, height: 70, top: 75, left: 75,
              background: 'linear-gradient(135deg, #B0C4DE, #B8D8C8)',
              boxShadow: '0 8px 32px rgba(176,196,222,0.6)',
            }}
          />
        </div>
      </section>

      {/* ── Feature Grid ───────────────────────────────────── */}
      <section id="features" className="py-24 px-6 mx-auto" style={{ maxWidth: '1100px' }}>
        <h2 className="font-serif text-4xl text-center mb-3" style={{ color: 'var(--text-dark)' }}>
          How It Works
        </h2>
        <p className="text-center mb-14 font-light" style={{ color: 'var(--text-mid)' }}>
          Three simple steps from sign-up to placement
        </p>

        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {[
            { step: '01', icon: '📋', title: 'Build Your Profile', color: 'var(--pastel-blue-light)',
              desc: 'Create a comprehensive academic profile with your CGPA, skills, and certifications. Let recruiters find you.' },
            { step: '02', icon: '🔍', title: 'Explore Drives', color: '#d4ede4',
              desc: 'Browse active placement drives from top companies. Filter by package, role, and eligibility criteria.' },
            { step: '03', icon: '🎉', title: 'Get Placed', color: '#fce4e4',
              desc: 'Apply, appear for interviews, and track your application status in real-time through the portal.' },
          ].map(({ step, icon, title, color, desc }) => (
            <div
              key={step}
              className="rounded-xl p-8 transition-transform hover:-translate-y-1 duration-200"
              style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(10px)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-light)' }}>
                Step {step}
              </p>
              <div
                className="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl mb-5"
                style={{ background: color, width: '52px', height: '52px' }}
              >
                {icon}
              </div>
              <h3 className="font-serif text-xl mb-3">{title}</h3>
              <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-mid)' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
