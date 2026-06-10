import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Paper, Tabs, Tab, TextField, Button, 
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
  Divider, Grid, Alert, Snackbar, CircularProgress, Radio, RadioGroup, 
  FormControlLabel, FormControl, FormLabel, Switch, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem
} from '@mui/material';
import { 
  Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon, 
  PersonAdd as PersonAddIcon, Receipt as ReceiptIcon, 
  Store as StoreIcon, People as PeopleIcon, Print as PrintIcon
} from '@mui/icons-material';

import { getUsersRequest, deleteUserRequest, registerRequest, updateUserRequest } from '../services/authService';
import { useAuth } from '../context/AuthContext';


const UsuariosTab = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'empleado' });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try { setLoading(true); const res = await getUsersRequest(); setUsuarios(res); } 
    catch (error) { showToast('Error al cargar la lista de usuarios', 'error'); } 
    finally { setLoading(false); }
  };

  const handleOpenCreate = () => { setEditingUser(null); setFormData({ username: '', password: '', role: 'empleado' }); setOpenModal(true); };
  const handleOpenEdit = (user) => { setEditingUser(user); setFormData({ username: user.username, password: '', role: user.role }); setOpenModal(true); };

  const handleSaveUser = async () => {
    if (!formData.username.trim()) return showToast('El nombre de usuario es obligatorio', 'warning');
    try {
      if (editingUser) { await updateUserRequest(editingUser.id, formData); showToast('Usuario actualizado', 'success'); } 
      else { if (!formData.password.trim()) return showToast('Contraseña obligatoria', 'warning'); await registerRequest(formData); showToast('Usuario creado', 'success'); }
      setOpenModal(false); loadUsers();
    } catch (error) { showToast(error.response?.data?.message || 'Error al guardar', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este usuario del sistema?')) return;
    try { await deleteUserRequest(id); showToast('Usuario eliminado', 'success'); loadUsers(); } 
    catch (error) { showToast('Error al eliminar usuario', 'error'); }
  };

  const showToast = (message, severity) => setToast({ open: true, message, severity });
  const handleCloseToast = () => setToast({ ...toast, open: false });

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
            <Typography variant="h6">Gestión de Usuarios</Typography>
            <Typography variant="body2" color="text.secondary">Controla los accesos al sistema.</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenCreate} sx={{ fontWeight: 'bold' }}>Nuevo Usuario</Button>
      </Box>

      <Paper variant="outlined">
        {loading ? <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box> : (
          <List>
            {usuarios.map((user, index) => (
              <React.Fragment key={user.id}>
                <ListItem>
                  <ListItemText 
                    primary={<Typography fontWeight="bold">{user.username.toUpperCase()}</Typography>} 
                    secondary={<Chip label={user.role.toUpperCase()} size="small" color={user.role === 'admin' ? 'primary' : 'default'} sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}/>}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" color="primary" onClick={() => handleOpenEdit(user)} sx={{ mr: 1 }}><EditIcon /></IconButton>
                    <IconButton edge="end" color="error" onClick={() => handleDelete(user.id)}><DeleteIcon /></IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < usuarios.length - 1 && <Divider />}
              </React.Fragment>
            ))}
            {usuarios.length === 0 && <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>No hay usuarios.</Box>}
          </List>
        )}
      </Paper>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent dividers>
            <Grid container spacing={2}>
                <Grid item xs={12}><TextField label="Nombre de Usuario" fullWidth size="small" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}/></Grid>
                <Grid item xs={12}><TextField label="Contraseña" fullWidth size="small" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} helperText={editingUser ? "Déjalo en blanco para no cambiarla" : "Mínimo 6 caracteres"}/></Grid>
                <Grid item xs={12}>
                    <TextField select label="Rol del Usuario" fullWidth size="small" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                        <MenuItem value="empleado">EMPLEADO</MenuItem>
                        <MenuItem value="admin">ADMINISTRADOR</MenuItem>
                    </TextField>
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenModal(false)} color="inherit">Cancelar</Button>
            <Button onClick={handleSaveUser} variant="contained" color="primary">Guardar</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={handleCloseToast}>
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
};



const Settings = () => {
  const { user } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);

  if (user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1565C0' }}>Configuración del Sistema</Typography>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} indicatorColor="primary" textColor="primary">
          <Tab icon={<PeopleIcon />} iconPosition="start" label="Usuarios" />
        </Tabs>
        {tabIndex === 0 && <UsuariosTab />}
      </Paper>
    </Container>
  );
};

export default Settings;