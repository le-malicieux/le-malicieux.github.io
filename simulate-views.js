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
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080'
    ],
    ignoreDefaultArgs: ['--enable-automation']
  });

  try {
    const csvText = await fetchCSV(STREAM_CSV_URL);
    const urls = extractURLs(csvText);
    console.log(`${urls.length} URLs à visiter.\n`);

    let successCount = 0;

    for (const url of urls) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'fr,fr-FR;q=0.9,en;q=0.8' });

      // Activer l'interception réseau pour voir TOUTES les requêtes (y compris iframe)
      const cdpSession = await page.target().createCDPSession();
      await cdpSession.send('Network.enable');
      let videoDataLoaded = false;
      cdpSession.on('Network.responseReceived', (params) => {
        const url = params.response.url;
        if (url.includes('.ts') || url.includes('.mp4') || url.includes('.m3u8') || url.includes('video')) {
          videoDataLoaded = true;
          console.log(`   📡 Donnée vidéo détectée : ${url.substring(0, 80)}...`);
        }
      });

      try {
        console.log(`\n⏳ ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Attendre que le player apparaisse
        await page.waitForSelector('video, iframe', { timeout: 15000 }).catch(() => {
          console.log('   ℹ️ Pas de <video> ou <iframe> trouvé.');
        });

        // Attendre 3 secondes de stabilisation
        await new Promise(r => setTimeout(r, 3000));

        // Cliquer au centre de l'écran (bouton Play typique)
        console.log('   ▶️ Clic au centre de l\'écran (960, 540)...');
        await page.mouse.click(960, 540);

        // Puis appuyer sur Espace (raccourci universel pour Play/Pause)
        await new Promise(r => setTimeout(r, 1500));
        await page.keyboard.press('Space');
        console.log('   ⌨️ Touche Espace pressée.');

        // Attendre 45 secondes pour que la vue soit comptabilisée
        console.log('   ⏳ Attente de 45 secondes pour lecture...');
        await new Promise(r => setTimeout(r, 45000));

        if (videoDataLoaded) {
          console.log('   ✅ Données vidéo chargées, vue comptée.');
        } else {
          console.log('   ⚠️ Aucune donnée vidéo détectée.');
        }
        successCount++;
      } catch (err) {
        console.log(`   ❌ Erreur : ${err.message}`);
      } finally {
        await cdpSession.detach();
        await page.close();
        await new Promise(r => setTimeout(r, 2000)); // pause
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
