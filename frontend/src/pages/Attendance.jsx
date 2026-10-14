import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Attendance() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [members, setMembers] = useState([]);
  const [member, setMember] = useState('');
  const [msg, setMsg] = useState('');
  const isMember = user.role === 'member';

  const load = () => api.get('/attendance').then(r => setRows(r.data));
  useEffect(() => { load(); if (!isMember) api.get('/members').then(r => setMembers(r.data)); }, []);

  const checkIn = async () => {
    setMsg('');
    try { await api.post('/attendance/checkin', { member }); load(); }
    catch (e) { setMsg(e.response?.data?.message || 'Failed'); }
  };
  const checkOut = async id => { await api.put('/attendance/checkout/' + id); load(); };
  const fmt = d => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const dur = a => (a.checkOut ? Math.round((new Date(a.checkOut) - new Date(a.checkIn)) / 60000) + ' min' : '-');

  return (
    <div>
      <div className="head">
        <h1>Attendance</h1>
        <div className="row">
          {!isMember && (
            <select value={member} onChange={e => setMember(e.target.value)}>
              <option value="">-- select member --</option>
              {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          )}
          <button className="btn" onClick={checkIn}>Check In</button>
        </div>
      </div>
      {msg && <p className="error">{msg}</p>}
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Member</th><th>Check-in</th><th>Check-out</th><th>Duration</th><th></th></tr></thead>
          <tbody>
            {rows.map(a => (
              <tr key={a._id}>
                <td>{a.member?.name}</td><td>{fmt(a.checkIn)}</td>
                <td>{a.checkOut ? fmt(a.checkOut) : <span className="badge active">Inside gym</span>}</td>
                <td>{dur(a)}</td>
                <td>{!a.checkOut && <button className="btn sm" onClick={() => checkOut(a._id)}>Check Out</button>}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="5" className="empty">No attendance yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
