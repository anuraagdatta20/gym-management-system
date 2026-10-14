import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Progress() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [id, setId] = useState('');
  const [w, setW] = useState('');

  const load = () => api.get('/members').then(r => { setMembers(r.data); setId(i => i || r.data[0]?._id || ''); });
  useEffect(() => { load(); }, []);

  const m = members.find(x => x._id === id);
  const bmi = m?.height && m?.weight ? m.weight / (m.height / 100) ** 2 : 0;
  const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  const bmr = m?.age && m?.height && m?.weight
    ? 10 * m.weight + 6.25 * m.height - 5 * m.age + (m.gender === 'Female' ? -161 : 5) : 0;
  const data = (m?.weightLog || []).map(x => ({
    date: new Date(x.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), weight: x.weight
  }));

  const add = async () => {
    if (!w) return;
    await api.post(`/members/${id}/weight`, { weight: Number(w) });
    setW(''); load();
  };

  return (
    <div>
      <div className="head">
        <h1>Progress, BMI & Calories</h1>
        {user.role !== 'member' && (
          <select value={id} onChange={e => setId(e.target.value)}>
            {members.map(x => <option key={x._id} value={x._id}>{x.name}</option>)}
          </select>
        )}
      </div>
      {!m ? <p>No member profile found.</p> : (
        <>
          <div className="stats">
            <div className="card stat"><small>Weight</small><h2>{m.weight || '-'} kg</h2></div>
            <div className="card stat"><small>Height</small><h2>{m.height || '-'} cm</h2></div>
            <div className="card stat"><small>BMI</small><h2>{bmi ? bmi.toFixed(1) : '-'}</h2>{bmi > 0 && <small>{cat}</small>}</div>
            <div className="card stat"><small>Maintenance calories</small><h2>{bmr ? Math.round(bmr * 1.55) : '-'}</h2><small>kcal/day (moderate activity)</small></div>
          </div>
          <div className="card">
            <div className="head">
              <h3>Weight history</h3>
              <div className="row">
                <input type="number" placeholder="New weight (kg)" value={w} onChange={e => setW(e.target.value)} />
                <button className="btn" onClick={add}>Log weight</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={['dataMin - 2', 'dataMax + 2']} /><Tooltip />
                <Line dataKey="weight" stroke="#2a9d8f" strokeWidth={3} /></LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
