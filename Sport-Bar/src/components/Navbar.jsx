import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Button, Box, Container, IconButton, Avatar, 
  Tooltip, Typography, Menu, MenuItem, Divider, ListItemIcon,
  Drawer, List, ListItem, ListItemButton, ListItemText, Collapse, 
  useTheme, useMediaQuery
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Dashboard as DashboardIcon, Inventory as InventoryIcon, 
  PointOfSale as PointOfSaleIcon, Logout as LogoutIcon,
  Badge as BadgeIcon, ReceiptLong as ReceiptIcon,
  Store as StoreIcon, Warehouse as WarehouseIcon, ArrowDropDown as ArrowDropDownIcon,
  Groups as GroupsIcon, Menu as MenuIcon, Close as CloseIcon, 
  ExpandLess, ExpandMore, Brightness4, Brightness7
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext'; 
import logoImg from '../assets/logo.png'; 

// Colores de la marca
const goldColor = '#D4AF37'; 
const darkColor = '#111111'; 

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth(); 
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); 
  const { mode, toggleTheme } = useThemeMode();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [expensesAnchorEl, setExpensesAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGastosOpen, setMobileGastosOpen] = useState(false);
  
  const openUserMenu = Boolean(anchorEl);
  const openExpensesDesktop = Boolean(expensesAnchorEl);
  const isExpensesActive = location.pathname.includes('/expenses');
  const isAdmin = user?.role === 'admin';

  const handleProfileClick = (event) => setAnchorEl(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorEl(null);
  
  const handleLogout = () => { 
    handleCloseUserMenu(); 
    logout(); 
  };
  
  const handleExpensesClick = (event) => setExpensesAnchorEl(event.currentTarget);
  const handleExpensesClose = () => setExpensesAnchorEl(null);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMobileGastosToggle = () => setMobileGastosOpen(!mobileGastosOpen);

  const allMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['admin'] },   
    { text: 'Inventario', icon: <InventoryIcon />, path: '/inventory', roles: ['admin', 'empleado'] }, 
    { text: 'Punto de Venta', icon: <PointOfSaleIcon />, path: '/pos', roles: ['admin', 'empleado'] }, 
    { text: 'Gastos', icon: <ReceiptIcon />, path: null, isDropdown: true, roles: ['admin'] }, 
  ];
  
  const userRole = user?.role || 'empleado';
  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  if (!user) return null;

  const drawerContent = (
    <Box sx={{ width: 280, height: '100%', bgcolor: mode === 'dark' ? '#1e1e1e' : '#f5f5f5', color: mode === 'dark' ? '#fff' : 'inherit' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: darkColor, color: goldColor, borderBottom: `2px solid ${goldColor}` }}>
        <Typography variant="h6" fontWeight="bold" sx={{ letterSpacing: 1 }}>MENÚ</Typography>
        <IconButton onClick={handleDrawerToggle} sx={{ color: goldColor }}><CloseIcon /></IconButton>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => {
          if (item.isDropdown) {
            return (
              <React.Fragment key={item.text}>
                <ListItem disablePadding>
                  <ListItemButton onClick={handleMobileGastosToggle}>
                    <ListItemIcon sx={{ color: isExpensesActive ? goldColor : 'inherit' }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isExpensesActive ? 'bold' : 'medium' }} />
                    {mobileGastosOpen ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={mobileGastosOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ bgcolor: mode === 'dark' ? '#333' : '#e0e0e0' }}>
                      <ListItemButton component={RouterLink} to="/expenses/store" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
                        <ListItemIcon><StoreIcon fontSize="small" /></ListItemIcon><ListItemText primary="Gastos Tienda" />
                      </ListItemButton>
                      <ListItemButton component={RouterLink} to="/expenses/warehouse" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
                        <ListItemIcon><WarehouseIcon fontSize="small" /></ListItemIcon><ListItemText primary="Gastos Bodega" />
                      </ListItemButton>
                      <ListItemButton component={RouterLink} to="/expenses/payroll" onClick={handleDrawerToggle} sx={{ pl: 4 }}>
                        <ListItemIcon><GroupsIcon fontSize="small" /></ListItemIcon><ListItemText primary="Nómina" />
                      </ListItemButton>
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton component={RouterLink} to={item.path} onClick={handleDrawerToggle} selected={isActive}
                sx={{ '&.Mui-selected': { bgcolor: 'rgba(212, 175, 55, 0.15)', borderRight: `4px solid ${goldColor}`, color: mode === 'dark' ? goldColor : '#000' } }}
              >
                <ListItemIcon sx={{ color: isActive ? goldColor : 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive ? 'bold' : 'medium' }} />
              </ListItemButton>
            </ListItem>
          );
        })}
        <Divider sx={{ my: 1 }} />
        <ListItem disablePadding>
          <ListItemButton onClick={toggleTheme}>
            <ListItemIcon sx={{ color: mode === 'dark' ? goldColor : 'inherit' }}>{mode === 'dark' ? <Brightness7 /> : <Brightness4 />}</ListItemIcon>
            <ListItemText primary={mode === 'dark' ? 'Modo Claro' : 'Modo Oscuro'} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" elevation={4} sx={{ background: darkColor, color: '#fff', top: 0, left: 0, right: 0, width: '100%', zIndex: 1200, borderBottom: `2px solid ${goldColor}` }}>
        <Container maxWidth="xl">
          {/* Se añade position relative y flex distribuidor */}
          <Toolbar disableGutters sx={{ minHeight: '64px', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> 
            
            {/* BOTÓN HAMBURGUESA (Alineado a la izquierda en móvil) */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, width: '48px' }}>
              <IconButton color="inherit" onClick={handleDrawerToggle}>
                <MenuIcon />
              </IconButton>
            </Box>

            {/* LOGO DE LA MARCA (Izquierda en Desktop, Centro absoluto en Móvil) */}
            <Box 
              component={RouterLink} 
              to="/" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                textDecoration: 'none',
                position: { xs: 'absolute', md: 'static' },
                left: { xs: '50%', md: 'auto' },
                transform: { xs: 'translateX(-50%)', md: 'none' },
                zIndex: 10
              }}
            >
              <Box 
                component="img" 
                src={logoImg} 
                alt="Logo" 
                sx={{ 
                  height: { xs: '42px', md: '52px' }, 
                  width: 'auto', 
                  objectFit: 'contain', 
                  filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))', 
                  transition: 'transform 0.3s ease', 
                  '&:hover': { transform: 'scale(1.05)' } 
                }} 
              />
            </Box>
            
            {/* MENÚ DE ENLACES (Perfectamente centrado en Escritorio) */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: 1.5 }}>
              {menuItems.map((item) => {
                if (item.isDropdown) {
                  return (
                    <Box key={item.text}>
                      <Button onClick={handleExpensesClick} startIcon={item.icon} endIcon={<ArrowDropDownIcon />} 
                        sx={{ my: 1, color: isExpensesActive ? goldColor : 'white', display: 'flex', textTransform: 'none', fontWeight: isExpensesActive ? 'bold' : 'normal', backgroundColor: isExpensesActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent', borderRadius: '8px', px: 2, borderBottom: isExpensesActive ? `3px solid ${goldColor}` : '3px solid transparent', '&:hover': { backgroundColor: 'rgba(212, 175, 55, 0.2)', color: goldColor, transform: 'translateY(-1px)' } }}
                      >
                        {item.text}
                      </Button>
                      <Menu anchorEl={expensesAnchorEl} open={openExpensesDesktop} onClose={handleExpensesClose} onClick={handleExpensesClose} PaperProps={{ elevation: 3, sx: { mt: 1, minWidth: 180 } }}>
                        <MenuItem component={RouterLink} to="/expenses/store"><ListItemIcon><StoreIcon fontSize="small" /></ListItemIcon> Gastos Tienda</MenuItem>
                        <MenuItem component={RouterLink} to="/expenses/warehouse"><ListItemIcon><WarehouseIcon fontSize="small" /></ListItemIcon> Gastos Bodega</MenuItem>
                        <Divider />
                        <MenuItem component={RouterLink} to="/expenses/payroll"><ListItemIcon><GroupsIcon fontSize="small" /></ListItemIcon> Nómina</MenuItem>
                      </Menu>
                    </Box>
                  );
                }

                const isActive = location.pathname === item.path;
                return (
                  <Button key={item.text} component={RouterLink} to={item.path} startIcon={item.icon}
                    sx={{ my: 1, color: isActive ? goldColor : 'white', display: 'flex', textTransform: 'none', fontWeight: isActive ? 'bold' : 'normal', backgroundColor: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent', borderRadius: '8px', px: 2, borderBottom: isActive ? `3px solid ${goldColor}` : '3px solid transparent', transition: 'all 0.3s ease', '&:hover': { backgroundColor: 'rgba(212, 175, 55, 0.2)', color: goldColor, transform: 'translateY(-1px)' } }}
                  >
                    {item.text}
                  </Button>
                );
              })}
            </Box>

            {/* SECCIÓN USUARIO / CONFIGURACIÓN (Alineado a la derecha en ambos entornos) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, zIndex: 10 }}>
              <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 0.5, display: { xs: 'none', md: 'flex' } }}>
                {mode === 'dark' ? <Brightness7 sx={{ color: goldColor }} /> : <Brightness4 />}
              </IconButton>

              <Box sx={{ textAlign: 'right', mr: 1, display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: 1, textTransform: 'uppercase', color: goldColor }}>{user?.username || 'Usuario'}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>{user?.role || 'Empleado'}</Typography>
              </Box>
              
              <Tooltip title="Opciones">
                <IconButton onClick={handleProfileClick} sx={{ p: 0 }}>
                  <Avatar sx={{ bgcolor: goldColor, color: darkColor, fontWeight: 'bold' }}>
                    {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>
              
              <Menu
                anchorEl={anchorEl} open={openUserMenu} onClose={handleCloseUserMenu}
                PaperProps={{ elevation: 0, sx: { overflow: 'visible', filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))', mt: 1.5, minWidth: 200, '& .MuiAvatar-root': { width: 32, height: 32, ml: -0.5, mr: 1 }, '&:before': { content: '""', display: 'block', position: 'absolute', top: 0, right: 14, width: 10, height: 10, bgcolor: 'background.paper', transform: 'translateY(-50%) rotate(45deg)', zIndex: 0 } } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                 <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight="bold" noWrap>{user?.username?.toUpperCase() || 'USUARIO'}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>Rol: {user?.role?.toUpperCase() || 'EMPLEADO'}</Typography>
                </Box>
                <Divider />
                
                {isAdmin && (
                  <MenuItem component={RouterLink} to="/settings" onClick={handleCloseUserMenu}>
                    <ListItemIcon><BadgeIcon fontSize="small" /></ListItemIcon> Configuración
                  </MenuItem>
                )}

                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon> Cerrar Sesión
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280, bgcolor: mode === 'dark' ? '#1e1e1e' : '#fff' } }}>
        {drawerContent}
      </Drawer>

      <Toolbar sx={{ minHeight: '64px' }} /> 
    </>
  );
};

export default Navbar;