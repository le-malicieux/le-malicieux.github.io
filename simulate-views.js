const puppeteer = require('puppeteer-core');
const https = require('https');

const STREAM_CSV_URL = 'https://raw.githubusercontent.com/le-malicieux/le-malicieux.github.io/main/stream.csv';

async function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractURLs(csvText) {
  const urls = [];
  const lines = csvText.split(/\r?\n/).slice(1).filter(l => l.trim());
  for (const line of lines) {
    const parts = line.split(',');
    const watchURL = parts[parts.length - 1].trim();
    if (watchURL.startsWith('http')) urls.push(watchURL);
  }
  return [...new Set(urls)];
}

(async () => {
  console.log('Lancement du navigateur...');

  // Utilise le Chromium installé dans l'environnement GitHub Actions
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',  // chemin par défaut dans ubuntu-22.04
    args: ['--no-sandbox', '--disable-gpu', '--disable-setuid-sandbox'],
    headless: 'new'
  });

  try {
    console.log('Lecture du fichier stream.csv...');
    const csvText = await fetchCSV(STREAM_CSV_URL);
    const urls = extractURLs(csvText);
    console.log(`${urls.length} URLs à visiter.`);

    let successCount = 0;
    for (const url of urls) {
      const page = await browser.newPage();
      try {
        console.log(`⏳ Ouverture : ${url}`);
        // Aller à l'URL (le fragment #... sera bien envoyé au navigateur)
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        // Attendre 5 secondes pour laisser le lecteur compter la vue
        await new Promise(r => setTimeout(r, 5000));
        console.log(`✅ Vue simulée : ${url}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Erreur sur ${url} : ${err.message}`);
      } finally {
        await page.close();
        // Petite pause entre chaque vidéo
        await new Promise(r => setTimeout(r, 1500));
      }
    }
    console.log(`Fini : ${successCount}/${urls.length} OK`);
  } catch (error) {
    console.error('Erreur globale :', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();const https = require('https');
const http = require('http');

// ⚠️ URL de TON fichier stream.csv
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

function extractURLsFromStream(csvText) {
  const urls = [];
  const lines = csvText.split(/\r?\n/).slice(1).filter(l => l.trim());
  for (const line of lines) {
    const parts = line.split(',');
    const watchURL = parts[parts.length - 1].trim(); // dernière colonne
    if (watchURL.startsWith('http')) {
      urls.push(watchURL);
    }
  }
  return [...new Set(urls)]; // supprime les doublons
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
  console.log('Début de la simulation de vues (stream.csv uniquement)…');
  try {
    const streamCSV = await fetchCSV(STREAM_CSV_URL);
    const urls = extractURLsFromStream(streamCSV);

    console.log(`Nombre d'URLs à visiter : ${urls.length}`);

    const results = [];
    for (const url of urls) {
      const result = await simulateVisit(url);
      results.push(result);
      console.log(result.status === 'success' ? `✅ ${url}` : `❌ ${url} - ${result.message || ''}`);
      await new Promise(r => setTimeout(r, 500)); // petite pause
    }

    const successful = results.filter(r => r.status === 'success').length;
    console.log(`Fini : ${successful}/${urls.length} OK`);
  } catch (error) {
    console.error('Erreur globale :', error);
    process.exit(1);
  }
})();
