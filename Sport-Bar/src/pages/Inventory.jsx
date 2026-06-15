import { useState } from 'react';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  useTheme, useMediaQuery, Fab, TextField, InputAdornment, CircularProgress,
  Grid, Card, CardContent
} from '@mui/material';
import { 
  Edit, Delete, Add, WarningAmberRounded, AddBox, Search, History,
  Inventory2, ErrorOutline, CheckCircleOutline
} from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext'; 
import ProductForm from '../components/ProductForm';
import { getProductHistoryService } from '../services/productService'; 

export default function Inventory() {
  const { products, deleteProduct, addProduct, updateProduct, addStockToProduct } = useInventory();
  const { user } = useAuth(); 
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isAdmin = user?.role === 'admin';
  
  const [openModal, setOpenModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [openStockModal, setOpenStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [newStockData, setNewStockData] = useState({ addedStock: '', newCost: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleOpenCreate = () => { setEditingProduct(null); setOpenModal(true); };
  const handleOpenEdit = (product) => { setEditingProduct(product); setOpenModal(true); };
  const handleSave = (productData) => { editingProduct ? updateProduct(editingProduct.id, productData) : addProduct(productData); };

  const handleDeleteClick = (id) => { setProductToDelete(id); setOpenDeleteDialog(true); };
  const handleConfirmDelete = () => { if (productToDelete) { deleteProduct(productToDelete); setOpenDeleteDialog(false); setProductToDelete(null); } };
  const handleCancelDelete = () => { setOpenDeleteDialog(false); setProductToDelete(null); };

  const handleOpenStock = (product) => {
    setStockProduct(product);
    setNewStockData({ addedStock: '', newCost: product.cost || 0 }); 
    setOpenStockModal(true);
  };

  const handleSaveStock = () => {
    if (stockProduct && Number(newStockData.addedStock) > 0) {
      if (addStockToProduct) addStockToProduct(stockProduct.id, newStockData); 
      setOpenStockModal(false); setStockProduct(null);
    }
  };
  const handleCancelStock = () => { setOpenStockModal(false); setStockProduct(null); };

  const handleOpenHistory = async (product) => {
    setHistoryProduct(product); setOpenHistoryModal(true); setLoadingHistory(true);
    try {
      const logs = await getProductHistoryService(product.id);
      setHistoryLogs(logs);
    } catch (error) { setHistoryLogs([]); } 
    finally { setLoadingHistory(false); }
  };
  const handleCloseHistory = () => { setOpenHistoryModal(false); setHistoryProduct(null); setHistoryLogs([]); };

  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchLower)) ||
      (product.category && product.category.toLowerCase().includes(searchLower))
    );
  });

  const totalItems = products.length;
  const outOfStockItems = products.filter(p => p.stock <= 0 && p.category !== 'Botanas' && p.category !== 'Alimentos').length;
  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= 10 && p.category !== 'Botanas' && p.category !== 'Alimentos').length;

  const formatHistoryDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
  };
    
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.default' }}> 
      
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} mb={3} gap={2} sx={{ flexShrink: 0 }}>
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight="900" color="primary">📦 Inventario</Typography>
        
        <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" flexGrow={1} justifyContent="flex-end">
            <TextField
              variant="outlined"
              size={isMobile ? "medium" : "small"}
              placeholder="Buscar producto, categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search color="primary"/></InputAdornment>,
                sx: { borderRadius: 3, bgcolor: 'background.paper' }
              }}
              sx={{ width: { xs: '100%', sm: '350px' } }}
            />

            {isAdmin && (
              <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate} size="large" sx={{ fontWeight: 'bold', borderRadius: 3, display: { xs: 'none', sm: 'flex' }, py: 1.2 }}>
                Nuevo Producto
              </Button>
            )}
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3, flexShrink: 0 }}>
          <Grid item xs={4} sm={4} md={4}>
              <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Inventory2 fontSize="large" sx={{ display: { xs:'none', sm:'block' } }}/>
                      <Box>
                          <Typography variant="h5" fontWeight="900">{totalItems}</Typography>
                          <Typography variant="caption" fontWeight="bold">EN CATÁLOGO</Typography>
                      </Box>
                  </CardContent>
              </Card>
          </Grid>
          <Grid item xs={4} sm={4} md={4}>
              <Card elevation={2} sx={{ borderRadius: 3, bgcolor: lowStockItems > 0 ? 'warning.light' : 'success.light', color: lowStockItems > 0 ? 'warning.contrastText' : 'success.contrastText' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                      {lowStockItems > 0 ? <WarningAmberRounded fontSize="large" sx={{ display: { xs:'none', sm:'block' } }}/> : <CheckCircleOutline fontSize="large" sx={{ display: { xs:'none', sm:'block' } }}/>}
                      <Box>
                          <Typography variant="h5" fontWeight="900">{lowStockItems}</Typography>
                          <Typography variant="caption" fontWeight="bold">POR RESURTIR (BEBIDAS)</Typography>
                      </Box>
                  </CardContent>
              </Card>
          </Grid>
          <Grid item xs={4} sm={4} md={4}>
              <Card elevation={2} sx={{ borderRadius: 3, bgcolor: outOfStockItems > 0 ? 'error.light' : 'background.paper', color: outOfStockItems > 0 ? 'error.contrastText' : 'text.secondary' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ErrorOutline fontSize="large" sx={{ display: { xs:'none', sm:'block' } }}/>
                      <Box>
                          <Typography variant="h5" fontWeight="900">{outOfStockItems}</Typography>
                          <Typography variant="caption" fontWeight="bold">AGOTADOS</Typography>
                      </Box>
                  </CardContent>
              </Card>
          </Grid>
      </Grid>

      <Paper elevation={3} sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', borderRadius: 3 }}>
        <TableContainer sx={{ flexGrow: 1, maxHeight: '100%', overflowY: 'auto' }}>
          <Table stickyHeader size={isMobile ? "small" : "medium"}> 
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Producto</TableCell>
                {!isTablet && <TableCell sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Categoría</TableCell>}
                <TableCell align="center" sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Disponibilidad / Vendidos</TableCell>
                <TableCell align="right" sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Precio</TableCell>
                {isAdmin && <TableCell align="center" sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                    <Inventory2 sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
                    <Typography variant="h6">{searchTerm ? `Sin resultados para "${searchTerm}"` : 'Inventario vacío'}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((row) => {
                    const isFoodOrSnack = row.category === 'Botanas' || row.category === 'Alimentos';
                    const stock = parseInt(row.stock) || 0;
                    const sold = parseInt(row.soldCount) || 0;
                    
                    let stockDisplay;

                    // Si es comida o botana mostramos el 🔥 Fuego de ventas
                    if (isFoodOrSnack) {
                        stockDisplay = (
                            <Chip 
                                label={`🔥 ${sold} Vendidos`} 
                                sx={{ bgcolor: 'rgba(212, 175, 55, 0.15)', color: '#B8860B', fontWeight: '900', fontSize: '13px', minWidth: '100px', border: '1px solid rgba(212, 175, 55, 0.5)' }} 
                            />
                        );
                    } else {
                        // Si es bebida mostramos semáforo de inventario
                        let stockColor = 'success';
                        let stockLabel = `${stock} pzs`;
                        if (stock <= 0) { stockColor = 'error'; stockLabel = 'Agotado'; } 
                        else if (stock <= 10) { stockColor = 'warning'; }
                        
                        stockDisplay = <Chip label={stockLabel} color={stockColor} size="medium" sx={{ fontWeight: 'bold', fontSize: '14px', minWidth: '80px' }} />;
                    }

                    return (
                        <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ py: 1.5 }}>
                                <Typography variant="body1" fontWeight="bold" color="text.primary">{row.name}</Typography>
                                {row.barcode && <Typography variant="caption" color="text.secondary" fontWeight="bold">Cód: {row.barcode}</Typography>}
                                {isTablet && row.category && <Typography variant="caption" display="block" color="primary">{row.category}</Typography>}
                            </TableCell>
                            
                            {!isTablet && (
                                <TableCell sx={{ color: 'text.secondary' }}>{row.category || '---'}</TableCell>
                            )}

                            <TableCell align="center">
                                {stockDisplay}
                            </TableCell>

                            <TableCell align="right">
                                <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                                    {isFoodOrSnack ? "Completa: " : ""}${parseFloat(row.priceRetail).toFixed(2)}
                                </Typography>
                                {isFoodOrSnack && parseFloat(row.priceHalf) > 0 && (
                                    <Typography variant="caption" color="text.secondary" display="block" fontWeight="bold">
                                        Media: ${parseFloat(row.priceHalf).toFixed(2)}
                                    </Typography>
                                )}
                            </TableCell>
                            
                            {isAdmin && (
                              <TableCell align="center">
                                  <Box display="flex" justifyContent="center" gap={0.5}>
                                      {/* El botón de agregar stock solo se muestra si NO es botana/alimento */}
                                      {!isFoodOrSnack && (
                                        <IconButton color="success" onClick={() => handleOpenStock(row)} sx={{ bgcolor: 'success.light', color: 'success.dark', '&:hover': { bgcolor: 'success.main', color: '#fff'} }} title="Ingresar Stock">
                                            <AddBox />
                                        </IconButton>
                                      )}
                                      <IconButton color="info" onClick={() => handleOpenHistory(row)} sx={{ bgcolor: 'info.light', color: 'info.dark', '&:hover': { bgcolor: 'info.main', color: '#fff'} }} title="Ver Historial">
                                          <History />
                                      </IconButton>
                                      <IconButton color="primary" onClick={() => handleOpenEdit(row)} sx={{ bgcolor: 'primary.light', color: 'primary.dark', '&:hover': { bgcolor: 'primary.main', color: '#fff'} }} title="Editar">
                                          <Edit />
                                      </IconButton>
                                      <IconButton color="error" onClick={() => handleDeleteClick(row.id)} sx={{ bgcolor: 'error.light', color: 'error.dark', '&:hover': { bgcolor: 'error.main', color: '#fff'} }} title="Eliminar">
                                          <Delete />
                                      </IconButton>
                                  </Box>
                              </TableCell>
                            )}
                        </TableRow>
                    );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {isAdmin && (
        <Fab color="primary" onClick={handleOpenCreate} sx={{ position: 'fixed', bottom: 20, right: 20, display: { xs: 'flex', sm: 'none' } }}>
          <Add />
        </Fab>
      )}

      <ProductForm open={openModal} handleClose={() => setOpenModal(false)} onSave={handleSave} initialData={editingProduct} existingProducts={products} />

      <Dialog open={openDeleteDialog} onClose={handleCancelDelete} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 'bold' }}>
            <WarningAmberRounded /> Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', fontSize: '16px' }}>
            ¿Estás seguro que deseas eliminar este producto de forma permanente? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button onClick={handleCancelDelete} variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" autoFocus sx={{ borderRadius: 2, fontWeight: 'bold' }}>Sí, eliminar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openStockModal} onClose={handleCancelStock} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ color: 'success.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddBox /> Ingresar Mercancía
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, mb: 3 }}>
            <Typography variant="body1">Producto: <strong>{stockProduct?.name}</strong></Typography>
            <Typography variant="body1">Stock actual: <strong>{stockProduct?.stock} pzs</strong></Typography>
          </Box>
          <TextField autoFocus label="Cantidad a sumar (pzs)" type="number" fullWidth variant="outlined" value={newStockData.addedStock} onChange={(e) => setNewStockData({ ...newStockData, addedStock: e.target.value })} sx={{ mb: 2 }} />
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button onClick={handleCancelStock} variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>Cancelar</Button>
          <Button onClick={handleSaveStock} variant="contained" color="success" disabled={!newStockData.addedStock || Number(newStockData.addedStock) <= 0} sx={{ borderRadius: 2, fontWeight: 'bold' }}>Guardar Stock</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openHistoryModal} onClose={handleCloseHistory} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ color: 'info.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <History /> Bitácora de {historyProduct?.name}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Acción</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Inventario</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Detalles</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingHistory ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress size={30} /></TableCell></TableRow>
                ) : historyLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>No hay movimientos.</TableCell></TableRow>
                ) : (
                  historyLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatHistoryDate(log.createdAt)}</TableCell>
                      <TableCell>
                        <Chip label={log.action} size="small" color={log.action === 'CREACIÓN' ? 'success' : log.action === 'INGRESO DE STOCK' ? 'primary' : 'warning'} sx={{ fontSize: '0.7rem', fontWeight: 'bold' }} />
                      </TableCell>
                      <TableCell align="center"><Typography variant="body2">{log.oldStock} → <b>{log.newStock}</b></Typography></TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{log.notes}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseHistory} variant="contained" color="info" sx={{ borderRadius: 2 }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}