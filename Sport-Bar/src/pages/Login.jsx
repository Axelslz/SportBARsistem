import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, TextField, Button, Alert } from '@mui/material';
import logoImg from '../assets/Logo.png'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(username, password);

    if (result.success) {
      navigate('/'); 
    } else {
      setError(result.message);
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        bgcolor: 'background.default', 
        p: 2 
      }}
    >
      <Paper 
        elevation={6} 
        sx={{ 
          p: 4, 
          borderRadius: 3, 
          width: '100%', 
          maxWidth: '400px',
          bgcolor: 'background.paper'
        }}
      >
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box 
            component="img" 
            src={logoImg} 
            alt="Logo Ferre La Bodega" 
            sx={{ 
              width: '100%', 
              maxWidth: '250px',
              height: 'auto',
              objectFit: 'contain'
            }} 
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Usuario"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <TextField
            label="Contraseña"
            type="password"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 4 }}
          />

          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            size="large"
            sx={{ 
              py: 1.5, 
              fontWeight: 'bold',
              borderRadius: 2
            }}
          >
            INGRESAR
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;