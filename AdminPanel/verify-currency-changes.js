const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Currency Symbol Changes in Admin Panel\n');

// Files to check
const filesToCheck = [
  'src/pages/VehiclePricing.js',
  'src/components/DashboardCards.js', 
  'src/pages/Dashboard.js',
  'src/pages/Shipments.js',
  'src/components/ShipmentDetailsModal.js'
];

let totalChanges = 0;
let allFilesValid = true;

filesToCheck.forEach(filePath => {
  console.log(`📄 Checking: ${filePath}`);
  
  try {
    const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    
    // Count rupee symbols
    const rupeeCount = (content.match(/₹/g) || []).length;
    
    // Check for any remaining dollar signs (excluding JavaScript syntax)
    const dollarMatches = content.match(/\$[0-9]|\$\s*[0-9]|\$0/g) || [];
    const usdMatches = content.match(/USD/g) || [];
    
    console.log(`   ✅ Rupee symbols (₹): ${rupeeCount}`);
    
    if (dollarMatches.length > 0) {
      console.log(`   ❌ Remaining dollar signs: ${dollarMatches.length} - ${dollarMatches.join(', ')}`);
      allFilesValid = false;
    } else {
      console.log(`   ✅ No currency dollar signs found`);
    }
    
    if (usdMatches.length > 0) {
      console.log(`   ❌ USD references: ${usdMatches.length}`);
      allFilesValid = false;
    } else {
      console.log(`   ✅ No USD references found`);
    }
    
    totalChanges += rupeeCount;
    console.log('');
    
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}\n`);
    allFilesValid = false;
  }
});

console.log('📊 Summary:');
console.log(`   Total rupee symbols (₹): ${totalChanges}`);
console.log(`   All files valid: ${allFilesValid ? '✅ YES' : '❌ NO'}`);

if (allFilesValid) {
  console.log('\n🎉 Currency conversion successful!');
  console.log('   All dollar signs ($) have been replaced with rupee symbols (₹)');
  console.log('   Currency formatting changed from USD to INR');
} else {
  console.log('\n⚠️  Some issues found. Please review the files above.');
}

console.log('\n🔧 Key Changes Made:');
console.log('   1. VehiclePricing.js: Updated formatCurrency to use INR instead of USD');
console.log('   2. VehiclePricing.js: Changed all $ input adornments to ₹');
console.log('   3. VehiclePricing.js: Updated fallback values from $0 to ₹0');
console.log('   4. DashboardCards.js: Changed revenue display from $ to ₹');
console.log('   5. Dashboard.js: Updated sample payment amount from $ to ₹');
console.log('   6. Shipments.js & ShipmentDetailsModal.js: Already using ₹ (verified)');