const https = require('https');

const data = JSON.stringify({
  type: 'Fire',
  location: 'Test Sector',
  description: 'Native Node.js stability test'
});

const options = {
  hostname: 'hrishikeshdutta-omniguard-api.hf.space',
  port: 443,
  path: '/api/incidents/public',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch (e) {
      console.log('RAW BODY:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('ERROR:', error);
});

req.write(data);
req.end();
