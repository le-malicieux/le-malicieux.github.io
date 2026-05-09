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
})();
