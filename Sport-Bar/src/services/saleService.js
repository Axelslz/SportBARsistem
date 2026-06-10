import api from './api';

export const createSaleService = async (saleData) => {
  const response = await api.post('/sales', saleData);
  return response.data;
};

export const getSalesHistoryService = async () => {
  const response = await api.get('/sales');
  return response.data;
};

export const getSalesRequest = async () => {
  return await api.get('/sales');
};

export const markSaleAsPaidService = async (id) => {
  const response = await api.put(`/sales/${id}/pay`);
  return response.data;
};

export const resetHistoryService = async () => {
  const response = await api.delete('/sales/reset-history');
  return response.data;
};