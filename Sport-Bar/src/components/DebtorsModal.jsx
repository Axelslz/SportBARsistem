import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Chip, Typography, CircularProgress, Box, IconButton 
} from '@mui/material';
import { CheckCircle, AssignmentInd, Visibility, Print } from '@mui/icons-material'; 
import { getSalesRequest } from '../services/saleService';
import { generateTicketHTML } from '../utils/printTicket'; 

export default function DebtorsModal({ open, onClose, onMarkAsPaid }) {
  const [loading, setLoading] = useState(false);
  const [dbSales, setDbSales] = useState([]);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [ticketHTML, setTicketHTML] = useState('');

  useEffect(() => {
    if (open) {
      loadSalesFromDB();
    }
  }, [open]);

  const loadSalesFromDB = async () => {
    setLoading(true);
    try {
      const res = await getSalesRequest();
      if (res.data) {
        const creditos = res.data.filter(s => s.paymentMethod === 'CREDITO');
        const ordenados = creditos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setDbSales(ordenados);
      }
    } catch (error) {
      console.error("Error cargando deudores:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const handleOpenPreview = async (sale) => {
    setIsPreviewOpen(true);
    setTicketHTML('');

    const itemsList = sale.SaleItems || sale.items || sale.cart || [];
    
    const saleData = {
      id: sale.id,
      ticketNumber: sale.ticketNumber,
      date: sale.createdAt || sale.date,
      paymentMethod: sale.paymentMethod,
      seller: sale.seller,
      total: sale.total,
      items: itemsList.map(item => ({
        name: item.productName || item.name,
        quantity: item.quantity,
        price: item.price,
        isWholesale: false 
      }))
    };

    const customerInfo = {
      name: sale.customerName,
      address: sale.customerAddress,
      phone: sale.customerPhone
    };

    try {
      const html = await generateTicketHTML(saleData, customerInfo);
      setTicketHTML(html);
    } catch (error) {
      console.error("Error al generar la vista previa del ticket:", error);
      setTicketHTML('<div style="padding: 20px; text-align: center;">Error al generar el ticket.</div>');
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setTicketHTML('');
  };

  const handlePrintTicket = () => {
    if (!ticketHTML) return;
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.write(ticketHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handlePayment = async (saleId) => {
    await onMarkAsPaid(saleId);
    loadSalesFromDB();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#ed6c02', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentInd /> Cuentas por Cobrar (Deudores)
        </DialogTitle>
        
        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress color="warning"/>
            </Box>
          ) : dbSales.length === 0 ? (
            <Typography align="center" sx={{ py: 3, color: 'text.secondary' }}>
              No hay deudas pendientes registradas.
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#fff3e0' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Folio</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ticket</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dbSales.map((sale) => {
                    const isPaid = sale.paymentMethod !== 'CREDITO';
                    const folioAMostrar = sale.ticketNumber ? sale.ticketNumber : `F-${sale.id}`;

                    return (
                      <TableRow key={sale.id} hover>
                        <TableCell>#{folioAMostrar}</TableCell>
                        <TableCell>{formatDate(sale.createdAt)}</TableCell>
                        
                        <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                          {sale.customerName || 'CLIENTE DESCONOCIDO'}
                        </TableCell>

                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            color="warning" 
                            onClick={() => handleOpenPreview(sale)}
                            title="Ver Ticket Original"
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </TableCell>
                        
                        <TableCell sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                          ${parseFloat(sale.total).toFixed(2)}
                        </TableCell>

                        <TableCell align="center">
                          <Chip 
                            label={isPaid ? "PAGADO" : "PENDIENTE"} 
                            color={isPaid ? "success" : "warning"} 
                            size="small" 
                            variant={isPaid ? "filled" : "outlined"}
                          />
                        </TableCell>
                        
                        <TableCell align="center">
                          {!isPaid && (
                            <Button 
                              variant="contained" 
                              color="success" 
                              size="small"
                              startIcon={<CheckCircle />}
                              onClick={() => {
                                  if(window.confirm(`¿Confirmar pago de ${sale.customerName}?`)){
                                      handlePayment(sale.id);
                                  }
                              }}
                            >
                              Cobrar
                            </Button>
                          )}
                          {isPaid && <CheckCircle color="success" fontSize="small"/>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={isPreviewOpen} 
        onClose={handleClosePreview} 
        maxWidth="xs" 
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pb: 1, color: '#ed6c02' }}>
          Detalle del Crédito
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '450px', backgroundColor: '#f5f5f5' }}>
          {ticketHTML ? (
            <iframe
              srcDoc={ticketHTML}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Vista previa del ticket"
            />
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography color="text.secondary">Cargando ticket...</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 2, pt: 1, gap: 1 }}>
          <Button onClick={handleClosePreview} variant="outlined" color="inherit" sx={{ flex: 1 }}>
            Cerrar
          </Button>
          <Button 
            onClick={handlePrintTicket} 
            variant="contained" 
            color="warning" 
            startIcon={<Print />}
            disabled={!ticketHTML}
            sx={{ flex: 1 }}
          >
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}