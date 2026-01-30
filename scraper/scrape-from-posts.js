const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Moltbook Scraper v2 - Usa el feed de posts para identificar agents
 */

const API_KEY = 'moltbook_sk_KN6zd5EdENIzwiSoQks5FMcJkjdE_ll3';

function apiRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'moltbook.com',
      path: `/api/v1${endpoint}`,
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Parse error', raw: data.substring(0, 200) });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function extractSkills(text) {
  const skills = [];
  const lowerText = (text || '').toLowerCase();
  
  const keywords = {
    'typescript': ['typescript', 'ts', 'node.js'],
    'python': ['python', 'py', 'django'],
    'security': ['security', 'audit', 'hardening'],
    'devops': ['devops', 'docker', 'kubernetes', 'k8s'],
    'automation': ['automation', 'bot', 'script'],
    'scraping': ['scraping', 'crawler', 'puppeteer'],
    'ai/ml': ['machine learning', 'ml', 'ai', 'gpt'],
    'database': ['database', 'sql', 'postgres'],
    'frontend': ['frontend', 'react', 'vue'],
    'backend': ['backend', 'api', 'server'],
    'testing': ['testing', 'qa', 'cypress'],
    'blockchain': ['blockchain', 'web3', 'ethereum'],
    'cloud': ['aws', 'gcp', 'azure']
  };
  
  for (const [skill, words] of Object.entries(keywords)) {
    if (words.some(w => lowerText.includes(w))) skills.push(skill);
  }
  
  return [...new Set(skills)];
}

async function scrapeFromPosts() {
  console.log('🔍 Scrapeando agents desde posts...\n');
  
  const agents = new Map();
  let offset = 0;
  const maxPosts = 100;
  
  while (offset < maxPosts) {
    console.log(`   Obteniendo posts ${offset}...`);
    const result = await apiRequest(`/posts?sort=hot&limit=25&offset=${offset}`);
    
    if (!result.posts || result.posts.length === 0) break;
    
    for (const post of result.posts) {
      const author = post.author;
      if (!author) continue;
      
      const content = `${post.title} ${post.content}`;
      
      if (!agents.has(author.name)) {
        agents.set(author.name, {
          name: author.name,
          karma: author.karma || 0,
          followers: author.follower_count || 0,
          posts: [],
          skills: new Set(),
          topics: new Set()
        });
      }
      
      const agent = agents.get(author.name);
      agent.posts.push({
        title: post.title,
        content: post.content.substring(0, 200),
        upvotes: post.upvotes,
        comments: post.comment_count
      });
      
      // Extraer skills
      extractSkills(content).forEach(s => agent.skills.add(s));
      
      // Extraer temas del título
      const topics = post.title.toLowerCase().match(/\b(kubernetes|docker|security|api|database|scraping|automation|ml|ai|crypto)\b/g);
      if (topics) topics.forEach(t => agent.topics.add(t));
    }
    
    offset += result.posts.length;
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Convertir a array y formatear
  const result = Array.from(agents.values()).map(a => ({
    name: a.name,
    karma: a.karma,
    followers: a.followers,
    post_count: a.posts.length,
    skills: Array.from(a.skills),
    topics: Array.from(a.topics),
    top_post: a.posts[0]?.title || '',
    engagement: a.posts.reduce((sum, p) => sum + p.upvotes + p.comments, 0)
  }));
  
  // Ordenar por karma
  result.sort((a, b) => b.karma - a.karma);
  
  return result;
}

async function main() {
  try {
    const agents = await scrapeFromPosts();
    
    console.log(`\n✅ ${agents.length} agents encontrados\n`);
    
    // Guardar
    const outputFile = path.join(__dirname, '../database/agents-from-posts.json');
    fs.writeFileSync(outputFile, JSON.stringify(agents, null, 2));
    console.log(`💾 Datos guardados en ${outputFile}\n`);
    
    // Stats
    console.log('📊 Top 10 Agents por Karma:');
    agents.slice(0, 10).forEach((a, i) => {
      console.log(`   ${i+1}. ${a.name} - ${a.karma} karma (${a.skills.join(', ')})`);
    });
    
    console.log('\n📊 Skills más comunes:');
    const skillCount = {};
    agents.forEach(a => a.skills.forEach(s => skillCount[s] = (skillCount[s] || 0) + 1));
    Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([skill, count]) => {
      console.log(`   ${skill}: ${count}`);
    });
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

main();
