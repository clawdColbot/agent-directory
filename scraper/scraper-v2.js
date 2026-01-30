const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'moltbook_sk_KN6zd5EdENIzwiSoQks5FMcJkjdE_ll3';

// Función para hacer requests siguiendo redirects
function apiRequest(urlPath, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const makeRequest = (currentPath, redirectsLeft) => {
      const options = {
        hostname: 'moltbook.com',
        path: currentPath,
        method: 'GET',
        headers: { 
          'X-API-Key': API_KEY,
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        // Manejar redirect
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirectsLeft > 0) {
            console.log(`   Redirect a: ${res.headers.location}`);
            makeRequest(res.headers.location, redirectsLeft - 1);
            return;
          } else {
            reject(new Error('Demasiados redirects'));
            return;
          }
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            resolve({ error: 'Parse error', raw: data.substring(0, 200) });
          }
        });
      });

      req.on('error', reject);
      req.end();
    };

    makeRequest(urlPath, maxRedirects);
  });
}

async function main() {
  console.log('🔍 Scrapeando agents desde posts...\n');
  
  const agents = new Map();
  let offset = 0;
  const maxPosts = 100;
  
  while (offset < maxPosts) {
    console.log(`   Obteniendo posts ${offset}...`);
    
    try {
      const result = await apiRequest(`/api/v1/posts?sort=hot&limit=25&offset=${offset}`);
      
      if (result.error) {
        console.log('   Error:', result.error);
        break;
      }
      
      if (!result.posts || result.posts.length === 0) {
        console.log('   No más posts');
        break;
      }
      
      console.log(`   ✅ ${result.posts.length} posts recibidos`);
      
      for (const post of result.posts) {
        if (!post.author) continue;
        
        const name = post.author.name;
        if (!name) continue;
        
        const content = `${post.title || ''} ${post.content || ''}`;
        
        if (!agents.has(name)) {
          agents.set(name, {
            name: name,
            karma: post.author.karma || 0,
            followers: post.author.follower_count || 0,
            posts: 0,
            totalEngagement: 0
          });
        }
        
        const agent = agents.get(name);
        agent.posts++;
        agent.totalEngagement += (post.upvotes || 0) + (post.comment_count || 0);
      }
      
      offset += result.posts.length;
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 500));
      
    } catch (e) {
      console.error('   Error:', e.message);
      break;
    }
  }
  
  // Convertir a array y ordenar
  const result = Array.from(agents.values())
    .sort((a, b) => b.karma - a.karma);
  
  console.log(`\n✅ ${result.length} agents encontrados\n`);
  
  // Guardar
  const outputDir = path.join(__dirname, '../database');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const outputFile = path.join(outputDir, 'agents-directory.json');
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  console.log(`💾 Datos guardados en ${outputFile}\n`);
  
  // Mostrar top 10
  console.log('📊 Top 10 Agents:');
  result.slice(0, 10).forEach((a, i) => {
    console.log(`   ${i+1}. ${a.name} - ${a.karma} karma, ${a.posts} posts`);
  });
}

main().catch(console.error);
