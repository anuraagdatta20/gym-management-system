import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const NAV = [
  ['/', 'Dashboard', ['admin', 'trainer']],
  ['/members', 'Members', ['admin', 'trainer']],
  ['/trainers', 'Trainers', ['admin', 'trainer']],
  ['/plans', 'Plans', null],
  ['/payments', 'Payments', null],
  ['/attendance', 'Attendance', null],
  ['/classes', 'Classes', null],
  ['/workouts', 'Workout & Diet', null],
  ['/equipment', 'Equipment', ['admin', 'trainer']],
  ['/progress', 'Progress & BMI', null],
  ['/announcements', 'Announcements', null]
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>IronPulse</h2>
        <small>Gym Management System</small>
        <nav>
          {NAV.filter(([, , roles]) => !roles || roles.includes(user.role)).map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <span>Welcome, <b>{user.name}</b> <span className="badge active">{user.role}</span></span>
          <span>
            <button className="btn ghost" onClick={() => setDark(!dark)}>{dark ? 'Light' : 'Dark'} mode</button>{' '}
            <button className="btn danger" onClick={logout}>Logout</button>
          </span>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
