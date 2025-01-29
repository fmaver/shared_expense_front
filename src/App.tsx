import React, { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { Login } from './components/Login';
import { Profile } from './components/Profile';
import axios from 'axios';
import { ExpenseForm } from './components/ExpenseForm';
import { MoneyTransferForm } from './components/MoneyTransferForm';
import { MonthPicker } from './components/MonthPicker';
import { ExpenseHeader } from './components/ExpenseHeader';
import { ExpenseContent } from './components/ExpenseContent';
import { LoadingState } from './components/LoadingState';
import { useMonthlyBalance } from './hooks/useMonthlyBalance';
import { useMembers } from './hooks/useMembers';
import { createExpense } from './api/expenses';
import type { ExpenseCreate } from './types/expense';
import { FormModal } from './components/FormModal';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [createExpenseError, setCreateExpenseError] = useState<string | null>(null);

  const { data: members, isLoading: isLoadingMembers } = useMembers();
  const { 
    data: monthlyData, 
    isLoading: isLoadingExpenses,
    error: expensesError,
    refetch: refreshMonthlyData
  } = useMonthlyBalance(year, month);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    
    if (token) {
      // Check if token is expired
      if (tokenExpiration && new Date(tokenExpiration) <= new Date()) {
        handleLogout();
        return;
      }
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    }

    // Add response interceptor
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const handleLogin = (token: string) => {
    // Store token and expiration time (30 minutes from now)
    const expirationTime = new Date(new Date().getTime() + 30 * 60000);
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiration', expirationTime.toISOString());
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setShowProfile(false);
    setAnchorEl(null);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    setShowProfile(true);
    handleClose();
  };

  const handleCreateExpense = async (expenseData: any) => {
    try {
      setCreateExpenseError(null);
      const { data: result, error } = await createExpense(expenseData);
      
      if (error) {
        throw new Error(error);
      } else if (result) {
        setShowForm(false);
        setShowTransferForm(false);
        refreshMonthlyData();
      } else {
        throw new Error('Failed to create expense');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      setCreateExpenseError(error instanceof Error ? error.message : 'Failed to create expense');
    }
  };

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const handleAddExpense = () => {
    setShowForm(!showForm);
    setShowTransferForm(false);
    setCreateExpenseError(null);
  };

  const handleAddTransfer = () => {
    setShowTransferForm(!showTransferForm);
    setShowForm(false);
    setCreateExpenseError(null);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  if (showProfile) {
    return (
      <Box>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Jirens Shared Expenses
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => setShowProfile(false)}>Back to Dashboard</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        <Profile />
      </Box>
    );
  }

  if (isLoadingMembers) {
    return <LoadingState message="Loading members..." />;
  }

  if (expensesError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg shadow">
          <p>Error: {expensesError}</p>
        </div>
      </div>
    );
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Jirens Shared Expenses
          </Typography>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-8 px-4">
          <ExpenseHeader 
            onAddExpense={handleAddExpense}
            onAddTransfer={handleAddTransfer}
            showForm={showForm}
            showTransferForm={showTransferForm}
            monthlyData={monthlyData}
            members={members || []}
          />

          <MonthPicker
            year={year}
            month={month}
            onNavigate={handleMonthChange}
          />

          {isLoadingExpenses ? (
            <LoadingState message="Loading expenses..." />
          ) : (
            <ExpenseContent
              isLoading={isLoadingExpenses}
              monthlyData={monthlyData}
              members={members || []}
              onExpenseUpdated={refreshMonthlyData}
            />
          )}

          {showForm && members && (
            <FormModal
              isOpen={showForm}
              onClose={() => {
                setShowForm(false);
                setCreateExpenseError(null);
              }}
              title="Add Expense"
              error={createExpenseError}
            >
              <ExpenseForm 
                onSubmit={handleCreateExpense} 
                members={members}
                onCancel={() => {
                  setShowForm(false);
                  setCreateExpenseError(null);
                }}
              />
            </FormModal>
          )}

          {showTransferForm && members && (
            <FormModal
              isOpen={showTransferForm}
              onClose={() => {
                setShowTransferForm(false);
                setCreateExpenseError(null);
              }}
              title="Add Money Transfer"
              error={createExpenseError}
            >
              <MoneyTransferForm
                onSubmit={handleCreateExpense}
                members={members}
                onCancel={() => {
                  setShowTransferForm(false);
                  setCreateExpenseError(null);
                }}
              />
            </FormModal>
          )}
        </div>
      </div>
    </Box>
  );
}

export default App;