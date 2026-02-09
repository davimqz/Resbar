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
    console.log('Posting to /api/auth/google to get tokens...');
    const login = await postJson('/api/auth/google', { googleId: 'seed-admin', email: 'admin@local.test', name: 'Admin' });
    console.log('Login response:', login.status, login.body);

    const token = login.body?.data?.accessToken;
    if (!token) return console.error('No access token returned');

    console.log('\nCalling dashboard overview with token...');
    const overview = await getJson('/api/dashboard/overview', token);
    console.log('Overview response:', overview.status, overview.body);
  } catch (e) {
    console.error('Error during auth-overview:', e);
  }
})();
