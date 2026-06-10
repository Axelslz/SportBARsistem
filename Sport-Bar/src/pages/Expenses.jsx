import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, TextField, MenuItem, DialogActions,
  DialogContentText, IconButton, Snackbar, Alert, useTheme, useMediaQuery,
  Fab, Divider
} from '@mui/material';
import { Add, Delete, Store, Warehouse, AttachMoney, ArrowBack, Groups, WarningAmberRounded, CalendarToday, Label } from '@mui/icons-material';
import * as expenseService from '../services/expenseService'; 

const CONFIG = {
  store: {
    title: 'Gastos de Tienda',
    icon: <Store fontSize="large" />,
    categories: ['Limpieza', 'Renta', 'Agua', 'Luz', 'Internet']
  },
  warehouse: {
    title: 'Gastos de Bodega',
    icon: <Warehouse fontSize="large" />,
    categories: ['Luz', 'Internet', 'GPS Carros', 'Gastos Telefónicos']
  },
  payroll: {
    title: 'Nómina de Personal',
    icon: <Groups fontSize="large" />, 
    categories: [] 
  }
};

export default function Expenses({ type = 'store' }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); 

  const currentConfig = CONFIG[type] || CONFIG.store;
  const isPayroll = type === 'payroll';

  const [records, setRecords] = useState([]);
  const [open, setOpen] = useState(false);
  
  const [isCustomCategory, setIsCustomCategory] = useState(false); 

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const availableCategories = useMemo(() => {
    const usedCategories = records.map(r => r.category);
    const allCategories = [...currentConfig.categories, ...usedCategories];
    return [...new Set(allCategories)].sort();
  }, [records, currentConfig]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const data = await expenseService.getAll(type);
        setRecords(data);
      } catch (error) {
        console.error("Error cargando gastos:", error);
      }
    };
    fetchExpenses();
  }, [type]);

  const totalGasto = records.reduce((acc, item) => acc + parseFloat(item.amount || 0), 0);

  const handleOpen = () => {
    setOpen(true);
    setIsCustomCategory(false); 
    setFormData({ 
      category: '', description: '', amount: '', 
      date: new Date().toISOString().split('T')[0] 
    });
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === '__NEW__') {
      setIsCustomCategory(true); 
      setFormData({ ...formData, category: '' }); 
    } else {
      setFormData({ ...formData, category: value });
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.amount) {
        showSnackbar('⚠️ Faltan datos (Categoría o Monto)', 'warning');
        return;
    }
    
    try {
        const payload = {
            ...formData,
            type: type, 
            amount: parseFloat(formData.amount)
        };

        const savedRecord = await expenseService.create(payload);

        setRecords([savedRecord, ...records]);
        setOpen(false);
        setFormData({ 
            category: '', description: '', amount: '', 
            date: new Date().toISOString().split('T')[0] 
        });
        setIsCustomCategory(false);
        showSnackbar('Registro guardado correctamente');

    } catch (error) {
        console.error("Error guardando:", error);
        showSnackbar('Error al guardar el gasto', 'error');
    }
  };

  const handleClickDelete = (id) => {
    setRecordToDelete(id);
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    
    try {
        await expenseService.remove(recordToDelete);
        setRecords(records.filter(r => r.id !== recordToDelete));
        showSnackbar('Registro eliminado');
    } catch (error) {
        console.error("Error eliminando:", error);
        showSnackbar('No se pudo eliminar', 'error');
    } finally {
        setOpenConfirmDialog(false);
        setRecordToDelete(null);
    }
  };

  const labelCategory = isPayroll ? "Nombre del Empleado" : "Categoría";
  const labelAdd = isPayroll ? "+ Registrar nuevo empleado..." : "+ Agregar nueva categoría...";
  const placeholderCustom = isPayroll ? "Ej. Juan Pérez" : "Ej. Pintura, Reparación...";
  const placeholderDesc = isPayroll ? "Ej. Sueldo Quincenal, Bono..." : "Ej. Pago recibo CFE Enero";

  return (
    <Box sx={{ p: isMobile ? 1.5 : 3, pb: isMobile ? 10 : 3 }}> 
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={isMobile ? 2 : 3}>
        <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
          <Box sx={{ bgcolor: 'primary.main', color: 'white', p: isMobile ? 0.5 : 1, borderRadius: 2, display: 'flex' }}>
            {React.cloneElement(currentConfig.icon, { fontSize: isMobile ? 'medium' : 'large' })}
          </Box>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="text.primary">
              {currentConfig.title}
            </Typography>
            {!isMobile && (
              <Typography variant="body2" color="text.secondary">
                Registro y control de {isPayroll ? 'pagos a personal' : 'egresos'}
              </Typography>
            )}
          </Box>
        </Box>
        
        {!isMobile && (
          <Button variant="contained" startIcon={<Add />} onClick={handleOpen}>
            {isPayroll ? 'Registrar Pago' : 'Nuevo Gasto'}
          </Button>
        )}
      </Box>

      <Grid container spacing={2} mb={isMobile ? 2 : 4}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderLeft: 5, borderColor: 'error.main', bgcolor: 'background.paper', boxShadow: isMobile ? 1 : 2 }}>
            <CardContent sx={{ p: isMobile ? 2 : undefined, '&:last-child': { pb: isMobile ? 2 : undefined } }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AttachMoney color="error" />
                <Typography variant="subtitle2" color="text.secondary">Total {isPayroll ? 'Pagado' : 'Gastado'}</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="text.primary">
                ${totalGasto.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {records.length === 0 ? (
            <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>
              No hay registros aún.
            </Typography>
          ) : (
            records.map((row) => (
              <Paper key={row.id} elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Chip 
                    label={row.category} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                    icon={isPayroll ? <Groups fontSize="small"/> : <Label fontSize="small"/>} 
                    sx={{ fontWeight: 'bold' }}
                  />
                  <Typography variant="h6" fontWeight="bold" color="error.main">
                    -${parseFloat(row.amount).toFixed(2)}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.primary" sx={{ mb: 1, minHeight: '40px' }}>
                  {row.description || 'Sin descripción'}
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                    <CalendarToday fontSize="inherit" /> {row.date}
                  </Typography>
                  <IconButton 
                    color="error" 
                    size="small" 
                    onClick={() => handleClickDelete(row.id)}
                    sx={{ bgcolor: 'error.light', color: 'error.dark', '&:hover': { bgcolor: 'error.main', color: 'white' } }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            ))
          )}
        </Box>
      ) : (
        <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.selected', color: 'text.primary' }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.selected', color: 'text.primary' }}>{isPayroll ? 'Empleado' : 'Categoría'}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.selected', color: 'text.primary' }}>Descripción</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'action.selected', color: 'text.primary' }}>Monto</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'action.selected', color: 'text.primary' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ color: 'text.primary' }}>{row.date}</TableCell>
                    <TableCell>
                      <Chip 
                          label={row.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                          icon={isPayroll ? <Groups fontSize="small"/> : undefined} 
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>{row.description}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      - ${parseFloat(row.amount).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton color="error" size="small" onClick={() => handleClickDelete(row.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No hay registros aún.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {isMobile && (
        <Fab 
          color="primary" 
          aria-label="add" 
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 70, 
            right: 20,
            boxShadow: 3
          }}
        >
          <Add />
        </Fab>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'text.primary' }}>
          {isPayroll ? 'Registrar Pago' : `Registrar Gasto - ${currentConfig.title}`}
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            
            {!isCustomCategory ? (
                <TextField
                  select
                  label={labelCategory} 
                  fullWidth
                  value={availableCategories.includes(formData.category) ? formData.category : ''}
                  onChange={handleCategoryChange}
                >
                  {availableCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                  <MenuItem value="__NEW__" sx={{ fontStyle: 'italic', color: 'primary.main', fontWeight: 'bold' }}>
                    {labelAdd} 
                  </MenuItem>
                </TextField>
            ) : (
                <Box display="flex" gap={1}>
                   <TextField
                      autoFocus
                      label={labelCategory}
                      fullWidth
                      placeholder={placeholderCustom} 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                   />
                   <IconButton onClick={() => setIsCustomCategory(false)} color="secondary" title="Volver a la lista">
                      <ArrowBack />
                   </IconButton>
                </Box>
            )}

            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={2}
              placeholder={placeholderDesc} 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <TextField
              type="number"
              label="Monto ($)"
              fullWidth
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />

            <TextField
              type="date"
              label="Fecha"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <WarningAmberRounded /> Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary' }}>
            ¿Seguro que deseas eliminar este registro de gasto?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} color="inherit" variant="outlined">Cancelar</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">Eliminar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}