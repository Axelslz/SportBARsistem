import api from './api'; 

export const getSellersRequest = async () => {
  return await api.get('/sellers');
};

export const createSellerRequest = async (name) => {
  return await api.post('/sellers', { name });
};

export const deleteSellerRequest = async (id) => {
  return await api.delete(`/sellers/${id}`);
};