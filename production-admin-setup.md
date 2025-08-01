# Production Admin Account Setup Guide

## Prerequisites
- Access to production database or server
- Production environment variables configured

## Method 1: Database Seeder (Quick Setup)

Run the existing seeder to create the default admin account:

```bash
# On production server
NODE_ENV=production npm run db:seed
```

**Default Admin Credentials:**
- Email: `admin@apace.com`
- Phone: `1234567890`

## Method 2: Custom Admin Script

Use the custom script to create a new admin with your details:

```bash
# Basic usage (creates admin with defaults)
node create-admin-script.js

# Custom admin details
node create-admin-script.js "John" "Doe" "john@yourcompany.com" "+1987654321"
```

## Method 3: Direct Database Insert

Execute the SQL script directly on your production database:

```sql
-- Connect to your production MySQL database and run:
INSERT INTO admins (
    id,
    firstName,
    lastName,
    email,
    phone,
    active,
    profilePicture,
    permissions,
    createdAt,
    updatedAt
) VALUES (
    UUID(),
    'Your First Name',
    'Your Last Name',
    'your-email@company.com',
    '+1234567890',
    true,
    NULL,
    NULL,
    NOW(),
    NOW()
);
```

## Method 4: Google Cloud Console (if using Cloud SQL)

1. Open Google Cloud Console
2. Navigate to Cloud SQL
3. Select your database instance
4. Open Cloud Shell or use the Query Editor
5. Run the INSERT statement above with your details

## Login Process

After creating the admin account:

1. Open the Admin Panel: `http://your-admin-panel-url`
2. Enter the phone number you used
3. Click "Request OTP"
4. Check your SMS/console logs for OTP
5. Enter OTP to login

## Verification

To verify the admin account was created successfully:

```sql
SELECT * FROM admins WHERE email = 'your-email@company.com';
```

## Security Notes

- Change the default admin credentials immediately after first login
- Use a secure phone number for OTP authentication
- Consider setting up proper permissions if your system supports role-based access
- Keep admin credentials secure and don't share them

## Troubleshooting

### Admin not found during login
- Verify the admin record exists in the `admins` table
- Check that the phone number matches exactly (including country code)
- Ensure the `active` field is set to `true`

### OTP not working
- Check OTP verification logs in the application
- Verify the phone number format is correct
- Check if OTP has expired (15-minute validity)

### Database connection issues
- Verify environment variables are correct
- Check database connectivity
- Ensure the `admins` table exists (run migrations if needed)