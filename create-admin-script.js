require('dotenv').config();
const { Admin } = require('./models');
const { connectDB } = require('./config/database');

async function createAdmin() {
  try {
    // Connect to database
    await connectDB();
    
    // Get admin details from command line arguments or use defaults
    const args = process.argv.slice(2);
    const firstName = args[0] || 'Admin';
    const lastName = args[1] || 'User';
    const email = args[2] || 'admin@apace.com';
    const phone = args[3] || '1234567890';
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      where: { 
        $or: [
          { email: email },
          { phone: phone }
        ]
      }
    });
    
    if (existingAdmin) {
      console.log('❌ Admin already exists with this email or phone number');
      console.log('Existing admin:', {
        id: existingAdmin.id,
        email: existingAdmin.email,
        phone: existingAdmin.phone,
        name: `${existingAdmin.firstName} ${existingAdmin.lastName}`
      });
      process.exit(1);
    }
    
    // Create new admin
    const newAdmin = await Admin.create({
      firstName,
      lastName,
      email,
      phone,
      active: true,
      profilePicture: null,
      permissions: null
    });
    
    console.log('✅ Admin account created successfully!');
    console.log('Admin Details:', {
      id: newAdmin.id,
      email: newAdmin.email,
      phone: newAdmin.phone,
      name: `${newAdmin.firstName} ${newAdmin.lastName}`
    });
    
    console.log('\n📱 To login:');
    console.log('1. Use the Admin Panel login page');
    console.log('2. Enter phone number:', phone);
    console.log('3. Request OTP and enter the code');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

// Run the script
createAdmin();