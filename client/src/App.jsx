import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import api, { errorMessage } from './api.js';

const SLOTS = ['Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'];
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
function AuthPage({ mode, onAuth }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';
  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      localStorage.setItem('sweety_token', data.token);
      onAuth(data.user);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };
  return <main className="auth-wrap">
    <div className="auth-brand"><span className="brand-mark">S</span><span>Sweety</span></div>
    <section className="auth-card">
      <div className="eyebrow">YOUR HEALTH, IN YOUR HANDS</div>
      <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <p className="muted">{isRegister ? 'Start keeping your glucose readings in one place.' : 'Sign in to review your glucose journal.'}</p>
      {error && <div className="alert">{error}</div>}
      <form onSubmit={submit} className="form-stack">
        {isRegister && <label>Full name<input required maxLength="100" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name" /></label>}
        <label>Email address<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com" /></label>
        <label>Password<input type="password" required minLength="8" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} /></label>
        <button className="primary-btn" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
      </form>
      <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to Sweety?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
      {!isRegister && <div className="demo-hint"><strong>Demo account</strong><br/>demo@sweety.local<br/>SweetyDemo123!</div>}
    </section>
    <p className="footnote">For tracking and discussion with your healthcare professional. Not a substitute for medical advice.</p>
  </main>;
}
function StatCard({ label, value, suffix, icon }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value ?? '—'}<small>{value !== null && value !== undefined ? suffix : ''}</small></div></div>;
}
function Dashboard({ user, onLogout }) {
  const [date, setDate] = useState(todayISO());
  const [readings, setReadings] = useState([]);
  const [reports, setReports] = useState({});
  const [slot, setSlot] = useState(SLOTS[0]);
  const [value, setValue] = useState('');
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('daily');
  const [report, setReport] = useState(null);
  const navigate = useNavigate();

  const loadReadings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/readings', { params: { date } });
      setReadings(data.readings);
    } catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  };
  const loadReports = async () => {
    try {
      const [daily, mtd, previous] = await Promise.all([
        api.get('/reports/daily', { params: { date } }),
        api.get('/reports/month-to-date', { params: { date } }),
        api.get('/reports/previous-month', { params: { date } })
      ]);
      setReports({ daily: daily.data, mtd: mtd.data, previous: previous.data });
      setReport(({daily: daily.data, mtd: mtd.data, previous: previous.data})[reportType]);
    } catch (err) { setError(errorMessage(err)); }
  };
  useEffect(() => { loadReadings(); loadReports(); }, [date]);
  useEffect(() => { if (reports[reportType]) setReport(reports[reportType]); }, [reportType, reports]);
  const resetForm = () => { setEditing(null); setValue(''); setSlot(SLOTS[0]); };
  const saveReading = async e => {
    e.preventDefault(); setError(''); setMessage('');
    if (value === '') { setError('Please enter a glucose value.'); return; }
    if (!Number.isInteger(Number(value)) || Number(value) < 40 || Number(value) > 600) { setError('Value must be between 40 and 600 mg/dl.'); return; }
    if (date > todayISO()) { setError('Date cannot be in the future.'); return; }
    try {
      const payload = { reading_date: date, time_slot: slot, value: Number(value) };
      if (editing) await api.put(`/readings/${editing.id}`, payload);
      else await api.post('/readings', payload);
      setMessage(editing ? 'Reading updated successfully.' : 'Reading saved successfully.');
      resetForm(); await loadReadings(); await loadReports();
    } catch (err) { setError(errorMessage(err)); }
  };
  const editReading = reading => { setEditing(reading); setSlot(reading.time_slot); setValue(String(reading.value)); window.scrollTo({top:0,behavior:'smooth'}); };
  const deleteReading = async reading => {
    if (!window.confirm(`Delete the ${reading.time_slot} reading (${reading.value} mg/dL)?`)) return;
    setError(''); setMessage('');
    try { await api.delete(`/readings/${reading.id}`); setMessage('Reading deleted.'); await loadReadings(); await loadReports(); }
    catch (err) { setError(errorMessage(err)); }
  };
  const logout = () => { localStorage.removeItem('sweety_token'); onLogout(); navigate('/login'); };
  const selectedReport = report || { highest:null, lowest:null, average:null, count:0 };
  const reportLabel = reportType === 'daily' ? 'Daily report' : reportType === 'mtd' ? 'Month to date' : 'Previous month';
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">S</span><span>Sweety</span></div>
      <div className="side-label">WORKSPACE</div>
      <div className="nav-item active"><span>▦</span> Overview</div>
      <div className="side-label side-bottom">YOUR ACCOUNT</div>
      <div className="profile"><div className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div><div className="profile-copy"><strong>{user?.name}</strong><span>{user?.email}</span></div></div>
      <button className="logout-btn" onClick={logout}>↗ Sign out</button>
      <div className="sidebar-note">Small steps, healthier days.</div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><span className="breadcrumb">Workspace / </span><strong>Overview</strong></div><div className="top-date">◷ &nbsp; {new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</div></header>
      <section className="welcome-row"><div><div className="eyebrow">GLUCOSE JOURNAL</div><h1>Good day, {user?.name?.split(' ')[0] || 'there'} <span>✦</span></h1><p className="muted">A clearer picture of your daily health, one reading at a time.</p></div><label className="date-picker">Selected date<input type="date" max={todayISO()} value={date} onChange={e=>setDate(e.target.value)} /></label></section>
      {(error || message) && <div className={error ? 'alert' : 'success-alert'}>{error || message}<button onClick={()=>{setError('');setMessage('')}} aria-label="Dismiss">×</button></div>}
      <section className="stats-grid">
        <StatCard label="Highest reading" value={reports.daily?.highest} suffix=" mg/dL" icon="↗"/>
        <StatCard label="Lowest reading" value={reports.daily?.lowest} suffix=" mg/dL" icon="↘"/>
        <StatCard label="Daily average" value={reports.daily?.average} suffix=" mg/dL" icon="≈"/>
        <StatCard label="Readings today" value={reports.daily?.count ?? 0} suffix=" / 4" icon="◷"/>
      </section>
      <div className="content-grid">
        <section className="panel reading-panel">
          <div className="panel-heading"><div><div className="eyebrow">{editing ? 'UPDATE ENTRY' : 'NEW ENTRY'}</div><h2>{editing ? 'Edit reading' : 'Add a reading'}</h2></div><span className="panel-symbol">＋</span></div>
          <form onSubmit={saveReading} className="form-stack">
            <label>Time slot<select value={slot} onChange={e=>setSlot(e.target.value)}>{SLOTS.map(s=><option key={s}>{s}</option>)}</select></label>
            <label>Glucose value <span className="unit">(mg/dL)</span><div className="value-input"><input type="number" min="40" max="600" step="1" value={value} onChange={e=>setValue(e.target.value)} placeholder="e.g. 110" /><span>mg/dL</span></div><small className="field-help">Enter a whole number between 40 and 600.</small></label>
            <div className="form-date">Date <strong>{new Date(`${date}T12:00:00`).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</strong></div>
            <button className="primary-btn">{editing ? 'Save changes' : 'Save reading'} <span>→</span></button>
            {editing && <button type="button" className="secondary-btn" onClick={resetForm}>Cancel edit</button>}
          </form>
          <div className="form-footnote">Your readings are private and only visible to your account.</div>
        </section>
        <section className="panel history-panel">
          <div className="panel-heading"><div><div className="eyebrow">YOUR JOURNAL</div><h2>Daily readings <span className="count-pill">{readings.length}/4</span></h2></div><span className="panel-symbol">☷</span></div>
          {loading ? <div className="empty-state">Loading your readings…</div> : readings.length === 0 ? <div className="empty-state"><div className="empty-icon">♡</div><strong>No readings yet</strong><p>Add your first reading for this date to start your journal.</p></div> :
            <div className="reading-list">{readings.map(r=><div className="reading-row" key={r.id}><div className="reading-dot"></div><div className="reading-info"><strong>{r.time_slot}</strong><span>{new Date(`${r.reading_date}T12:00:00`).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span></div><div className="reading-number">{r.value}<small> mg/dL</small></div><div className="row-actions"><button title="Edit reading" onClick={()=>editReading(r)}>✎</button><button title="Delete reading" onClick={()=>deleteReading(r)}>×</button></div></div>)}</div>}
          <div className="panel-bottom"><span>Daily limit</span><div className="limit-track"><div style={{width:`${Math.min(readings.length/4*100,100)}%`}}></div></div><strong>{readings.length} of 4</strong></div>
        </section>
      </div>
      <section className="panel reports-panel">
        <div className="panel-heading report-heading"><div><div className="eyebrow">INSIGHTS</div><h2>Reading reports</h2></div><div className="report-tabs">{[['daily','Daily'],['mtd','Month to date'],['previous','Previous month']].map(([key,label])=><button key={key} className={reportType===key?'tab-active':''} onClick={()=>setReportType(key)}>{label}</button>)}</div></div>
        <div className="report-period">{selectedReport.startDate ? `${selectedReport.startDate} — ${selectedReport.endDate}` : 'Choose a date to view reports'}</div>
        <div className="report-stats"><div><span>Highest</span><strong>{selectedReport.highest ?? '—'}<small>{selectedReport.highest != null ? ' mg/dL' : ''}</small></strong></div><div><span>Lowest</span><strong>{selectedReport.lowest ?? '—'}<small>{selectedReport.lowest != null ? ' mg/dL' : ''}</small></strong></div><div><span>Average</span><strong>{selectedReport.average ?? '—'}<small>{selectedReport.average != null ? ' mg/dL' : ''}</small></strong></div><div><span>Total readings</span><strong>{selectedReport.count ?? 0}</strong></div></div>
        {reportType === 'daily' && <div className="daily-report-list"><h3>Readings for selected date</h3>{selectedReport.readings?.length ? selectedReport.readings.map(r=><div className="daily-report-row" key={r.id}><span>{r.time_slot}</span><strong>{r.value} mg/dL</strong></div>) : <p className="muted">No readings for this date yet. Add one above to see it here.</p>}</div>}
        {selectedReport.count === 0 && reportType !== 'daily' && <div className="empty-report">No readings found in this report period.</div>}
      </section>
      <footer className="page-footer"><span>© {new Date().getFullYear()} Sweety Glucose Tracker</span><span>Track consistently. Talk with your care team.</span></footer>
    </main>
  </div>;
}
export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(localStorage.getItem('sweety_token')));
  useEffect(() => {
    if (!localStorage.getItem('sweety_token')) { setChecking(false); return; }
    api.get('/auth/me').then(({data})=>setUser(data.user)).catch(()=>localStorage.removeItem('sweety_token')).finally(()=>setChecking(false));
  }, []);
  if (checking) return <div className="loading-screen">Opening your Sweety workspace…</div>;
  return <Routes>
    <Route path="/login" element={user ? <Navigate to="/" replace/> : <AuthPage mode="login" onAuth={setUser}/>}/>
    <Route path="/register" element={user ? <Navigate to="/" replace/> : <AuthPage mode="register" onAuth={setUser}/>}/>
    <Route path="/" element={user ? <Dashboard user={user} onLogout={()=>setUser(null)}/> : <Navigate to="/login" replace/>}/>
    <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace/>}/>
  </Routes>;
}
