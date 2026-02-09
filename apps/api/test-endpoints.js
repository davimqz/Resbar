const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n=== ${path} ===`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, JSON.stringify(res.headers, null, 2));
        try {
          console.log(`Body:`, JSON.parse(data));
        } catch {
          console.log(`Body:`, data);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`Error testing ${path}:`, e.message);
      resolve();
    });

    req.end();
  });
}

async function main() {
  await testEndpoint('/health');
  await testEndpoint('/api/dashboard/stats');
  await testEndpoint('/api/metrics/revenue');
  await testEndpoint('/api/metrics/overview');
}

main();
