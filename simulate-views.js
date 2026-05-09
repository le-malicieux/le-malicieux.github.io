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
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--autoplay-policy=no-user-gesture-required', // autorise la lecture sans geste
      '--disable-blink-features=AutomationControlled' // masque l'automatisation
    ],
    headless: 'new',
    ignoreDefaultArgs: ['--enable-automation'] // supprime la bannière "Chrome is being controlled"
  });

  try {
    const csvText = await fetchCSV(STREAM_CSV_URL);
    const urls = extractURLs(csvText);
    console.log(`${urls.length} URLs à visiter.\n`);

    let successCount = 0;

    for (const url of urls) {
      const page = await browser.newPage();
      // User-agent réaliste
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'fr,fr-FR;q=0.9,en;q=0.8' });

      try {
        console.log(`\n⏳ ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Attendre que le player apparaisse (peut être un <video> ou un <iframe>)
        await page.waitForSelector('video, iframe', { timeout: 15000 }).catch(() => {
          console.log('   ℹ️ Pas de <video> ou <iframe> trouvé, on essaie un clic global.');
        });

        // 1. Essayer de cliquer sur le bouton "Play" s'il existe
        const playButtonClicked = await page.evaluate(() => {
          const selectors = [
            'button[aria-label="Play"]',
            'button[title="Play"]',
            '.play-button',
            '.vjs-big-play-button',
            '[class*="play"]',
            'video'
          ];
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) {
              el.click();
              return true;
            }
          }
          return false;
        });

        if (playButtonClicked) {
          console.log('   ▶️ Clic sur le bouton Play effectué.');
        } else {
          console.log('   ⚠️ Aucun bouton Play trouvé, clic au centre de la page.');
          await page.mouse.click(400, 300);
        }

        // 2. Surveiller le trafic réseau pour détecter le chargement d'un segment vidéo
        let videoDataLoaded = false;
        page.on('response', (response) => {
          const url = response.url();
          if (url.includes('.ts') || url.includes('.mp4') || url.includes('.m3u8') || url.includes('video')) {
            videoDataLoaded = true;
          }
        });

        // Attendre max 25 secondes que la vidéo démarre vraiment
        console.log('   ⏳ Attente de 25 secondes pour lecture...');
        await page.waitForTimeout(25000);

        if (videoDataLoaded) {
          console.log('   ✅ Données vidéo chargées, vue probablement comptée.');
        } else {
          console.log('   ⚠️ Aucune donnée vidéo détectée, la vue risque de ne pas compter.');
        }

        successCount++;
      } catch (err) {
        console.log(`   ❌ Erreur : ${err.message}`);
      } finally {
        await page.close();
        await new Promise(r => setTimeout(r, 2000)); // pause entre chaque vidéo
      }
    }

    console.log(`\n=== Fini : ${successCount}/${urls.length} OK ===`);
  } catch (error) {
    console.error('Erreur globale :', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
