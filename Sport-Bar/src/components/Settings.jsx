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

const TicketTab = () => {
  const [form, setForm] = useState({ storeName: 'LA BODEGA', slogan: 'Materiales y Galvanizados', address: '1A PTE SUR S/N - COL EL JOBO, TUXTLA GTZ', phone: '961 182 1879', email: 'contacto@labodega.com', footerMessage: '** GRACIAS POR SU COMPRA **\nNO SE ACEPTAN DEVOLUCIONES' });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  return (
  <Box sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom sx={{ color: '#1565C0', fontWeight: 'bold' }}>Información del Ticket</Typography>
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}><TextField label="Nombre de la Tienda" name="storeName" fullWidth value={form.storeName} onChange={handleChange}/></Grid>
      <Grid item xs={12} sm={6}><TextField label="Frase o Slogan" name="slogan" fullWidth value={form.slogan} onChange={handleChange}/></Grid>
      <Grid item xs={12}><TextField label="Dirección Completa" name="address" fullWidth multiline rows={2} value={form.address} onChange={handleChange}/></Grid>
      <Grid item xs={12} sm={6}><TextField label="Teléfono / WhatsApp" name="phone" fullWidth value={form.phone} onChange={handleChange}/></Grid>
      <Grid item xs={12} sm={6}><TextField label="Correo Electrónico" name="email" fullWidth value={form.email} onChange={handleChange}/></Grid>
      <Grid item xs={12}><TextField label="Mensaje Final" name="footerMessage" fullWidth multiline rows={2} value={form.footerMessage} onChange={handleChange}/></Grid>
      <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}><Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={() => alert("Guardado")} sx={{ px: 4, borderRadius: 2 }}>Guardar Configuración</Button></Grid>
    </Grid>
  </Box>
  );
};

const PrinterTab = () => {
  const [paperSize, setPaperSize] = useState('80');
  const [showLogo, setShowLogo] = useState(true);
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#1565C0', fontWeight: 'bold' }}>Configuración de Impresión</Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <FormControl>
              <FormLabel sx={{ fontWeight: 'bold', mb: 1 }}>Tamaño del Papel</FormLabel>
              <RadioGroup value={paperSize} onChange={(e) => setPaperSize(e.target.value)}>
                <FormControlLabel value="80" control={<Radio />} label="80mm (Estándar)" sx={{ mb: 1 }}/>
                <FormControlLabel value="58" control={<Radio />} label="58mm (Pequeño)" />
              </RadioGroup>
            </FormControl>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'text.secondary' }}>PREFERENCIAS DE CAJA</Typography>
            <List disablePadding>
              <ListItem disableGutters><ListItemText primary="Mostrar Logo en Ticket" /><Switch edge="end" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} /></ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
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
          <Tab icon={<StoreIcon />} iconPosition="start" label="Datos Tienda" />
          <Tab icon={<ReceiptIcon />} iconPosition="start" label="Impresora" />
        </Tabs>
        {tabIndex === 0 && <UsuariosTab />}
        {tabIndex === 1 && <TicketTab />}
        {tabIndex === 2 && <PrinterTab />}
      </Paper>
    </Container>
  );
};

export default Settings;