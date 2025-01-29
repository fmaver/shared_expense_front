import React, { useState, useEffect } from 'react';
import { getCurrentUser, updateProfile, updatePassword, MemberResponse } from '../api/auth';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

export const Profile: React.FC = () => {
  const [user, setUser] = useState<MemberResponse | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      setName(userData.name);
      setEmail(userData.email);
      setTelephone(userData.telephone);
    } catch (err) {
      setError('Failed to load user data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ name, email, telephone });
      setSuccess('Profile updated successfully');
      setError('');
    } catch (err) {
      setError('Failed to update profile');
      setSuccess('');
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      await updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess('Password updated successfully');
      setError('');
      setOpenPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError('Failed to update password');
      setSuccess('');
    }
  };

  if (!user) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Profile
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="telephone"
            label="Telephone"
            name="telephone"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Update Profile
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setOpenPasswordDialog(true)}
          >
            Change Password
          </Button>
        </Box>
      </Box>

      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            required
            fullWidth
            name="currentPassword"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="newPassword"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
          <Button onClick={handlePasswordUpdate}>Update Password</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
