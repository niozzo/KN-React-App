import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

interface PasscodeScreenProps {
  onPasscodeValid: () => void;
}

export const PasscodeScreen: React.FC<PasscodeScreenProps> = ({ onPasscodeValid }) => {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasscodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPasscode(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (passcode === 'da1sy') {
      onPasscodeValid();
    }
    
    setLoading(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'grey.100',
        padding: 2
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Admin Access
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter the admin passcode to continue
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Passcode"
              type="password"
              value={passcode}
              onChange={handlePasscodeChange}
              disabled={loading}
              sx={{ mb: 3 }}
              autoFocus
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !passcode.trim()}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Access Admin Panel'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
