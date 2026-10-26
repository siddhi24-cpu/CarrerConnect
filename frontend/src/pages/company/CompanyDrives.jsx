import { useEffect, useMemo, useState } from 'react';
import {
  fetchCompanyDrives,
  createCompanyDrive,
  fetchCompanyApplicants,
  updateCompanyApplicant,
  scheduleCompanyInterview,
} from '../../api';

const EMPTY = {
  role: '', package: '', packageValue: '', deadline: '', status: 'open', description: '',
  minCGPA: 6, maxBacklogs: 0, batch: '', allowedBranches: ''
};
const stages = ['applied', 'shortlisted', 'technical', 'hr', 'selected', 'rejected'];
const stageLabels = {
  applied: 'Applied', shortlisted: 'Shortlisted', technical: 'Technical',
  hr: 'HR Round', selected: 'Selected', rejected: 'Rejected'
};

export default function CompanyDrives() {
  const [drives, setDrives] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [interviewStudent, setInterviewStudent] = useState(null);
  const [interviewForm, setInterviewForm] = useState({ round: 'Technical Interview', scheduledAt: '', mode: 'Online', meetingLink: '', venue: '', interviewer: '', notes: '' });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await fetchCompanyDrives();
      setDrives(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load placement drives. Make sure the backend is running.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault(); setError(''); setMsg('');
    try {
      await createCompanyDrive({
        role: form.role, package: form.package, packageValue: Number(form.packageValue) || undefined,
        deadline: form.deadline, status: form.status, description: form.description,
        eligibilityCriteria: {
          minCGPA: Number(form.minCGPA) || 0,
          maxBacklogs: Number(form.maxBacklogs) || 0,
          batch: form.batch ? Number(form.batch) : undefined,
          allowedBranches: form.allowedBranches.split(',').map(x => x.trim()).filter(Boolean),
        },
      });
      setMsg('Drive created successfully. Students can now see and apply if eligible.');
      setOpen(false); setForm(EMPTY); load();
    } catch (err) { setError(err.response?.data?.message || 'Could not create drive'); }
  };

  const showApplicants = async (drive) => {
    setSelected(drive); setPipelineLoading(true); setError('');
    try {
      const r = await fetchCompanyApplicants(drive._id);
      setApplicants(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      setApplicants([]); setError(err.response?.data?.message || 'Could not load applicants.');
    } finally { setPipelineLoading(false); }
  };

  const move = async (a, stage) => {
    try {
      await updateCompanyApplicant(selected._id, a.student?._id || a.student, stage);
      setMsg(`${a.student?.name || 'Candidate'} moved to ${stageLabels[stage]}.`);
      await showApplicants(selected);
    } catch (err) { setError(err.response?.data?.message || 'Could not update candidate status'); }
  };

  const openInterview = (a) => {
    setInterviewStudent(a);
    setInterviewForm({ round: a.stage === 'hr' ? 'HR Round' : 'Technical Interview', scheduledAt: '', mode: 'Online', meetingLink: '', venue: '', interviewer: '', notes: '' });
  };

  const scheduleInterview = async (e) => {
    e.preventDefault();
    try {
      await scheduleCompanyInterview({
        driveId: selected._id, studentId: interviewStudent.student?._id || interviewStudent.student,
        ...interviewForm,
      });
      setMsg(`Interview scheduled for ${interviewStudent.student?.name || 'candidate'}.`);
      setInterviewStudent(null);
    } catch (err) { setError(err.response?.data?.message || 'Could not schedule interview'); }
  };

  const grouped = useMemo(() => stages.reduce((acc, stage) => {
    acc[stage] = applicants.filter(a => a.stage === stage); return acc;
  }, {}), [applicants]);

  const input = { width: '100%', padding: '.65rem .8rem', border: '1px solid rgba(176,196,222,.5)', borderRadius: 10, background: 'rgba(255,255,255,.7)', fontFamily: 'inherit' };

  return <>
    {(error || msg) && <div className={`toast ${error ? 'toast-error' : 'toast-info'}`} onClick={() => { setError(''); setMsg(''); }}>{error || msg}</div>}

    <div className="flex justify-between items-center mb-8 gap-4">
      <div><span className="eyebrow">RECRUITMENT</span><h2 className="font-serif text-4xl">Placement Drives</h2><p className="text-sm mt-1" style={{ color: 'var(--text-mid)' }}>Create a role, then move candidates through a clear hiring pipeline.</p></div>
      <button className="btn-primary" onClick={() => setOpen(true)}>+ New Drive</button>
    </div>

    {loading ? <div className="glass-card p-8"><div className="skeleton" style={{ height: 120 }} /></div> : (
      <div className="space-y-4">
        {drives.map(d => <div className="glass-card p-6" key={d._id}>
          <div className="flex justify-between gap-4">
            <div><span className="eyebrow">{d.status}</span><h3 className="font-serif text-2xl">{d.role}</h3><p className="text-sm" style={{ color: 'var(--text-mid)' }}>{d.package} · Deadline {new Date(d.deadline).toLocaleDateString('en-IN')}</p></div>
            <div className="text-right"><div className="font-serif text-2xl">{d.applicants?.length || 0}</div><div className="text-xs" style={{ color: 'var(--text-light)' }}>applicants</div></div>
          </div>
          <div className="mt-5 flex gap-3 items-center"><button className="btn-primary" onClick={() => showApplicants(d)}>Open Candidate Pipeline →</button><span className="badge badge-blue">CGPA {d.eligibilityCriteria?.minCGPA || 0}+</span><span className="badge badge-green">{d.applicants?.filter(a => a.stage === 'shortlisted').length || 0} shortlisted</span></div>
        </div>)}
        {!drives.length && <div className="glass-card p-8 text-sm" style={{ color: 'var(--text-mid)' }}>No drives created yet. Create your first placement drive.</div>}
      </div>
    )}

    {open && <div className="modal-backdrop"><div className="modal-box p-7" style={{ maxWidth: 850 }}>
      <h3 className="font-serif text-2xl mb-5">Create Placement Drive</h3>
      <form onSubmit={submit}>
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {[['Job Role','role'],['Package','package'],['Package (LPA)','packageValue'],['Deadline','deadline'],['Minimum CGPA','minCGPA'],['Maximum Backlogs','maxBacklogs'],['Batch','batch']].map(([l,k]) => <div key={k}><label className="form-label">{l}</label><input required={['role','package','deadline'].includes(k)} type={k === 'deadline' ? 'date' : 'text'} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} style={input} /></div>)}
        </div>
        <div className="mt-4"><label className="form-label">Allowed Branches</label><input placeholder="Computer Science, Information Technology" value={form.allowedBranches} onChange={e => setForm({ ...form, allowedBranches: e.target.value })} style={input} /></div>
        <div className="mt-4"><label className="form-label">Rich Job Description</label><div contentEditable suppressContentEditableWarning onInput={e => setForm({ ...form, description: e.currentTarget.innerHTML })} dangerouslySetInnerHTML={{ __html: form.description }} className="rich-editor"/><div className="text-xs mt-2" style={{ color: 'var(--text-light)' }}>Use headings, bold text, lists and links. HTML is sanitized by the server.</div></div>
        <div className="flex gap-3 mt-6"><button className="flex-1 py-3 rounded-full text-white" style={{ background: 'var(--matte)', border: 0 }}>Create Drive</button><button type="button" className="flex-1 py-3 rounded-full" onClick={() => setOpen(false)}>Cancel</button></div>
      </form>
    </div></div>}

    {selected && <div className="modal-backdrop"><div className="modal-box p-7" style={{ maxWidth: 1200, width: '95vw' }}>
      <div className="flex justify-between items-start mb-5"><div><span className="eyebrow">{selected.company || 'COMPANY'} · CANDIDATE PIPELINE</span><h3 className="font-serif text-3xl">{selected.role}</h3><p className="text-sm" style={{ color: 'var(--text-mid)' }}>Shortlist candidates, move them through rounds, and schedule interviews.</p></div><button onClick={() => setSelected(null)} className="icon-btn">×</button></div>
      {pipelineLoading ? <div className="skeleton" style={{ height: 420 }} /> : <div className="pipeline-board">
        {stages.map(stage => <div className="pipeline-column" key={stage}>
          <div className="pipeline-column-head"><span>{stageLabels[stage]}</span><b>{grouped[stage]?.length || 0}</b></div>
          {grouped[stage]?.map(a => <div className="pipeline-card" key={a._id}>
            <div className="candidate-avatar">{(a.student?.name || '?').split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase()}</div>
            <b>{a.student?.name || 'Unknown Student'}</b>
            <p>{a.student?.branch || 'Branch'} · CGPA {a.student?.cgpa ?? '—'}</p>
            <div className="skill-pills">{(a.student?.skills || []).slice(0,4).map(s => <span key={s}>{s}</span>)}</div>
            <div className="pipeline-actions">
              {a.student?.resumeUrl && <a className="btn-ghost" target="_blank" rel="noreferrer" href={`http://localhost:5000${a.student.resumeUrl}`}>Resume</a>}
              {stage !== 'selected' && stage !== 'rejected' && <select value={a.stage} onChange={e => move(a, e.target.value)}>{stages.map(s => <option key={s} value={s}>{stageLabels[s]}</option>)}</select>}
              {(stage === 'shortlisted' || stage === 'technical' || stage === 'hr') && <button className="btn-ghost" onClick={() => openInterview(a)}>Schedule</button>}
            </div>
          </div>)}
          {!grouped[stage]?.length && <div className="kanban-empty">No candidates</div>}
        </div>)}
      </div>}
    </div></div>}

    {interviewStudent && <div className="modal-backdrop"><div className="modal-box p-7" style={{ maxWidth: 650 }}>
      <div className="flex justify-between mb-5"><div><span className="eyebrow">INTERVIEW</span><h3 className="font-serif text-2xl">Schedule for {interviewStudent.student?.name}</h3></div><button className="icon-btn" onClick={() => setInterviewStudent(null)}>×</button></div>
      <form onSubmit={scheduleInterview} className="grid gap-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div><label className="form-label">Round</label><input className="form-input" value={interviewForm.round} onChange={e => setInterviewForm({ ...interviewForm, round: e.target.value })} required /></div>
          <div><label className="form-label">Date & Time</label><input className="form-input" type="datetime-local" value={interviewForm.scheduledAt} onChange={e => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })} required /></div>
          <div><label className="form-label">Mode</label><select className="form-input" value={interviewForm.mode} onChange={e => setInterviewForm({ ...interviewForm, mode: e.target.value })}><option>Online</option><option>Offline</option></select></div>
          <div><label className="form-label">Interviewer</label><input className="form-input" value={interviewForm.interviewer} onChange={e => setInterviewForm({ ...interviewForm, interviewer: e.target.value })} /></div>
        </div>
        {interviewForm.mode === 'Online' ? <div><label className="form-label">Meeting Link</label><input className="form-input" placeholder="https://meet.google.com/..." value={interviewForm.meetingLink} onChange={e => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })} /></div> : <div><label className="form-label">Venue</label><input className="form-input" placeholder="Placement Cell / Room 204" value={interviewForm.venue} onChange={e => setInterviewForm({ ...interviewForm, venue: e.target.value })} /></div>}
        <div><label className="form-label">Notes</label><textarea className="form-input" rows="3" value={interviewForm.notes} onChange={e => setInterviewForm({ ...interviewForm, notes: e.target.value })} /></div>
        <button className="btn-primary">Schedule Interview</button>
      </form>
    </div></div>}
  </>;
}
