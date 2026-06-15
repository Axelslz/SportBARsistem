import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const URL_BACKEND = isLocal 
  ? 'http://localhost:5000/api' 
  : 'https://backsportbarsistem.onrender.com/api';

console.log("Conectando a:", URL_BACKEND); 

const api = axios.create({
  baseURL: URL_BACKEND, 
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Token expirado o inválido, cerrando sesión automáticamente...");
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user_data');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;