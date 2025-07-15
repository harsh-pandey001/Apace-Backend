# APACE Admin Panel

A modern, responsive admin dashboard built with React.js and Material-UI for the APACE Transportation System.

## Features

- **Modern UI**: Built with Material-UI components for a clean, professional look
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Theme**: Toggle between dark and light themes with persistent storage
- **Routing**: React Router for navigation between different pages
- **Modular Structure**: Clean component architecture for easy maintenance and scalability

## Project Structure

```
AdminPanel/
├── components/
│   ├── Sidebar.js          # Navigation sidebar
│   ├── Header.js           # Top header with theme toggle
│   └── DashboardCards.js   # Metric cards for dashboard
├── pages/
│   ├── Dashboard.js        # Main dashboard page
│   ├── Users.js           # User management
│   ├── Shipments.js       # Shipment tracking
│   ├── Bookings.js        # Booking management
│   └── Preferences.js     # System preferences
├── public/
│   └── index.html         # HTML template
├── App.js                 # Main app component
├── index.js               # React entry point
├── theme.js               # MUI theme configuration
├── package.json           # Dependencies
└── README.md              # This file
```

## Installation

1. Navigate to the AdminPanel directory:
   ```bash
   cd AdminPanel
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to set your backend URL:
   ```
   REACT_APP_API_BASE_URL=https://apace-backend-86500976134.us-central1.run.app
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

### Environment Variables

The admin panel uses the following environment variables:

- `REACT_APP_API_BASE_URL`: Base URL for the backend API (required)
  - **Production**: `https://apace-backend-86500976134.us-central1.run.app`
  - **Development**: `http://localhost:5000`

### Backend Configuration

The admin panel connects to the APACE Transportation Backend API. Make sure the backend is running and accessible at the configured URL.

## Technologies Used

- **React.js** (v18.2.0) - Frontend framework
- **Material-UI** (v5.11.0) - UI component library
- **React Router DOM** (v6.8.0) - Routing
- **@mui/icons-material** - Material Design icons
- **@emotion/react & @emotion/styled** - CSS-in-JS styling

## Key Components

### 1. Sidebar Navigation
- Dashboard
- Users Management
- Shipments Tracking
- Bookings Management
- System Preferences
- Logout

### 2. Header
- Mobile menu toggle
- Dark/Light theme switcher
- Notifications bell
- User profile dropdown

### 3. Dashboard
- Metric cards showing key statistics
- Recent activities table
- Recent shipments table
- Performance metrics

### 4. Theme Management
- Light and dark theme support
- Persistent theme preference using localStorage
- Custom MUI theme configuration

## Development

### Adding New Pages

1. Create a new component in `pages/` directory
2. Import it in `App.js`
3. Add a new route in the Routes component
4. Add navigation item in `Sidebar.js`

### Customizing Theme

Edit `theme.js` to modify:
- Color palette
- Typography settings
- Component overrides
- Border radius and spacing

### Adding New Features

1. Create components in `components/` directory
2. Import and use them in relevant pages
3. Follow Material-UI best practices for styling
4. Use React hooks for state management

## Future Enhancements

- [ ] Connect to backend API
- [ ] Implement user authentication
- [ ] Add data visualization charts
- [ ] Real-time notifications
- [ ] Advanced filtering and search
- [ ] Export functionality
- [ ] Role-based access control
- [ ] Internationalization (i18n)

## Best Practices

- Use functional components with hooks
- Keep components small and focused
- Use Material-UI's `sx` prop for styling
- Follow consistent naming conventions
- Add proper PropTypes or TypeScript (future)
- Write unit tests for components

## Deployment

To build for production:

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Contributing

1. Follow the existing code style
2. Test thoroughly before submitting changes
3. Update documentation as needed
4. Create meaningful commit messages

## License

This project is part of the APACE Transportation Backend system.