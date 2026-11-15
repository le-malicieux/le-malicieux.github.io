// suggestions.js — Module autonome de suggestions par tags pondérés (TF-IDF)
// Aucune dépendance externe. Exposé globalement via window.Suggestions.
(function (global) {
  'use strict';

  // ============================================================
  // 1. Normalisation des tags
  // ============================================================
  function normaliserTags(str) {
    if (!str) return [];
    return str
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t && t.length > 1 && t !== 'x' && t !== 'non');
  }

  function tagsUniques(str) {
    return Array.from(new Set(normaliserTags(str)));
  }

  // ============================================================
  // 2. Parseur CSV robuste (séparateur ; , guillemets échappés "")
  // ============================================================
  function parseCSV(text, sep) {
    sep = sep || ';';
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // BOM

    const rows = [];
    let row = [], cur = '', inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { cur += '"'; i++; }
          else inQuotes = false;
        } else {
          cur += c;
        }
      } else {
        if (c === '"') inQuotes = true;
        else if (c === sep) { row.push(cur); cur = ''; }
        else if (c === '\n') {
          row.push(cur); cur = '';
          if (row.length > 1 || row[0] !== '') rows.push(row);
          row = [];
        }
        else if (c === '\r') { /* ignore */ }
        else cur += c;
      }
    }
    if (cur !== '' || row.length) {
      row.push(cur);
      if (row.length > 1 || row[0] !== '') rows.push(row);
    }
    return rows;
  }

  function rowsToObjects(rows) {
    if (rows.length < 2) return [];
    const headers = rows[0].map(h => h.trim());
    const objects = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (r.length < 2) continue;
      const obj = {};
      for (let idx = 0; idx < headers.length; idx++) {
        const h = headers[idx];
        if (h) obj[h] = r[idx] != null ? r[idx].trim() : '';
      }
      objects.push(obj);
    }
    return objects;
  }

  function chargerAnimesDepuisTexte(text) {
    return rowsToObjects(parseCSV(text, ';'))
      .filter(a => a.anime && a.anime.trim());
  }

  async function chargerAnimesDepuisURL(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('CSV introuvable : HTTP ' + resp.status);
    return chargerAnimesDepuisTexte(await resp.text());
  }

  // ============================================================
  // 3. Index TF-IDF
  //    - df(t) = nombre d'animes contenant t
  //    - Les tags avec df < 2 sont IGNORÉS (spec utilisateur)
  // ============================================================
  function buildTagIndex(animes) {
    const df = Object.create(null);
    const N = animes.length;

    animes.forEach(a => {
      const set = new Set(normaliserTags(a.tags));
      set.forEach(t => { df[t] = (df[t] || 0) + 1; });
    });

    const idf = Object.create(null);
    for (const t in df) {
      if (df[t] < 2) continue; // tag vu une seule fois → ignoré
      idf[t] = Math.log(N / df[t]);
    }

    const moyenneTags = N > 0
      ? animes.reduce((s, a) => s + normaliserTags(a.tags).length, 0) / N
      : 0;

    return { df, idf, N, moyenneTags };
  }

  // ============================================================
  // 4. Similarité cosinus pondérée par IDF (mode "normal")
  // ============================================================
  function similariteTags(a, b, idf) {
    const setA = new Set(normaliserTags(a.tags));
    const setB = new Set(normaliserTags(b.tags));
    let dot = 0, nA = 0, nB = 0, communs = 0;

    setA.forEach(t => {
      const w = idf[t] || 0;
      nA += w * w;
      if (setB.has(t)) { dot += w * w; communs++; }
    });
    setB.forEach(t => { const w = idf[t] || 0; nB += w * w; });

    if (!nA || !nB) return { score: 0, communs: 0 };
    return { score: dot / (Math.sqrt(nA) * Math.sqrt(nB)), communs };
  }

  // ============================================================
  // 5. Suggestions
  //    - Anime avec >=5 tags valides : mode "normal" (cosine, communsMin=2)
  //    - Anime avec 1..4 tags valides : mode "rare"
  //        → on trie les tags par rareté (IDF desc)
  //        → on score par somme des IDF des tags rares partagés
  //        → communsMin=1, bonus ×1.4 si le tag le plus rare est partagé
  //    - Anime avec 0 tag valide : aucune suggestion
  // ============================================================
  function getSuggestions(animeCourant, animes, index, options) {
    const opts = Object.assign(
      { topN: 5, scoreMin: 0.12, communsMin: 2, communsMinRare: 1 },
      options || {}
    );

    const tagsBruts = normaliserTags(animeCourant.tags);
    // On ne garde que les tags ayant df >= 2 (donc présents dans idf)
    const tagsCourant = tagsBruts.filter(t => index.idf[t]);

    const modeRare = tagsCourant.length >= 1 && tagsCourant.length <= 4;

    // Tri par rareté décroissante pour le mode rare
    const tagsTries = modeRare
      ? [...tagsCourant].sort((x, y) => index.idf[y] - index.idf[x])
      : tagsCourant;

    const resultats = [];

    for (const a of animes) {
      if (a.anime === animeCourant.anime) continue;
      if (a.mal_id && animeCourant.mal_id && a.mal_id === animeCourant.mal_id) continue;

      if (modeRare) {
        const setB = new Set(normaliserTags(a.tags));
        let score = 0, communs = 0;
        for (const t of tagsTries) {
          if (setB.has(t)) { score += index.idf[t]; communs++; }
        }
        if (tagsTries.length && setB.has(tagsTries[0])) score *= 1.4;
        if (communs >= opts.communsMinRare) {
          resultats.push({ anime: a, score, communs, mode: 'rare' });
        }
      } else {
        const { score, communs } = similariteTags(animeCourant, a, index.idf);
        if (score >= opts.scoreMin && communs >= opts.communsMin) {
          resultats.push({ anime: a, score, communs, mode: 'normal' });
        }
      }
    }

    resultats.sort((x, y) => y.score - x.score);
    return resultats.slice(0, opts.topN);
  }

  // ============================================================
  // Export
  // ============================================================
  global.Suggestions = {
    normaliserTags,
    tagsUniques,
    parseCSV,
    rowsToObjects,
    chargerAnimesDepuisTexte,
    chargerAnimesDepuisURL,
    buildTagIndex,
    similariteTags,
    getSuggestions
  };
})(typeof window !== 'undefined' ? window : globalThis);