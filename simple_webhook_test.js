const express = require('express');
const axios = require('axios');

// Create a simple test server
const app = express();
app.use(express.json());

let receivedRequest = null;

app.post('/webhook', (req, res) => {
  console.log('✅ Test webhook received request!');
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  receivedRequest = req.body;
  res.sendStatus(200);
});

app.get('/status', (req, res) => {
  res.json({ received: receivedRequest });
});

const server = app.listen(3002, () => {
  console.log('🚀 Test server listening on port 3002');
  testWebhook();
});

async function testWebhook() {
  console.log('\n📤 Sending test webhook request...');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const testPayload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: '123456789',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          messages: [{
            from: '919741301245',
            id: 'test_msg_id',
            timestamp: Date.now(),
            type: 'interactive',
            interactive: {
              type: 'button_reply',
              button_reply: {
                id: `counselor_ack_CS-123456_9876543210`,
                title: 'Acknowledge'
              }
            }
          }]
        },
        field: 'messages'
      }]
    }]
  };
  
  try {
    const response = await axios.post('http://localhost:3002/webhook', testPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`✅ Test request sent successfully (Status: ${response.status})`);
    
    // Check if we received it
    const statusResponse = await axios.get('http://localhost:3002/status');
    if (statusResponse.data.received) {
      console.log('✅ Request was received by test server!');
    } else {
      console.log('❌ Request was not received by test server');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  server.close();
  console.log('\n🏁 Test completed - server closed');
} 