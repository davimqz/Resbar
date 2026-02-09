const http = require('http');

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let resp = '';
      res.on('data', (chunk) => (resp += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resp) });
        } catch (e) {
          resolve({ status: res.statusCode, body: resp });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET',
      headers: {},
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let resp = '';
      res.on('data', (chunk) => (resp += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resp) });
        } catch (e) {
          resolve({ status: res.statusCode, body: resp });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  try {
    console.log('Logging in as seed-admin...');
    const login = await postJson('/api/auth/google', { googleId: 'seed-admin', email: 'admin@local.test', name: 'Admin' });
    console.log('Login status:', login.status);
    const token = login.body?.data?.accessToken;
    if (!token) return console.error('No token');

    console.log('\nGET /api/dashboard/overview');
    const d = await getJson('/api/dashboard/overview', token);
    console.log('status:', d.status);
    console.log(JSON.stringify(d.body, null, 2));

    console.log('\nGET /api/metrics/overview');
    const m = await getJson('/api/metrics/overview', token);
    console.log('status:', m.status);
    console.log(JSON.stringify(m.body, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
})();
