import api from '../services/api';

const MAINTENANCE_URL = '/maintenance';

const getAll = async () => {
    const response = await api.get(MAINTENANCE_URL);
    return response.data;
};

const create = async (newRecord) => {
    const response = await api.post(MAINTENANCE_URL, newRecord);
    return response.data;
};

const remove = async (id) => {
    const response = await api.delete(`${MAINTENANCE_URL}/${id}`);
    return response.data;
};

const maintenanceService = {
    getAll,
    create,
    remove
};

export default maintenanceService;