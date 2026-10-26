import { useState, useEffect } from 'react';
import { fetchDrives, createDrive, updateDrive, deleteDrive } from '../../api';
import DriveTable from '../../components/DriveTable';

const EMPTY_FORM = { company: '', role: '', package: '', deadline: '', status: 'open', description: '' };

export default function TPODrives() {
  const [drives, setDrives]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [editId, setEditId]     = useState(null);
  const [toast, setToast]       = useState('');

  const load = () =>
    fetchDrives()
      .then(({ data }) => setDrives(data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateDrive(editId, form);
        showToast('Drive updated ✓');
      } else {
        await createDrive(form);
        showToast('Drive created ✓');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving drive.');
    }
  };

  const handleEdit = (drive) => {
    setForm({
      company: drive.company, role: drive.role,
      package: drive.package, deadline: drive.deadline?.slice(0, 10) || '',
      status: drive.status,   description: drive.description || '',
    });
    setEditId(drive._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this drive?')) return;
    try {
      await deleteDrive(id);
      showToast('Drive deleted.');
      load();
    } catch {
      showToast('Could not delete.');
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.65rem 1rem',
    border: '1.5px solid rgba(176,196,222,0.4)', borderRadius: '10px',
    fontFamily: 'inherit', fontSize: '0.875rem',
    background: 'rgba(255,255,255,0.6)', color: 'var(--text-dark)', outline: 'none',
  };
  const labelStyle = { display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-mid)', marginBottom: '0.4rem' };

  return (
    <>
      {toast && (
        <div className="fixed bottom-8 right-8 px-5 py-3 rounded-xl text-sm text-white z-50" style={{ background: 'var(--matte)' }}>
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="font-serif text-3xl" style={{ color: 'var(--text-dark)' }}>Manage Drives</h2>
          <p className="mt-1 text-sm font-light" style={{ color: 'var(--text-mid)' }}>Create, edit, and track placement drives</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }}
          className="px-5 py-2.5 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-85"
          style={{ background: 'var(--matte)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + New Drive
        </button>
      </div>

      {/* Drive form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        >
          <div className="glass-card p-8 w-full" style={{ maxWidth: '500px' }}>
            <p className="font-serif text-2xl mb-6">{editId ? 'Edit Drive' : 'New Drive'}</p>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {[['Company', 'company', 'text', 'e.g. Google'], ['Role', 'role', 'text', 'e.g. SWE Intern'],
                  ['Package', 'package', 'text', 'e.g. ₹45 LPA'], ['Deadline', 'deadline', 'date', '']].map(([label, key, type, ph]) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      type={type} required placeholder={ph}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label style={labelStyle}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  style={inputStyle}
                >
                  <option value="open">Open</option>
                  <option value="soon">Upcoming</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="mt-4">
                <label style={labelStyle}>Rich Job Description</label>
                <div className="rich-editor" contentEditable suppressContentEditableWarning onInput={(e) => setForm({ ...form, description: e.currentTarget.innerHTML })} dangerouslySetInnerHTML={{ __html: form.description }} />
                <div className="flex gap-2 mt-2 text-xs" style={{color:'var(--text-mid)'}}><span>Use the browser editor for headings, bullets and emphasis.</span></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 py-3 rounded-full text-white text-sm font-medium" style={{ background: 'var(--matte)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {editId ? 'Save Changes' : 'Create Drive'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-full text-sm font-medium" style={{ background: 'rgba(176,196,222,0.2)', color: 'var(--text-mid)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DriveTable drives={drives} loading={loading} isTPO onEdit={handleEdit} onDelete={handleDelete} />
    </>
  );
}
