import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  useTheme,
  Badge,
  Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalShipping as ShippingIcon,
  Description as DocumentIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Help,
  Info,
  DirectionsCar as VehicleIcon,
} from '@mui/icons-material';
import userService from '../services/userService';
import { getLast24HoursShipmentsCount } from '../services/shipmentService';
import driverDocumentService from '../services/driverDocumentService';

// Menu items structure - badges will be populated dynamically
const getMenuItems = (usersBadge, shipmentsBadge, documentsBadge) => [
  { 
    text: 'Dashboard', 
    icon: <DashboardIcon />, 
    path: '/dashboard',
    badge: null, 
  },
  { 
    text: 'Users', 
    icon: <PeopleIcon />, 
    path: '/users',
    badge: usersBadge > 0 ? usersBadge : null, // New users in last 24h
  },
  { 
    text: 'Shipments', 
    icon: <ShippingIcon />, 
    path: '/shipments',
    badge: shipmentsBadge > 0 ? shipmentsBadge : null, // New shipments in last 24h
  },
  { 
    text: 'Driver Documents', 
    icon: <DocumentIcon />, 
    path: '/driver-documents',
    badge: documentsBadge > 0 ? documentsBadge : null, // Pending documents
  },
  { 
    text: 'Vehicle Pricing', 
    icon: <VehicleIcon />, 
    path: '/vehicle-pricing',
    badge: null,
  },
  { 
    text: 'Settings', 
    icon: <SettingsIcon />, 
    path: '/preferences',
    badge: null,
  },
];

// Footer menu items
const footerMenuItems = [
  { text: 'Help & Support', icon: <Help />, path: '/help' },
  { text: 'About', icon: <Info />, path: '/about' },
];

function Sidebar({ drawerWidth, mobileOpen, onDrawerToggle, onRouteChange }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for dynamic badge counts
  const [usersBadgeCount, setUsersBadgeCount] = useState(0);
  const [shipmentsBadgeCount, setShipmentsBadgeCount] = useState(0);
  const [documentsBadgeCount, setDocumentsBadgeCount] = useState(0);
  
  // Fetch badge counts on component mount and set up refresh interval
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        const [usersCount, shipmentsCount, documentsStats] = await Promise.all([
          userService.getLast24HoursUsersCount(),
          getLast24HoursShipmentsCount(),
          driverDocumentService.getDocumentStatistics()
        ]);
        
        setUsersBadgeCount(usersCount);
        setShipmentsBadgeCount(shipmentsCount);
        setDocumentsBadgeCount(documentsStats.data?.pending_documents || 0);
      } catch (error) {
        console.error('Error fetching badge counts:', error);
      }
    };
    
    // Initial fetch
    fetchBadgeCounts();
    
    // Set up interval to refresh badge counts every 5 minutes
    const intervalId = setInterval(fetchBadgeCounts, 5 * 60 * 1000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Get menu items with current badge counts
  const menuItems = getMenuItems(usersBadgeCount, shipmentsBadgeCount, documentsBadgeCount);

  const handleLogout = () => {
    // Handle logout logic here
    console.log('Logout clicked');
    // For now, just navigate to login or show alert
    alert('Logout functionality will be implemented');
  };

  const drawer = (
    <div>
      {/* App Title/Logo */}
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 2,
        backgroundColor: theme.palette.primary.main,
        color: 'white'
      }}>
        <Avatar 
          sx={{ 
            width: 40, 
            height: 40, 
            bgcolor: 'white', 
            color: theme.palette.primary.main,
            mr: 1.5,
            fontWeight: 'bold'
          }}
        >
          A
        </Avatar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          APACE Admin
        </Typography>
      </Toolbar>
      
      <Divider />
      
      {/* Main Menu */}
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                // Close sidebar on mobile after navigation
                if (onRouteChange) {
                  onRouteChange();
                }
              }}
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: '8px',
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}15`,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}25`,
                  },
                },
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: location.pathname === item.path
                    ? theme.palette.primary.main 
                    : 'inherit',
                  minWidth: 40
                }}
              >
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  '& .MuiListItemText-primary': { 
                    fontWeight: location.pathname === item.path
                      ? 600 
                      : 400 
                  } 
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider sx={{ mt: 2 }} />
      
      {/* Footer Menu */}
      <List sx={{ px: 1 }}>
        {footerMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{
                px: 2,
                py: 1,
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        
        {/* Logout Button */}
        <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              px: 2,
              py: 1,
              borderRadius: '8px',
              color: theme.palette.error.main,
              '&:hover': {
                backgroundColor: `${theme.palette.error.main}15`,
              },
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.error.main, minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: 'none',
            boxShadow: theme.shadows[8]
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: 'none',
            boxShadow: theme.shadows[3]
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
}

export default Sidebar;