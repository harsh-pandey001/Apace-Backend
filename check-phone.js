const { User, Driver, Admin } = require('./models');

async function checkPhoneNumber(phone) {
    try {
        console.log(`🔍 Checking if phone number ${phone} is registered...\n`);

        // Check in Users table
        const user = await User.findOne({ where: { phone } });
        if (user) {
            console.log('✅ Found in USERS table:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Name: ${user.firstName} ${user.lastName}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Phone: ${user.phone}`);
            console.log(`   Role: user`);
            console.log(`   Active: ${user.active}`);
            return { found: true, table: 'users', role: 'user', user };
        }

        // Check in Drivers table
        const driver = await Driver.findOne({ where: { phone } });
        if (driver) {
            console.log('✅ Found in DRIVERS table:');
            console.log(`   ID: ${driver.id}`);
            console.log(`   Name: ${driver.name}`);
            console.log(`   Email: ${driver.email || 'N/A'}`);
            console.log(`   Phone: ${driver.phone}`);
            console.log(`   Role: driver`);
            console.log(`   Active: ${driver.isActive}`);
            console.log(`   Verified: ${driver.isVerified}`);
            console.log(`   Vehicle Type: ${driver.vehicleType}`);
            return { found: true, table: 'drivers', role: 'driver', user: driver };
        }

        // Check in Admins table
        const admin = await Admin.findOne({ where: { phone } });
        if (admin) {
            console.log('✅ Found in ADMINS table:');
            console.log(`   ID: ${admin.id}`);
            console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   Phone: ${admin.phone}`);
            console.log(`   Role: admin`);
            console.log(`   Active: ${admin.active}`);
            return { found: true, table: 'admins', role: 'admin', user: admin };
        }

        console.log('❌ Phone number NOT found in any table');
        return { found: false };

    } catch (error) {
        console.error('❌ Error checking phone number:', error.message);
        return { found: false, error: error.message };
    }
}

// Check the specific phone number
checkPhoneNumber('9876543210').then(() => {
    process.exit(0);
});