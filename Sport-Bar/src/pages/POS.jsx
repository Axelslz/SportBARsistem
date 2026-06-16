import { useState, useEffect } from 'react';
import { 
  Container, Box, Grid, Paper, Typography, TextField, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, useMediaQuery, useTheme,
  FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Snackbar, Alert, Card, CardActionArea, CardContent, ToggleButtonGroup, ToggleButton, Chip,
  Tabs, Tab, InputAdornment 
} from '@mui/material';
import { 
  Delete, ReceiptLong, History, CheckCircle, 
  TableBar, CallSplit, Save, AddCircleOutline, RemoveCircleOutline, Payments, CreditCard, Cancel,
  Restaurant, LocalBar, AccountBalanceWallet, Print, LockOpen, Lock, PointOfSale
} from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';
import SalesHistory from '../components/SalesHistory';
import { printTicket, printPreAccount, generateTicketHTML, printCashDrawerClosing } from '../utils/printTicket';
import { useThemeMode } from '../context/ThemeContext'; 

import { useAuth } from '../context/AuthContext';
import { saveActiveTableService, getActiveTablesService, clearActiveTableService } from '../services/saleService';

const LISTA_MESAS = ['MESA 1', 'MESA 2', 'MESA 3', 'MESA 4', 'MESA 5', 'MESA 6', 'MESA 7', 'MESA 8', 'MESA 9', 'MESA 10'];

export default function POS() {
  const { products, addSale, sales, cashDrawer, startCashSession, closeCashSession } = useInventory();
  const { user } = useAuth(); 
  const isAdmin = user?.role === 'admin'; 

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); 
  const { mode } = useThemeMode();

  const [searchTerm, setSearchTerm] = useState('');
  const [menuTab, setMenuTab] = useState(0); 
  const [subCategory, setSubCategory] = useState('Cervezas');
  
  const [mesasActivas, setMesasActivas] = useState({});
  const [cart, setCart] = useState([]);

  const [tipMode, setTipMode] = useState(''); 
  const [tipAmount, setTipAmount] = useState(''); 
  const [openStartBox, setOpenStartBox] = useState(false);
  const [initialCashInput, setInitialCashInput] = useState('');
  const [openCloseBox, setOpenCloseBox] = useState(false);

  const [selectedTable, setSelectedTable] = useState('BARRA');
  
  const [total, setTotal] = useState(0); 
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); 
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' }); 

  const sellerName = user?.username || user?.name || 'CAJA / MESERO';

  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO'); 
  const [splitPayments, setSplitPayments] = useState(['']); 
  const [splitMethods, setSplitMethods] = useState(['EFECTIVO']); 

  const [openSplitDialog, setOpenSplitDialog] = useState(false);
  const [tempSplitWays, setTempSplitWays] = useState(2); 
  const [activeSplit, setActiveSplit] = useState(1); 
  const [portionDialog, setPortionDialog] = useState({ open: false, product: null });
  const [flippedCardId, setFlippedCardId] = useState(null);

  const fetchActiveTables = async () => {
    try {
      const data = await getActiveTablesService();
      const tableMap = {};
      data.forEach(t => { 
        let parsedCart = t.cart;
        if (typeof parsedCart === 'string') {
          try { parsedCart = JSON.parse(parsedCart); } catch (e) { parsedCart = []; }
        }
        tableMap[t.tableName] = { cart: parsedCart || [], waiter: t.waiter }; 
      });
      setMesasActivas(tableMap);
    } catch (error) { console.error("Error obteniendo mesas activas:", error); }
  };

  useEffect(() => {
    fetchActiveTables(); 
    const interval = setInterval(fetchActiveTables, 5000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tipMode === '10') setTipAmount((total * 0.10).toFixed(2));
    else if (tipMode === '20') setTipAmount((total * 0.20).toFixed(2));
    else if (tipMode === '30') setTipAmount((total * 0.30).toFixed(2));
  }, [total, tipMode]);

  const handleManualTipChange = (val) => { setTipMode('custom'); setTipAmount(val); };

  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(search) || (p.barcode && p.barcode.toLowerCase().includes(search));
    if (!matchesSearch) return false;
    if (menuTab === 0) return ['Alimentos', 'Botanas'].includes(p.category);
    if (menuTab === 1) return p.category === subCategory;
    return false; 
  });

  useEffect(() => { setTotal(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)); }, [cart]);

  useEffect(() => {
    const updatePreview = async () => {
        const tip = parseFloat(tipAmount) || 0;
        const grandTotal = total + tip;
        const tempSaleData = { id: '---', items: activeSplit > 1 ? cart.map(item => ({ ...item, price: item.price / activeSplit })) : cart, total: total, tip: tip, paymentMethod: paymentMethod, seller: sellerName, date: new Date(), ticketNumber: '' };
        const customerInfo = { name: selectedTable, address: activeSplit > 1 ? `Parte 1 de ${activeSplit}` : 'CONSUMO LOCAL', location: '', phone: '' };
        const html = await generateTicketHTML(tempSaleData, customerInfo);
        setPreviewHtml(html);
    };
    updatePreview();
  }, [cart, total, selectedTable, paymentMethod, sellerName, activeSplit, tipAmount]); 

  const handleTableChange = (newTable) => {
    setSelectedTable(newTable);
    
    if (mesasActivas[newTable] && Array.isArray(mesasActivas[newTable].cart)) {
      setCart(mesasActivas[newTable].cart);
    } else {
      setCart([]);
    }
    
    setActiveSplit(1); 
    setTempSplitWays(2); 
    setSplitPayments(['']); 
    setSplitMethods(['EFECTIVO']);
    setTipMode(''); 
    setTipAmount(''); 
  };

  const handleSaveOrder = async () => {
    try {
      await saveActiveTableService({ tableName: selectedTable, waiter: sellerName, cart: cart });
      await fetchActiveTables(); 
      showSnackbar(`✅ Comanda de ${selectedTable} guardada (Atiende: ${sellerName})`, "success");
    } catch (error) { showSnackbar(`❌ Error al guardar comanda en el servidor`, "error"); }
  };

  const handlePrintPreAccount = async () => {
    if (cart.length === 0) return;
    if (activeSplit > 1) {
      const splitTotal = total / activeSplit; const splitTip = (parseFloat(tipAmount) || 0) / activeSplit;
      for (let i = 1; i <= activeSplit; i++) {
        const preAccountData = { items: cart, total: total, isSplit: true, activeSplit: activeSplit, splitTotal: splitTotal, tip: splitTip, date: new Date().toISOString(), seller: sellerName, ticketNumber: "PENDIENTE", paymentMethod: "POR DEFINIR" };
        await printPreAccount(preAccountData, { name: selectedTable, address: `Pre-cuenta ${i} de ${activeSplit}` });
      }
      showSnackbar(`🖨️ ${activeSplit} Pre-cuentas desglosadas impresas`, "info");
    } else {
      const preAccountData = { items: cart, total: total, tip: parseFloat(tipAmount) || 0, date: new Date().toISOString(), seller: sellerName, ticketNumber: "PENDIENTE", paymentMethod: "POR DEFINIR" };
      await printPreAccount(preAccountData, { name: selectedTable, address: "CONSUMO LOCAL" }); 
      showSnackbar(`🖨️ Pre-cuenta de ${selectedTable} impresa`, "info");
    }
  };

  const handleStartCashDrawer = async () => {
    if (!initialCashInput) return showSnackbar("Ingresa un fondo inicial válido", "warning");
    const success = await startCashSession(initialCashInput);
    if (success) { setOpenStartBox(false); showSnackbar("✅ Caja iniciada con éxito", "success"); } 
    else { showSnackbar("❌ Error al abrir caja", "error"); }
  };

  const handleCloseCashDrawer = async () => {
    if (cashDrawer && cashDrawer.totals) { await printCashDrawerClosing(cashDrawer.totals, sellerName); }
    const success = await closeCashSession();
    if (success) { setOpenCloseBox(false); showSnackbar("✅ Caja cerrada y ticket de corte impreso", "success"); } 
    else { showSnackbar("❌ Error al cerrar caja", "error"); }
  };

  const addSpecificItemToCart = (product, portionType) => {
    let finalPrice = parseFloat(product.priceRetail); let finalName = product.name; let cartItemId = product.id; 
    if (portionType === 'media') { finalPrice = parseFloat(product.priceHalf); finalName = `${product.name} (Media)`; cartItemId = `${product.id}-media`; } 
    else if (portionType === 'completa') { cartItemId = `${product.id}-completa`; }
    const existingItem = cart.find(item => item.id === cartItemId);
    const stockActual = parseInt(product.stock) || 0; 
    const isFoodOrSnack = product.category === 'Botanas' || product.category === 'Alimentos';

    if (existingItem) {
      if (existingItem.quantity + 1 > stockActual && !isFoodOrSnack) return showSnackbar(`⚠️ Stock insuficiente de ${product.name}`, "warning");
      updateQuantity(cartItemId, existingItem.quantity + 1);
    } else setCart([...cart, { ...product, id: cartItemId, name: finalName, quantity: 1, price: finalPrice }]);
    setFlippedCardId(null);
  };

  const addToCart = (product) => {
    const stockActual = parseInt(product.stock) || 0;
    const isFoodOrSnack = product.category === 'Botanas' || product.category === 'Alimentos';
    if (stockActual <= 0 && !isFoodOrSnack) return showSnackbar(`❌ Agotado: ${product.name}`, "error");
    const hasHalfPrice = parseFloat(product.priceHalf) > 0;
    if (isFoodOrSnack && hasHalfPrice) { setPortionDialog({ open: true, product }); return; }
    addSpecificItemToCart(product, 'normal');
  };

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return removeFromCart(id);
    setCart(cart.map(item => item.id === id ? { ...item, quantity: newQty > item.stock && item.category !== 'Botanas' && item.category !== 'Alimentos' ? item.stock : newQty } : item));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const tip = parseFloat(tipAmount) || 0; const grandTotal = total + tip; const amountToPay = activeSplit > 1 ? grandTotal / activeSplit : grandTotal;
  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const applySplit = () => { setActiveSplit(tempSplitWays); setSplitPayments(Array(tempSplitWays).fill('')); setSplitMethods(Array(tempSplitWays).fill('EFECTIVO')); setOpenSplitDialog(false); showSnackbar(`✅ Cuenta dividida en ${tempSplitWays} partes`, 'info'); };
  const cancelSplit = () => { setActiveSplit(1); setTempSplitWays(2); setSplitPayments(['']); setSplitMethods(['EFECTIVO']); showSnackbar(`ℹ️ División de cuenta cancelada`, 'info'); };

  const handleFinalConfirmCheckout = async () => {
    const customer = { name: selectedTable, address: 'LOCAL', location: '', phone: '' };
    let finalAmountPaid = grandTotal;
    let finalChange = 0;
    let dbPaymentMethod = paymentMethod;

    if (activeSplit > 1) {
      let cashSum = 0, cardSum = 0, transSum = 0;
      finalAmountPaid = 0;
      
      for (let i = 0; i < activeSplit; i++) {
          const amountWithoutTip = total / activeSplit;
          const method = splitMethods[i];
          const amountToPayThisPerson = grandTotal / activeSplit;
          
          if (method === 'EFECTIVO') cashSum += amountWithoutTip;
          else if (method === 'TARJETA') cardSum += amountWithoutTip;
          else if (method === 'TRANSFERENCIA') transSum += amountWithoutTip;

          if (method === 'EFECTIVO') finalAmountPaid += (parseFloat(splitPayments[i]) || amountToPayThisPerson);
          else finalAmountPaid += amountToPayThisPerson;
      }
      finalChange = finalAmountPaid - grandTotal;
      dbPaymentMethod = `SPLIT:EFECTIVO=${cashSum},TARJETA=${cardSum},TRANSFERENCIA=${transSum}`;
    } else {
      if (paymentMethod === 'EFECTIVO') { finalAmountPaid = parseFloat(splitPayments[0]) || grandTotal; finalChange = finalAmountPaid - grandTotal; }
    }
    if (finalChange < 0) finalChange = 0; 
    const splitLabel = activeSplit > 1 ? `DIV-${activeSplit}` : '';
    
    const success = await addSale(cart, total, customer, sellerName, dbPaymentMethod, splitLabel, finalAmountPaid, finalChange, tip); 
    
    if (success) {
        if (activeSplit > 1) {
            const splitTotal = total / activeSplit; const splitTip = tip / activeSplit; const splitGrandTotal = splitTotal + splitTip;
            const splitCart = cart.map(item => ({ ...item, price: item.price / activeSplit }));
            for (let i = 1; i <= activeSplit; i++) {
                const currentMethod = splitMethods[i - 1];
                const splitCustomerInfo = { ...customer, address: `División: Pago ${i} de ${activeSplit}` };
                const currentAmountPaid = currentMethod === 'EFECTIVO' ? (parseFloat(splitPayments[i - 1]) || splitGrandTotal) : splitGrandTotal;
                const currentChange = currentAmountPaid - splitGrandTotal;
                const splitSaleData = { ...splitCustomerInfo, seller: sellerName, paymentMethod: currentMethod, items: splitCart, total: splitTotal, tip: splitTip, amountPaid: currentAmountPaid, change: currentChange > 0 ? currentChange : 0, date: new Date() };
                const splitSaleRecord = { id: `TICKET-${i}`, date: new Date(), items: splitCart, total: splitTotal, tip: splitTip, paymentMethod: currentMethod, seller: sellerName, amountPaid: currentAmountPaid, change: currentChange > 0 ? currentChange : 0 };
                printTicket(splitSaleRecord, splitSaleData);
            }
        } else {
            const currentAmountPaid = (paymentMethod === 'TARJETA' || paymentMethod === 'TRANSFERENCIA') ? grandTotal : (parseFloat(splitPayments[0]) || grandTotal);
            const currentChange = currentAmountPaid - grandTotal;
            const saleData = { ...customer, seller: sellerName, paymentMethod, items: cart, total: total, tip: tip, amountPaid: currentAmountPaid, change: currentChange > 0 ? currentChange : 0, date: new Date() };
            const saleRecord = { id: "COMPLETADO", date: new Date(), items: cart, total: total, tip: tip, paymentMethod: paymentMethod, seller: sellerName, amountPaid: currentAmountPaid, change: currentChange > 0 ? currentChange : 0 };
            printTicket(saleRecord, saleData);
        }
        await clearActiveTableService(selectedTable); await fetchActiveTables();
        setCart([]); setTotal(0); cancelSplit(); setPaymentMethod('EFECTIVO'); setTipAmount(''); setTipMode(''); setOpenConfirmDialog(false);
        showSnackbar(activeSplit > 1 ? `✅ Mesa cobrada y ${activeSplit} tickets impresos` : "✅ Mesa cobrada y liberada", "success");
    } else {
        setOpenConfirmDialog(false); showSnackbar("❌ Error al registrar cobro en el sistema", "error");
    }
  };

  const themeColors = { bg: mode === 'dark' ? '#121212' : '#f0f2f5', paper: mode === 'dark' ? '#1e1e1e' : '#ffffff', headerRow: mode === 'dark' ? '#333' : '#f5f5f5', totalBox: mode === 'dark' ? '#1e3a5f' : '#e3f2fd' };

  const handlePaymentChange = (index, value) => { const newPayments = [...splitPayments]; newPayments[index] = value; setSplitPayments(newPayments); };
  const handleMethodChange = (index, value) => { if(value) { const newM = [...splitMethods]; newM[index] = value; setSplitMethods(newM); }};

  const handleAddPortion = (product, portionType) => {
    let finalPrice = parseFloat(product.priceRetail); let finalName = product.name; let cartItemId = product.id;
    if (portionType === 'media') { finalPrice = parseFloat(product.priceHalf); finalName = `${product.name} (Media)`; cartItemId = `${product.id}-media`; } 
    else if (portionType === 'completa') { cartItemId = `${product.id}-completa`; }
    const existingItem = cart.find(item => item.id === cartItemId);
    if (existingItem) updateQuantity(cartItemId, existingItem.quantity + 1);
    else setCart([...cart, { ...product, id: cartItemId, name: finalName, quantity: 1, price: finalPrice }]);
    setFlippedCardId(null);
  };

  const handleClearOrder = async () => {
    try { await clearActiveTableService(selectedTable); setCart([]); await fetchActiveTables(); showSnackbar(`🧹 Orden limpiada y liberada del servidor`, "info");
    } catch (error) { showSnackbar(`❌ Error al limpiar la mesa`, "error"); }
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ height: isMobile ? 'auto' : 'calc(100vh - 85px)', p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: themeColors.bg }}>
      
      <Box display="flex" alignItems="center" flexWrap="wrap" gap={3} mb={2} px={1} width="100%">
        {isAdmin ? (
          <>
            <Box display="flex" alignItems="center" gap={1.5}>
              <PointOfSale sx={{ fontSize: 35, color: cashDrawer?.totals ? '#2e7d32' : '#d32f2f' }} />
              <Box>
                {cashDrawer?.totals ? (
                  <>
                    <Typography variant="h6" fontWeight="900" color="success.main" lineHeight={1.1}>CAJA ABIERTA</Typography>
                    <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                      Fondo: ${parseFloat(cashDrawer.totals.initialCash).toFixed(2)} | Cobrado (Efec): ${parseFloat(cashDrawer.totals.efectivo).toFixed(2)} | Propinas: ${parseFloat(cashDrawer.totals.totalPropinas).toFixed(2)} | Total en Caja: ${parseFloat(cashDrawer.totals.efectivoEsperadoEnCaja).toFixed(2)}
                    </Typography>
                  </>
                ) : (<Typography variant="h5" fontWeight="900" color="error.main">CAJA CERRADA</Typography>)}
              </Box>
            </Box>
            <Box>
              {!cashDrawer ? (
                <Button variant="contained" color="warning" size="medium" startIcon={<LockOpen />} onClick={() => setOpenStartBox(true)} sx={{ fontWeight: 'bold', borderRadius: 3, boxShadow: '0px 4px 10px rgba(255, 152, 0, 0.4)' }}>ARRANCAR CAJA</Button>
              ) : (
                <Button variant="contained" color="error" size="medium" startIcon={<Print />} onClick={() => setOpenCloseBox(true)} sx={{ fontWeight: 'bold', borderRadius: 3, boxShadow: '0px 4px 10px rgba(244, 67, 54, 0.4)' }}>CERRAR E IMPRIMIR TICKET</Button>
              )}
            </Box>
          </>
        ) : (
          <>
            <Box display="flex" gap={2} width="100%" alignItems="center" bgcolor={themeColors.paper} p={1.5} borderRadius={3} sx={{ boxShadow: 1 }}>
              <FormControl size="small" sx={{ minWidth: 250 }}>
                <InputLabel sx={{ fontWeight: 'bold' }}><TableBar sx={{mr:1, verticalAlign:'middle'}}/> Seleccionar Mesa</InputLabel>
                <Select value={selectedTable} label="Seleccionar Mesa" onChange={(e) => handleTableChange(e.target.value)} sx={{fontWeight: 'bold', borderRadius: 2}}>
                  {LISTA_MESAS.map((mesa) => {
                    const infoMesa = mesasActivas[mesa];
                    const isOccupied = infoMesa && infoMesa.cart && infoMesa.cart.length > 0;
                    return (
                      <MenuItem key={mesa} value={mesa}>
                        {mesa} {isOccupied ? ` 🟢 (Atiende: ${infoMesa.waiter})` : ""}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              
              <Button variant="contained" color="warning" size="large" startIcon={<Save />} onClick={handleSaveOrder} disabled={cart.length === 0} sx={{ fontWeight: 'bold', px: 3, borderRadius: 2 }}>
                GUARDAR ORDEN
              </Button>
              <Button variant="contained" color="info" size="large" startIcon={<CallSplit />} onClick={() => setOpenSplitDialog(true)} disabled={total === 0} sx={{ fontWeight: 'bold', px: 3, borderRadius: 2 }}>
                DIVIDIR CUENTA
              </Button>
            </Box>
          </>
        )}
      </Box>

      <Grid container spacing={2} sx={{ height: 'calc(100% - 50px)', width: '100%', m: 0 }}>
        
        
        <Grid size={{ xs: 12, md: isAdmin ? 4 : 6 }} sx={{ height: isMobile ? '500px' : '100%', pl: '0 !important', display: 'flex', flexDirection: 'column' }}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, bgcolor: themeColors.paper }}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">📖 Menú</Typography>
            <TextField placeholder="Buscar producto..." variant="outlined" size="small" fullWidth value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mb: 1.5, '& .MuiInputBase-root': { borderRadius: 3 } }} />
            <Tabs value={menuTab} onChange={(e, newValue) => { setMenuTab(newValue); setSubCategory('Todos'); setFlippedCardId(null); }} variant="fullWidth" indicatorColor="primary" textColor="primary" sx={{ mb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Tab icon={<Restaurant fontSize="small" />} iconPosition="start" label="Botanas" sx={{ fontWeight: 'bold', fontSize: '13px' }} />
              <Tab icon={<LocalBar fontSize="small" />} iconPosition="start" label="Bebidas" sx={{ fontWeight: 'bold', fontSize: '13px' }} />
            </Tabs>
            
            {menuTab === 1 && (
              <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', mb: 2, pb: 1, '&::-webkit-scrollbar': { height: '5px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '4px' } }}>
                {['Cervezas', 'Refrescos y Aguas', 'Coctelería', 'Licores'].map((cat) => (
                  <Chip key={cat} label={cat} clickable color={subCategory === cat ? "primary" : "default"} variant={subCategory === cat ? "filled" : "outlined"} onClick={() => setSubCategory(cat)} sx={{ fontWeight: 'bold', fontSize: '12px' }} />
                ))}
              </Box>
            )}
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
              <Grid container spacing={1.5}>
                {filteredProducts.map((prod) => {
                  const isAgotado = prod.stock <= 0 && prod.category !== 'Botanas' && prod.category !== 'Alimentos';
                  const isFoodOrSnack = prod.category === 'Botanas' || prod.category === 'Alimentos';
                  const hasHalfPrice = parseFloat(prod.priceHalf) > 0;
                  const isFlipped = flippedCardId === prod.id;

                  return (
                    <Grid size={{ xs: 6 }} key={prod.id}>
                        <Card elevation={isAgotado ? 0 : 2} sx={{ borderRadius: 2, bgcolor: isAgotado ? 'action.hover' : 'background.paper', opacity: isAgotado ? 0.6 : 1, overflow: 'hidden' }}>
                            {isFlipped ? (
                              <Box sx={{ display: 'flex', height: '100px', width: '100%' }}>
                                <Button variant="contained" color="warning" onClick={() => handleAddPortion(prod, 'media')} sx={{ width: '50%', borderRadius: 0, display: 'flex', flexDirection: 'column' }}>
                                  <Typography variant="h5" fontWeight="900">M</Typography><Typography variant="caption" fontWeight="bold">${parseFloat(prod.priceHalf).toFixed(2)}</Typography>
                                </Button>
                                <Button variant="contained" color="success" onClick={() => handleAddPortion(prod, 'completa')} sx={{ width: '50%', borderRadius: 0, display: 'flex', flexDirection: 'column' }}>
                                  <Typography variant="h5" fontWeight="900">C</Typography><Typography variant="caption" fontWeight="bold">${parseFloat(prod.priceRetail).toFixed(2)}</Typography>
                                </Button>
                              </Box>
                            ) : (
                              <CardActionArea onClick={() => { if (isAgotado) return; if (isFoodOrSnack && hasHalfPrice) setFlippedCardId(flippedCardId === prod.id ? null : prod.id); else addToCart(prod); }} sx={{ height: '100px', p: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <Typography variant="subtitle2" fontWeight="bold" textAlign="center" sx={{ lineHeight: 1.2, mb: 0.5 }}>{prod.name}</Typography>
                                  <Typography variant="h6" color="primary" fontWeight="bold">${parseFloat(prod.priceRetail).toFixed(2)}</Typography>
                                  {isFoodOrSnack && hasHalfPrice && <Typography variant="caption" color="text.secondary" sx={{ position: 'absolute', top: 2, right: 4, fontWeight: 'bold' }}>⟳</Typography>}
                              </CardActionArea>
                            )}
                        </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* 🌟 COLUMNA 2: COMANDA */}
        <Grid size={{ xs: 12, md: isAdmin ? 4 : 6 }} sx={{ height: isMobile ? 'auto' : '100%', pt: '0 !important', display: 'flex', flexDirection: 'column' }}> 
          <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, bgcolor: themeColors.paper }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold" color="secondary">📝 Orden: {selectedTable}
                {mesasActivas[selectedTable] && (<span style={{ fontSize: '13px', color: '#888', display: 'block' }}>(Atiende: {mesasActivas[selectedTable].waiter})</span>)}
              </Typography>
              <Box display="flex" gap={0.5}>
                <Button size="small" variant="text" color="error" startIcon={<Delete />} onClick={handleClearOrder} disabled={cart.length === 0} sx={{ fontWeight: 'bold' }}>Limpiar</Button>
                {isAdmin && (
                  <Button size="small" variant="text" startIcon={<History />} onClick={() => setHistoryOpen(true)}>Historial</Button>
                )}
              </Box>
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
                        <Typography variant="body2" fontWeight="bold">{item.name}</Typography><Typography variant="caption" color="text.secondary">${item.price} c/u</Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.5 }}>
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                            <IconButton size="small" color="error" onClick={() => updateQuantity(item.id, item.quantity - 1)}>{item.quantity === 1 ? <Delete /> : <RemoveCircleOutline />}</IconButton>
                            <Typography fontWeight="bold" sx={{ width: '25px', textAlign: 'center' }}>{item.quantity}</Typography>
                            <IconButton size="small" color="primary" onClick={() => updateQuantity(item.id, item.quantity + 1)}><AddCircleOutline /></IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.5, fontWeight:'bold', fontSize: '16px' }}>${(item.price * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ p: 2, bgcolor: themeColors.totalBox, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {activeSplit > 1 && (
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip label={`Dividido en ${activeSplit} partes`} color="info" size="small" sx={{ fontWeight: 'bold' }} onDelete={cancelSplit}/>
                    <Typography variant="h6" fontWeight="bold" color="text.secondary">Total Real: ${grandTotal.toFixed(2)}</Typography>
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

        {isAdmin && (
          <Grid size={{ xs: 12, md: 4 }} sx={{ height: isMobile ? 'auto' : '100%', pt: '0 !important', display: 'flex', flexDirection: 'column' }}>
            <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, bgcolor: themeColors.paper, overflowY: 'auto' }}>
              
              <FormControl fullWidth size="large" sx={{ mb: 2 }}>
                <InputLabel sx={{ fontWeight: 'bold' }}><TableBar sx={{mr:1, verticalAlign:'middle'}}/> Seleccionar Mesa</InputLabel>
                <Select value={selectedTable} label="Seleccionar Mesa" onChange={(e) => handleTableChange(e.target.value)} sx={{fontSize:'18px', fontWeight: 'bold', borderRadius: 3}}>
                  {LISTA_MESAS.map((mesa) => {
                    const infoMesa = mesasActivas[mesa];
                    const isOccupied = infoMesa && infoMesa.cart && infoMesa.cart.length > 0;
                    return (
                      <MenuItem key={mesa} value={mesa} sx={{fontSize:'16px', py: 1.5}}>
                        {mesa} {isOccupied ? ` 🟢 (Atiende: ${infoMesa.waiter})` : ""}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <Box display="flex" gap={2} mb={2}>
                  <Button variant="contained" color="warning" size="large" fullWidth startIcon={<Save />} onClick={handleSaveOrder} disabled={cart.length === 0 || !cashDrawer} sx={{ py: 2, borderRadius: 3, fontWeight: 'bold' }}>GUARDAR</Button>
                  <Button variant="contained" color="info" size="large" fullWidth startIcon={<CallSplit />} onClick={() => setOpenSplitDialog(true)} disabled={total === 0 || !cashDrawer} sx={{ py: 2, borderRadius: 3, fontWeight: 'bold' }}>DIVIDIR</Button>
              </Box>

              <Typography variant="subtitle2" gutterBottom color="text.secondary" fontWeight="bold">PROPINA</Typography>
              <ToggleButtonGroup value={tipMode} exclusive onChange={(e, val) => { if(val) setTipMode(val); else {setTipMode(''); setTipAmount('');} }} fullWidth sx={{ mb: 1 }}>
                  <ToggleButton value="10" sx={{ fontWeight: 'bold' }} disabled={!cashDrawer}>10%</ToggleButton>
                  <ToggleButton value="20" sx={{ fontWeight: 'bold' }} disabled={!cashDrawer}>20%</ToggleButton>
                  <ToggleButton value="30" sx={{ fontWeight: 'bold' }} disabled={!cashDrawer}>30%</ToggleButton>
                  <ToggleButton value="custom" sx={{ fontWeight: 'bold' }} disabled={!cashDrawer}>Manual</ToggleButton>
              </ToggleButtonGroup>

              {tipMode === 'custom' && (<TextField placeholder="Propina Manual..." type="number" variant="outlined" fullWidth value={tipAmount} onChange={(e) => handleManualTipChange(e.target.value)} sx={{ mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, sx: { fontSize: 16, fontWeight: 'bold', borderRadius: 2 } }} />)}
              {tipMode !== 'custom' && tipMode !== '' && (<Typography variant="body2" color="primary" fontWeight="bold" sx={{ mb: 2, textAlign: 'center' }}>Propina Calculada: ${tipAmount}</Typography>)}

              <Typography variant="subtitle2" gutterBottom color="text.secondary" fontWeight="bold">MÉTODO DE PAGO</Typography>
              
              {activeSplit > 1 ? (
                <Box mb={2} sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                  {Array.from({ length: activeSplit }).map((_, index) => {
                    const currentTotal = grandTotal / activeSplit;
                    const currentMethod = splitMethods[index];
                    const currentPaid = parseFloat(splitPayments[index]) || 0;
                    const currentChange = currentPaid - currentTotal;
                    return (
                      <Box key={index} mb={2} p={2} sx={{ bgcolor: mode === 'dark' ? '#2c2c2c' : '#f9f9f9', borderRadius: 3, border: '1px solid #ddd' }}>
                        <Typography variant="subtitle2" mb={1} fontWeight="bold" color="text.secondary">PERSONA {index + 1} (Paga: ${currentTotal.toFixed(2)})</Typography>
                        
                        <ToggleButtonGroup value={currentMethod} exclusive onChange={(e, val) => handleMethodChange(index, val)} fullWidth size="small" sx={{ mb: 1.5 }}>
                            <ToggleButton value="EFECTIVO" sx={{ fontWeight: 'bold' }}>Efect.</ToggleButton>
                            <ToggleButton value="TARJETA" sx={{ fontWeight: 'bold' }}>Tarj.</ToggleButton>
                            <ToggleButton value="TRANSFERENCIA" sx={{ fontWeight: 'bold', fontSize: '11px' }}>Transf.</ToggleButton>
                        </ToggleButtonGroup>

                        {currentMethod === 'EFECTIVO' ? (
                            <>
                              <TextField type="number" value={splitPayments[index]} onChange={(e) => handlePaymentChange(index, e.target.value)} size="small" fullWidth color="success" placeholder="¿Con cuánto paga?" disabled={!cashDrawer} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, sx: { fontWeight: 'bold', borderRadius: 2, bgcolor: themeColors.paper } }} />
                              {splitPayments[index] && (<Typography variant="body2" sx={{ mt: 1, textAlign:'center', fontWeight:'bold', color: currentChange >= 0 ? '#2e7d32' : '#d32f2f' }}>Cambio: ${currentChange.toFixed(2)}</Typography>)}
                            </>
                        ) : (
                            <Typography variant="body2" textAlign="center" color="primary" fontWeight="bold">Pago exacto con {currentMethod}</Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <>
                  <ToggleButtonGroup value={paymentMethod} exclusive onChange={(e, val) => val && setPaymentMethod(val)} fullWidth sx={{ mb: 2 }}>
                      <ToggleButton value="EFECTIVO" sx={{ py: 1.5, fontWeight: 'bold' }} disabled={!cashDrawer}><Payments sx={{mr:1}}/> Efect.</ToggleButton>
                      <ToggleButton value="TARJETA" sx={{ py: 1.5, fontWeight: 'bold' }} disabled={!cashDrawer}><CreditCard sx={{mr:1}}/> Tarj.</ToggleButton>
                      <ToggleButton value="TRANSFERENCIA" sx={{ py: 1.5, fontWeight: 'bold' }} disabled={!cashDrawer}><AccountBalanceWallet sx={{mr:1}}/> Transf.</ToggleButton>
                  </ToggleButtonGroup>

                  {paymentMethod === 'EFECTIVO' && (
                    <Box mb={2}>
                      <TextField type="number" value={splitPayments[0]} onChange={(e) => handlePaymentChange(0, e.target.value)} size="large" fullWidth color="success" placeholder="¿Con cuánto paga?" disabled={!cashDrawer} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, sx: { fontSize: 20, fontWeight: 'bold', borderRadius: 2, bgcolor: themeColors.paper } }} />
                      {splitPayments[0] && (<Typography variant="body1" sx={{ mt: 1, textAlign:'center', fontWeight:'bold', color: (parseFloat(splitPayments[0]) - grandTotal) >= 0 ? '#2e7d32' : '#d32f2f' }}>Cambio: ${(parseFloat(splitPayments[0]) - grandTotal).toFixed(2)}</Typography>)}
                    </Box>
                  )}
                </>
              )}

              <Box sx={{ mt: 'auto', pt: 2 }}>
                  <Button variant="outlined" color="info" fullWidth startIcon={<Print />} sx={{ mb: 1.5, py: 1.5, fontWeight: 'bold', borderRadius: 3, borderWidth: 2, '&:hover': { borderWidth: 2 } }} onClick={handlePrintPreAccount} disabled={cart.length === 0 || !cashDrawer}>IMPRIMIR PRE-CUENTA</Button>
                  <Button variant="contained" color={cashDrawer ? "success" : "error"} fullWidth size="large" onClick={() => setOpenConfirmDialog(true)} disabled={cart.length === 0 || !cashDrawer} sx={{ py: 2.5, fontSize: '18px', fontWeight: '900', borderRadius: 3, boxShadow: '0px 8px 20px rgba(76, 175, 80, 0.4)' }}>
                    {!cashDrawer ? "ABRE LA CAJA PARA COBRAR" : `COBRAR $${grandTotal.toFixed(2)}`}
                  </Button>
              </Box>

            </Paper>
          </Grid>
        )}
      </Grid>
       
      <Dialog open={openStartBox} PaperProps={{ sx: { borderRadius: 3, p: 2, minWidth: '350px' } }}>
        <DialogTitle sx={{ textAlign: 'center', color: '#f57c00', fontWeight: '900', fontSize: '24px' }}><LockOpen sx={{ fontSize: 40, display: 'block', margin: '0 auto', mb: 1 }} />ARRANCAR CAJA</DialogTitle>
        <DialogContent>
          <Typography variant="body1" textAlign="center" mb={3} color="text.secondary">Ingresa el fondo inicial de la caja para poder comenzar a cobrar comandas el día de hoy.</Typography>
          <TextField autoFocus fullWidth label="Fondo Inicial" type="number" variant="outlined" value={initialCashInput} onChange={(e) => setInitialCashInput(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, sx: { fontSize: 24, fontWeight: 'bold' } }} />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button variant="text" color="inherit" onClick={() => setOpenStartBox(false)}>Cancelar</Button>
          <Button variant="contained" color="warning" size="large" onClick={handleStartCashDrawer} sx={{ fontWeight: 'bold', px: 4 }}>ABRIR CAJA</Button>
        </DialogActions>
      </Dialog>
 
      <Dialog open={openCloseBox} onClose={() => setOpenCloseBox(false)} PaperProps={{ sx: { borderRadius: 3, minWidth: '400px' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f', fontWeight: '900' }}><Lock /> CERRAR CAJA ACTUAL</DialogTitle>
        <DialogContent dividers>
          {cashDrawer?.totals ? (
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">FONDO INICIAL: ${parseFloat(cashDrawer.totals.initialCash).toFixed(2)}</Typography>
              <Box my={2} p={2} bgcolor="background.default" borderRadius={2}>
                <Typography variant="body2" color="text.secondary">Ingresos Efectivo: ${parseFloat(cashDrawer.totals.efectivo).toFixed(2)}</Typography>
                <Typography variant="body2" color="text.secondary">Ingresos Tarjeta: ${parseFloat(cashDrawer.totals.tarjeta).toFixed(2)}</Typography>
                <Typography variant="body2" color="text.secondary">Ingresos Transf: ${parseFloat(cashDrawer.totals.transferencia).toFixed(2)}</Typography>
              </Box>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">TOTAL CONSUMOS: ${parseFloat(cashDrawer.totals.totalConsumo).toFixed(2)}</Typography>
              <Typography variant="subtitle1" fontWeight="bold" color="secondary">TOTAL PROPINAS: ${parseFloat(cashDrawer.totals.totalPropinas).toFixed(2)}</Typography>
              <Box mt={3} p={2} bgcolor="#e8f5e9" borderRadius={2} border="1px solid #4caf50">
                <Typography variant="h6" textAlign="center" fontWeight="900" color="#2e7d32">EFECTIVO EN CAJA DEBE SER:<br />${parseFloat(cashDrawer.totals.efectivoEsperadoEnCaja).toFixed(2)}</Typography>
              </Box>
            </Box>
          ) : (<Typography>Cargando datos...</Typography>)}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenCloseBox(false)} color="inherit">Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleCloseCashDrawer} sx={{ fontWeight: 'bold' }}>CERRAR E IMPRIMIR TICKET</Button>
        </DialogActions>
      </Dialog>
 
      <Dialog open={openSplitDialog} onClose={() => setOpenSplitDialog(false)} PaperProps={{ sx: { borderRadius: 3, minWidth: '350px' } }}>
        <DialogTitle sx={{ color: '#0288d1', display:'flex', alignItems:'center', gap:1, fontWeight: 'bold' }}><CallSplit/> Dividir Cuenta ({selectedTable})</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" gutterBottom color="text.secondary">Total de la mesa: <b>${grandTotal.toFixed(2)}</b></Typography>
            <Box display="flex" alignItems="center" justifyContent="center" gap={3} my={3}>
                <IconButton color="primary" onClick={() => setTempSplitWays(s => Math.max(2, s - 1))} sx={{ border: '2px solid' }}><RemoveCircleOutline fontSize="large"/></IconButton>
                <Typography variant="h4" fontWeight="bold">{tempSplitWays}</Typography>
                <IconButton color="primary" onClick={() => setTempSplitWays(s => s + 1)} sx={{ border: '2px solid' }}><AddCircleOutline fontSize="large"/></IconButton>
            </Box>
            <Paper elevation={0} sx={{ p: 3, bgcolor: '#e1f5fe', borderRadius: 3 }}>
                <Typography variant="body1" fontWeight="bold" color="text.secondary">Separar en {tempSplitWays} partes:</Typography>
                <Typography variant="h2" color="primary" fontWeight="900">${(grandTotal / tempSplitWays).toFixed(2)}</Typography>
            </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button size="large" onClick={cancelSplit} color="error" sx={{ borderRadius: 2 }}>Quitar</Button>
            <Button size="large" variant="contained" onClick={applySplit} color="info" sx={{ borderRadius: 2 }}>Aplicar</Button>
        </DialogActions>
      </Dialog>

      <SalesHistory open={historyOpen} onClose={() => setHistoryOpen(false)} sales={sales} />

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#2e7d32', fontWeight: 'bold' }}><CheckCircle /> Confirmar Cobro</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
            <DialogContentText sx={{ fontSize: '18px' }}>
                ¿Deseas cerrar la <b>{selectedTable}</b>?<br/><br/>
                {tip > 0 && <>Propina incluida: <b style={{ color: '#d4af37' }}>${tip.toFixed(2)}</b><br/></>}
                {activeSplit > 1 ? (
                  <>Se emitirán <b>{activeSplit} tickets separados</b> por <b>${amountToPay.toFixed(2)}</b> cada uno, con sus métodos de pago individuales.</>
                ) : (
                  <>Total a cobrar: <b>${grandTotal.toFixed(2)}</b> en <b>{paymentMethod}</b>.</>
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