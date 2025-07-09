const axios = require('axios');

const baseURL = 'http://localhost:5000/api';
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE2MzgyZGU5LTVjOGMtMTFmMC1iMGEyLTAyNDJhYzEzMDAwMiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MjA2MzE5NiwiZXhwIjoxNzUyMDg0Nzk2fQ.NRDYfVRBgZeGxAqgUZby4Wo12HEP5h5NH8eLFWYfufs';

const api = axios.create({
  baseURL,
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }
});

async function testDocumentFilterFix() {
  console.log('🧪 Testing Document Filter Fix...\n');

  try {
    // Test 1: Default call should show ALL documents (no status filter)
    console.log('📋 Test 1: Default call (no status parameter)...');
    const defaultResponse = await api.get('/admin/documents/pending');
    console.log(`✅ Default response: ${defaultResponse.data.data.documents.length} documents`);
    
    if (defaultResponse.data.data.documents.length > 0) {
      const statusBreakdown = defaultResponse.data.data.documents.reduce((acc, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1;
        return acc;
      }, {});
      console.log(`   Status breakdown:`, statusBreakdown);
    } else {
      console.log('   ⚠️ No documents found in default response');
    }

    // Test 2: With empty status parameter
    console.log('\n📋 Test 2: With empty status parameter...');
    const emptyStatusResponse = await api.get('/admin/documents/pending?status=');
    console.log(`✅ Empty status response: ${emptyStatusResponse.data.data.documents.length} documents`);

    // Test 3: With specific status filters
    console.log('\n📋 Test 3: With specific status filters...');
    
    const pendingResponse = await api.get('/admin/documents/pending?status=pending');
    console.log(`   - Pending only: ${pendingResponse.data.data.documents.length} documents`);
    
    const verifiedResponse = await api.get('/admin/documents/pending?status=verified');
    console.log(`   - Verified only: ${verifiedResponse.data.data.documents.length} documents`);
    
    const rejectedResponse = await api.get('/admin/documents/pending?status=rejected');
    console.log(`   - Rejected only: ${rejectedResponse.data.data.documents.length} documents`);

    // Test 4: Search functionality
    console.log('\n🔍 Test 4: Search functionality...');
    const searchResponse = await api.get('/admin/documents/pending?search=driver');
    console.log(`   - Search for "driver": ${searchResponse.data.data.documents.length} documents`);

    // Test 5: Combined filters
    console.log('\n🔧 Test 5: Combined filters...');
    const combinedResponse = await api.get('/admin/documents/pending?status=verified&search=driver');
    console.log(`   - Verified + search "driver": ${combinedResponse.data.data.documents.length} documents`);

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   - Default (all): ${defaultResponse.data.data.documents.length} documents`);
    console.log(`   - Empty status: ${emptyStatusResponse.data.data.documents.length} documents`);
    console.log(`   - Pending: ${pendingResponse.data.data.documents.length} documents`);
    console.log(`   - Verified: ${verifiedResponse.data.data.documents.length} documents`);
    console.log(`   - Rejected: ${rejectedResponse.data.data.documents.length} documents`);

    const totalFiltered = pendingResponse.data.data.documents.length + 
                         verifiedResponse.data.data.documents.length + 
                         rejectedResponse.data.data.documents.length;
    
    console.log(`   - Sum of filtered: ${totalFiltered} documents`);

    if (defaultResponse.data.data.documents.length === totalFiltered) {
      console.log('\n✅ SUCCESS: Default response correctly shows all documents!');
    } else {
      console.log('\n❌ ISSUE: Default response count doesn\'t match sum of individual status filters');
    }

    if (defaultResponse.data.data.documents.length === emptyStatusResponse.data.data.documents.length) {
      console.log('✅ SUCCESS: Empty status parameter works the same as no status parameter');
    } else {
      console.log('❌ ISSUE: Empty status parameter behaves differently from no status parameter');
    }

    console.log('\n🎉 Document filter fix testing completed!');

  } catch (error) {
    console.error('❌ Error testing document filters:', error.response?.data || error.message);
  }
}

testDocumentFilterFix();