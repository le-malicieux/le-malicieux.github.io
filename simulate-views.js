const https = require('https');
const http = require('http');

// URLs de TES fichiers CSV (ne rien changer)
const ANIMES_CSV_URL = 'https://raw.githubusercontent.com/le-malicieux/le-malicieux.github.io/main/animes.csv';
const STREAM_CSV_URL = 'https://raw.githubusercontent.com/le-malicieux/le-malicieux.github.io/main/stream.csv';

function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractURLs(csvText, type) {
  const urls = [];
  const lines = csvText.split(/\r?\n/).slice(1).filter(l => l.trim());
  if (type === 'animes') {
    for (const line of lines) {
      const cols = line.split(';');
      const clean = s => s ? s.trim().replace(/^"|"$/g, '') : '';
      const streamCol = clean(cols[9]);
      const dlCol = clean(cols[10]);
      if (streamCol) streamCol.split(',').forEach(u => u && urls.push(u.trim()));
      if (dlCol) dlCol.split(',').forEach(u => u && urls.push(u.trim()));
    }
  } else if (type === 'stream') {
    for (const line of lines) {
      const parts = line.split(',');
      const watchURL = parts[parts.length - 1].trim();
      if (watchURL.startsWith('http')) urls.push(watchURL);
    }
  }
  return [...new Set(urls)];
}

function simulateVisit(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, { method: 'HEAD', timeout: 10000 }, (res) => {
      resolve({ url, status: 'success', code: res.statusCode });
    });
    req.on('error', (e) => resolve({ url, status: 'error', message: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ url, status: 'timeout' }); });
    req.end();
  });
}

(async () => {
  console.log('Début de la simulation de vues…');
  try {
    const [animesCSV, streamCSV] = await Promise.all([
      fetchCSV(ANIMES_CSV_URL),
      fetchCSV(STREAM_CSV_URL)
    ]);

    const urls = [
      ...extractURLs(animesCSV, 'animes'),
      ...extractURLs(streamCSV, 'stream')
    ];

    console.log(`Nombre d'URLs à visiter : ${urls.length}`);

    const results = [];
    for (const url of urls) {
      const result = await simulateVisit(url);
      results.push(result);
      console.log(result.status === 'success' ? `✅ ${url}` : `❌ ${url} - ${result.message || ''}`);
      await new Promise(r => setTimeout(r, 500));
    }

    const successful = results.filter(r => r.status === 'success').length;
    console.log(`Fini : ${successful}/${urls.length} OK`);
  } catch (error) {
    console.error('Erreur globale :', error);
    process.exit(1);
  }
})();
