import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, useMediaQuery, CircularProgress } from '@mui/material';
import { getTheme } from './theme';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { SkipLink, LiveRegion } from './components/AccessibilityUtils';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Lazy-loaded components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const Shipments = lazy(() => import('./pages/Shipments'));
const DriverDocuments = lazy(() => import('./pages/DriverDocuments'));
const Preferences = lazy(() => import('./pages/Preferences'));
const Login = lazy(() => import('./pages/auth/Login'));

const drawerWidth = 240;

// Loading component for lazy-loaded routes
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

// Login route component that redirects to dashboard if already logged in
const LoginRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading while checking auth state
  if (loading) {
    return <LoadingFallback />;
  }
  
  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    console.log('Already authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  // Otherwise, show login page
  return <Login />;
};

// PageAnnouncer component for screen reader announcements
const PageAnnouncer = () => {
  const location = useLocation();
  
  // Format the pathname for announcement
  const pageNameForScreenReader = () => {
    // Remove leading slash and get the page name
    const pageName = location.pathname.substring(1) || 'dashboard';
    return pageName.charAt(0).toUpperCase() + pageName.slice(1);
  };

  return (
    <div 
      aria-live="polite" 
      aria-atomic="true" 
      className="visually-hidden" 
      style={{ position: 'absolute', left: '-9999px' }}
    >
      {`You are now on the ${pageNameForScreenReader()} page`}
    </div>
  );
};

// Layout component for authenticated pages
const AuthenticatedLayout = ({ children }) => {
  // Media query to detect mobile devices
  const isMobile = useMediaQuery('(max-width:600px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    // Check for user preference in localStorage
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    // If not found, check for system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Generate theme based on current mode
  const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  // Listen for system color scheme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only update if user hasn't explicitly set a preference
      if (localStorage.getItem('darkMode') === null) {
        setDarkMode(e.matches);
      }
    };

    // Add event listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // For older browsers
      mediaQuery.addListener(handleChange);
    }

    // Clean up
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Close mobile drawer when switching to desktop view
  useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile, mobileOpen]);

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Handle theme mode toggle
  const handleThemeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  // Close sidebar on mobile after route changes
  const handleRouteChange = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await logout();
      // Redirect will happen automatically due to auth state change
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Accessibility: Announcement region for screen readers */}
        <LiveRegion mode="polite">
          <div id="announcement-region" aria-live="polite" className="visually-hidden"></div>
        </LiveRegion>
        
        <Header 
          drawerWidth={drawerWidth} 
          handleDrawerToggle={handleDrawerToggle}
          darkMode={darkMode}
          onThemeToggle={handleThemeToggle}
          onLogout={handleLogout}
          user={user}
        />
        
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          <Sidebar 
            drawerWidth={drawerWidth}
            mobileOpen={mobileOpen}
            onDrawerToggle={handleDrawerToggle}
            onRouteChange={handleRouteChange}
            onLogout={handleLogout}
            user={user}
          />
          
          {/* Main content area */}
          <Box
            component="main"
            id="main-content" // Target for the skip link
            role="main" // ARIA role for main content
            tabIndex={-1} // Makes it focusable for skip link
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 3 }, // Responsive padding
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              mt: { xs: 7, sm: 8 }, // Responsive top margin
              overflowX: 'hidden', // Prevent horizontal scrolling on mobile
            }}
          >
            {children}
          </Box>
        </Box>
        
        {/* Use the PageAnnouncer component for screen readers */}
        <PageAnnouncer />
      </Box>
    </ThemeProvider>
  );
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Accessibility: Skip link for keyboard users */}
        <SkipLink target="main-content" />
        
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginRoute />} />
            
            {/* Protected routes wrapped with AuthenticatedLayout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <Navigate to="/dashboard" replace />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <Dashboard />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly>
                  <AuthenticatedLayout>
                    <Users />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/shipments"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <Shipments />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver-documents"
              element={
                <ProtectedRoute adminOnly>
                  <AuthenticatedLayout>
                    <DriverDocuments />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/preferences"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <Preferences />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;