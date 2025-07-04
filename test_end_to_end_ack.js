const axios = require('axios');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase (same as in config/firebase.js)
if (!admin.apps.length) {
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
  });
}

const db = admin.firestore();

async function testEndToEndAcknowledgment() {
  console.log('🧪 End-to-End Acknowledgment Test\n');
  
  const testSessionId = `CS-${Date.now()}-E2E`;
  const testStudentPhone = '9876543210';
  const testCounselorPhone = '919741301245';
  
  let docId = null;
  
  try {
    // Step 1: Create a test counselor request in Firebase
    console.log('📝 Step 1: Creating test counselor request in Firebase...');
    
    const counselorRequest = {
      sessionId: testSessionId,
      name: 'Test Student E2E',
      phoneNumber: testStudentPhone,
      issueDescription: 'Test anxiety issue for acknowledgment testing',
      issueDuration: '1-3 months',
      previousHelp: 'No',
      urgencyLevel: 'High',
      preferredContact: 'WhatsApp',
      assignedCounselor: {
        id: 'counselor_1',
        name: 'Dr. Test Counselor',
        phone: testCounselorPhone,
        specialization: 'General Counseling'
      },
      status: 'pending',
      submittedAt: admin.firestore.Timestamp.now(),
      source: 'e2e_test_script'
    };
    
    const docRef = await db.collection('counselorRequests').add(counselorRequest);
    docId = docRef.id;
    console.log(`✅ Test request created with Firebase ID: ${docId}`);
    console.log(`🆔 Session ID: ${testSessionId}`);
    
    // Step 2: Wait a moment for Firebase to propagate
    console.log('\n⏳ Waiting for Firebase propagation...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Test the acknowledgment endpoint
    console.log('\n📤 Step 3: Testing acknowledgment via webhook...');
    
    const acknowledgmentPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: '123456789',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: testCounselorPhone,
              phone_number_id: '123456789'
            },
            messages: [{
              from: testCounselorPhone,
              id: 'test_ack_msg_id',
              timestamp: Date.now(),
              type: 'interactive',
              interactive: {
                type: 'button_reply',
                button_reply: {
                  id: `counselor_ack_${testSessionId}_${testStudentPhone}`,
                  title: 'Acknowledge'
                }
              }
            }],
            contacts: [{
              profile: {
                name: 'Dr. Test Counselor'
              },
              wa_id: testCounselorPhone
            }]
          },
          field: 'messages'
        }]
      }]
    };

    console.log(`🔍 Button ID: counselor_ack_${testSessionId}_${testStudentPhone}`);
    
    const response = await axios.post('http://localhost:3000/webhook', acknowledgmentPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log(`✅ Acknowledgment request sent successfully (Status: ${response.status})`);
    
    // Step 4: Wait for processing and check the Firebase record was updated
    console.log('\n⏳ Waiting for acknowledgment processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🔍 Step 4: Checking Firebase update...');
    
    const updatedDoc = await db.collection('counselorRequests').doc(docId).get();
    if (updatedDoc.exists) {
      const updatedData = updatedDoc.data();
      console.log('📊 Updated request data:');
      console.log(`   Status: ${updatedData.status}`);
      console.log(`   Acknowledged: ${updatedData.acknowledgedAt ? 'Yes' : 'No'}`);
      console.log(`   Acknowledged By: ${updatedData.acknowledgedByCounselor || 'None'}`);
      console.log(`   Acknowledged Phone: ${updatedData.acknowledgedBy || 'None'}`);
      
      if (updatedData.status === 'acknowledged') {
        console.log('\n✅ SUCCESS: Request was properly acknowledged!');
        console.log('✅ Student should have received acknowledgment message');
        console.log('✅ Counselor should have received confirmation message');
      } else {
        console.log('\n❌ FAILURE: Request was not acknowledged properly');
        console.log('   Expected status: acknowledged');
        console.log(`   Actual status: ${updatedData.status}`);
      }
    } else {
      console.log('❌ ERROR: Could not find the request document');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.error('Stack trace:', error.stack);
  } finally {
    // Cleanup
    if (docId) {
      console.log('\n🧹 Cleanup: Removing test data...');
      try {
        await db.collection('counselorRequests').doc(docId).delete();
        console.log('✅ Test data cleaned up');
      } catch (cleanupError) {
        console.log('⚠️ Cleanup failed:', cleanupError.message);
      }
    }
  }
}

testEndToEndAcknowledgment().then(() => {
  console.log('\n🏁 End-to-End Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
}); 