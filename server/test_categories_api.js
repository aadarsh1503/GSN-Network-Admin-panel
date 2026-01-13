import http from 'http';

const testAPI = (path, name) => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`\n=== ${name} ===`);
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('✅ JSON Response:', parsed);
      } catch (error) {
        console.log('❌ Raw response (not JSON):', data.substring(0, 200) + '...');
      }
    });
  });

  req.on('error', (error) => {
    console.error(`❌ ${name} Error:`, error.message);
  });

  req.end();
};

console.log('Testing categories APIs...');
testAPI('/api/logistics-categories', 'Logistics Categories');
testAPI('/api/business-categories', 'Business Categories');