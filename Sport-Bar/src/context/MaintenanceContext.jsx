import { createContext, useContext, useState, useEffect } from 'react';
import maintenanceService from '../services/maintenanceService'; 

const MaintenanceContext = createContext();

export const useMaintenance = () => {
  return useContext(MaintenanceContext);
};

export const MaintenanceProvider = ({ children }) => {
  const [records, setRecords] = useState([]);

  const getRecords = async () => {
    try {
      const data = await maintenanceService.getAll();
      setRecords(data);
    } catch (error) {
      console.error("Error en servicio de mantenimiento (Get):", error);
    }
  };

  const addRecord = async (recordData) => {
    try {
      const savedRecord = await maintenanceService.create(recordData);
      setRecords([savedRecord, ...records]);
    } catch (error) {
      console.error("Error en servicio de mantenimiento (Create):", error);
      alert("No se pudo guardar el registro.");
    }
  };

  const deleteRecord = async (id) => {
    try {
      await maintenanceService.remove(id);
      setRecords(records.filter(r => r.id !== id));
    } catch (error) {
      console.error("Error en servicio de mantenimiento (Delete):", error);
      alert("No se pudo eliminar el registro.");
    }
  };

  useEffect(() => {
    getRecords();
  }, []);

  return (
    <MaintenanceContext.Provider value={{ records, addRecord, deleteRecord }}>
      {children}
    </MaintenanceContext.Provider>
  );
};