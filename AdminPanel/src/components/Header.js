import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  InputBase,
  Tooltip,
  Chip,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Divider,
  Popover,
  List,
  ListItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  AccountCircle,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  Help as HelpIcon,
  MarkEmailRead as MarkReadIcon,
  DeleteSweep as ClearAllIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

function Header({ 
  drawerWidth, 
  handleDrawerToggle, 
  darkMode, 
  onThemeToggle,
  onLogout,
  user
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchInput);
    alert(`Global search for: ${searchInput}`);
    setSearchInput('');
    setShowSearch(false);
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchInput('');
    }
  };

  const handleMarkAllRead = () => {
    alert('All notifications marked as read');
    handleNotificationClose();
  };

  const handleClearAll = () => {
    alert('All notifications cleared');
    handleNotificationClose();
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    if (onLogout) {
      onLogout();
    }
  };

  // Get current page title from location
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.includes('/users')) return 'User Management';
    if (path === '/shipments') return 'Shipments';
    if (path === '/bookings') return 'Bookings';
    if (path === '/preferences') return 'Settings';
    if (path === '/analytics') return 'Analytics';
    if (path === '/login') return 'Login';
    return 'Dashboard';
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'A';
    
    const firstInitial = user.firstName ? user.firstName.charAt(0) : '';
    const lastInitial = user.lastName ? user.lastName.charAt(0) : '';
    
    return `${firstInitial}${lastInitial}`;
  };

  // Get user full name
  const getUserFullName = () => {
    if (!user) return 'Admin User';
    return `${user.firstName} ${user.lastName}`;
  };

  // Sample notifications with more details
  const notifications = [
    { 
      id: 1, 
      type: 'user', 
      title: 'New user registered', 
      message: 'John Doe just created an account',
      time: '2 minutes ago',
      read: false
    },
    { 
      id: 2, 
      type: 'shipment', 
      title: 'Shipment delivered', 
      message: 'Shipment #1234 was delivered successfully',
      time: '15 minutes ago',
      read: false
    },
    { 
      id: 3, 
      type: 'booking', 
      title: 'Booking cancelled', 
      message: 'Customer cancelled booking #5678',
      time: '1 hour ago',
      read: true
    },
    { 
      id: 4, 
      type: 'system', 
      title: 'System update', 
      message: 'New version is available for installation',
      time: '2 hours ago',
      read: true
    },
  ];

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.drawer - 1,
      }}
      color="default"
      elevation={0}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? 'white' : 'text.primary',
            }}
          >
            {getPageTitle()}
            {user && user.role === 'admin' && location.pathname === '/dashboard' && (
              <Chip 
                label="Admin" 
                size="small" 
                color="primary" 
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
              />
            )}
          </Typography>
        </Box>

        {/* Search Bar - conditionally shown */}
        {showSearch && (
          <Box 
            component="form" 
            onSubmit={handleSearchSubmit}
            sx={{ 
              position: 'relative',
              backgroundColor: alpha(theme.palette.common.black, 0.04),
              borderRadius: 2,
              width: { xs: '100%', sm: 300, md: 400 },
              mx: 2,
              transition: theme.transitions.create('width'),
              display: { xs: 'none', md: 'block' },
            }}
          >
            <Box sx={{ 
              padding: '0 16px',
              height: '100%',
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <SearchIcon color="action" />
            </Box>
            <InputBase
              placeholder="Search…"
              value={searchInput}
              onChange={handleSearchChange}
              autoFocus
              sx={{
                padding: '8px 8px 8px 48px',
                width: '100%',
                '& input': {
                  transition: theme.transitions.create('width'),
                },
              }}
            />
          </Box>
        )}

        {/* Only show these controls when user is logged in */}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Search Toggle */}
            <Tooltip title="Search">
              <IconButton 
                size="large"
                color="inherit"
                onClick={handleSearchToggle}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>

            {/* Help */}
            <Tooltip title="Help">
              <IconButton 
                size="large"
                color="inherit"
                onClick={() => navigate('/help')}
              >
                <HelpIcon />
              </IconButton>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
              <IconButton onClick={onThemeToggle} color="inherit">
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                size="large"
                aria-label="show notifications"
                color="inherit"
                onClick={handleNotificationOpen}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile Menu */}
            <Box sx={{ ml: 1 }}>
              <Tooltip title="Account">
                <IconButton
                  edge="end"
                  aria-label="account of current user"
                  aria-controls="profile-menu"
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  sx={{ p: 0 }}
                >
                  <Avatar 
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: user.role === 'admin' ? theme.palette.error.main : theme.palette.primary.main,
                      border: '2px solid',
                      borderColor: 'background.paper'
                    }}
                  >
                    {getUserInitials()}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}

        {/* Enhanced Notification Menu */}
        <Popover
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            elevation: 4,
            sx: {
              width: 360,
              maxHeight: 450,
              overflow: 'hidden',
              borderRadius: '10px',
            },
          }}
        >
          {/* Notification Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Notifications
            </Typography>
            <Box>
              <Tooltip title="Mark all as read">
                <IconButton size="small" onClick={handleMarkAllRead}>
                  <MarkReadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear all">
                <IconButton size="small" onClick={handleClearAll}>
                  <ClearAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {/* Notification List */}
          <List sx={{ 
            maxHeight: 320, 
            overflow: 'auto',
            p: 0,
          }}>
            {notifications.map((notification) => (
              <ListItem 
                key={notification.id}
                sx={{ 
                  px: 2, 
                  py: 1.5,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  backgroundColor: notification.read ? 'inherit' : alpha(theme.palette.primary.main, 0.04),
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    cursor: 'pointer'
                  }
                }}
                onClick={handleNotificationClose}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" component="span" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.time}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {notification.message}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={notification.type} 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        fontSize: '0.7rem',
                        textTransform: 'capitalize'
                      }}
                      variant="outlined"
                    />
                    <ChevronRightIcon fontSize="small" color="action" />
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
          
          {/* View All */}
          <Box sx={{ 
            p: 1.5, 
            textAlign: 'center',
            borderTop: `1px solid ${theme.palette.divider}`,
          }}>
            <Button 
              size="small" 
              onClick={handleNotificationClose}
              sx={{ borderRadius: 5, textTransform: 'none' }}
            >
              View All Notifications
            </Button>
          </Box>
        </Popover>

        {/* Enhanced Profile Menu */}
        <Menu
          id="profile-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          PaperProps={{
            elevation: 4,
            sx: {
              minWidth: 200,
              maxWidth: 280,
              borderRadius: '10px',
              mt: 1,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* User Info Header */}
          {user && (
            <>
              <Box sx={{ px: 2, py: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar 
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: user.role === 'admin' ? theme.palette.error.main : theme.palette.primary.main,
                      mr: 1.5
                    }}
                  >
                    {getUserInitials()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {getUserFullName()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </Box>
                {user.role === 'admin' && (
                  <Chip 
                    label={user.role.toUpperCase()} 
                    color="error"
                    size="small"
                    sx={{ borderRadius: '4px', mb: 0.5 }}
                  />
                )}
              </Box>
              
              <Divider />
              
              <MenuItem onClick={() => {
                handleProfileMenuClose();
                navigate('/profile');
              }}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                <ListItemText>My Profile</ListItemText>
              </MenuItem>
              
              <MenuItem onClick={() => {
                handleProfileMenuClose();
                navigate('/preferences');
              }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
              
              <Divider />
            </>
          )}
          
          <MenuItem 
            onClick={handleLogout}
            sx={{ 
              color: theme.palette.error.main,
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Header;