import http from 'http';

async function testSimpleEndpoint() {
  try {
    console.log('Testing /api/test-endpoint...');
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/test-endpoint',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response body:', data);
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

testSimpleEndpoint();