import api from './api';

const PRODUCT_ENDPOINT = '/products';

export const getProductsService = async () => {
  const response = await api.get(PRODUCT_ENDPOINT);
  return response.data;
};

export const createProductService = async (productData) => {
  const response = await api.post(PRODUCT_ENDPOINT, productData);
  return response.data;
};

export const updateProductService = async (id, productData) => {
  const response = await api.put(`${PRODUCT_ENDPOINT}/${id}`, productData);
  return response.data;
};

export const deleteProductService = async (id) => {
  const response = await api.delete(`${PRODUCT_ENDPOINT}/${id}`);
  return response.data;
};

export const addProductStockService = async (id, stockData) => {
  const response = await api.post(`${PRODUCT_ENDPOINT}/${id}/stock`, stockData);
  return response.data;
};

export const getProductHistoryService = async (id) => {
  const response = await api.get(`${PRODUCT_ENDPOINT}/${id}/history`);
  return response.data;
};