import { useState, useEffect } from 'react';
import { 
  Container, Box, Grid, Paper, Typography, TextField, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, useMediaQuery, useTheme,
  FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Snackbar, Alert, Card, CardActionArea, CardContent, ToggleButtonGroup, ToggleButton, Chip,
  Tabs, Tab 
} from '@mui/material';
import { 
  Delete, ReceiptLong, History, CheckCircle, 
  TableBar, CallSplit, Save, AddCircleOutline, RemoveCircleOutline, Payments, CreditCard, Cancel,
  Restaurant, LocalBar 
} from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';
import SalesHistory from '../components/SalesHistory';
import { printTicket, generateTicketHTML } from '../utils/printTicket';
import { getUsersRequest } from '../services/authService';
import { useThemeMode } from '../context/ThemeContext'; 

const LISTA_MESAS = ['BARRA', 'MESA 1', 'MESA 2', 'MESA 3', 'MESA 4', 'MESA 5', 'VIP'];

export default function POS() {
  const { products, addSale, sales } = useInventory();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); 
  const { mode } = useThemeMode();

  const [searchTerm, setSearchTerm] = useState('');
  // Cambiamos el estado inicial a 0 (0: Botanas, 1: Bebidas) ya que eliminamos "Todo"
  const [menuTab, setMenuTab] = useState(0); 
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0); 
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [vendedoresList, setVendedoresList] = useState([]);
  const [seller, setSeller] = useState('');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); 
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' }); 

  // Estados del Bar
  const [selectedTable, setSelectedTable] = useState('BARRA');
  const [mesasActivas, setMesasActivas] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO'); 
  const [splitPayments, setSplitPayments] = useState(['']); 

  // Estados para manejar la división de cuenta
  const [openSplitDialog, setOpenSplitDialog] = useState(false);
  const [tempSplitWays, setTempSplitWays] = useState(2); 
  const [activeSplit, setActiveSplit] = useState(1); 

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const lista = await getUsersRequest(); 
        if (lista && lista.length > 0) {
          setVendedoresList(lista);
          setSeller(lista[0].username); 
        } else {
          setVendedoresList([{ id: 0, username: 'ADMINISTRADOR' }]);
          setSeller('ADMINISTRADOR');
        }
      } catch (error) {
        setVendedoresList([{ id: 0, username: 'ADMINISTRADOR' }]);
        setSeller('ADMINISTRADOR');
      }
    };
    fetchSellers();
  }, []);

  // Modificación del filtro para mapear las pestañas solicitadas
  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(search) || (p.barcode && p.barcode.toLowerCase().includes(search));
    
    if (!matchesSearch) return false;

    // Filtrado por Pestaña/Categoría
    if (menuTab === 0) {
      // Pestaña 0: Botanas (Muestra alimentos y botanas)
      return p.category === 'Alimentos' || p.category === 'Botanas' || p.category === 'Comida';
    }
    if (menuTab === 1) {
      // Pestaña 1: Bebidas (Se incluye explícitamente Cervezas y Licores)
      return p.category === 'Bebidas' || p.category === 'Bebida' || 
             p.category === 'Cervezas' || p.category === 'Cerveza' || 
             p.category === 'Licores' || p.category === 'Licor';
    }
    
    return true; 
  });

  useEffect(() => {
    setTotal(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0));
  }, [cart]);

  // Actualizar la vista previa
  useEffect(() => {
    const updatePreview = async () => {
        const ticketTotal = activeSplit > 1 ? total / activeSplit : total;
        const ticketCart = activeSplit > 1 
            ? cart.map(item => ({ ...item, price: item.price / activeSplit })) 
            : cart;

        const tempSaleData = {
            id: '---', items: ticketCart, total: ticketTotal, paymentMethod: paymentMethod, seller: seller, date: new Date(), ticketNumber: ''
        };
        const customerInfo = { name: selectedTable, address: activeSplit > 1 ? `Parte 1 de ${activeSplit}` : 'CONSUMO LOCAL', location: '', phone: '' };
        const html = await generateTicketHTML(tempSaleData, customerInfo);
        setPreviewHtml(html);
    };
    updatePreview();
  }, [cart, total, selectedTable, paymentMethod, seller, activeSplit]); 

  const handleTableChange = (newTable) => {
    const mesasActualizadas = { ...mesasActivas, [selectedTable]: cart };
    setMesasActivas(mesasActualizadas);
    setSelectedTable(newTable);
    setCart(mesasActualizadas[newTable] || []);
    setActiveSplit(1); 
    setTempSplitWays(2);
    setSplitPayments(['']); 
  };

  const handleSaveOrder = () => {
    setMesasActivas(prev => ({ ...prev, [selectedTable]: cart }));
    showSnackbar(`✅ Comanda guardada en ${selectedTable}`, "success");
  };

  const addToCart = (product) => {
    if (product.stock <= 0 && product.category !== 'Botanas' && product.category !== 'Alimentos') {
      showSnackbar(`❌ Agotado: ${product.name}`, "error");
      return; 
    }
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock && product.category !== 'Botanas' && product.category !== 'Alimentos') {
        showSnackbar(`⚠️ Stock insuficiente de ${product.name}`, "warning");
        return; 
      }
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      setCart([...cart, { ...product, quantity: 1, price: parseFloat(product.priceRetail) }]);
    }
  };

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) {
        removeFromCart(id);
        return;
    }
    setCart(cart.map(item => item.id === id ? { ...item, quantity: newQty > item.stock && item.category !== 'Botanas' && item.category !== 'Alimentos' ? item.stock : newQty } : item));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  
  const amountToPay = activeSplit > 1 ? total / activeSplit : total;

  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const applySplit = () => {
      setActiveSplit(tempSplitWays);
      setSplitPayments(Array(tempSplitWays).fill('')); 
      setOpenSplitDialog(false);
      showSnackbar(`✅ Cuenta dividida en ${tempSplitWays} partes`, 'info');
  };

  const cancelSplit = () => {
      setActiveSplit(1);
      setTempSplitWays(2);
      setSplitPayments(['']); 
      showSnackbar(`ℹ️ División de cuenta cancelada`, 'info');
  };

  const handleFinalConfirmCheckout = async () => {
    const customer = { name: selectedTable, address: 'LOCAL', location: '', phone: '' };
    
    // --- NUEVO: Cálculo de montos reales para guardar en la base de datos ---
    let finalAmountPaid = total;
    let finalChange = 0;

    if (paymentMethod === 'EFECTIVO') {
      if (activeSplit > 1) {
        // Si está dividido, sumamos el efectivo ingresado por cada persona
        finalAmountPaid = splitPayments.reduce((acc, current) => acc + (parseFloat(current) || (total / activeSplit)), 0);
        finalChange = finalAmountPaid - total;
      } else {
        // Cuenta normal individual
        finalAmountPaid = parseFloat(splitPayments[0]) || total;
        finalChange = finalAmountPaid - total;
      }
    }
    if (finalChange < 0) finalChange = 0; // Evitar cambios negativos visuales
    // ----------------------------------------------------------------------

    const splitLabel = activeSplit > 1 ? `DIV-${activeSplit}` : '';
    
    // AGREGAMOS finalAmountPaid Y finalChange AL METODO addSale PARA QUE SE GUARDEN EN EL HISTORIAL
    const success = await addSale(
      cart, 
      total, 
      customer, 
      seller, 
      paymentMethod, 
      splitLabel, 
      finalAmountPaid, 
      finalChange
    ); 
    
    if (success) {
        if (activeSplit > 1) {
            const splitTotal = total / activeSplit;
            const splitCart = cart.map(item => ({ ...item, price: item.price / activeSplit }));

            for (let i = 1; i <= activeSplit; i++) {
                const splitCustomerInfo = { ...customer, address: `División: Pago ${i} de ${activeSplit}` };
                const currentAmountPaid = paymentMethod === 'TARJETA' ? splitTotal : (parseFloat(splitPayments[i - 1]) || splitTotal);
                const currentChange = currentAmountPaid - splitTotal;
                
                const splitSaleData = {
                    ...splitCustomerInfo, seller, paymentMethod, items: splitCart, total: splitTotal, 
                    amountPaid: currentAmountPaid, 
                    change: currentChange > 0 ? currentChange : 0, date: new Date(), 
                    splitWays: activeSplit, splitAmount: splitTotal 
                };

                // NUEVO: Agregamos también amountPaid y change al record que se procesa para la impresión
                const splitSaleRecord = { 
                    id: `TICKET-${i}`, date: new Date(), items: splitCart, total: splitTotal,
                    paymentMethod: paymentMethod, seller: seller,
                    amountPaid: currentAmountPaid,
                    change: currentChange > 0 ? currentChange : 0
                };
                
                printTicket(splitSaleRecord, splitSaleData);
            }
        } else {
            const currentAmountPaid = paymentMethod === 'TARJETA' ? total : (parseFloat(splitPayments[0]) || total);
            const currentChange = currentAmountPaid - total;

            const saleData = {
                ...customer, seller, paymentMethod, items: cart, total: total, amountPaid: currentAmountPaid, 
                change: currentChange > 0 ? currentChange : 0, date: new Date()
            };
            
            // NUEVO: Agregamos amountPaid y change al record de la cuenta única
            const saleRecord = { 
                id: "COMPLETADO", date: new Date(), items: cart, total: total,
                paymentMethod: paymentMethod, seller: seller,
                amountPaid: currentAmountPaid,
                change: currentChange > 0 ? currentChange : 0
            };
            printTicket(saleRecord, saleData);
        }
        
        const nuevasMesas = {...mesasActivas};
        delete nuevasMesas[selectedTable];
        setMesasActivas(nuevasMesas);

        setCart([]); setTotal(0); setSplitPayments(['']); setPaymentMethod('EFECTIVO'); 
        setActiveSplit(1); setTempSplitWays(2);
        setOpenConfirmDialog(false);
        showSnackbar(activeSplit > 1 ? `✅ Mesa cobrada y ${activeSplit} tickets impresos` : "✅ Mesa cobrada y liberada", "success");
    } else {
        setOpenConfirmDialog(false);
        showSnackbar("❌ Error al registrar cobro en el sistema", "error");
    }
  };

  const themeColors = {
    bg: mode === 'dark' ? '#121212' : '#f0f2f5',
    paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
    headerRow: mode === 'dark' ? '#333' : '#f5f5f5',
    totalBox: mode === 'dark' ? '#1e3a5f' : '#e3f2fd',
  };

  const handlePaymentChange = (index, value) => {
    const newPayments = [...splitPayments];
    newPayments[index] = value;
    setSplitPayments(newPayments);
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ 
      height: isMobile ? 'auto' : 'calc(100vh - 85px)', 
      p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: themeColors.bg
    }}>
      
      <Grid container spacing={2} sx={{ height: '100%', width: '100%', m: 0 }}>
        
        {/* COLUMNA 1: MENÚ */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ height: isMobile ? '500px' : '100%', pl: '0 !important', display: 'flex', flexDirection: 'column' }}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, bgcolor: themeColors.paper }}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">📖 Menú</Typography>
            
            <TextField placeholder="Buscar producto..." variant="outlined" size="small" fullWidth value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mb: 1.5, '& .MuiInputBase-root': { borderRadius: 3 } }} />
            
            {/* Se removió la pestaña 'Todo', ahora solo muestra Botanas y Bebidas */}
            <Tabs 
              value={menuTab} 
              onChange={(e, newValue) => setMenuTab(newValue)} 
              variant="fullWidth" 
              indicatorColor="primary"
              textColor="primary"
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<Restaurant fontSize="small" />} iconPosition="start" label="Botanas" sx={{ fontWeight: 'bold', fontSize: '13px' }} />
              <Tab icon={<LocalBar fontSize="small" />} iconPosition="start" label="Bebidas" sx={{ fontWeight: 'bold', fontSize: '13px' }} />
            </Tabs>
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
              <Grid container spacing={1.5}>
                {filteredProducts.map((prod) => {
                  const isAgotado = prod.stock <= 0 && prod.category !== 'Botanas' && prod.category !== 'Alimentos';
                  return (
                    <Grid size={{ xs: 6 }} key={prod.id}>
                        <Card elevation={isAgotado ? 0 : 2} sx={{ borderRadius: 2, bgcolor: isAgotado ? 'action.hover' : 'background.paper', opacity: isAgotado ? 0.6 : 1 }}>
                            <CardActionArea onClick={() => isAgotado ? null : addToCart(prod)} sx={{ height: '100px', p: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Typography variant="subtitle2" fontWeight="bold" textAlign="center" sx={{ lineHeight: 1.2, mb: 0.5 }}>{prod.name}</Typography>
                                <Typography variant="h6" color="primary" fontWeight="bold">${parseFloat(prod.priceRetail).toFixed(2)}</Typography>
                            </CardActionArea>
                        </Card>
                    </Grid>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <Box width="100%" textAlign="center" py={4}>
                    <Typography color="text.secondary">No se encontraron productos en esta sección.</Typography>
                  </Box>
                )}
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* COLUMNA 2: COMANDA */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ height: isMobile ? 'auto' : '100%', pt: '0 !important', display: 'flex', flexDirection: 'column' }}> 
          <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, bgcolor: themeColors.paper }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold" color="secondary">📝 Orden: {selectedTable}</Typography>
              <Button size="small" variant="text" startIcon={<History />} onClick={() => setHistoryOpen(true)}>Historial</Button>
            </Box>
            
            <TableContainer sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
              <Table stickyHeader size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight:'bold', bgcolor: themeColors.headerRow, borderRadius: '8px 0 0 8px' }}>Producto</TableCell>
                    <TableCell align="center" sx={{ fontWeight:'bold', bgcolor: themeColors.headerRow }}>Cant.</TableCell>
                    <TableCell align="right" sx={{ fontWeight:'bold', bgcolor: themeColors.headerRow, borderRadius: '0 8px 8px 0' }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ py: 1.5 }}> 
                        <Typography variant="body2" fontWeight="bold">{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">${item.price} c/u</Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.5 }}>
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                            <IconButton size="small" color="error" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                {item.quantity === 1 ? <Delete /> : <RemoveCircleOutline />}
                            </IconButton>
                            <Typography fontWeight="bold" sx={{ width: '25px', textAlign: 'center' }}>{item.quantity}</Typography>
                            <IconButton size="small" color="primary" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                <AddCircleOutline />
                            </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.5, fontWeight:'bold', fontSize: '16px' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ p: 2, bgcolor: themeColors.totalBox, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {activeSplit > 1 && (
                 <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip label={`Dividido en ${activeSplit} partes`} color="info" size="small" sx={{ fontWeight: 'bold' }} onDelete={cancelSplit}/>
                    <Typography variant="h6" fontWeight="bold" color="text.secondary">Total Real: ${total.toFixed(2)}</Typography>
                 </Box>
              )}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">{activeSplit > 1 ? "PAGO POR PERSONA" : "TOTAL MESA"}</Typography>
                    <Typography variant="body2" color="text.secondary">{cart.length} Artículos</Typography>
                </Box>
                <Typography variant="h3" fontWeight="900" color="primary">${amountToPay.toFixed(2)}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* COLUMNA 3: COBRO */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ height: isMobile ? 'auto' : '100%', pt: '0 !important', display: 'flex', flexDirection: 'column' }}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, bgcolor: themeColors.paper, overflowY: 'auto' }}>
            
            <FormControl fullWidth size="large" sx={{ mb: 3 }}>
              <InputLabel sx={{ fontWeight: 'bold' }}><TableBar sx={{mr:1, verticalAlign:'middle'}}/> Seleccionar Mesa</InputLabel>
              <Select value={selectedTable} label="Seleccionar Mesa" onChange={(e) => handleTableChange(e.target.value)} sx={{fontSize:'18px', fontWeight: 'bold', borderRadius: 3}}>
                {LISTA_MESAS.map((mesa) => (
                  <MenuItem key={mesa} value={mesa} sx={{fontSize:'16px', py: 1.5}}>
                    {mesa} {mesasActivas[mesa] && mesasActivas[mesa].length > 0 ? " 🟢 (Ocupada)" : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box display="flex" gap={2} mb={3}>
                <Button variant="contained" color="warning" size="large" fullWidth startIcon={<Save />} onClick={handleSaveOrder} disabled={cart.length === 0} sx={{ py: 2, borderRadius: 3, fontWeight: 'bold' }}>
                  GUARDAR ORDEN
                </Button>
                <Button variant="contained" color="info" size="large" fullWidth startIcon={<CallSplit />} onClick={() => setOpenSplitDialog(true)} disabled={total === 0} sx={{ py: 2, borderRadius: 3, fontWeight: 'bold' }}>
                  DIVIDIR
                </Button>
            </Box>

            <Typography variant="subtitle2" gutterBottom color="text.secondary" fontWeight="bold">MÉTODO DE PAGO</Typography>
            <ToggleButtonGroup value={paymentMethod} exclusive onChange={(e, val) => val && setPaymentMethod(val)} fullWidth sx={{ mb: 3 }}>
                <ToggleButton value="EFECTIVO" sx={{ py: 1.5, fontWeight: 'bold' }}><Payments sx={{mr:1}}/> Efectivo</ToggleButton>
                <ToggleButton value="TARJETA" sx={{ py: 1.5, fontWeight: 'bold' }}><CreditCard sx={{mr:1}}/> Tarjeta</ToggleButton>
            </ToggleButtonGroup>

            {/* SECCIÓN DINÁMICA DE PAGOS */}
            {paymentMethod === 'EFECTIVO' && (
              <Box mb={2} sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {Array.from({ length: activeSplit }).map((_, index) => {
                  const currentTotal = total / activeSplit;
                  const currentPaid = parseFloat(splitPayments[index]) || 0;
                  const currentChange = currentPaid - currentTotal;

                  return (
                    <Box key={index} mb={2} p={2} sx={{ bgcolor: mode === 'dark' ? '#2c2c2c' : '#f9f9f9', borderRadius: 3 }}>
                      <Typography variant="subtitle2" mb={1} fontWeight="bold" color="text.secondary">
                        {activeSplit > 1 ? `PERSONA ${index + 1} (Paga: $${currentTotal.toFixed(2)})` : `¿CON CUÁNTO PAGAN?`}
                      </Typography>
                      <TextField 
                        type="number" 
                        value={splitPayments[index]} 
                        onChange={(e) => handlePaymentChange(index, e.target.value)} 
                        size="large" fullWidth color="success" placeholder="$ 0.00" 
                        InputProps={{ sx: { fontSize: 20, fontWeight: 'bold', borderRadius: 2, bgcolor: themeColors.paper } }} 
                      />
                      {splitPayments[index] && (
                        <Typography variant="body1" sx={{ mt: 1, textAlign:'center', fontWeight:'bold', color: currentChange >= 0 ? '#2e7d32' : '#d32f2f' }}>
                            Cambio: ${currentChange.toFixed(2)}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}

            <Box sx={{ mt: 'auto', pt: 2 }}>
                <Button variant="contained" color="success" fullWidth size="large" onClick={() => setOpenConfirmDialog(true)} disabled={cart.length === 0} sx={{ py: 2.5, fontSize: '18px', fontWeight: '900', borderRadius: 3, boxShadow: '0px 8px 20px rgba(76, 175, 80, 0.4)' }}>
                {activeSplit > 1 ? `COBRAR (${activeSplit} de $${amountToPay.toFixed(2)})` : `COBRAR $${total.toFixed(2)}`}
                </Button>
            </Box>

          </Paper>
        </Grid>

      </Grid>
      
      {/* MODAL DIVIDIR CUENTA */}
      <Dialog open={openSplitDialog} onClose={() => setOpenSplitDialog(false)} PaperProps={{ sx: { borderRadius: 3, minWidth: '350px' } }}>
        <DialogTitle sx={{ color: '#0288d1', display:'flex', alignItems:'center', gap:1, fontWeight: 'bold' }}><CallSplit/> Dividir Cuenta ({selectedTable})</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" gutterBottom color="text.secondary">Total de la mesa: <b>${total.toFixed(2)}</b></Typography>
            <Box display="flex" alignItems="center" justifyContent="center" gap={3} my={3}>
                <IconButton color="primary" onClick={() => setTempSplitWays(s => Math.max(2, s - 1))} sx={{ border: '2px solid' }}><RemoveCircleOutline fontSize="large"/></IconButton>
                <Typography variant="h4" fontWeight="bold">{tempSplitWays}</Typography>
                <IconButton color="primary" onClick={() => setTempSplitWays(s => s + 1)} sx={{ border: '2px solid' }}><AddCircleOutline fontSize="large"/></IconButton>
            </Box>
            <Paper elevation={0} sx={{ p: 3, bgcolor: '#e1f5fe', borderRadius: 3 }}>
                <Typography variant="body1" fontWeight="bold" color="text.secondary">Imprimir {tempSplitWays} tickets por:</Typography>
                <Typography variant="h2" color="primary" fontWeight="900">${(total / tempSplitWays).toFixed(2)}</Typography>
            </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button size="large" onClick={cancelSplit} color="error" sx={{ borderRadius: 2 }}>Quitar</Button>
            <Button size="large" variant="contained" onClick={applySplit} color="info" sx={{ borderRadius: 2 }}>Aplicar</Button>
        </DialogActions>
      </Dialog>

      <SalesHistory open={historyOpen} onClose={() => setHistoryOpen(false)} sales={sales} />

      {/* MODAL CONFIRMAR COBRO */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#2e7d32', fontWeight: 'bold' }}>
            <CheckCircle /> Confirmar Cobro
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
            <DialogContentText sx={{ fontSize: '18px' }}>
                ¿Deseas cerrar la <b>{selectedTable}</b> y registrar el pago en <b>{paymentMethod}</b>?<br/><br/>
                {activeSplit > 1 ? (
                  <>Se emitirán <b>{activeSplit} tickets separados</b> por <b>${amountToPay.toFixed(2)}</b> cada uno.</>
                ) : (
                  <>Total a cobrar: <b>${total.toFixed(2)}</b>.</>
                )}
            </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button size="large" onClick={() => setOpenConfirmDialog(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancelar</Button>
            <Button size="large" onClick={handleFinalConfirmCheckout} variant="contained" color="success" autoFocus sx={{ borderRadius: 2, fontWeight: 'bold' }}>SÍ, COBRAR</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2, fontSize: '16px', alignItems: 'center' }}>{snackbar.message}</Alert>
      </Snackbar>

      <iframe srcDoc={previewHtml} title="Impresion" style={{ display: 'none' }} />
    </Container>
  );
}