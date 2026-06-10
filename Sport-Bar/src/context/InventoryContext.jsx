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

const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]); 
  const { isAuthenticated } = useAuth(); 

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
      loadSales(); 
    } else {
      setProducts([]);
      setSales([]);
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
    
  // --- MODIFICADO: Agregamos amountPaid y change al final de los parámetros ---
  const addSale = async (cart, total, customer, seller, paymentMethod, ticketNumber, amountPaid, change) => {
    try { 
        // Armamos el objeto saleData inyectando cuánto pagó y su cambio para enviarlo al backend
        const saleData = { 
          cart, 
          total, 
          customer, 
          seller, 
          paymentMethod, 
          ticketNumber,
          amountPaid: amountPaid !== undefined ? amountPaid : total, // Respaldo si viene vacío
          change: change !== undefined ? change : 0 
        };

        await createSaleService(saleData); 

        // Refrescamos productos e historial para mantener la app sincronizada
        await loadProducts(); 
        await loadSales(); 

        // Retorna true directo para sincronizar con el "if (success)" de tu POS.jsx
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