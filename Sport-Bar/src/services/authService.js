import api from './api';

export const loginRequest = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data; 
};

export const registerRequest = async (credentials) => {
  const response = await api.post('/auth/register', credentials);
  return response.data;
};

export const getUsersRequest = async () => {
  const response = await api.get('/auth/users');
  return response.data;
};

export const updateUserRequest = async (id, userData) => {
  const response = await api.put(`/auth/users/${id}`, userData);
  return response.data;
};

export const deleteUserRequest = async (id) => {
  const response = await api.delete(`/auth/users/${id}`);
  return response.data;
};