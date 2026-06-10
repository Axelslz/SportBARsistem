import api from '../services/api';

const EXPENSES_URL = '/expenses';

export const getAll = async (type) => {
    const response = await api.get(`${EXPENSES_URL}?type=${type}`);
    return response.data;
};

export const create = async (newExpense) => {
    const response = await api.post(EXPENSES_URL, newExpense);
    return response.data;
};

export const remove = async (id) => {
    const response = await api.delete(`${EXPENSES_URL}/${id}`);
    return response.data;
};