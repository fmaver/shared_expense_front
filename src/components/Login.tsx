import React, { useState } from 'react';
import { login, register } from '../api/auth';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
  Link,
  useTheme,
} from '@mui/material';
import { AccountCircle, Lock, Visibility, VisibilityOff, Phone } from '@mui/icons-material';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // register-only
  const [name, setName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const theme = useTheme();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setTelephone('');
    setError('');
  };

  const switchMode = (next: 'login' | 'register') => {
    resetForm();
    setMode(next);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await login({ username: email, password });
      localStorage.setItem('token', response.access_token);
      onLoginSuccess(response.access_token);
    } catch {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await register({ name, email, password, telephone: telephone.trim() || undefined });
      // Auto-login after successful registration
      const tokenResponse = await login({ username: email, password });
      localStorage.setItem('token', tokenResponse.access_token);
      onLoginSuccess(tokenResponse.access_token);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
        padding: 3,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <AccountCircle sx={{ fontSize: 40, color: 'white' }} />
          </Box>

          <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>
            Jirens
          </Typography>
          <Typography component="h2" variant="h5" sx={{ mb: 3, color: 'text.secondary', textAlign: 'center' }}>
            Shared Expenses
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          {mode === 'login' ? (
            <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(v => !v)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  color: 'white',
                  '&:hover': { background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)' },
                }}
              >
                {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Sign In'}
              </Button>
              <Typography variant="body2" align="center">
                Don&apos;t have an account?{' '}
                <Link component="button" type="button" onClick={() => switchMode('register')}>
                  Create one
                </Link>
              </Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleRegister} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Full name"
                autoComplete="name"
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                fullWidth
                label="WhatsApp phone (optional)"
                type="tel"
                placeholder="e.g. 541138718498"
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
                helperText="Include country code, no + sign. Needed to use the WhatsApp bot."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                inputProps={{ minLength: 6 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(v => !v)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(v => !v)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  color: 'white',
                  '&:hover': { background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)' },
                }}
              >
                {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create account'}
              </Button>
              <Typography variant="body2" align="center">
                Already have an account?{' '}
                <Link component="button" type="button" onClick={() => switchMode('login')}>
                  Sign in
                </Link>
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};
