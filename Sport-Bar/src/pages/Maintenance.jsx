import React, { useState } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, TextField, MenuItem, DialogActions,
  Tabs, Tab, useTheme, useMediaQuery, Fab, IconButton
} from '@mui/material';
import { Add, LocalGasStation, Build, CarRepair, Delete } from '@mui/icons-material';
import { useMaintenance } from '../context/MaintenanceContext';

export default function Maintenance() {
  const { records, addRecord, deleteRecord } = useMaintenance();
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0); 
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    vehicle: '',
    type: 'servicio',
    description: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    mileage: ''
  });

  const handleSubmit = () => {
    addRecord(formData);
    setOpen(false);
    setFormData({ 
        vehicle: '', 
        type: 'servicio', 
        description: '', 
        cost: '', 
        date: new Date().toISOString().split('T')[0],
        mileage: ''
    }); 
  };

  const totalGeneral = records.reduce((acc, curr) => acc + parseFloat(curr.cost || 0), 0);
  const totalCombustible = records.filter(r => r.type === 'combustible').reduce((acc, curr) => acc + parseFloat(curr.cost || 0), 0);
  const totalServicios = records.filter(r => r.type === 'servicio').reduce((acc, curr) => acc + parseFloat(curr.cost || 0), 0);
  const totalRefacciones = records.filter(r => r.type === 'refaccion').reduce((acc, curr) => acc + parseFloat(curr.cost || 0), 0);

  const getFilteredRecords = () => {
    if (tabValue === 0) return records;
    if (tabValue === 1) return records.filter(r => r.type === 'combustible');
    if (tabValue === 2) return records.filter(r => r.type === 'servicio');
    if (tabValue === 3) return records.filter(r => r.type === 'refaccion');
    return records;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: { xs: 8, md: 3 } }}> 
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="primary">
          Control de Flotilla
        </Typography>
        <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => setOpen(true)}
            sx={{ display: { xs: 'none', sm: 'flex' } }} 
        >
          Registrar Gasto
        </Button>
      </Box>

      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#1976d2', color: 'white', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2">Gasto Total Global</Typography>
              <Typography variant="h4" fontWeight="bold">${totalGeneral.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <LocalGasStation color="error" />
                <Typography variant="subtitle2" color="textSecondary">Combustible</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">${totalCombustible.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Build color="warning" />
                <Typography variant="subtitle2" color="textSecondary">Servicios</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">${totalServicios.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CarRepair color="success" />
                <Typography variant="subtitle2" color="textSecondary">Refacciones</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">${totalRefacciones.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, val) => setTabValue(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable" 
          scrollButtons="auto" 
          allowScrollButtonsMobile 
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Todo" />
          <Tab label="Combustible" icon={<LocalGasStation />} iconPosition="start" />
          <Tab label="Servicios" icon={<Build />} iconPosition="start" />
          <Tab label="Refacciones" icon={<CarRepair />} iconPosition="start" />
        </Tabs>

        <TableContainer sx={{ maxHeight: 440, overflowX: 'auto' }}>
          <Table stickyHeader size={isMobile ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Vehículo</TableCell>
                
                
                {tabValue === 1 && (
                    <TableCell sx={{ fontWeight: 'bold' }}>Kilometraje</TableCell>
                )}

                <TableCell sx={{ fontWeight: 'bold' }}>Concepto</TableCell>
                <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' } }}>Tipo</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Costo</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredRecords().map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.date}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{row.vehicle}</Typography>
                    {isMobile && (
                        <Typography variant="caption" display="block" color="text.secondary">
                            {row.type.toUpperCase()}
                        </Typography>
                    )}
                  </TableCell>

                  {tabValue === 1 && (
                    <TableCell>
                        {row.mileage ? `${row.mileage} km` : '-'}
                    </TableCell>
                  )}

                  <TableCell sx={{ minWidth: '150px' }}>{row.description}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Chip 
                      label={row.type.toUpperCase()} 
                      size="small"
                      color={
                        row.type === 'combustible' ? 'error' : 
                        row.type === 'servicio' ? 'warning' : 'success'
                      } 
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    ${parseFloat(row.cost).toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="error" size="small" onClick={() => {
                        if(window.confirm('¿Borrar registro?')) deleteRecord(row.id)
                    }}>
                      <Delete fontSize="small"/>
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {getFilteredRecords().length === 0 && (
                <TableRow>
                  <TableCell colSpan={tabValue === 1 ? 7 : 6} align="center" sx={{ py: 3 }}>
                    No hay registros en esta categoría
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Fab 
        color="primary" 
        aria-label="add" 
        onClick={() => setOpen(true)}
        sx={{ 
            position: 'fixed', 
            bottom: 20, 
            right: 20, 
            display: { xs: 'flex', sm: 'none' }, 
            zIndex: 1000
        }}
      >
        <Add />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Nuevo Registro de Mantenimiento</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField 
                label="Vehículo" 
                fullWidth 
                value={formData.vehicle}
                onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                placeholder="Ej. Nissan NP300 Roja"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                select 
                label="Tipo de Gasto" 
                fullWidth 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <MenuItem value="servicio">Servicio / Mantenimiento</MenuItem>
                <MenuItem value="refaccion">Refacción</MenuItem>
                <MenuItem value="combustible">Combustible</MenuItem>
              </TextField>
            </Grid>
            
            {formData.type === 'combustible' && (
              <Grid item xs={12} sm={6}>
                <TextField 
                  type="number" 
                  label="Kilometraje Actual (KM)" 
                  fullWidth 
                  value={formData.mileage}
                  onChange={(e) => setFormData({...formData, mileage: e.target.value})}
                  placeholder="Ej. 125000"
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField 
                type="date" 
                label="Fecha" 
                fullWidth 
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label="Descripción / Concepto" 
                fullWidth 
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Ej. Cambio de aceite, Compra de llanta..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                type="number" 
                label="Costo Total ($)" 
                fullWidth 
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="error">Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}