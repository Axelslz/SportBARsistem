import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid, InputAdornment, Typography, MenuItem, 
  Divider, Box
} from '@mui/material';
import { 
  LocalBar, Fastfood, LocalDining, Liquor, 
  SportsBar, Coffee, Kitchen, Category 
} from '@mui/icons-material';

const goldColor = '#D4AF37'; 
const darkColor = '#111111'; 

const CATEGORIAS_BAR = [
  { name: 'Cervezas', icon: <SportsBar fontSize="small" sx={{ mr: 1, color: goldColor }}/> },
  { name: 'Licores', icon: <Liquor fontSize="small" sx={{ mr: 1, color: goldColor }}/> },
  { name: 'Coctelería', icon: <LocalBar fontSize="small" sx={{ mr: 1, color: goldColor }}/> },
  { name: 'Refrescos y Aguas', icon: <Coffee fontSize="small" sx={{ mr: 1, color: goldColor }}/> },
  { name: 'Alimentos', icon: <LocalDining fontSize="small" sx={{ mr: 1, color: goldColor }}/> },
  { name: 'Botanas', icon: <Fastfood fontSize="small" sx={{ mr: 1, color: goldColor }}/> },
  { name: 'Insumos de Barra', icon: <Kitchen fontSize="small" sx={{ mr: 1, color: goldColor }}/> },
  { name: 'Otros', icon: <Category fontSize="small" sx={{ mr: 1, color: goldColor }}/> }
];

export default function ProductForm({ open, handleClose, onSave, initialData }) {
  
  const defaultState = {
    name: '',
    barcode: '',
    category: 'Cervezas', 
    stock: '',
    priceRetail: '',
    priceHalf: '' 
  };

  const [formData, setFormData] = useState(defaultState);

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        name: initialData.name || '',
        barcode: initialData.barcode || '',
        category: initialData.category || 'Cervezas',
        stock: initialData.stock || '',
        priceRetail: initialData.priceRetail || '',
        priceHalf: initialData.priceHalf || ''
      }); 
    } else {
      setFormData(defaultState);
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const productToSend = {
      ...formData,
      name: formData.name.trim(),
      barcode: formData.barcode ? formData.barcode.trim() : '',
      stock: parseFloat(formData.stock) || 0,
      cost: 0, 
      priceRetail: parseFloat(formData.priceRetail) || 0,
      priceHalf: parseFloat(formData.priceHalf) || 0,
      category: formData.category
    };
    
    onSave(productToSend);
    handleClose();
  };

  const isFoodOrSnack = formData.category === 'Botanas' || formData.category === 'Alimentos';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      
      <Box sx={{ bgcolor: darkColor, color: goldColor, px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `3px solid ${goldColor}` }}>
        <LocalBar fontSize="large" />
        <Typography variant="h6" fontWeight="bold" sx={{ letterSpacing: 1 }}>
            {initialData ? 'EDITAR PRODUCTO' : 'AGREGAR NUEVO PRODUCTO'}
        </Typography>
      </Box>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3, pb: 4 }}>
          <Grid container spacing={3}>
            
            <Grid item xs={12} sm={6}>
              <TextField select label="Categoría" name="category" value={formData.category} onChange={handleChange} fullWidth required variant="outlined" InputProps={{ sx: { borderRadius: 2, fontWeight: 'bold' } }}>
                {CATEGORIAS_BAR.map((cat) => (
                  <MenuItem key={cat.name} value={cat.name} sx={{ py: 1.5 }}>
                    {cat.icon} {cat.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Código de Barras (Opc.)" name="barcode" value={formData.barcode} onChange={handleChange} fullWidth variant="outlined" placeholder="Escanea aquí..." InputProps={{ sx: { borderRadius: 2 } }} />
            </Grid>

            <Grid item xs={12}>
              <TextField autoFocus label="Nombre de Bebida o Platillo" name="name" value={formData.name} onChange={handleChange} fullWidth required variant="outlined" placeholder="Ej. Corona 355ml o Nachos" InputProps={{ sx: { borderRadius: 2, fontSize: '1.1rem' } }} />
            </Grid>

            <Grid item xs={12} sx={{ mt: 1 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" sx={{ color: goldColor, fontWeight: '900', letterSpacing: 1 }}>
                PRECIO Y DISPONIBILIDAD
              </Typography>
            </Grid>

            <Grid item xs={12} sm={isFoodOrSnack ? 6 : 12}>
              <TextField
                label={isFoodOrSnack ? "Precio Orden Completa" : "Precio de Venta"}
                name="priceRetail"
                type="number"
                value={formData.priceRetail}
                onChange={handleChange}
                fullWidth
                required
                placeholder="0.00"
                inputProps={{ min: 0, step: "any" }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Typography variant="h6" sx={{ color: darkColor, fontWeight: 'bold' }}>$</Typography></InputAdornment>,
                  sx: { fontWeight: '900', fontSize: '1.5rem', borderRadius: 2, '& input': { color: darkColor } }
                }}
              />
            </Grid>

            {isFoodOrSnack && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Precio Media Orden (Opc.)"
                  name="priceHalf"
                  type="number"
                  value={formData.priceHalf}
                  onChange={handleChange}
                  fullWidth
                  placeholder="0.00"
                  inputProps={{ min: 0, step: "any" }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Typography variant="h6" sx={{ color: '#666', fontWeight: 'bold' }}>$</Typography></InputAdornment>,
                    sx: { fontWeight: 'bold', fontSize: '1.3rem', borderRadius: 2, bgcolor: '#f5f5f5' }
                  }}
                />
              </Grid>
            )}

            {/* SOLO MOSTRAMOS STOCK SI ES BEBIDA O INSUMO */}
            {!isFoodOrSnack && (
                <Grid item xs={12} sm={12}>
                <TextField
                    label="Stock Inicial (Botellas/Pzs)"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleChange}
                    fullWidth
                    required
                    placeholder="Ej. 24"
                    inputProps={{ min: 0, step: "any" }} 
                    InputProps={{ sx: { borderRadius: 2, fontSize: '1.2rem', fontWeight: 'bold' } }}
                />
                </Grid>
            )}

          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 3, justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <Button onClick={handleClose} variant="text" size="large" sx={{ color: '#aaa', fontWeight: 'bold' }}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" size="large" sx={{ borderRadius: 2, fontWeight: '900', px: 4, py: 1.5, bgcolor: goldColor, color: darkColor, '&:hover': { bgcolor: '#B8860B' }, boxShadow: '0px 4px 15px rgba(212, 175, 55, 0.3)' }}>
            GUARDAR PRODUCTO
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}