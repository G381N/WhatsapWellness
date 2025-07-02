const axios = require('axios');

async function simpleAckTest() {
  console.log('🧪 Simple Acknowledgment Test\n');
  
  const testSessionId = `CS-${Date.now()}-SIMPLE`;
  const testStudentPhone = '9876543210';
  const testCounselorPhone = '919741301245';
  
  // Test the acknowledgment endpoint
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
    console.log(`🔍 Button ID: counselor_ack_${testSessionId}_${testStudentPhone}`);
    
    const response = await axios.post('http://localhost:3000/webhook', acknowledgmentPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    
    console.log(`✅ Acknowledgment request sent successfully (Status: ${response.status})`);
    console.log('📋 Check server logs for debug messages');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

simpleAckTest(); 