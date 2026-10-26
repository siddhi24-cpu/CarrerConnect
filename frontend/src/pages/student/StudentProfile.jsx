import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchMyProfile, fetchStudentProfile, updateMyProfile, uploadResume, changePassword } from '../../api';

// ── Colour options for avatar ──────────────────────────────
const AVATAR_COLORS = [
  'linear-gradient(135deg,#B0C4DE,#9DC4B0)',
  'linear-gradient(135deg,#D4A5B0,#B0C4DE)',
  'linear-gradient(135deg,#D4BA8A,#9DC4B0)',
  'linear-gradient(135deg,#9DC4B0,#B0C4DE)',
  'linear-gradient(135deg,#B0C4DE,#D4A5B0)',
];

const SKILL_SUGGESTIONS = [
  'React','Node.js','Python','Java','MongoDB','SQL','TypeScript',
  'Express','Docker','Git','DSA','Machine Learning','Figma','C++',
];

const BRANCHES = ['Computer Science','Information Technology','Electronics','Mechanical','Civil','Chemical','Electrical'];
const DEGREES  = ['B.Tech','M.Tech','B.E','MCA','MBA','B.Sc'];
const BATCHES  = ['2023','2024','2025','2026','2027'];

// ── Helper: profile completion ─────────────────────────────
function computeStrength(data) {
  const checks = [
    !!data.rollNumber, !!data.degree, !!data.branch, !!data.batch,
    data.cgpa != null, data.tenthScore != null, data.twelfthScore != null,
    Array.isArray(data.skills) && data.skills.length > 0,
    !!data.phone, !!data.about, !!data.resumeUrl,
  ];
  const done  = checks.filter(Boolean).length;
  const base  = (done / checks.length) * 70;
  const cgpa  = ((Math.min(10, Math.max(0, +data.cgpa || 0))) / 10) * 20;
  const pen   = Math.max(0, +data.backlogs || 0) * 2;
  return Math.min(100, Math.round(base + cgpa + 10 - pen));
}

// ── Toast component ────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [msg, onDone]);

  const bg = type === 'success' ? '#5a8a6a' : type === 'error' ? '#b05060' : '#4a6a9a';
  return (
    <div
      className="toast"
      style={{ background: bg, color: '#fff' }}
      role="alert"
    >
      {type === 'success' ? '✓ ' : type === 'error' ? '✕ ' : 'ℹ '}{msg}
    </div>
  );
}

// ── Skeleton for loading state ─────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 2fr' }}>
      <div className="glass-card p-8 flex flex-col items-center gap-4">
        <div className="skeleton w-20 h-20 rounded-full" />
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-8 w-28 rounded-full mt-2" />
        <div className="skeleton h-2 w-full mt-4" />
      </div>
      <div className="flex flex-col gap-5">
        <div className="glass-card p-6">
          <div className="skeleton h-5 w-36 mb-5" />
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="skeleton h-3 w-20 mb-2" />
                <div className="skeleton h-4 w-28" />
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="skeleton h-5 w-24 mb-4" />
          <div className="flex gap-2 flex-wrap">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-7 w-20 rounded-full" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Field row for the edit form ────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
      {error && <p style={{ color: 'var(--error)', fontSize: '11px', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

// ── Validate form values ───────────────────────────────────
function validate(v) {
  const e = {};
  if (!v.name?.trim())           e.name       = 'Name is required';
  if (!v.rollNumber?.trim())     e.rollNumber = 'Roll number is required';
  if (!v.degree)                 e.degree     = 'Degree is required';
  if (!v.branch)                 e.branch     = 'Branch is required';
  if (!v.batch)                  e.batch      = 'Batch is required';

  const cgpa = parseFloat(v.cgpa);
  if (isNaN(cgpa) || cgpa < 0 || cgpa > 10)
    e.cgpa = 'CGPA must be 0–10';

  if (v.tenthScore !== '' && v.tenthScore != null) {
    const t = parseFloat(v.tenthScore);
    if (isNaN(t) || t < 0 || t > 100) e.tenthScore = '0–100 required';
  }
  if (v.twelfthScore !== '' && v.twelfthScore != null) {
    const t = parseFloat(v.twelfthScore);
    if (isNaN(t) || t < 0 || t > 100) e.twelfthScore = '0–100 required';
  }
  if (v.backlogs !== '' && v.backlogs != null) {
    const b = parseInt(v.backlogs);
    if (isNaN(b) || b < 0) e.backlogs = 'Must be ≥ 0';
  }
  if (v.phone && !/^\+?[\d\s\-()]{7,15}$/.test(v.phone))
    e.phone = 'Enter a valid phone number';
  if (v.linkedIn && !/^https?:\/\/.+/.test(v.linkedIn))
    e.linkedIn = 'Must start with http:// or https://';
  if (v.github && !/^https?:\/\/.+/.test(v.github))
    e.github = 'Must start with http:// or https://';
  if (v.about && v.about.length > 500)
    e.about = 'Max 500 characters';

  return e;
}

// ── Main component ─────────────────────────────────────────
export default function StudentProfile({ studentId, readOnly = false }) {
  const { updateUser } = useAuth();
  const resumeInputRef = useRef(null);
  const params = useParams();
  const effectiveStudentId = studentId || params.id;
  const isReadOnly = readOnly || Boolean(effectiveStudentId);

  const [profile,     setProfile    ] = useState(null);
  const [loading,     setLoading    ] = useState(true);
  const [editOpen,    setEditOpen   ] = useState(false);
  const [pwOpen,      setPwOpen     ] = useState(false);
  const [saving,      setSaving     ] = useState(false);
  const [uploading,   setUploading  ] = useState(false);
  const [toast,       setToast      ] = useState(null);   // { msg, type }
  const [loadError,   setLoadError  ] = useState('');
  const [form,        setForm       ] = useState({});
  const [formErrors,  setFormErrors ] = useState({});
  const [skillInput,  setSkillInput ] = useState('');
  const [pw,          setPw         ] = useState({ current: '', next: '', confirm: '' });
  const [pwError,     setPwError    ] = useState('');
  const [avatarIdx,   setAvatarIdx  ] = useState(0);

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = isReadOnly && effectiveStudentId
          ? await fetchStudentProfile(effectiveStudentId)
          : await fetchMyProfile();
        const d = response?.data?.data || response?.data?.student || response?.data || {};
        setProfile(d);
        const colorIdx = AVATAR_COLORS.findIndex((c) => c === d.avatarColor);
        setAvatarIdx(colorIdx >= 0 ? colorIdx : 0);
      } catch (err) {
        const message = err?.response?.data?.message || 'Unable to load profile data.';
        setLoadError(message);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isReadOnly, effectiveStudentId]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
  }, []);

  // Open edit modal — pre-fill form
  const openEdit = () => {
    const d = profile || {};
    setForm({
      name:         d.name         || '',
      rollNumber:   d.rollNumber   || '',
      degree:       d.degree       || '',
      branch:       d.branch       || '',
      batch:        d.batch        || '',
      cgpa:         d.cgpa         ?? '',
      backlogs:     d.backlogs     ?? 0,
      tenthScore:   d.tenthScore   ?? '',
      twelfthScore: d.twelfthScore ?? '',
      skills:       Array.isArray(d.skills) ? [...d.skills] : [],
      phone:        d.phone        || '',
      linkedIn:     d.linkedIn     || '',
      github:       d.github       || '',
      about:        d.about        || '',
    });
    setFormErrors({});
    setSkillInput('');
    setEditOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    // Clear error for this field
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: '' }));
  };

  const addSkill = (skill) => {
    const s = skill.trim();
    if (!s || form.skills.includes(s)) return;
    setForm((p) => ({ ...p, skills: [...p.skills, s] }));
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setForm((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  // Save profile
  const handleSave = async () => {
    const errors = validate(form);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        cgpa:         form.cgpa         !== '' ? parseFloat(form.cgpa)         : undefined,
        tenthScore:   form.tenthScore   !== '' ? parseFloat(form.tenthScore)   : undefined,
        twelfthScore: form.twelfthScore !== '' ? parseFloat(form.twelfthScore) : undefined,
        backlogs:     form.backlogs     !== '' ? parseInt(form.backlogs)       : 0,
        avatarColor:  AVATAR_COLORS[avatarIdx],
      };

      const { data } = await updateMyProfile(payload);
      const updated = data?.data || {};
      setProfile(updated);
      updateUser({ name: updated.name });
      setEditOpen(false);
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Resume upload
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadResume(file);
      setProfile((p) => ({ ...p, resumeUrl: data.resumeUrl }));
      showToast('Resume uploaded!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };



  // Change password
  const handlePasswordChange = async () => {
    if (!pw.current || !pw.next) { setPwError('All fields required'); return; }
    if (pw.next.length < 6)      { setPwError('Min 6 characters'); return; }
    if (pw.next !== pw.confirm)  { setPwError('Passwords do not match'); return; }

    setSaving(true);
    try {
      await changePassword({ currentPassword: pw.current, newPassword: pw.next });
      setPwOpen(false);
      setPw({ current: '', next: '', confirm: '' });
      setPwError('');
      showToast('Password changed!');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // ── Derived data ───────────────────────────────────────
  const d               = profile || {};
  const profileStrength = computeStrength(d);
  const initials        = d.name
    ? d.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const academicRows = [
    ['Degree',      d.degree        || '—'],
    ['Department',  d.branch        || '—'],
    ['Batch',       d.batch         || '—'],
    ['CGPA',        d.cgpa != null  ? `${d.cgpa} / 10` : '—'],
    ['Backlogs',    d.backlogs ?? 0],
    ['10th Score',  d.tenthScore   != null ? `${d.tenthScore}%`   : '—'],
    ['12th Score',  d.twelfthScore != null ? `${d.twelfthScore}%` : '—'],
  ];

  const strengthColor =
    profileStrength >= 80 ? '#5a8a6a'
    : profileStrength >= 60 ? '#c4924a'
    : '#b05060';

  const strengthLabel =
    profileStrength >= 80 ? 'Strong'
    : profileStrength >= 60 ? 'Average'
    : 'Needs Work';

  // ── Render ─────────────────────────────────────────────
  return (
    <>
      {/* Toast */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}

      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-serif" style={{ fontSize: '30px', color: 'var(--text-dark)', margin: 0 }}>
            {isReadOnly ? 'Student Profile' : 'My Profile'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-mid)', fontWeight: 300 }}>
            {isReadOnly ? 'View student academic and placement details' : 'Keep your profile updated for better placement visibility'}
          </p>
        </div>
        {!isReadOnly && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-ghost"
              onClick={() => setPwOpen(true)}
            >
              🔒 Change Password
            </button>
            <button
              className="btn-primary"
              onClick={openEdit}
              disabled={loading}
            >
              ✏️ Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && <ProfileSkeleton />}

      {!loading && loadError && (
        <div className="glass-card p-6" style={{ borderLeft: '4px solid var(--error)' }}>
          <p className="text-sm" style={{ color: 'var(--text-mid)', margin: 0 }}>{loadError}</p>
        </div>
      )}

      {/* Profile content */}
      {!loading && !loadError && (
        <div className="fade-in grid gap-6" style={{ gridTemplateColumns: '1fr 2fr' }}>
          {/* ── Left: Avatar card ── */}
          <div className="glass-card p-8 flex flex-col items-center text-center">
            {/* Avatar + colour picker */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '28px',
                  color: '#fff',
                  background: AVATAR_COLORS[avatarIdx],
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              >
                {initials}
              </div>
            </div>

            <p style={{ fontWeight: 600, fontSize: '17px', margin: 0 }}>
              {d.name || 'Your Name'}
            </p>
            <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-mid)', fontWeight: 300 }}>
              {d.degree || 'B.Tech'} {d.branch || 'CS'} · {d.batch || '—'} Batch
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
              Roll: {d.rollNumber || '—'}
            </p>

            {d.email && (
              <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                {d.email}
              </p>
            )}

            {/* CGPA badge */}
            <div
              className="badge badge-blue"
              style={{ marginTop: '14px', fontSize: '13px', padding: '6px 16px' }}
            >
              CGPA: {d.cgpa ?? '—'}
            </div>

            {/* Profile strength */}
            <div style={{ width: '100%', marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-light)', margin: 0 }}>
                  Profile Strength
                </p>
                <span style={{ fontSize: '11px', fontWeight: 600, color: strengthColor }}>
                  {strengthLabel}
                </span>
              </div>
              <div className="strength-bar">
                <div
                  className="strength-fill"
                  style={{ width: `${profileStrength}%`, background: `linear-gradient(90deg, ${strengthColor}, var(--pastel-blue))` }}
                />
              </div>
              <p style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-mid)' }}>
                {profileStrength}% Complete
              </p>
            </div>

            {/* Contact info */}
            {(d.phone || d.linkedIn || d.github) && (
              <div style={{ width: '100%', marginTop: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                {d.phone && (
                  <p style={{ fontSize: '12px', color: 'var(--text-mid)', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    📱 {d.phone}
                  </p>
                )}
                {d.linkedIn && (
                  <a href={d.linkedIn} target="_blank" rel="noreferrer"
                    style={{ fontSize: '12px', color: 'var(--pastel-blue)', margin: '4px 0', display: 'block', textDecoration: 'none' }}>
                    🔗 LinkedIn ↗
                  </a>
                )}
                {d.github && (
                  <a href={d.github} target="_blank" rel="noreferrer"
                    style={{ fontSize: '12px', color: 'var(--text-mid)', margin: '4px 0', display: 'block', textDecoration: 'none' }}>
                    🐙 GitHub ↗
                  </a>
                )}
              </div>
            )}

            {/* Resume */}
            <div style={{ width: '100%', marginTop: '16px' }}>
              {d.resumeUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <a
                    href={`http://localhost:5000${d.resumeUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost"
                    style={{ justifyContent: 'center' }}
                  >
                    📄 View Resume
                  </a>
                  {!isReadOnly && <button className="btn-primary" style={{justifyContent:'center'}} onClick={() => navigate('/dashboard/resume')}>✨ Open Resume Studio</button>}
                  {!isReadOnly && (
                    <button
                      className="btn-ghost"
                      style={{ justifyContent: 'center', fontSize: '11px' }}
                      onClick={() => resumeInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading…' : '↻ Replace Resume'}
                    </button>
                  )}
                </div>
              ) : (
                isReadOnly ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: 0 }}>
                    No resume uploaded.
                  </p>
                ) : (
                  <button
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading…' : '📤 Upload Resume'}
                  </button>
                )
              )}
              {!isReadOnly && (
                <>
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={handleResumeUpload}
                  />
                  <p style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '4px' }}>
                    PDF or Word · Max 5 MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* ── Right: Details ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* About */}
            {d.about && (
              <div className="glass-card p-6 fade-in">
                <p className="font-serif" style={{ fontSize: '20px', marginBottom: '10px' }}>About</p>
                <p style={{ fontSize: '13px', color: 'var(--text-mid)', lineHeight: '1.8', margin: 0 }}>
                  {d.about}
                </p>
              </div>
            )}

            {/* Academic details */}
            <div className="glass-card p-6">
              <p className="font-serif" style={{ fontSize: '20px', marginBottom: '20px' }}>
                Academic Details
              </p>
              <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {academicRows.map(([k, v]) => (
                  <div key={k}>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-light)', margin: '0 0 4px' }}>
                      {k}
                    </p>
                    <p style={{ fontSize: '14px', margin: 0, color: 'var(--text-dark)' }}>
                      {String(v)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="glass-card p-6">
              <p className="font-serif" style={{ fontSize: '20px', marginBottom: '16px' }}>Skills</p>
              {d.skills?.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {d.skills.map((s) => (
                    <span key={s} className="badge badge-blue">{s}</span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                  No skills added yet.
                  {!isReadOnly && (
                    <button onClick={openEdit} style={{ background: 'none', border: 'none', color: 'var(--pastel-blue)', cursor: 'pointer', fontSize: '13px' }}>
                      Add skills →
                    </button>
                  )}
                </p>
              )}
            </div>

            {/* Completion checklist */}
            <div className="glass-card p-6">
              <p className="font-serif" style={{ fontSize: '20px', marginBottom: '16px' }}>
                Profile Checklist
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  ['Roll Number',    !!d.rollNumber ],
                  ['Academic Info',  !!d.degree && !!d.branch && !!d.batch ],
                  ['CGPA',           d.cgpa != null ],
                  ['10th & 12th',    d.tenthScore != null && d.twelfthScore != null ],
                  ['Skills',         d.skills?.length > 0 ],
                  ['Phone',          !!d.phone ],
                  ['About Me',       !!d.about ],
                  ['Resume',         !!d.resumeUrl ],
                ].map(([label, done]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: done ? '#5a8a6a' : 'var(--glass)',
                      border: `1px solid ${done ? '#5a8a6a' : 'var(--glass-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', color: '#fff', flexShrink: 0,
                    }}>
                      {done ? '✓' : ''}
                    </div>
                    <span style={{ fontSize: '13px', color: done ? 'var(--text-dark)' : 'var(--text-light)', textDecoration: done ? 'none' : 'none' }}>
                      {label}
                    </span>
                    {!done && !isReadOnly && (
                      <button
                        onClick={openEdit}
                        style={{ fontSize: '11px', color: 'var(--pastel-blue)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                      >
                        Add →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {!isReadOnly && editOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setEditOpen(false); }}>
          <div className="modal-box">
            {/* Modal header */}
            <div style={{ padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="font-serif" style={{ margin: 0, fontSize: '24px' }}>Edit Profile</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-light)' }}>
                  All fields with * are required
                </p>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text-light)', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px 28px 28px' }}>
              {/* Avatar colour */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Avatar Colour</label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  {AVATAR_COLORS.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setAvatarIdx(i)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: c, border: avatarIdx === i ? '3px solid var(--text-dark)' : '3px solid transparent',
                        cursor: 'pointer', transition: 'border 0.15s',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Section: Personal */}
              <p style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-light)', margin: '0 0 12px' }}>
                Personal Info
              </p>
              <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <Field label="Full Name *" error={formErrors.name}>
                  <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Ashwin Mali" />
                </Field>
                <Field label="Roll Number *" error={formErrors.rollNumber}>
                  <input className="form-input" name="rollNumber" value={form.rollNumber} onChange={handleChange} placeholder="IMCC202401" />
                </Field>
                <Field label="Phone" error={formErrors.phone}>
                  <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9000000000" />
                </Field>
                <div style={{ gridColumn: '1/-1' }}>
                  <Field label="About Me (max 500 chars)" error={formErrors.about}>
                    <textarea
                      className="form-input"
                      name="about"
                      value={form.about}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Brief intro about yourself, interests, goals..."
                      style={{ resize: 'vertical' }}
                    />
                    <p style={{ fontSize: '10px', color: 'var(--text-light)', textAlign: 'right', margin: '2px 0 0' }}>
                      {(form.about || '').length}/500
                    </p>
                  </Field>
                </div>
              </div>

              {/* Section: Academic */}
              <p style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-light)', margin: '0 0 12px' }}>
                Academic Info
              </p>
              <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <Field label="Degree *" error={formErrors.degree}>
                  <select className="form-input" name="degree" value={form.degree} onChange={handleChange}>
                    <option value="">Select degree</option>
                    {DEGREES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Branch *" error={formErrors.branch}>
                  <select className="form-input" name="branch" value={form.branch} onChange={handleChange}>
                    <option value="">Select branch</option>
                    {BRANCHES.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Batch *" error={formErrors.batch}>
                  <select className="form-input" name="batch" value={form.batch} onChange={handleChange}>
                    <option value="">Select batch</option>
                    {BATCHES.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="CGPA (0–10) *" error={formErrors.cgpa}>
                  <input className="form-input" name="cgpa" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={handleChange} placeholder="8.5" />
                </Field>
                <Field label="10th Score (%)" error={formErrors.tenthScore}>
                  <input className="form-input" name="tenthScore" type="number" min="0" max="100" value={form.tenthScore} onChange={handleChange} placeholder="88" />
                </Field>
                <Field label="12th Score (%)" error={formErrors.twelfthScore}>
                  <input className="form-input" name="twelfthScore" type="number" min="0" max="100" value={form.twelfthScore} onChange={handleChange} placeholder="82" />
                </Field>
                <Field label="Active Backlogs" error={formErrors.backlogs}>
                  <input className="form-input" name="backlogs" type="number" min="0" value={form.backlogs} onChange={handleChange} placeholder="0" />
                </Field>
              </div>

              {/* Section: Skills */}
              <p style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-light)', margin: '0 0 12px' }}>
                Skills
              </p>
              <div style={{ marginBottom: '20px' }}>
                {/* Current skills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', minHeight: '30px' }}>
                  {form.skills.map((s) => (
                    <span key={s} className="badge badge-blue" style={{ gap: '6px' }}>
                      {s}
                      <button
                        onClick={() => removeSkill(s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'inherit', padding: 0, lineHeight: 1 }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {form.skills.length === 0 && (
                    <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>No skills added</span>
                  )}
                </div>

                {/* Skill input */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className="form-input"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    placeholder="Type skill and press Enter"
                    style={{ flex: 1 }}
                    list="skill-suggestions"
                  />
                  <datalist id="skill-suggestions">
                    {SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s)).map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <button
                    className="btn-ghost"
                    type="button"
                    onClick={() => addSkill(skillInput)}
                  >
                    Add
                  </button>
                </div>

                {/* Quick-add suggestions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s)).slice(0, 7).map((s) => (
                    <button
                      key={s}
                      onClick={() => addSkill(s)}
                      style={{
                        padding: '3px 10px', borderRadius: '999px', fontSize: '11px',
                        background: 'var(--surface)', border: '1px solid var(--glass-border)',
                        cursor: 'pointer', color: 'var(--text-mid)',
                      }}
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Links */}
              <p style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-light)', margin: '0 0 12px' }}>
                Social Links
              </p>
              <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <Field label="LinkedIn URL" error={formErrors.linkedIn}>
                  <input className="form-input" name="linkedIn" value={form.linkedIn} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
                </Field>
                <Field label="GitHub URL" error={formErrors.github}>
                  <input className="form-input" name="github" value={form.github} onChange={handleChange} placeholder="https://github.com/..." />
                </Field>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn-ghost" onClick={() => setEditOpen(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : '✓ Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {!isReadOnly && pwOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setPwOpen(false); }}>
          <div className="modal-box" style={{ maxWidth: '420px' }}>
            <div style={{ padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="font-serif" style={{ margin: 0, fontSize: '22px' }}>Change Password</h3>
              <button onClick={() => setPwOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text-light)' }}>✕</button>
            </div>
            <div style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="Current Password">
                <input className="form-input" type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} placeholder="••••••" />
              </Field>
              <Field label="New Password (min 6 chars)">
                <input className="form-input" type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="••••••" />
              </Field>
              <Field label="Confirm New Password">
                <input className="form-input" type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} placeholder="••••••" />
              </Field>
              {pwError && <p style={{ color: 'var(--error)', fontSize: '12px', margin: 0 }}>✕ {pwError}</p>}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button className="btn-ghost" onClick={() => { setPwOpen(false); setPwError(''); }}>Cancel</button>
                <button className="btn-primary" onClick={handlePasswordChange} disabled={saving}>
                  {saving ? 'Saving…' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
