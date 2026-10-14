import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(c => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = 'Bearer ' + t;
  return c;
});

api.interceptors.response.use(r => r, e => {
  if (e.response?.status === 401 && location.pathname !== '/login') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    location.href = '/login';
  }
  return Promise.reject(e);
});

export default api;
