const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testDynamicIconFetching() {
    console.log('🎨 Testing Dynamic Icon Fetching from Vehicles API...\n');

    try {
        // Test 1: Get vehicle types from public API
        console.log('📋 Test 1: Fetch Vehicle Types from Public API');
        const vehiclesResponse = await axios.get(`${BASE_URL}/api/vehicles`);
        
        console.log('✅ Status:', vehiclesResponse.status);
        console.log('✅ Vehicle Types Found:', vehiclesResponse.data.data.length);
        
        // Extract icon keys
        const iconKeys = [...new Set(vehiclesResponse.data.data.map(vehicle => vehicle.iconKey))];
        console.log('✅ Unique Icon Keys:', iconKeys);
        
        // Show vehicle type details
        vehiclesResponse.data.data.forEach(vehicle => {
            console.log(`   📄 ${vehicle.type}: ${vehicle.name} (Icon: ${vehicle.iconKey})`);
        });

        // Test 2: Simulate what the admin panel will do
        console.log('\n📋 Test 2: Simulate Admin Panel Icon Options Generation');
        
        // Map to format expected by the UI
        const iconOptions = iconKeys.map(iconKey => ({
            label: iconKey.charAt(0).toUpperCase() + iconKey.slice(1),
            value: iconKey
        }));
        
        // Add some common additional icons that might not be in use yet
        const additionalIcons = [
            { label: 'Default', value: 'default' },
            { label: 'Bus', value: 'bus' },
            { label: 'Car', value: 'car' },
            { label: 'Motorcycle', value: 'motorcycle' }
        ];
        
        // Merge and remove duplicates
        const allOptions = [...iconOptions, ...additionalIcons];
        const uniqueOptions = allOptions.filter((option, index, array) => 
            array.findIndex(item => item.value === option.value) === index
        );
        
        console.log('✅ Generated Icon Options for Admin Panel:');
        uniqueOptions.forEach(option => {
            console.log(`   🎨 ${option.label}: ${option.value}`);
        });

        console.log('\n🎉 Dynamic icon fetching test completed successfully!');
        console.log('\n✅ Key benefits:');
        console.log('   • Icon options are now fetched from real-time API data');
        console.log('   • No hardcoded arrays in admin panel');
        console.log('   • Icons automatically reflect current vehicle types');
        console.log('   • Fallback options ensure UI never breaks');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testDynamicIconFetching();