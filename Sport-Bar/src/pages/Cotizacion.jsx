import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, TextField, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Autocomplete } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete'; 
import { PDFViewer, Document, Page, Text, View, StyleSheet, Image, PDFDownloadLink } from '@react-pdf/renderer';
import { getProductsService } from '../services/productService'; 
import logoImg from '../assets/logo.png'; 

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }, 
  headerLeft: { width: '60%' },
  headerRight: { width: '35%', textAlign: 'right' },
  logo: { width: 100, marginBottom: 10 },
  companyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1565C0', marginBottom: 4 },
  companySubtitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  companyText: { fontSize: 9, color: '#333', marginBottom: 2 },
  clientTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#1565C0' },
  folioText: { fontSize: 12, fontWeight: 'bold', color: '#E53935', marginBottom: 4 }, 
  clientText: { fontSize: 9, marginBottom: 4 },
  table: { display: 'table', width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', borderBottomWidth: 0, borderRightWidth: 0 },
  tableRow: { flexDirection: 'row' },
  tableHeader: { backgroundColor: '#f0f0f0', fontWeight: 'bold' },
  tableColCod: { width: '12%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', borderLeftWidth: 0, borderTopWidth: 0 },
  tableColCant: { width: '10%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', borderLeftWidth: 0, borderTopWidth: 0 },
  tableColName: { width: '50%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', borderLeftWidth: 0, borderTopWidth: 0 },
  tableColPrice: { width: '14%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', borderLeftWidth: 0, borderTopWidth: 0 },
  tableColTotal: { width: '14%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', borderLeftWidth: 0, borderTopWidth: 0 },
  tableCellHeader: { margin: 5, fontSize: 8, fontWeight: 'bold', textAlign: 'center' },
  tableCell: { margin: 5, fontSize: 8 },
  tableCellCenter: { margin: 5, fontSize: 8, textAlign: 'center' },
  tableCellRight: { margin: 5, fontSize: 8, textAlign: 'right' },
  totalContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 },
  totalText: { fontSize: 12, fontWeight: 'bold', marginRight: 10 },
  totalValue: { fontSize: 12, fontWeight: 'bold', width: '14%', textAlign: 'right' },
  footerContainer: { marginTop: 40, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 10 },
  footerTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  footerText: { fontSize: 9, marginBottom: 3 }
});

const MyDocument = ({ clientName, date, items, total, folio }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Image src={logoImg} style={styles.logo} />
          <Text style={styles.companyTitle}>FERRETERIA LA BODEGA</Text>
          <Text style={styles.companyText}>MATERIAL DE CONSTRUCCIÓN, FONTANERÍA, ELECTRICIDAD</Text>
          <Text style={styles.companyText}>DIRECCION: Carret. El Jobo a Suchiapa S/N</Text>
          <Text style={styles.companyText}>Entre 1a. y 2a Sur Poniente Col. El Jobo</Text>
          <Text style={styles.companyText}>Tuxtla Gutierrez, Chiapas. CP 29100</Text>
          <Text style={styles.companyText}>RFC: GACJ720709L17</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.clientTitle}>COTIZACIÓN</Text>
          <Text style={styles.folioText}>FOLIO: {folio}</Text> 
          <Text style={styles.clientText}>FECHA: {date}</Text>
          <Text style={styles.clientText}>CLIENTE: {clientName || 'Público en general'}</Text>
          <Text style={styles.clientText}>TEL: (961) 690 5168</Text>
          <Text style={styles.clientText}>CEL: 961 182 1679</Text>
          <Text style={styles.clientText}>labodegaeljobo@hotmail.com</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={styles.tableColCod}><Text style={styles.tableCellHeader}>COD</Text></View>
          <View style={styles.tableColCant}><Text style={styles.tableCellHeader}>CANTIDAD</Text></View>
          <View style={styles.tableColName}><Text style={styles.tableCellHeader}>NOMBRE</Text></View>
          <View style={styles.tableColPrice}><Text style={styles.tableCellHeader}>P/UNITARIO</Text></View>
          <View style={styles.tableColTotal}><Text style={styles.tableCellHeader}>TOTAL</Text></View>
        </View>
        
        {items.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={styles.tableColCod}><Text style={styles.tableCellCenter}>{item.code || 'S/N'}</Text></View>
            <View style={styles.tableColCant}><Text style={styles.tableCellCenter}>{item.quantity}</Text></View>
            <View style={styles.tableColName}><Text style={styles.tableCell}>{item.name}</Text></View>
            <View style={styles.tableColPrice}><Text style={styles.tableCellRight}>${Number(item.price || 0).toFixed(2)}</Text></View>
            <View style={styles.tableColTotal}><Text style={styles.tableCellRight}>${(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}</Text></View>
          </View>
        ))}
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>IMPORTE TOTAL:</Text>
        <Text style={styles.totalValue}>${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.footerTitle}>CUENTA PARA TRANSFERENCIA A BBVA</Text>
        <Text style={styles.footerText}>JOEL HUMBERTO GALLEGOS CANCINO</Text>
        <Text style={styles.footerText}>No. De Cuenta: 0145826446</Text>
        <Text style={styles.footerText}>CLABE: 012 100 00145826446 6</Text>
        <Text style={styles.footerText}>TARJETA: 4152 3138 1067 3967</Text>
      </View>
    </Page>
  </Document>
);

export default function Cotizacion() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [clientName, setClientName] = useState('');
  const [quoteItems, setQuoteItems] = useState([]);
  
  const [folio, setFolio] = useState(1000);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProductsService();
        setProducts(data);
      } catch (error) {
        console.error("Error al cargar productos:", error);
      }
    };
    fetchProducts();

    const storedFolio = localStorage.getItem('cotizacionFolio');
    if (storedFolio) {
      setFolio(parseInt(storedFolio, 10));
    } else {
      localStorage.setItem('cotizacionFolio', '1000');
    }
  }, []);

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;
    
    const price = selectedProduct.priceRetail || 0; 
    const newItem = {
      id: selectedProduct.id,
      code: selectedProduct.barcode, 
      name: selectedProduct.name,
      price: parseFloat(price),
      quantity: parseInt(quantity)
    };

    setQuoteItems([...quoteItems, newItem]);
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...quoteItems];
    newItems.splice(index, 1);
    setQuoteItems(newItems);
  };

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...quoteItems];
    newItems[index][field] = value === '' ? '' : Number(value);
    setQuoteItems(newItems);
  };

  const handleClearQuote = () => {

    setClientName('');
    setQuoteItems([]);
    setSelectedProduct(null);
    setQuantity(1);
    
    const nextFolio = folio + 1;
    setFolio(nextFolio);
    localStorage.setItem('cotizacionFolio', nextFolio.toString());
  };

  const total = quoteItems.reduce((acc, item) => {
    const q = Number(item.quantity) || 0;
    const p = Number(item.price) || 0;
    return acc + (q * p);
  }, 0);
  
  const today = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 } }}>
      <Grid container spacing={3}>
        
        <Grid size={{ xs: 12, md: 4, lg: 4 }}>
          <Paper sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">Cotización</Typography>
              <Typography variant="subtitle1" color="error" fontWeight="bold">Folio: {folio}</Typography>
            </Box>
            
            <TextField 
              fullWidth label="Nombre del Cliente" variant="outlined" margin="normal" size="small"
              value={clientName} onChange={(e) => setClientName(e.target.value)}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, mb: 2 }}>
              <Autocomplete
                options={products}
                getOptionLabel={(option) => option.barcode ? `[${option.barcode}] ${option.name}` : option.name}
                value={selectedProduct}
                onChange={(event, newValue) => setSelectedProduct(newValue)}
                renderInput={(params) => <TextField {...params} label="Buscar Producto" size="small" />}
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField 
                  type="number" label="Cant." size="small" sx={{ width: '40%' }}
                  value={quantity} onChange={(e) => setQuantity(e.target.value)}
                />
                <Button variant="contained" color="primary" onClick={handleAddItem} sx={{ width: '60%' }}>
                  Agregar
                </Button>
              </Box>
            </Box>

            <TableContainer sx={{ maxHeight: 350 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Prod.</TableCell>
                    <TableCell align="center">Cant.</TableCell>
                    <TableCell align="center">Precio</TableCell>
                    <TableCell align="center">Quitar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quoteItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: '0.75rem', maxWidth: '80px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.name}>
                        {item.name}
                      </TableCell>
                      
                      <TableCell align="center">
                        <TextField
                          size="small"
                          type="number"
                          variant="standard"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                          inputProps={{ style: { textAlign: 'center', fontSize: '0.8rem' } }}
                          sx={{ width: '45px' }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <TextField
                          size="small"
                          type="number"
                          variant="standard"
                          value={item.price}
                          onChange={(e) => handleUpdateItem(index, 'price', e.target.value)}
                          inputProps={{ style: { textAlign: 'center', fontSize: '0.8rem' } }}
                          sx={{ width: '60px' }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <IconButton color="error" size="small" onClick={() => handleRemoveItem(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" align="right" sx={{ mt: 3, color: '#1565C0', fontWeight: 'bold' }}>
              Total: ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>

            <Button 
              variant="outlined" 
              color="error" 
              fullWidth 
              sx={{ mt: 2 }} 
              onClick={handleClearQuote}
            >
              Nueva Cotización (Avanzar Folio)
            </Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 8, lg: 8 }}>
          <Paper sx={{ width: '100%', height: { xs: '60vh', md: 'calc(100vh - 110px)' } }}>
            <PDFViewer width="100%" height="100%" style={{ border: 'none', borderRadius: '8px' }}>
              <MyDocument 
                clientName={clientName} 
                date={today} 
                items={quoteItems} 
                total={total}
                folio={folio} 
              />
            </PDFViewer>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}