import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        // Check if user is already authenticated
        if (authService.isAuthenticated()) {
          // Get user data from localStorage
          const userData = authService.getCurrentUser();
          
          if (userData) {
            setUser(userData);
          } else {
            // If token exists but no user data, try to fetch profile
            try {
              const response = await authService.getUserProfile();
              setUser(response.data.user);
            } catch (profileError) {
              console.error('Error fetching user profile:', profileError);
              // If profile fetch fails, clear auth data and reset state
              authService.clearAuthData();
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError('Failed to initialize authentication. Please try again.');
        // Clear any invalid auth state
        authService.clearAuthData();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login with OTP verification
  const login = async (phone, otp) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.verifyOtp(phone, otp);
      // The user data is in response.data.user
      if (response && response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }
      return response;
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials and try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setLoading(true);
    
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = (userData) => {
    setUser(userData);
  };

  // Refresh token
  const refreshUserToken = async () => {
    try {
      await authService.refreshToken();
      return true;
    } catch (err) {
      console.error('Token refresh error:', err);
      setUser(null);
      return false;
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: isAdmin(),
    login,
    logout,
    updateUserProfile,
    refreshUserToken,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;