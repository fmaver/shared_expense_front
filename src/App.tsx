import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Login } from './components/Login';
import { Profile } from './components/Profile';
import { GroupSelector } from './components/GroupSelector';
import { GroupLayout } from './components/GroupLayout';
import { ExpensesDashboard } from './components/ExpensesDashboard';
import { GroupMembers } from './components/GroupMembers';
import { GroupSettings } from './components/GroupSettings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const tokenExpiration = localStorage.getItem('tokenExpiration');

    if (token) {
      if (tokenExpiration && new Date(tokenExpiration) <= new Date()) {
        handleLogout();
        return;
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    }

    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) handleLogout();
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const handleLogin = (token: string) => {
    const expiration = new Date(new Date().getTime() + 30 * 60000);
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiration', expiration.toISOString());
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <Routes>
      <Route path="/" element={<GroupSelector onLogout={handleLogout} />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/groups/:groupId" element={<GroupLayout onLogout={handleLogout} />}>
        <Route index element={<ExpensesDashboard />} />
        <Route path="members" element={<GroupMembers />} />
        <Route path="settings" element={<GroupSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
