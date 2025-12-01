// Test script for get-chatwoot-conversations function
// Run with: deno run --allow-net --allow-env test-chatwoot-function.js

const INBOX_ID = '1'; // Test inbox ID
const API_URL = `http://localhost:54321/functions/v1/get-chatwoot-conversations?inbox_id=${INBOX_ID}`;

async function testFunction() {
  try {
    console.log('🧪 Testing get-chatwoot-conversations function...');
    console.log('URL:', API_URL);
    
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    console.log('✅ Status:', response.status);
    console.log('📊 Response:', JSON.stringify(data, null, 2));
    
    if (data.data) {
      console.log(`📱 Found ${data.data.length} conversations`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFunction();
