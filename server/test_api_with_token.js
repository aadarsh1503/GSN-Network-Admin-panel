import http from 'http';

async function testApiWithToken() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImVtYWlsIjoiYWFkYXJzaGNoYXVoYW4zNUBnbWFpbC5jb20iLCJyb2xlIjoiY29tcGFueSIsImlhdCI6MTc2Njk5OTQzMCwiZXhwIjoxNzY3MDg1ODMwfQ.6pQS-Dnu85zWQ0o7viOkTRmtF20eTR2dIFCq1Qno67Y';
    
    console.log('Testing /api/quotes/available with authentication token...');
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/quotes/available',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response body:', data);
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ API call successful!');
          console.log('Quotes found:', jsonData.quotes?.length || 0);
          console.log('Has active subscription:', jsonData.hasActiveSubscription);
          console.log('Can respond:', jsonData.canRespond);
        } catch (e) {
          console.log('Response is not JSON:', data);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
    });

    req.end();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testApiWithToken();