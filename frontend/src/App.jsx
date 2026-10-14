import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Progress from './pages/Progress';
import { Members, Plans, Trainers, Payments, Classes, Equipment, Workouts, Announcements } from './pages/Pages';

const Guard = ({ roles, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const Home = () => {
  const { user } = useAuth();
  return user.role === 'member' ? <Navigate to="/progress" /> : <Dashboard />;
};

const staff = ['admin', 'trainer'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Guard><Layout /></Guard>}>
        <Route index element={<Home />} />
        <Route path="members" element={<Guard roles={staff}><Members /></Guard>} />
        <Route path="trainers" element={<Guard roles={staff}><Trainers /></Guard>} />
        <Route path="equipment" element={<Guard roles={staff}><Equipment /></Guard>} />
        <Route path="plans" element={<Plans />} />
        <Route path="payments" element={<Payments />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="classes" element={<Classes />} />
        <Route path="workouts" element={<Workouts />} />
        <Route path="progress" element={<Progress />} />
        <Route path="announcements" element={<Announcements />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
