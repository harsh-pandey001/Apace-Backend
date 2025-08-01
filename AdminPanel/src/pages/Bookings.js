import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

function Bookings() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Bookings Management
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">124</Typography>
            <Typography variant="body2" color="text.secondary">Total Bookings</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">89</Typography>
            <Typography variant="body2" color="text.secondary">Confirmed</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">23</Typography>
            <Typography variant="body2" color="text.secondary">Pending</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="error.main">12</Typography>
            <Typography variant="body2" color="text.secondary">Cancelled</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            variant="outlined"
            placeholder="Search bookings..."
            sx={{ flex: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<CalendarIcon />}
            onClick={() => alert('Date filter coming soon!')}
          >
            Filter by Date
          </Button>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Chip label="All" color="primary" sx={{ mr: 1 }} />
          <Chip label="Confirmed" sx={{ mr: 1 }} />
          <Chip label="Pending" sx={{ mr: 1 }} />
          <Chip label="Cancelled" sx={{ mr: 1 }} />
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 5 }}>
          Booking management interface will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
}

export default Bookings;