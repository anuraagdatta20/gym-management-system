import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

const idOf = v => (v && typeof v === 'object' && v._id ? v._id : v);

export const raw = (r, c) => {
  const v = r[c.key];
  if (Array.isArray(v)) return v.join(', ');
  if (v && typeof v === 'object') return v.name || v.title || '';
  if (c.key.toLowerCase().includes('date') && v) return new Date(v).toLocaleDateString('en-IN');
  return v ?? '';
};

// Reusable page: search, table, add/edit modal, delete, CSV export, custom row actions
export default function CrudPage({ title, endpoint, columns, fields, rowActions, canAdd = true }) {
  const { user } = useAuth();
  const canWrite = ['admin', 'trainer'].includes(user.role);
  const canDelete = user.role === 'admin';
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);
  const [refs, setRefs] = useState({});
  const [err, setErr] = useState('');

  const load = () => api.get(`/${endpoint}`, { params: { q } }).then(r => setRows(r.data));
  useEffect(() => { load(); }, [q]);
  useEffect(() => {
    if (!canWrite) return;
    fields.filter(f => f.ref).forEach(f => api.get(`/${f.ref}`).then(r => setRefs(p => ({ ...p, [f.ref]: r.data }))));
  }, []);

  const openEdit = row => {
    const o = { _id: row._id };
    fields.forEach(f => {
      let v = idOf(row[f.name]);
      if (f.type === 'date' && v) v = String(v).slice(0, 10);
      if (f.type === 'list' && Array.isArray(v)) v = v.join(', ');
      o[f.name] = v ?? '';
    });
    setErr(''); setForm(o);
  };

  const save = async e => {
    e.preventDefault();
    const body = { ...form };
    fields.forEach(f => {
      if (f.type === 'list' && typeof body[f.name] === 'string')
        body[f.name] = body[f.name].split(',').map(s => s.trim()).filter(Boolean);
      if (body[f.name] === '') delete body[f.name];
    });
    try {
      if (form._id) await api.put(`/${endpoint}/${form._id}`, body);
      else await api.post(`/${endpoint}`, body);
      setForm(null); load();
    } catch (ex) { setErr(ex.response?.data?.message || 'Something went wrong'); }
  };

  const del = async id => {
    if (confirm('Delete this record?')) { await api.delete(`/${endpoint}/${id}`); load(); }
  };

  const exportCsv = () => {
    const head = columns.map(c => c.label).join(',');
    const lines = rows.map(r => columns.map(c => `"${String(raw(r, c)).replace(/"/g, '""')}"`).join(','));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([[head, ...lines].join('\n')], { type: 'text/csv' }));
    a.download = endpoint + '.csv';
    a.click();
  };

  const input = f => {
    const v = form[f.name] ?? '';
    const set = e => setForm({ ...form, [f.name]: e.target.value });
    if (f.ref) return (
      <select value={v} onChange={set} required={f.required}>
        <option value="">-- select --</option>
        {(refs[f.ref] || []).map(o => <option key={o._id} value={o._id}>{o.name || o.title}</option>)}
      </select>
    );
    if (f.type === 'select') return (
      <select value={v} onChange={set} required={f.required}>
        <option value="">-- select --</option>
        {f.options.map(o => <option key={o}>{o}</option>)}
      </select>
    );
    if (f.type === 'textarea') return <textarea rows="4" value={v} onChange={set} />;
    return <input type={f.type === 'list' ? 'text' : f.type || 'text'} value={v} onChange={set} required={f.required} />;
  };

  return (
    <div>
      <div className="head">
        <h1>{title}</h1>
        <div className="row">
          <input className="search" placeholder="Search..." value={q} onChange={e => setQ(e.target.value)} />
          <button className="btn ghost" onClick={exportCsv}>Export CSV</button>
          {canWrite && canAdd && <button className="btn" onClick={() => { setErr(''); setForm({}); }}>+ Add</button>}
        </div>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}<th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r._id}>
                {columns.map(c => <td key={c.key}>{c.render ? c.render(r) : raw(r, c)}</td>)}
                <td className="actions">
                  {rowActions && rowActions(r, load)}
                  {canWrite && <button className="btn sm ghost" onClick={() => openEdit(r)}>Edit</button>}
                  {canDelete && <button className="btn sm danger" onClick={() => del(r._id)}>Delete</button>}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={columns.length + 1} className="empty">No records found</td></tr>}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="modal" onClick={() => setForm(null)}>
          <form className="card modal-box" onClick={e => e.stopPropagation()} onSubmit={save}>
            <h2>{form._id ? 'Edit' : 'Add'} {title}</h2>
            <div className="grid2">
              {fields.map(f => (
                <label key={f.name} className={f.type === 'textarea' ? 'full' : ''}>
                  {f.label}{f.required && ' *'}
                  {input(f)}
                </label>
              ))}
            </div>
            {err && <p className="error">{err}</p>}
            <div className="row end">
              <button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
