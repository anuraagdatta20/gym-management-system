import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../api';

const COLORS = ['#e63946', '#457b9d', '#2a9d8f', '#f4a261', '#8d99ae'];

export default function Dashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/stats').then(r => setS(r.data)); }, []);
  if (!s) return <p>Loading...</p>;

  const cards = [
    ['Total Members', s.totalMembers], ['Active', s.active], ['Expired', s.expired],
    ['Trainers', s.trainers], ['Revenue', '₹' + s.totalRevenue.toLocaleString('en-IN')],
    ["Today's Check-ins", s.todayCheckins], ['Equipment Issues', s.equipmentIssues]
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stats">
        {cards.map(([l, v]) => <div key={l} className="card stat"><small>{l}</small><h2>{v}</h2></div>)}
      </div>

      <div className="grid3">
        <div className="card">
          <h3>Monthly Revenue (₹)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={s.revenue}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip />
              <Bar dataKey="amount" fill="#e63946" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>Attendance (last 7 days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={s.attendance}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis allowDecimals={false} /><Tooltip />
              <Line dataKey="count" stroke="#457b9d" strokeWidth={3} /></LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>Members by Plan</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart><Pie data={s.planDist} dataKey="value" nameKey="name" outerRadius={80} label>
              {s.planDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Legend /><Tooltip /></PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3>Memberships expiring in 7 days</h3>
          {s.expiring.length ? s.expiring.map(m => (
            <p key={m._id}><b>{m.name}</b> - {new Date(m.expiryDate).toLocaleDateString('en-IN')} {m.phone && `(${m.phone})`}</p>
          )) : <p className="muted">No upcoming expiries</p>}
        </div>
        <div className="card">
          <h3>Latest announcements</h3>
          {s.announcements.length ? s.announcements.map(a => <p key={a._id}><b>{a.title}</b><br />{a.message}</p>) : <p className="muted">None</p>}
        </div>
      </div>
    </div>
  );
}
