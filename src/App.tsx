import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { LandingPage } from './pages/LandingPage';
import { isStandalone } from './utils/pwa';
// Se importa acá para escuchar `beforeinstallprompt` desde la carga (Chrome lo dispara una vez).
import './utils/installGuide';
import { LoginPage } from './pages/LoginPage';
import { AppShell } from './components/layout/AppShell';
import { useKeyboardInset } from './hooks/useKeyboardInset';
import { GroupSelectorPage } from './pages/GroupSelectorPage';
import { SettleProgressPage } from '@/pages/SettleProgressPage';
import { ArchivedGroupsPage } from './pages/ArchivedGroupsPage';
import { GroupLayout } from './pages/GroupLayout';
import { ExpensesDashboard } from './pages/ExpensesDashboard';
import { GroupMembersPage } from './pages/GroupMembersPage';
import { GroupSettingsPage } from './pages/GroupSettingsPage';
import { GroupChartsPage } from './pages/GroupChartsPage';
import { ProfilePage } from './pages/ProfilePage';
import { PersonalDashboard } from './pages/PersonalDashboard';
import { PersonalSectionPage } from './pages/PersonalSectionPage';
import { PersonalChartsPage } from './pages/PersonalChartsPage';
import { InvitationLanding } from './public-pages/InvitationLanding';
import { GroupJoinLanding } from './public-pages/GroupJoinLanding';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { IslandProvider } from './contexts/IslandContext';
import { FabActionsProvider } from './contexts/FabActionsContext';
import { SearchProvider } from './contexts/SearchContext';
import { ScrollProvider } from './contexts/ScrollContext';
import { ExpenseRefreshProvider } from './contexts/ExpenseRefreshContext';
import { SettlementProvider } from './contexts/SettlementContext';
import { usePushNavigation } from '@/hooks/usePushNavigation';
import GroupDueDatesPage from '@/pages/GroupDueDatesPage';
import PersonalDueDatesPage from '@/pages/PersonalDueDatesPage';

function App() {
  usePushNavigation();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Publishes --keyboard-inset so bottom sheets can sit above the on-screen keyboard.
  useKeyboardInset();

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
    window.location.href = '/login';
  };

  // Don't render routes until we've checked localStorage — prevents flash-redirect on deep links
  if (!authChecked) return null;

  return (
    <CurrencyProvider>
      <IslandProvider>
        <ScrollProvider>
        <FabActionsProvider>
        <SearchProvider>
        <ExpenseRefreshProvider>
        <SettlementProvider>
      <Routes>
        {/* Public */}
        {/* La app instalada no muestra la pública de marketing: quien ya la instaló viene a
            entrar, no a enterarse de qué es. Abre directo en el login. */}
        <Route path="/" element={isAuthenticated
          ? <Navigate to="/groups" replace />
          : isStandalone() ? <Navigate to="/login" replace /> : <LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/groups" replace /> : <LoginPage onLoginSuccess={handleLogin} />} />
        <Route path="/invite/:token" element={<InvitationLanding onLoginSuccess={handleLogin} />} />
        <Route path="/join/:token" element={<GroupJoinLanding onLoginSuccess={handleLogin} />} />

        {/* Protected */}
        {!isAuthenticated ? (
          <Route path="*" element={<Navigate to="/login" replace />} />
        ) : (
          <Route element={<AppShell onLogout={handleLogout} />}>
            <Route path="/groups" element={<GroupSelectorPage />} />
              <Route path="/groups/archived" element={<ArchivedGroupsPage />} />
            <Route path="/groups/:groupId" element={<GroupLayout />}>
              <Route index element={<ExpensesDashboard />} />
              <Route path="members" element={<GroupMembersPage />} />
              <Route path="settings" element={<GroupSettingsPage />} />
              <Route path="charts" element={<GroupChartsPage />} />
        <Route path="due-dates" element={<GroupDueDatesPage />} />
            </Route>
            {/*
              Saldar lleva días: se marca un pago hoy y el otro el martes. Por eso el progreso
              es una pantalla con URL propia —fuera de las pestañas, con su "‹ Casa"— y no una
              hoja que se cierra de un manotazo y no deja dónde volver.
            */}
            <Route path="/groups/:groupId/settle" element={<SettleProgressPage />} />
            <Route path="/personal" element={<PersonalDashboard />} />
            <Route path="/personal/charts" element={<PersonalChartsPage />} />
            <Route path="/personal/incomes" element={<PersonalSectionPage section="incomes" />} />
            <Route path="/personal/expenses" element={<PersonalSectionPage section="expenses" />} />
            <Route path="/personal/shares" element={<PersonalSectionPage section="shares" />} />
            <Route path="/personal/due-dates" element={<PersonalDueDatesPage />} />
            <Route path="/profile" element={<ProfilePage onLogout={handleLogout} />} />
            <Route path="*" element={<Navigate to="/groups" replace />} />
          </Route>
        )}
      </Routes>
        </SettlementProvider>
        </ExpenseRefreshProvider>
        </SearchProvider>
        </FabActionsProvider>
        </ScrollProvider>
      </IslandProvider>
    </CurrencyProvider>
  );
}

export default App;
