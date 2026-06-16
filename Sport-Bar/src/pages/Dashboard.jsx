import React, { useMemo, useState } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, 
  Card, CardContent, Divider, useTheme, CircularProgress, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, 
  Snackbar, Alert, MenuItem, Select, FormControl, InputLabel 
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  AttachMoney, TrendingUp, Inventory, CalendarMonth, 
  DeleteForever, WarningAmberRounded, FilterAlt, LocalBar, Restaurant, WineBar
} from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';
import { format, subDays, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

import { resetHistoryService } from '../services/saleService'; 

export default function Dashboard() {
  const { sales, products, loadSales } = useInventory(); 
  const theme = useTheme();

  const [openDialog, setOpenDialog] = useState(false); 
  const [loadingReset, setLoadingReset] = useState(false); 
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' }); 
  const [timeFilter, setTimeFilter] = useState('week'); 

  const handleOpenConfirm = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  const handleConfirmReset = async () => {
    setLoadingReset(true);
    try {
        await resetHistoryService();
        if(loadSales) await loadSales();
        
        setOpenDialog(false);
        setSnackbar({ 
            open: true, 
            message: '✅ Sistema reiniciado (Corte de caja limpio).', 
            severity: 'success' 
        });
        setTimeout(() => { window.location.reload(); }, 1500);
    } catch (error) {
        console.error(error);
        setOpenDialog(false);
        setSnackbar({ 
            open: true, 
            message: '❌ Error al reiniciar.', 
            severity: 'error' 
        });
    } finally {
        setLoadingReset(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
 
  const stats = useMemo(() => {
    const today = new Date();
    
    let startDate, endDate;
    if (timeFilter === 'week') {
        startDate = startOfWeek(today, { weekStartsOn: 1 }); 
        endDate = endOfWeek(today, { weekStartsOn: 1 });
    } else if (timeFilter === 'month') {
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
    } else { 
        startDate = new Date(2000, 0, 1); 
        endDate = new Date(2100, 0, 1);
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      return {
        date: d,
        label: format(d, 'EEE dd', { locale: es }),
        ventas: 0, costo: 0, ganancia: 0
      };
    });

    let totalVentasGlobal = 0;
    let totalCostoMercancia = 0;
    let ventasHoy = 0;

    const ventasPorCategoriaBar = {
      cervezas: 0,
      licores: 0,
      botanas: 0,
      otros: 0
    };

    const currentProducts = Array.isArray(products) ? products : [];

    if (sales && Array.isArray(sales)) {
        sales.forEach(sale => {
            const dateString = sale.createdAt || sale.date || new Date();
            const saleDate = new Date(dateString);
            
            const isWithinFilterRange = isWithinInterval(saleDate, { start: startDate, end: endDate });
            const productsList = sale.SaleItems || sale.items || [];

            let saleCost = 0;
            let saleTotal = parseFloat(sale.total) || 0; 

            productsList.forEach(item => {
                const price = parseFloat(item.price) || 0;
                const quantity = parseInt(item.quantity) || 1;
                let unitCost = 0;
                
                const idToSearch = item.ProductId || item.id;
                const productInDb = currentProducts.find(p => String(p.id) === String(idToSearch));

                if (productInDb && productInDb.cost) {
                    unitCost = parseFloat(productInDb.cost);
                } else if (item.cost) {
                    unitCost = parseFloat(item.cost);
                } else {
                    unitCost = price * 0.40; 
                }
                
                const itemTotalCost = unitCost * quantity;
                const itemTotalRevenue = price * quantity;
                saleCost += itemTotalCost;

                if (isWithinFilterRange) {
                  const catText = (productInDb?.category || 'otros').toLowerCase();
                  
                  if (catText.includes('cerveza') || catText.includes('beer')) {
                    ventasPorCategoriaBar.cervezas += itemTotalRevenue;
                  } else if (catText.includes('licor') || catText.includes('botella') || catText.includes('trago') || catText.includes('coctel') || catText.includes('vino')) {
                    ventasPorCategoriaBar.licores += itemTotalRevenue;
                  } else if (catText.includes('botana') || catText.includes('alimento') || catText.includes('comida') || catText.includes('snack')) {
                    ventasPorCategoriaBar.botanas += itemTotalRevenue;
                  } else {
                    ventasPorCategoriaBar.otros += itemTotalRevenue;
                  }
                }
            });

            const saleProfit = saleTotal - saleCost;
            
            if (isWithinFilterRange) {
                totalVentasGlobal += saleTotal;
                totalCostoMercancia += saleCost;
            }

            if (isSameDay(saleDate, today)) {
                ventasHoy += saleTotal;
            }

            const dayStat = last7Days.find(d => isSameDay(d.date, saleDate));
            if (dayStat) {
                dayStat.ventas += saleTotal;
                dayStat.costo += saleCost;
                dayStat.ganancia += saleProfit;
            }
        });
    }

    const pieCategoriasData = [
      { name: 'Cervezas', value: ventasPorCategoriaBar.cervezas, color: '#ffb300' }, 
      { name: 'Licores / Copas', value: ventasPorCategoriaBar.licores, color: '#8e24aa' }, 
      { name: 'Botanas / Cocina', value: ventasPorCategoriaBar.botanas, color: '#f4511e' }, 
      { name: 'Otros', value: ventasPorCategoriaBar.otros, color: '#757575' }
    ].filter(cat => cat.value > 0);

    const utilidadBruta = totalVentasGlobal - totalCostoMercancia;

    return {
      chartData: last7Days,
      totalVentas: totalVentasGlobal,
      totalCostoMercancia: totalCostoMercancia,
      utilidadBruta: utilidadBruta,
      ventasHoy,
      pieCategoriasData,
      filterLabel: timeFilter === 'week' ? 'Esta Semana' : timeFilter === 'month' ? 'Este Mes' : 'Histórico General'
    };
  }, [sales, products, timeFilter]); 

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={3} gap={2}>
         <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
                Dashboard - Cazadores Sport Bar🍻
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Rendimiento financiero y de inventarios: <b>{stats.filterLabel}</b>
            </Typography>
         </Box>
         
         <Box display="flex" gap={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="time-filter-label" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FilterAlt fontSize="small" /> Filtro
                </InputLabel>
                <Select
                    labelId="time-filter-label"
                    value={timeFilter}
                    label="Filtro de Tiempo"
                    onChange={(e) => setTimeFilter(e.target.value)}
                    sx={{ bgcolor: 'background.paper' }}
                >
                    <MenuItem value="week">Esta Semana</MenuItem>
                    <MenuItem value="month">Este Mes</MenuItem>
                    <MenuItem value="all">Todo Histórico</MenuItem>
                </Select>
            </FormControl>

            <Button 
                variant="outlined" color="error" startIcon={<DeleteForever />}
                onClick={handleOpenConfirm} 
                sx={{ fontWeight: 'bold', borderColor: '#ef5350', color: '#ef5350' }}
            >
                Corte de Caja
            </Button>
         </Box>
      </Box>

      {/* METRICAS PRINCIPALES */}
      <Grid container spacing={3} mb={2}>
        <Grid item xs={12} sm={4} md={4}>
          <KPICard title="Venta Bruta en Barra" value={stats.totalVentas} icon={<AttachMoney fontSize="large" />} color={theme.palette.success.main} subtitle="Total ingresado en caja" />
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <KPICard title="Costo de Insumos" value={stats.totalCostoMercancia} icon={<Inventory fontSize="large" />} color={theme.palette.warning.main} subtitle="Inversión en lo vendido" />
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <KPICard title="Utilidad Bruta Estimada" value={stats.utilidadBruta} icon={<TrendingUp fontSize="large" />} color={theme.palette.primary.main} subtitle="Ganancia sobre productos" />
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Paper elevation={1} sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: theme.palette.mode === 'dark' ? 'rgba(2, 136, 209, 0.1)' : '#e3f2fd', borderLeft: `4px solid ${theme.palette.info.main}` }}>
          <Box display="flex" alignItems="center" gap={2}>
            <CalendarMonth color="info" />
            <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
              Corte Jornada: {format(new Date(), "dd 'de' MMMM", { locale: es })}
            </Typography>
          </Box>
          <Chip label={`Ventas de Hoy: $${stats.ventasHoy.toFixed(2)}`} color="info" sx={{ fontWeight: 'bold', fontSize: '1rem' }} />
        </Paper>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, height: '400px', display:'flex', flexDirection:'column' }}>
            <Typography variant="h6" gutterBottom color="text.secondary">Flujo Diario de Caja y Costos (Últimos 7 días)</Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} contentStyle={{ backgroundColor: '#fff', borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="ventas" name="Ventas ($)" fill="#4caf50" radius={[4, 4, 0, 0]} />
                <Bar dataKey="costo" name="Costo Bebida/Comida" fill="#ff9800" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom color="text.secondary">¿Qué se vende más en el Bar?</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box flexGrow={1} sx={{ height: 200 }}>
              {stats.pieCategoriasData.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography color="text.secondary">Sin registros de ventas en este periodo</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieCategoriasData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={3} dataKey="value"
                      label={({percent}) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.pieCategoriasData.map((entry, index) => (
                        <Cell key={`cell-bar-cat-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
            
            <Box display="flex" justifyContent="space-around" mt={1} bgcolor="action.hover" p={1.5} borderRadius={2}>
              <Box textAlign="center">
                <LocalBar sx={{ color: '#ffb300' }} />
                <Typography variant="caption" display="block">Cervezas</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${stats.pieCategoriasData.find(c => c.name === 'Cervezas')?.value.toLocaleString('en-US', {maximumFractionDigits:0}) || 0}
                </Typography>
              </Box>
              <Box textAlign="center">
                <WineBar sx={{ color: '#8e24aa' }} />
                <Typography variant="caption" display="block">Licores</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${stats.pieCategoriasData.find(c => c.name === 'Licores / Copas')?.value.toLocaleString('en-US', {maximumFractionDigits:0}) || 0}
                </Typography>
              </Box>
              <Box textAlign="center">
                <Restaurant sx={{ color: '#f4511e' }} />
                <Typography variant="caption" display="block">Botanas</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${stats.pieCategoriasData.find(c => c.name === 'Botanas / Cocina')?.value.toLocaleString('en-US', {maximumFractionDigits:0}) || 0}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
          <WarningAmberRounded fontSize="large" />
          {"¿Efectuar corte y reinicio de Turno?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esto archivará/eliminará las ventas actuales para arrancar una nueva jornada en <b>$0.00</b>. Asegúrate de haber impreso tus reportes.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} color="primary" variant="outlined">Cancelar</Button>
          <Button 
            onClick={handleConfirmReset} 
            color="error" variant="contained" 
            disabled={loadingReset}
            startIcon={loadingReset ? <CircularProgress size={20} color="inherit"/> : <DeleteForever />}
          >
            {loadingReset ? "Limpiando..." : "Sí, Reiniciar Caja"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Container>
  );
}

function KPICard({ title, value, icon, color, subtitle }) {
  return (
    <Card elevation={2} sx={{ height: '100%', borderLeft: `5px solid ${color}` }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="overline" fontWeight="bold">{title}</Typography>
            <Typography variant="h4" component="div" fontWeight="800" sx={{ color: 'text.primary' }}>
              ${value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>{subtitle}</Typography>
          </Box>
          <Box sx={{ bgcolor: `${color}20`, p: 1.5, borderRadius: '50%', color: color, display: 'flex' }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}