import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';

const OtpVerification = ({ phone, onBack, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resendDisabled, setResendDisabled] = useState(true);
  const timerRef = useRef(null);
  
  // Use auth context for login
  const { login } = useAuth();

  useEffect(() => {
    // Start countdown
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Format phone for display (add asterisks)
  const formatPhoneForDisplay = () => {
    if (!phone || phone.length < 5) return phone;
    return `${phone.substring(0, 2)}****${phone.substring(phone.length - 4)}`;
  };

  const handleOtpChange = (e) => {
    const value = e.target.value;
    // Only allow digits
    if (/^\d*$/.test(value)) {
      setOtp(value);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!otp || otp.length < 4) {
      setError('Please enter a valid verification code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Use login from auth context instead of direct service call
      await login(phone, otp);
      
      // If we get here, login was successful
      console.log('Login successful, redirecting...');
      onSuccess(); // Callback to parent on successful verification
    } catch (err) {
      console.error('Error verifying OTP:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResendDisabled(true);
    setCountdown(60);
    
    try {
      await authService.requestOtp(phone);
      
      // Restart countdown
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error resending OTP:', err);
      setError('Failed to resend verification code. Please try again.');
      setResendDisabled(false);
    }
  };

  return (
    <form onSubmit={handleVerifyOtp}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" gutterBottom>
          Verification code sent to:
        </Typography>
        <Typography variant="h6" fontWeight="medium">
          {formatPhoneForDisplay()}
        </Typography>
      </Box>

      <TextField
        fullWidth
        required
        id="otp"
        name="otp"
        label="Verification Code"
        variant="outlined"
        placeholder="Enter 6-digit code"
        value={otp}
        onChange={handleOtpChange}
        disabled={loading}
        autoFocus
        inputProps={{
          maxLength: 6,
          pattern: '[0-9]*',
          inputMode: 'numeric',
        }}
        sx={{ mb: 3 }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={loading || !otp}
        endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockOpenIcon />}
        sx={{ mb: 2 }}
      >
        {loading ? 'Verifying...' : 'Verify & Login'}
      </Button>

      <Stack 
        direction="row" 
        spacing={2} 
        justifyContent="space-between"
        alignItems="center"
        sx={{ mt: 2 }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          disabled={loading}
        >
          Back
        </Button>

        <Box>
          {resendDisabled ? (
            <Typography variant="body2" color="text.secondary">
              Resend code in {countdown}s
            </Typography>
          ) : (
            <Button
              variant="text"
              startIcon={<RefreshIcon />}
              onClick={handleResendOtp}
              disabled={loading}
            >
              Resend Code
            </Button>
          )}
        </Box>
      </Stack>
    </form>
  );
};

OtpVerification.propTypes = {
  phone: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default OtpVerification;