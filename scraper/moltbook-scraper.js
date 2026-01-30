const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Moltbook Scraper - Indexa agents de Moltbook
 * Extrae perfiles, skills y metadata
 */

const API_KEY = 'moltbook_sk_KN6zd5EdENIzwiSoQks5FMcJkjdE_ll3';
const DB_FILE = path.join(__dirname, '../database/agents.db');

// HTTP request helper
function apiRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'moltbook.com',
      path: `/api/v1${endpoint}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
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

// Extraer skills de una bio
function extractSkills(description) {
  const skills = [];
  const text = (description || '').toLowerCase();
  
  const skillKeywords = {
    'typescript': ['typescript', 'ts', 'node.js', 'nodejs'],
    'python': ['python', 'py', 'django', 'flask'],
    'rust': ['rust', 'cargo'],
    'go': ['golang', 'go lang'],
    'security': ['security', 'seguridad', 'audit', 'hardening'],
    'devops': ['devops', 'docker', 'kubernetes', 'k8s', 'ci/cd'],
    'database': ['database', 'sql', 'postgres', 'mongodb', 'sqlite'],
    'web-scraping': ['scraping', 'crawler', 'puppeteer', 'selenium'],
    'ai/ml': ['machine learning', 'ml', 'ai', 'neural', 'gpt'],
    'automation': ['automation', 'automate', 'script', 'bot'],
    'monitoring': ['monitoring', 'observability', 'logs', 'metrics'],
    'api': ['api', 'rest', 'graphql', 'webhook'],
    'frontend': ['frontend', 'react', 'vue', 'angular', 'html', 'css'],
    'backend': ['backend', 'server', 'api'],
    'testing': ['testing', 'qa', 'test', 'cypress', 'jest'],
    'documentation': ['documentation', 'docs', 'technical writing'],
    'communication': ['communication', 'slack', 'discord', 'telegram'],
    'data-analysis': ['data analysis', 'analytics', 'pandas', 'numpy'],
    'blockchain': ['blockchain', 'web3', 'ethereum', 'solana', 'crypto'],
    'cloud': ['aws', 'gcp', 'azure', 'cloud', 'serverless']
  };
  
  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      skills.push(skill);
    }
  }
  
  return [...new Set(skills)];
}

// Extraer especialidad principal
function extractSpecialty(description) {
  const text = (description || '').toLowerCase();
  
  if (text.includes('security') || text.includes('audit')) return 'security';
  if (text.includes('devops') || text.includes('infrastructure')) return 'devops';
  if (text.includes('database') || text.includes('data')) return 'data';
  if (text.includes('frontend') || text.includes('ui') || text.includes('design')) return 'frontend';
  if (text.includes('backend') || text.includes('api')) return 'backend';
  if (text.includes('automation') || text.includes('bot')) return 'automation';
  if (text.includes('scraping') || text.includes('crawl')) return 'scraping';
  if (text.includes('testing') || text.includes('qa')) return 'qa';
  if (text.includes('writing') || text.includes('content')) return 'content';
  if (text.includes('research') || text.includes('analysis')) return 'research';
  
  return 'general';
}

// Función principal simplificada
async function main() {
  console.log('🚀 Moltbook Scraper v1.0\n');
  
  try {
    console.log('🔍 Obteniendo agents de Moltbook...');
    const result = await apiRequest('/agents?limit=50');
    
    if (!result.agents || result.agents.length === 0) {
      console.log('⚠️ No se encontraron agents');
      return;
    }
    
    console.log(`✅ ${result.agents.length} agents obtenidos\n`);
    
    // Procesar agents
    const processed = result.agents.map(agent => ({
      name: agent.name,
      description: agent.description || '',
      source: 'moltbook',
      source_url: `https://moltbook.com/u/${agent.name}`,
      karma: agent.karma || 0,
      follower_count: agent.follower_count || 0,
      specialty: extractSpecialty(agent.description),
      skills: extractSkills(agent.description),
      is_claimed: agent.is_claimed || false,
      is_active: agent.is_active || false,
      created_at: agent.created_at,
      last_active: agent.last_active,
      scraped_at: new Date().toISOString()
    }));
    
    // Guardar
    const outputFile = path.join(__dirname, '../database/agents-data.json');
    fs.writeFileSync(outputFile, JSON.stringify(processed, null, 2));
    console.log(`💾 ${processed.length} agents guardados`);
    
    // Stats
    const specialties = {};
    const allSkills = {};
    
    for (const agent of processed) {
      specialties[agent.specialty] = (specialties[agent.specialty] || 0) + 1;
      for (const skill of agent.skills) {
        allSkills[skill] = (allSkills[skill] || 0) + 1;
      }
    }
    
    console.log('\n📊 Especialidades:');
    Object.entries(specialties).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
      console.log(`   ${k}: ${v}`);
    });
    
    console.log('\n📊 Top Skills:');
    Object.entries(allSkills).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
      console.log(`   ${k}: ${v}`);
    });
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { extractSkills, extractSpecialty };
