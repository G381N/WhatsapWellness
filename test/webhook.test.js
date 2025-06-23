// Simple test payload for testing the webhook
const testPayload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "15550559999",
              phone_number_id: "PHONE_NUMBER_ID"
            },
            contacts: [
              {
                profile: {
                  name: "Test Student"
                },
                wa_id: "15551234567"
              }
            ],
            messages: [
              {
                from: "15551234567",
                id: "wamid.HBgLMTU1NTEyMzQ1NjcVAgASGBQzQTdBNjVBNzE5RDczNDQzQjNCNAA=",
                timestamp: "1234567890",
                text: {
                  body: "hello"
                },
                type: "text"
              }
            ]
          },
          field: "messages"
        }
      ]
    }
  ]
};

console.log('Test payload for webhook testing:');
console.log(JSON.stringify(testPayload, null, 2));

// Test function to simulate webhook call
function testWebhook() {
  console.log('\n=== Webhook Test ===');
  console.log('To test the webhook, send this payload to your deployed bot:');
  console.log('curl -X POST https://your-app.onrender.com/webhook \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'' + JSON.stringify(testPayload) + '\'');
  console.log('\nExpected behavior:');
  console.log('1. Bot should respond with welcome message');
  console.log('2. Bot should show main menu with 5 options');
  console.log('3. Check console logs for processing messages');
}

if (require.main === module) {
  testWebhook();
}

module.exports = { testPayload, testWebhook }; 