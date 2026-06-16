import React from 'react';
import { Box } from '@mui/material'; 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { MaintenanceProvider } from './context/MaintenanceContext'; 
import Navbar from './components/Navbar';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute'; 
import Login from './pages/Login';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Dashboard from './pages/Dashboard';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import Settings from './components/Settings'; 
import Cotizacion from './pages/Cotizacion'; 
import { ThemeModeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <InventoryProvider>
          <MaintenanceProvider>
            <Router>
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                <Navbar /> 
                <Box component="main" sx={{ flexGrow: 1, width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                    <Route path="/pos" element={<ProtectedRoute><POS/></ProtectedRoute>} />
                    <Route path="/cotizacion" element={<ProtectedRoute><Cotizacion /></ProtectedRoute>} />

                    <Route path="/" element={<ProtectedRoute><RoleRoute allowedRoles={['admin']}><Dashboard/></RoleRoute></ProtectedRoute>} />
                    <Route path="/maintenance" element={<ProtectedRoute><RoleRoute allowedRoles={['admin']}><Maintenance /></RoleRoute></ProtectedRoute>} />
                    <Route path="/expenses" element={<ProtectedRoute><RoleRoute allowedRoles={['admin']}><Expenses /></RoleRoute></ProtectedRoute>} />
                    <Route path="/expenses/store" element={<ProtectedRoute><RoleRoute allowedRoles={['admin']}><Expenses type="store" /></RoleRoute></ProtectedRoute>} />
                    <Route path="/expenses/warehouse" element={<ProtectedRoute><RoleRoute allowedRoles={['admin']}><Expenses type="warehouse" /></RoleRoute></ProtectedRoute>} />
                    <Route path="/expenses/payroll" element={<ProtectedRoute><RoleRoute allowedRoles={['admin']}><Expenses type="payroll" /></RoleRoute></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><RoleRoute allowedRoles={['admin']}><Box sx={{ height: '100%', overflowY: 'auto' }}><Settings /></Box></RoleRoute></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/inventory" replace />} />
                  </Routes>
                </Box>
              </Box>
            </Router>
          </MaintenanceProvider>
        </InventoryProvider>
      </AuthProvider>
    </ThemeModeProvider>
  );
}

export default App;