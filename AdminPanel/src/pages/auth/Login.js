import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
  InputAdornment,
  Divider,
  CardContent,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import OtpVerification from './OtpVerification';
import authService from '../../services/authService';
// Logo will be added later

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneSubmitted, setPhoneSubmitted] = useState('');

  // Form validation
  const [phoneError, setPhoneError] = useState('');

  const validatePhone = (phoneNumber) => {
    // Basic phone number validation
    if (!phoneNumber.trim()) {
      setPhoneError('Phone number is required');
      return false;
    }

    // Phone number format validation (basic check)
    if (!/^[0-9]{10,15}$/.test(phoneNumber.trim())) {
      setPhoneError('Please enter a valid phone number (10-15 digits without + prefix)');
      return false;
    }

    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);

    // Clear error when user types
    if (phoneError) setPhoneError('');
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    
    // Validate phone
    if (!validatePhone(phone)) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authService.requestOtp(phone);
      setOtpSent(true);
      setPhoneSubmitted(phone);
    } catch (err) {
      console.error('Error requesting OTP:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setOtpSent(false);
    setPhoneSubmitted('');
    setError('');
  };

  const handleVerificationSuccess = () => {
    console.log('Verification successful, redirecting to dashboard...');
    // Add a small delay to ensure state updates before navigation
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          width: '100%', 
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Logo and Header Section */}
        <Box 
          sx={{ 
            p: 3, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <Typography variant="h4" color="inherit" sx={{ mb: 2 }}>
            <Box component="span" sx={{ fontWeight: 300, opacity: 0.8 }}>Him</Box>
            <Box component="span" sx={{ fontWeight: 700, fontSize: '1.1em' }}>Dispatch</Box>
          </Typography>
          <Typography variant="h5" component="h1" gutterBottom textAlign="center">
            Admin Panel Login
          </Typography>
          <Typography variant="body2" textAlign="center">
            {otpSent 
              ? 'Enter the verification code sent to your phone' 
              : 'Enter your phone number to receive a one-time password'
            }
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {!otpSent ? (
            <form onSubmit={handleRequestOtp}>
              <TextField
                fullWidth
                required
                id="phone"
                name="phone"
                label="Phone Number"
                variant="outlined"
                value={phone}
                onChange={handlePhoneChange}
                error={!!phoneError}
                helperText={phoneError || "Enter without country code prefix (e.g. 9876543210)"}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !phone}
                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                sx={{ mb: 2 }}
              >
                {loading ? 'Sending Code...' : 'Request OTP'}
              </Button>

              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Admin Access Only
                </Typography>
              </Divider>

              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
                This login page is restricted to authorized personnel only.
                <br />
                If you need assistance, please contact the system administrator.
              </Typography>
            </form>
          ) : (
            <OtpVerification 
              phone={phoneSubmitted} 
              onBack={handleBack}
              onSuccess={handleVerificationSuccess}
            />
          )}
        </CardContent>
      </Paper>
    </Container>
  );
};

export default Login;