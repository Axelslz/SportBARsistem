import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Inventory from '../pages/Inventory';
import POS from '../pages/POS';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/inventory " element={<Inventory />} />
      <Route path="/pos" element={<POS />} />
      <Route path="*" element={<h2>404 - Página no encontrada</h2>} />
    </Routes>
  );
};

export default AppRoutes;