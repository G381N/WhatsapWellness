const axios = require('axios');

async function testAcknowledgmentDebug() {
  console.log('🐛 Debugging Counselor Acknowledgment Issue...\n');
  
  // Create a test counselor request first to get a valid sessionId
  const testSessionId = `CS-${Date.now()}-DEBUG`;
  
  console.log(`📝 Using test session ID: ${testSessionId}`);
  
  // Simulate the acknowledgment button click
  const acknowledgmentPayload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: '123456789',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '919741301245',
            phone_number_id: '123456789'
          },
          messages: [{
            from: '919741301245', // Counselor phone
            id: 'debug_msg_id',
            timestamp: Date.now(),
            type: 'interactive',
            interactive: {
              type: 'button_reply',
              button_reply: {
                id: `counselor_ack_${testSessionId}_9876543210`,
                title: 'Acknowledge'
              }
            }
          }],
          contacts: [{
            profile: {
              name: 'Dr. Debug Counselor'
            },
            wa_id: '919741301245'
          }]
        },
        field: 'messages'
      }]
    }]
  };

  try {
    console.log('📤 Sending acknowledgment test...');
    console.log(`🔍 Button ID: counselor_ack_${testSessionId}_9876543210`);
    
    const response = await axios.post('http://localhost:3000/webhook', acknowledgmentPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`✅ Request sent successfully (Status: ${response.status})`);
    console.log('\n📋 Expected Behavior:');
    console.log('• Should parse sessionId and studentPhone from button ID');
    console.log('• Should query counselorRequests collection for sessionId');
    console.log('• Should find the session or show "Session not found" message');
    console.log('• Should NOT show "Error processing acknowledgement" message');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAcknowledgmentDebug(); 