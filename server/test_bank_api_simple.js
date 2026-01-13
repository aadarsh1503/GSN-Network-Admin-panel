import http from 'http';

const testAPI = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/bank-details',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('✅ API Response:', parsed);
      } catch (error) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error:', error.message);
  });

  req.end();
};

console.log('Testing bank details API...');
testAPI();