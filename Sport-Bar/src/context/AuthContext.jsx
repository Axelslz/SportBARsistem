import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginRequest } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = () => {
        const storedUser = sessionStorage.getItem('user_data');
        const storedToken = sessionStorage.getItem('token');

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
        setLoading(false);
    };
    checkLogin();
  }, []);

  const login = async (username, password) => {
    try {
      const data = await loginRequest({ username, password });

      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user_data', JSON.stringify(data.user));
      
      setUser(data.user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Error al conectar con el servidor';
      return { success: false, message: errorMsg };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user_data');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated, 
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};