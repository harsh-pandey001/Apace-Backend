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

async function testDocumentDeletion() {
  console.log('🧪 Testing Document Deletion Functionality...\n');

  try {
    // Get all documents first
    console.log('📋 Getting all documents...');
    const allDocsResponse = await api.get('/admin/documents/pending');
    const documents = allDocsResponse.data.data.documents;
    
    console.log(`✅ Total documents before deletion: ${documents.length}`);
    
    if (documents.length > 0) {
      // Find a document to delete (preferably with files)
      const documentToDelete = documents.find(doc => 
        doc.documents.driving_license.uploaded || 
        doc.documents.passport_photo.uploaded || 
        doc.documents.vehicle_rc.uploaded || 
        doc.documents.insurance_paper.uploaded
      ) || documents[0];
      
      console.log(`\n🗑️ Testing deletion of document ID: ${documentToDelete.id}`);
      console.log(`   Driver: ${documentToDelete.driver?.name || 'Deleted Driver'}`);
      console.log(`   Status: ${documentToDelete.status}`);
      console.log(`   Files uploaded:`);
      console.log(`     - Driving License: ${documentToDelete.documents.driving_license.uploaded}`);
      console.log(`     - Passport Photo: ${documentToDelete.documents.passport_photo.uploaded}`);
      console.log(`     - Vehicle RC: ${documentToDelete.documents.vehicle_rc.uploaded}`);
      console.log(`     - Insurance: ${documentToDelete.documents.insurance_paper.uploaded}`);
      
      // Get driver verification status before deletion
      let driverVerificationBefore = null;
      if (documentToDelete.driver && !documentToDelete.driver.deleted) {
        try {
          const driverResponse = await api.get(`/drivers/${documentToDelete.driver.id}`);
          driverVerificationBefore = driverResponse.data.data.driver.isVerified;
          console.log(`   Driver verification before deletion: ${driverVerificationBefore}`);
        } catch (error) {
          console.log(`   Could not get driver verification status`);
        }
      }
      
      // Perform deletion
      console.log(`\n🔥 Deleting document...`);
      const deleteResponse = await api.delete(`/admin/driver-documents/${documentToDelete.id}`);
      
      console.log(`✅ Delete response: ${deleteResponse.data.message}`);
      console.log(`   Document ID: ${deleteResponse.data.data.id}`);
      console.log(`   Driver ID: ${deleteResponse.data.data.driver_id}`);
      
      // Verify deletion
      console.log(`\n🔍 Verifying deletion...`);
      const afterDeleteResponse = await api.get('/admin/documents/pending');
      const documentsAfter = afterDeleteResponse.data.data.documents;
      
      console.log(`✅ Total documents after deletion: ${documentsAfter.length}`);
      
      // Check if document is gone
      const deletedDocStillExists = documentsAfter.find(doc => doc.id === documentToDelete.id);
      if (!deletedDocStillExists) {
        console.log(`✅ Document successfully removed from database`);
      } else {
        console.log(`❌ Document still exists in database`);
      }
      
      // Check driver verification status after deletion
      if (documentToDelete.driver && !documentToDelete.driver.deleted) {
        try {
          const driverResponseAfter = await api.get(`/drivers/${documentToDelete.driver.id}`);
          const driverVerificationAfter = driverResponseAfter.data.data.driver.isVerified;
          console.log(`✅ Driver verification after deletion: ${driverVerificationAfter}`);
          
          if (driverVerificationBefore === true && driverVerificationAfter === false) {
            console.log(`✅ Driver verification correctly updated to false after document deletion`);
          } else if (driverVerificationBefore === false && driverVerificationAfter === false) {
            console.log(`✅ Driver verification remains false (expected)`);
          } else {
            console.log(`⚠️ Driver verification status: ${driverVerificationBefore} → ${driverVerificationAfter}`);
          }
        } catch (error) {
          console.log(`   Could not verify driver status after deletion`);
        }
      }
      
      // Test deleting non-existent document
      console.log(`\n🚫 Testing deletion of non-existent document...`);
      try {
        await api.delete('/admin/driver-documents/99999');
        console.log(`❌ Should have failed - non-existent document`);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`✅ Correctly returned 404 for non-existent document`);
        } else {
          console.log(`⚠️ Unexpected error: ${error.response?.data?.message || error.message}`);
        }
      }
      
      console.log('\n🎉 Document deletion tests completed successfully!');
      
    } else {
      console.log('⚠️ No documents available for deletion testing');
    }
    
  } catch (error) {
    console.error('❌ Error testing document deletion:', error.response?.data || error.message);
  }
}

testDocumentDeletion();