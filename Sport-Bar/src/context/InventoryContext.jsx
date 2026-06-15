import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext'; 
import { 
  getProductsService, 
  createProductService, 
  updateProductService, 
  deleteProductService,
  addProductStockService
} from '../services/productService';
import { createSaleService, getSalesHistoryService } from '../services/saleService';

// 🔥 NUEVO: Detecta automáticamente si está en Producción o Desarrollo
const API_URL = import.meta.env.MODE === 'production' 
  ? 'https://backsportbarsistem.onrender.com/api/sales/cash' 
  : 'http://localhost:5000/api/sales/cash';

const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]); 
  const [cashDrawer, setCashDrawer] = useState(null); 
  const { isAuthenticated } = useAuth(); 

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
      loadSales(); 
      loadActiveCashSession(); 
    } else {
      setProducts([]);
      setSales([]);
      setCashDrawer(null);
    }
  }, [isAuthenticated]); 

  const loadProducts = async () => {
    try {
      const data = await getProductsService();
      setProducts(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  const loadSales = async () => {
    try {
      const history = await getSalesHistoryService();
      setSales(history);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    }
  };

  // 🔥 CORREGIDO: Uso de la variable API_URL dinámica
  const loadActiveCashSession = async () => {
    try {
      const response = await fetch(`${API_URL}/active`); 
      const data = await response.json();
      setCashDrawer(data); 
    } catch (error) {
      console.error("Error cargando caja activa:", error);
    }
  };

  // 🔥 CORREGIDO: Uso de la variable API_URL dinámica
  const startCashSession = async (initialCash) => {
    try {
      await fetch(`${API_URL}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialCash: parseFloat(initialCash) })
      });
      await loadActiveCashSession();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  // 🔥 CORREGIDO: Uso de la variable API_URL dinámica
  const closeCashSession = async () => {
    try {
      await fetch(`${API_URL}/close`, { method: 'POST' });
      await loadActiveCashSession();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const addProduct = async (productData) => { 
      try {
        const savedProduct = await createProductService(productData);
        
        setProducts(prevProducts => {
            const alreadyExists = prevProducts.find(p => p.id === savedProduct.id);
            if (alreadyExists) {
                return prevProducts.map(p => p.id === savedProduct.id ? savedProduct : p);
            } else {
                return [...prevProducts, savedProduct];
            }
        });
        return true;
      } catch (error) { 
        console.error(error); 
        return false; 
      }
  };

  const updateProduct = async (id, updatedData) => { 
      try {
        await updateProductService(id, updatedData);
        setProducts(products.map(p => (p.id === id ? { ...p, ...updatedData } : p)));
      } catch (error) { console.error(error); }
  };

  const deleteProduct = async (id) => {  
      try {
        await deleteProductService(id);
        setProducts(products.filter(p => p.id !== id));
      } catch (error) { console.error(error); }
  };
    
  const addSale = async (cart, total, customer, seller, paymentMethod, ticketNumber, amountPaid, change, tip = 0) => {
    try { 
        const saleData = { 
          cart, 
          total, 
          customer, 
          seller, 
          paymentMethod, 
          ticketNumber,
          amountPaid: amountPaid !== undefined ? amountPaid : total, 
          change: change !== undefined ? change : 0,
          tip: parseFloat(tip) 
        };

        await createSaleService(saleData); 

        await loadProducts(); 
        await loadSales(); 
        await loadActiveCashSession(); 

        return true; 
    } catch (error) {
        console.error("Error al procesar venta:", error);
        alert("Error al registrar la venta.");
        return false;
    }
  };

  const addStockToProduct = async (id, stockData) => {
    try {
      const updatedProduct = await addProductStockService(id, stockData);
      setProducts(products.map(p => p.id === id ? updatedProduct : p));
      return updatedProduct;
    } catch (error) {
      console.error("Error al agregar stock:", error);
      throw error;
    }
  };

  return (
    <InventoryContext.Provider value={{ 
      products, 
      sales, 
      cashDrawer,
      startCashSession,
      closeCashSession,
      loadActiveCashSession,
      addProduct, 
      updateProduct, 
      deleteProduct, 
      addSale,
      loadSales,
      addStockToProduct
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => useContext(InventoryContext);