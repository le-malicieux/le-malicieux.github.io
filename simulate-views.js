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
    args: ['--no-sandbox', '--disable-gpu', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
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
        // Aller à l'URL
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Attendre que le player soit chargé (le plus souvent un <video>)
        await page.waitForSelector('video, iframe', { timeout: 15000 }).catch(() => console.log('  ℹ️ Aucun <video> ou <iframe> trouvé.'));

        // Forcer la lecture de la vidéo (peu importe l'interface)
        await page.evaluate(() => {
          // Essayer de jouer tous les éléments <video>
          document.querySelectorAll('video').forEach(v => {
            v.muted = true;       // important pour l'autoplay
            v.play().catch(() => {});
          });
          // Si c'est un iframe, on ne peut pas toujours accéder à l'intérieur,
          // mais on laisse le temps de chargement quand même.
        });

        // Laisser le temps au compteur de vues de s'incrémenter (15 sec)
        console.log('  ⏳ Attente 15 secondes pour comptabilisation...');
        await new Promise(r => setTimeout(r, 15000));

        console.log(`  ✅ Vue simulée : ${url}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Erreur sur ${url} : ${err.message}`);
      } finally {
        await page.close();
        await new Promise(r => setTimeout(r, 2000)); // pause entre les vidéos
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
