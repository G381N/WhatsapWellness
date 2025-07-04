const axios = require('axios');

async function testDebugAcknowledgment() {
  console.log('🐛 Debug Acknowledgment Test\n');
  
  const testSessionId = `CS-${Date.now()}-DEBUG`;
  const testStudentPhone = '9876543210';
  const testCounselorPhone = '919741301245';
  
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

  try {
    console.log(`🔍 Testing button ID: counselor_ack_${testSessionId}_${testStudentPhone}`);
    console.log(`📤 Sending to webhook...`);
    
    const response = await axios.post('http://localhost:3000/webhook', acknowledgmentPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Accept any status below 500
      }
    });
    
    console.log(`📨 Response Status: ${response.status}`);
    console.log(`📨 Response Headers: ${JSON.stringify(response.headers, null, 2)}`);
    console.log(`📨 Response Data: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 200) {
      console.log('✅ Webhook accepted the request');
      console.log('📋 Check the server terminal for processing logs');
      console.log('🔍 Look for any error messages in the server output');
    } else {
      console.log(`⚠️ Unexpected status code: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    if (error.response) {
      console.error('Error Response Status:', error.response.status);
      console.error('Error Response Data:', error.response.data);
    }
    console.error('Error Stack:', error.stack);
  }
}

testDebugAcknowledgment(); 