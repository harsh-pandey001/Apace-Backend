import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  useTheme,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import UserFilters from '../components/UserFilters';
import UserTable from '../components/UserTable';
import DriverTable from '../components/DriverTable';
import OptimizedUserRoleChart from '../components/charts/OptimizedUserRoleChart';
import userService from '../services/userService';
import driverService from '../services/driverService';

function Users() {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  const [driverFilters, setDriverFilters] = useState({});
  
  // State for user statistics
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newUsersToday: 0,
    roleDistribution: {}
  });
  
  // State for driver statistics
  const [driverStats, setDriverStats] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    inactiveDrivers: 0,
    newDriversToday: 0,
    verifiedDrivers: 0,
    pendingDrivers: 0
  });
  
  // State for loading and error messages
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverLoading, setDriverLoading] = useState(true);
  const [driverError, setDriverError] = useState(null);
  
  // Form state for adding a new user
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'user',
  });
  
  // Validation state
  const [formErrors, setFormErrors] = useState({});

  // Fetch user statistics
  const fetchUserStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const stats = await userService.getUserStats();
      setUserStats({
        totalUsers: stats.totalUsers || 0,
        activeUsers: stats.activeUsers || 0,
        inactiveUsers: stats.inactiveUsers || 0,
        newUsersToday: stats.newUsersToday || 0,
        roleDistribution: stats.roleDistribution || {}
      });
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError('Failed to load user statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch driver statistics
  const fetchDriverStats = async () => {
    setDriverLoading(true);
    setDriverError(null);
    
    try {
      const stats = await driverService.getDriverStats();
      setDriverStats({
        totalDrivers: stats.totalDrivers || 0,
        activeDrivers: stats.activeDrivers || 0,
        inactiveDrivers: stats.inactiveDrivers || 0,
        newDriversToday: stats.newDriversToday || 0,
        verifiedDrivers: stats.verifiedDrivers || 0,
        pendingDrivers: stats.pendingDrivers || 0
      });
    } catch (err) {
      console.error('Error fetching driver stats:', err);
      setDriverError('Failed to load driver statistics. Please try again.');
    } finally {
      setDriverLoading(false);
    }
  };

  // Fetch stats when component mounts
  useEffect(() => {
    fetchUserStats();
    fetchDriverStats();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Handle user data changes from the UserTable component
  const handleUserDataChange = useCallback((userData) => {
    // This function will be called when the UserTable component fetches data
    // Use it to update user statistics without making another API call
    if (userData && userData.data && userData.data.users) {
      const users = userData.data.users;
      
      // Update role distribution
      const roleDistribution = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      // Count active/inactive users
      const activeUsers = users.filter(user => user.active).length;
      const inactiveUsers = users.length - activeUsers;
      
      // Count users created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = users.filter(user => {
        const createdDate = new Date(user.createdAt);
        return createdDate >= today;
      }).length;
      
      setUserStats(prevStats => ({
        ...prevStats,
        totalUsers: userData.totalUsers || 0,
        activeUsers,
        inactiveUsers,
        newUsersToday,
        roleDistribution
      }));
    }
  }, []);

  const handleAddUserOpen = () => {
    setOpenAddUserDialog(true);
  };

  const handleAddUserClose = () => {
    // Reset form when closing
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'user',
    });
    setFormErrors({});
    setOpenAddUserDialog(false);
  };

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleFilter = useCallback((filterCriteria) => {
    setFilters(filterCriteria);
  }, []);

  const handleDriverSearch = useCallback((term) => {
    setDriverSearchTerm(term);
  }, []);

  const handleDriverFilter = useCallback((filterCriteria) => {
    setDriverFilters(filterCriteria);
  }, []);

  // Handle driver data changes from the DriverTable component
  const handleDriverDataChange = useCallback((driverData) => {
    if (driverData && driverData.data && driverData.data.drivers) {
      const drivers = driverData.data.drivers;
      
      // Count active/inactive drivers
      const activeDrivers = drivers.filter(driver => driver.isActive).length;
      const inactiveDrivers = drivers.length - activeDrivers;
      
      // Count verified/pending drivers
      const verifiedDrivers = drivers.filter(driver => driver.isVerified).length;
      const pendingDrivers = drivers.length - verifiedDrivers;
      
      // Count drivers created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newDriversToday = drivers.filter(driver => {
        const createdDate = new Date(driver.createdAt);
        return createdDate >= today;
      }).length;
      
      setDriverStats(prevStats => ({
        ...prevStats,
        totalDrivers: driverData.totalDrivers || 0,
        activeDrivers,
        inactiveDrivers,
        newDriversToday,
        verifiedDrivers,
        pendingDrivers
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!newUser.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!newUser.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!newUser.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!newUser.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    return errors;
  };

  const handleAddUser = async (event) => {
    event.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      await userService.createUser(newUser);
      handleAddUserClose();
      
      // Refresh user data 
      fetchUserStats();
    } catch (err) {
      console.error('Error creating user:', err);
      
      // Handle API errors
      if (err.response && err.response.data && err.response.data.errors) {
        const apiErrors = {};
        err.response.data.errors.forEach(error => {
          apiErrors[error.path] = error.msg;
        });
        setFormErrors(apiErrors);
      } else {
        setError('Failed to create user. Please try again.');
      }
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            User & Driver Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage all users and drivers in the system.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUserOpen}
          sx={{ height: 'fit-content' }}
        >
          Add New User
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="User management tabs">
          <Tab
            icon={<PersonIcon />}
            label="Users"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<CarIcon />}
            label="Drivers"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {currentTab === 0 && (
        <>
          {/* Users Tab Content */}
          {/* Error Display */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  startIcon={<RefreshIcon />}
                  onClick={fetchUserStats}
                >
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {/* User Stats */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="inherit" sx={{ opacity: 0.8 }}>
                      Total Users
                    </Typography>
                    <Typography variant="h4" color="inherit">
                      {userStats.totalUsers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: theme.palette.success.light, color: theme.palette.success.contrastText }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="inherit" sx={{ opacity: 0.8 }}>
                      Active Users
                    </Typography>
                    <Typography variant="h4" color="inherit">
                      {userStats.activeUsers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: theme.palette.error.light, color: theme.palette.error.contrastText }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="inherit" sx={{ opacity: 0.8 }}>
                      Inactive Users
                    </Typography>
                    <Typography variant="h4" color="inherit">
                      {userStats.inactiveUsers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: theme.palette.info.light, color: theme.palette.info.contrastText }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="inherit" sx={{ opacity: 0.8 }}>
                      New Today
                    </Typography>
                    <Typography variant="h4" color="inherit">
                      {userStats.newUsersToday}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Role Distribution Chart */}
          <OptimizedUserRoleChart roleDistribution={userStats.roleDistribution} />

          {/* Search and Filters */}
          <UserFilters onSearch={handleSearch} onFilter={handleFilter} />

          {/* User Table */}
          <UserTable 
            searchTerm={searchTerm} 
            filters={filters} 
            onUserDataChange={handleUserDataChange}
          />
        </>
      )}
      
      {currentTab === 1 && (
        <>
          {/* Drivers Tab Content */}
          {/* Error Display */}
          {driverError && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  startIcon={<RefreshIcon />}
                  onClick={fetchDriverStats}
                >
                  Retry
                </Button>
              }
            >
              {driverError}
            </Alert>
          )}
          
          {/* Driver Stats */}
          {driverLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={2}>
                <Card sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="inherit" sx={{ opacity: 0.8 }}>
                      Total Drivers
                    </Typography>
                    <Typography variant="h4" color="inherit">
                      {driverStats.totalDrivers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Card sx={{ bgcolor: theme.palette.success.light, color: theme.palette.success.contrastText }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="inherit" sx={{ opacity: 0.8 }}>
                      Active
                    </Typography>
                    <Typography variant="h4" color="inherit">
                      {driverStats.activeDrivers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Card sx={{ bgcolor: theme.palette.error.light, color: theme.palette.error.contrastText }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="inherit" sx={{ opacity: 0.8 }}>
                      Inactive
                    </Typography>
                    <Typography variant="h4" color="inherit">
                      {driverStats.inactiveDrivers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Card sx={{ bgcolor: theme.palette.info.light, color: theme.palette.info.contrastText }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="inherit" sx={{ opacity: 0.8 }}>
                      Verified
                    </Typography>
                    <Typography variant="h4" color="inherit">
                      {driverStats.verifiedDrivers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Card sx={{ bgcolor: theme.palette.warning.light, color: theme.palette.warning.contrastText }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="inherit" sx={{ opacity: 0.8 }}>
                      Pending
                    </Typography>
                    <Typography variant="h4" color="inherit">
                      {driverStats.pendingDrivers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Card sx={{ bgcolor: theme.palette.secondary.light, color: theme.palette.secondary.contrastText }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="inherit" sx={{ opacity: 0.8 }}>
                      New Today
                    </Typography>
                    <Typography variant="h4" color="inherit">
                      {driverStats.newDriversToday}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Driver Search and Filters */}
          <UserFilters 
            onSearch={handleDriverSearch} 
            onFilter={handleDriverFilter}
            isDriverMode={true}
          />

          {/* Driver Table */}
          <DriverTable 
            searchTerm={driverSearchTerm} 
            filters={driverFilters} 
            onDriverDataChange={handleDriverDataChange}
          />
        </>
      )}

      {/* Add User Dialog */}
      <Dialog open={openAddUserDialog} onClose={handleAddUserClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center' }}>
          <PersonAddIcon sx={{ mr: 1 }} /> Add New User
        </DialogTitle>
        <form onSubmit={handleAddUser}>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Enter the details for the new user. All fields marked with * are required.
            </DialogContentText>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoFocus
                  required
                  margin="dense"
                  id="firstName"
                  name="firstName"
                  label="First Name"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={newUser.firstName}
                  onChange={handleInputChange}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  margin="dense"
                  id="lastName"
                  name="lastName"
                  label="Last Name"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={newUser.lastName}
                  onChange={handleInputChange}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  margin="dense"
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  fullWidth
                  variant="outlined"
                  value={newUser.email}
                  onChange={handleInputChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  margin="dense"
                  id="phone"
                  name="phone"
                  label="Phone Number"
                  type="tel"
                  fullWidth
                  variant="outlined"
                  placeholder="e.g. 11234567890 (no + prefix)"
                  value={newUser.phone}
                  onChange={handleInputChange}
                  error={!!formErrors.phone}
                  helperText={formErrors.phone || "Enter number without + prefix"}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="dense" required>
                  <InputLabel id="role-select-label">Role</InputLabel>
                  <Select
                    labelId="role-select-label"
                    id="role"
                    name="role"
                    label="Role"
                    value={newUser.role}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="driver">Driver</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                  <FormHelperText>
                    Select the appropriate role for this user
                  </FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleAddUserClose}>Cancel</Button>
            <Button type="submit" variant="contained">Create User</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default Users;