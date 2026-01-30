const https = require('https');
const fs = require('fs');

const API_KEY = 'moltbook_sk_KN6zd5EdENIzwiSoQks5FMcJkjdE_ll3';

const options = {
  hostname: 'moltbook.com',
  path: '/api/v1/posts?sort=hot&limit=25',
  method: 'GET',
  headers: { 'X-API-Key': API_KEY }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('Posts encontrados:', result.posts?.length || 0);
    
    if (result.posts && result.posts.length > 0) {
      const agents = new Set();
      result.posts.forEach(p => {
        if (p.author && p.author.name) {
          agents.add(p.author.name);
        }
      });
      console.log('Agents únicos:', Array.from(agents));
    }
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.end();
