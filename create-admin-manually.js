const { Admin } = require('./models');

async function createAdmin() {
    try {
        // Delete existing admin if exists
        await Admin.destroy({
            where: { email: 'admin@apace.com' }
        });

        // Create new admin with correct phone format
        const admin = await Admin.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@apace.com',
            phone: '1234567890',
            active: true,
            profilePicture: null,
            permissions: null
        });

        console.log('✅ Admin created successfully:');
        console.log('ID:', admin.id);
        console.log('Email:', admin.email);
        console.log('Phone:', admin.phone);
        
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
    }
    
    process.exit(0);
}

createAdmin();