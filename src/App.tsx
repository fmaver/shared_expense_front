import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AppShell } from './components/layout/AppShell';
import { GroupSelectorPage } from './pages/GroupSelectorPage';
import { GroupLayout } from './pages/GroupLayout';
import { ExpensesDashboard } from './pages/ExpensesDashboard';
import { GroupMembersPage } from './pages/GroupMembersPage';
import { GroupSettingsPage } from './pages/GroupSettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { PersonalDashboard } from './pages/PersonalDashboard';
import { InvitationLanding } from './public-pages/InvitationLanding';
import { GroupJoinLanding } from './public-pages/GroupJoinLanding';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const expiration = localStorage.getItem('tokenExpiration');
    if (token) {
      if (expiration && new Date(expiration) <= new Date()) {
        handleLogout();
        setAuthChecked(true);
        return;
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    }
    setAuthChecked(true);
    const id = axios.interceptors.response.use(
      r => r,
      err => { if (err.response?.status === 401) handleLogout(); return Promise.reject(err); },
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  const handleLogin = (token: string) => {
    const expiration = new Date(Date.now() + 30 * 60_000).toISOString();
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiration', expiration);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    delete axios.defaults.headers.common['Authorization'];
    // Full page reload guarantees a clean redirect regardless of router state
    window.location.href = '/';
  };

  // Don't render routes until we've checked localStorage — prevents flash-redirect on deep links
  if (!authChecked) return null;

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/groups" replace /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/groups" replace /> : <LoginPage onLoginSuccess={handleLogin} />} />
      <Route path="/invite/:token" element={<InvitationLanding onLoginSuccess={handleLogin} />} />
      <Route path="/join/:token" element={<GroupJoinLanding onLoginSuccess={handleLogin} />} />

      {/* Protected */}
      {!isAuthenticated ? (
        <Route path="*" element={<Navigate to="/login" replace />} />
      ) : (
        <Route element={<AppShell onLogout={handleLogout} />}>
          <Route path="/groups" element={<GroupSelectorPage />} />
          <Route path="/groups/:groupId" element={<GroupLayout />}>
            <Route index element={<ExpensesDashboard />} />
            <Route path="members" element={<GroupMembersPage />} />
            <Route path="settings" element={<GroupSettingsPage />} />
          </Route>
          <Route path="/personal" element={<PersonalDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/groups" replace />} />
        </Route>
      )}
    </Routes>
  );
}

export default App;
