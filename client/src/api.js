import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sweety_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export function errorMessage(error) {
  return error?.response?.data?.message || 'Unable to complete the request. Check the server and try again.';
}
export default api;
