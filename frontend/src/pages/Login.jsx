import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

const DEMO = [['Admin', 'admin@gym.com', 'admin123'], ['Trainer', 'trainer@gym.com', 'trainer123'], ['Member', 'member@gym.com', 'member123']];

export default function Login() {
  const { user, login } = useAuth();
  const [reg, setReg] = useState(false);
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '' });
  const [err, setErr] = useState('');
  if (user) return <Navigate to="/" />;

  const submit = async e => {
    e.preventDefault();
    try {
      const { data } = await api.post(reg ? '/auth/register' : '/auth/login', f);
      login(data);
    } catch (ex) { setErr(ex.response?.data?.message || 'Server not reachable'); }
  };
  const set = k => e => setF({ ...f, [k]: e.target.value });

  return (
    <div className="login">
      <form className="card login-box" onSubmit={submit}>
        <h1>IronPulse</h1>
        <p className="muted">{reg ? 'Create a member account' : 'Sign in to your gym account'}</p>
        {reg && <input placeholder="Full name" value={f.name} onChange={set('name')} required />}
        {reg && <input placeholder="Phone" value={f.phone} onChange={set('phone')} />}
        <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input type="password" placeholder="Password" value={f.password} onChange={set('password')} required />
        {err && <p className="error">{err}</p>}
        <button className="btn">{reg ? 'Register' : 'Login'}</button>
        <a href="#" onClick={e => { e.preventDefault(); setReg(!reg); setErr(''); }}>
          {reg ? 'Already have an account? Login' : 'New member? Register'}
        </a>
        {!reg && (
          <div className="demo">
            <small>Demo logins (click to fill):</small>
            <div className="row">
              {DEMO.map(([n, email, password]) => (
                <button type="button" key={n} className="btn sm ghost" onClick={() => setF({ ...f, email, password })}>{n}</button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
