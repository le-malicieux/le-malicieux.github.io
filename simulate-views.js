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
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-gpu', '--disable-setuid-sandbox'],
    headless: 'new'
  });

  try {
    const csvText = await fetchCSV(STREAM_CSV_URL);
    const urls = extractURLs(csvText);
    console.log(`${urls.length} URLs à visiter.`);

    let successCount = 0;
    for (const url of urls) {
      const page = await browser.newPage();
      try {
        console.log(`⏳ ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // 1. Attendre un peu que la page soit complètement chargée
        await new Promise(r => setTimeout(r, 3000));

        // 2. Essayer de cliquer au centre de la page pour lancer la vidéo
        //    (c’est l’endroit le plus probable pour le bouton "Play")
        await page.mouse.click(400, 300); // clic vers le centre

        // 3. Laisser du temps pour que la lecture démarre et soit comptabilisée
        console.log('   ⏳ Pause 20 secondes pour comptabilisation...');
        await new Promise(r => setTimeout(r, 20000));

        console.log(`   ✅ Terminé : ${url}`);
        successCount++;
      } catch (err) {
        console.log(`   ❌ Erreur : ${err.message}`);
      } finally {
        await page.close();
        await new Promise(r => setTimeout(r, 2000));
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
