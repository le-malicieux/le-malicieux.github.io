/* ═══════════════════════════════════════════════════════════
   common.js — Logique partagée par toutes les pages du site
═══════════════════════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth, onAuthStateChanged, signInWithPopup,
    GoogleAuthProvider, signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore, doc, setDoc, getDoc,
    collection, query, where, getDocs, onSnapshot,
    addDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCD70a-QR2nJnHBnA-FUoIGHZ7Z3VByPMk",
    authDomain: "le-malicieux-v2.firebaseapp.com",
    projectId: "le-malicieux-v2",
    storageBucket: "le-malicieux-v2.firebasestorage.app",
    messagingSenderId: "938147445933",
    appId: "1:938147445933:web:86f9c65ee0737e66a9da24"
};
const _app = initializeApp(firebaseConfig);
export const auth = getAuth(_app);
export const db = getFirestore(_app);
export const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export {
    onAuthStateChanged, signInWithPopup, signOut,
    doc, setDoc, getDoc,
    collection, query, where, getDocs, onSnapshot,
    addDoc, deleteDoc, serverTimestamp
};

// ── Constantes ──
// Utilisation de fastly.jsdelivr.net pour une meilleure stabilité en cas de blocage
const CDN_BASE = 'https://fastly.jsdelivr.net/gh/le-malicieux/le-malicieux.github.io@main';
// Version pour forcer le rechargement du cache si nécessaire (change la valeur si tu as des soucis)
const VERSION = '?v=1.0.1';

export const IMG_LOGO = `${CDN_BASE}/img/bannieres_icones/logo.jpg`;
export const IMG_DISCORD = `${CDN_BASE}/img/bannieres_icones/logo-discord.jpg`;
export const DEFAULT_COVER_NUM = 1;

// ═══════════════════════════════════════════════════════════
//  LOGIQUE DE STATISTIQUES
// ═══════════════════════════════════════════════════════════

async function logVisit() {
    try {
        // On ne compte pas les visites en local (quand tu développes)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;

        await addDoc(collection(db, "visits"), {
            page: window.location.pathname,
            referrer: document.referrer || 'Direct',
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Erreur d'enregistrement de la visite", e);
    }
}

// ═══════════════════════════════════════════════════════════
//  NAVBAR GLOBALE (Générée automatiquement)
// ═══════════════════════════════════════════════════════════

const HEADER_HTML = `
    <header class="site-header">
        <div class="navbar">
            <div class="nav-left">
                <button class="burger" onclick="toggleM()" aria-label="Ouvrir le menu">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
                <a class="nav-brand" href="index.html">
                    <img src="${CDN_BASE}/img/bannieres_icones/logo.jpg" class="nav-logo-small" alt="Logo Le Malicieux">
                    <span class="nav-title">LE MALICIEUX</span>
                </a>
            </div>
            <div class="mobile-overlay" id="overlay" onclick="toggleM()"></div>
            <nav class="nav-links" id="menu">
                <div class="close-menu" onclick="toggleM()">Fermer</div>
                <div class="menu-account js-hidden" id="menu-account-wrap">
                    <a href="profil.html" id="nav-profil-link-mobile" class="auth-account" style="text-decoration:none;">
                        <img id="nav-avatar-mobile" src="${CDN_BASE}/img/bannieres_icones/logo.jpg" class="auth-avatar" style="display:none;">
                        <span id="nav-pseudo-mobile" class="auth-name" style="display:none;"></span>
                    </a>
                </div>
                <a href="index.html" class="nav-tab" data-page="index.html">Accueil</a>
                <a href="tags.html" class="nav-tab" data-page="tags.html">Tags</a>
                <a href="alphabetique.html" class="nav-tab" data-page="alphabetique.html">A-Z</a>
                <a href="playlist.html" class="nav-tab" data-page="playlist.html">Playlist</a>
                <a href="pls.html" class="nav-tab" data-page="pls.html">Industrie</a>
                <a href="discord.html" class="nav-tab" data-page="discord.html">Updates</a>
                <a href="profil.html" class="nav-tab" data-page="profil.html">Profil</a>
                <a href="index_old.html" class="nav-tab" data-page="index_old.html">Ancien Index</a>
                
                <!-- Boutons pour le menu mobile -->
                <a href="recherche.html" class="nav-action">Recherche appr.</a>
                <button class="nav-action" onclick="randomAnime()">Au hasard</button>
                <a href="https://discord.gg/4DY3Zq4vW4" target="_blank" class="discord-btn" title="Rejoindre le Discord">
                    <img src="${CDN_BASE}/img/bannieres_icones/logo-discord.jpg" alt="Discord">
                </a>
            </nav>
            <div class="nav-right">
                <div class="search-wrapper" id="search-wrapper">
                    <input type="text" id="search" placeholder="Rechercher un anime..." autocomplete="off">
                    <span class="search-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                    <div class="search-suggestions" id="search-suggestions"></div>
                </div>
                <a href="recherche.html" class="nav-action">Recherche appr.</a>
                <button class="nav-action" onclick="randomAnime()">Au hasard</button>
                <a href="https://discord.gg/4DY3Zq4vW4" target="_blank" class="discord-btn" title="Rejoindre le Discord">
                    <img src="${CDN_BASE}/img/bannieres_icones/logo-discord.jpg" alt="Discord">
                </a>
                <a href="profil.html" id="nav-profil-link" class="auth-account" style="text-decoration:none;">
                    <img id="nav-avatar" src="${CDN_BASE}/img/bannieres_icones/logo.jpg" class="auth-avatar" style="display:none;">
                    <span id="nav-pseudo" class="auth-name" style="display:none;"></span>
                </a>
                <div id="auth-ui" class="auth-ui-slot"><button class="js-login-btn auth-login-btn">Connexion</button></div>
            </div>
        </div>
    </header>
`;

export function renderHeader() {
    if (document.querySelector('.site-header')) return; 
    document.body.insertAdjacentHTML('afterbegin', HEADER_HTML);
    setupHeaderSearch();
}

// ═══════════════════════════════════════════════════════════
//  CACHE GLOBAL POUR LES ANIMES
// ═══════════════════════════════════════════════════════════

let _animesCache = null;
let _animesPromise = null;

export async function loadAnimes() {
    if (_animesCache) return _animesCache;
    if (_animesPromise) return _animesPromise;

    _animesPromise = (async () => {
        try {
            const resp = await fetch('animes.csv');
            if (!resp.ok) throw new Error(`animes.csv introuvable (${resp.status})`);
            const raw = await resp.text();
            const lines = raw.split(/\r?\n/);
            const animes = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line.trim()) continue;
                const cols = parseCSVLine(line);
                if (cols.length < 19) continue;
                const a = parseAnimeRow(cols);
                if (a.nom && a.ordreAjout > 0) animes.push(a);
            }
            _animesCache = animes;
            return animes;
        } catch (e) {
            _animesPromise = null;
            throw e;
        }
    })();

    return _animesPromise;
}

// ═══════════════════════════════════════════════════════════
//  CHEMINS D'IMAGES
// ═══════════════════════════════════════════════════════════

export function getTranche(ordreAjout) {
    const n = Math.max(1, parseInt(ordreAjout, 10) || 1);
    if (n < 100) return '1-99';
    const start = Math.floor(n / 100) * 100;
    return `${start}-${start + 99}`;
}

export function getCoverPath(ordreAjout, num = DEFAULT_COVER_NUM) {
    const n = parseInt(ordreAjout, 10);
    if (!n || n < 1) return IMG_LOGO;
    // Ajout de la version pour le cache
    return `${CDN_BASE}/img/covers/${getTranche(n)}/${n}-${num}.webp${VERSION}`;
}

export function getPlsPath(slug) {
    if (!slug) return IMG_LOGO;
    return `${CDN_BASE}/img/pls/${slug}.webp${VERSION}`;
}

export function getBackgroundUrl(kind, filename) {
    if (!filename) return '';
    // Ajout de la version pour le cache
    return kind === 'mobile'
        ? `${CDN_BASE}/img/fonds_mobiles/${filename}${VERSION}`
        : `${CDN_BASE}/img/fonds_desktop/${filename}${VERSION}`;
}

// ═══════════════════════════════════════════════════════════
//  FALLBACK IMAGE (avec changement de CDN)
// ═══════════════════════════════════════════════════════════

export function handleImgError(img, filename) {
    if (!img || img.dataset.fallbackDone === '1') return;

    // 1. Si l'image vient de "fastly.jsdelivr.net", on tente gcore.jsdelivr.net
    if (img.src.includes('fastly.jsdelivr.net') && !img.dataset.fallbackTried) {
        img.dataset.fallbackTried = '1';
        img.src = img.src.replace('fastly.jsdelivr.net', 'gcore.jsdelivr.net');
        return;
    }

    // 2. Si l'image vient de "gcore.jsdelivr.net", on tente cdn.jsdelivr.net (le principal)
    if (img.src.includes('gcore.jsdelivr.net') && img.dataset.fallbackTried === '1') {
        img.dataset.fallbackTried = '2';
        img.src = img.src.replace('gcore.jsdelivr.net', 'cdn.jsdelivr.net');
        return;
    }

    // 3. Si l'image échoue sur les 3 CDN, on tente les extensions de secours (jpg, png, etc.)
    const m = String(filename || '').match(/^(\d+)-(\d+)\.(webp|jpg|jpeg|png)$/i);
    if (!m) {
        img.dataset.fallbackDone = '1';
        img.onerror = null;
        img.src = IMG_LOGO;
        return;
    }
    const ordre = parseInt(m[1], 10);
    const num = parseInt(m[2], 10);
    const ext = m[3].toLowerCase();

    const tried = (img.dataset.tried || '').split(',').filter(Boolean);
    tried.push(ext);
    img.dataset.tried = tried.join(',');

    const chain = { webp: ['jpg', 'jpeg', 'png'], jpg: ['jpeg', 'png', 'webp'], jpeg: ['jpg', 'png', 'webp'], png: ['jpg', 'jpeg', 'webp'] };
    const next = (chain[ext] || []).find(e => !tried.includes(e));
    if (next) {
        // On repart sur fastly pour le nouveau format
        img.dataset.fallbackTried = ''; 
        img.src = `https://fastly.jsdelivr.net/gh/le-malicieux/le-malicieux.github.io@main/img/covers/${getTranche(ordre)}/${ordre}-${num}.${next}${VERSION}`;
    } else {
        img.dataset.fallbackDone = '1';
        img.onerror = null;
        img.src = IMG_LOGO;
    }
}
window.handleImgError = handleImgError;

// ═══════════════════════════════════════════════════════════
//  ENCADRÉS CENSURE / STATUT
// ═══════════════════════════════════════════════════════════

export function renderMetaBadges(anime) {
    const cens = ((anime && anime.censure) || '—').trim();
    const etat = ((anime && anime.etat) || '—').trim();
    return `<div class="card-meta-row" style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
        <span class="meta-badge"><strong>Censure :</strong> ${cens}</span>
        <span class="meta-badge"><strong>Statut :</strong> ${etat}</span>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
//  PARSING CSV
// ═══════════════════════════════════════════════════════════

export function parseCSVLine(line) {
    const cols = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
            else inQ = !inQ;
        } else if (ch === ';' && !inQ) {
            cols.push(cur); cur = '';
        } else {
            cur += ch;
        }
    }
    cols.push(cur);
    return cols;
}

export function parseAnimeRow(cols) {
    const c = (i) => (cols[i] || '').trim().replace(/^"|"$/g, '');
    const producteur = c(13);
    const label = c(14);
    const studio = c(15);
    const editeurList = [producteur, label, studio].filter(Boolean);

    return {
        nom: c(0), pop: c(1), score: c(2), sortie: c(3), ep: c(4),
        censure: c(5), etat: c(6), description: c(7),
        liensStreaming: c(8), liensDownload: c(9), infos: c(10),
        tags: c(11), malId: c(12), producteur, label, studio,
        editeur: editeurList.join(', '),
        prequels: c(16), sequels: c(17),
        ordreAjout: parseInt(c(18), 10) || 0,
        alternatif: c(19),
    };
}

// ═══════════════════════════════════════════════════════════
//  RECHERCHE
// ═══════════════════════════════════════════════════════════

export function normalize(str) {
    return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[-_.:;,!?()'"&~#|\[\]\/]/g, ' ').replace(/\s+/g, ' ').trim();
}
export function squash(str) { return normalize(str).replace(/ /g, ''); }

function editDistance(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        const cur = [i]; let best = i;
        for (let j = 1; j <= b.length; j++) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            if (cur[j] < best) best = cur[j];
        }
        if (best > max) return max + 1;
        prev = cur;
    }
    return prev[b.length];
}
function isSubsequence(q, t) {
    let i = 0;
    for (let j = 0; j < t.length && i < q.length; j++) if (t[j] === q[i]) i++;
    return i === q.length;
}

export function matchScore(title, query) {
    const t = normalize(title), q = normalize(query);
    if (!q) return null;
    const ts = squash(t), qs = squash(q);
    if (t === q) return 1000;
    if (t.startsWith(q)) return 900 - t.length * 0.1;
    if (ts.startsWith(qs)) return 850 - ts.length * 0.1;
    const words = t.split(' ');
    if (words.some(w => w.startsWith(q))) return 800 - t.length * 0.1;
    if (t.includes(q)) return 700 - t.indexOf(q) - t.length * 0.05;
    if (ts.includes(qs)) return 650 - ts.length * 0.05;
    const qWords = q.split(' ').filter(Boolean);
    if (qWords.length > 1 && qWords.every(qw => words.some(w => w.includes(qw)))) return 600;
    const initials = words.map(w => w[0]).join('');
    if (qs.length >= 2 && initials.startsWith(qs)) return 560;
    if (qs.length >= 4) {
        const tol = qs.length <= 6 ? 1 : 2;
        for (const w of words) if (Math.abs(w.length - q.length) <= tol && editDistance(w, q, tol) <= tol) return 500;
        if (Math.abs(ts.length - qs.length) <= tol && editDistance(ts, qs, tol) <= tol) return 480;
    }
    if (qs.length >= 3 && isSubsequence(qs, ts)) return 300 - ts.length * 0.05;
    return null;
}

export function searchAnimes(query, animes, limit) {
    const scored = [];
    for (const a of animes) {
        let s = matchScore(a.nom, query);
        if (s === null && a.alternatif) {
            const alt = matchScore(a.alternatif, query);
            if (alt !== null) s = alt - 60;
        }
        if (s !== null) scored.push({ a, s });
    }
    scored.sort((x, y) => y.s - x.s || x.a.nom.localeCompare(y.a.nom, 'fr'));
    const out = scored.map(x => x.a);
    return limit ? out.slice(0, limit) : out;
}

export function highlightTitle(title, query) {
    if (!query) return title;
    const normTitle = normalize(title), normQuery = normalize(query);
    const idx = normTitle.indexOf(normQuery);
    if (idx === -1) return title;
    let count = 0, orig = -1;
    for (let i = 0; i < title.length; i++) {
        if (normalize(title[i]).length > 0) count++;
        if (count > idx && orig === -1) orig = i;
    }
    if (orig === -1) return title;
    const end = orig + query.length;
    return title.substring(0, orig) + '<span class="highlight">' + title.substring(orig, Math.min(end, title.length)) + '</span>' + title.substring(Math.min(end, title.length));
}

// ═══════════════════════════════════════════════════════════
//  FOND VERROUILLÉ
// ═══════════════════════════════════════════════════════════

let _bgLastW = null;
function _zoomFactor() {
    const z = parseFloat(getComputedStyle(document.documentElement).zoom);
    return (!z || isNaN(z)) ? 1 : z;
}

export function lockBackground(force = false) {
    const layers = [document.getElementById('bg-layer'), document.getElementById('bg-overlay')];
    if (!layers[0]) return;
    const w = document.documentElement.clientWidth;
    if (!force && _bgLastW !== null && Math.abs(w - _bgLastW) < 2) return;
    _bgLastW = w;
    const z = _zoomFactor();
    const h = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, (window.screen && window.screen.height) || 0);
    layers.forEach(el => {
        if (!el) return;
        el.style.width = (w / z) + 'px';
        el.style.height = (h / z) + 'px';
    });
}

export async function setBackground() {
    try {
        const res = await fetch('backgrounds.json');
        if (!res.ok) return;
        const data = await res.json();
        const kind = window.innerWidth <= 1000 ? 'mobile' : 'desktop';
        const list = data[kind] || [];
        if (!list.length) return;
        const file = list[Math.floor(Math.random() * list.length)];
        
        // On utilise le fallback manuel ici aussi pour les fonds d'écran
        const url = getBackgroundUrl(kind, file);
        
        const img = new Image();
        img.onload = () => {
            const layer = document.getElementById('bg-layer');
            if (layer) layer.style.backgroundImage = `url('${url}')`;
        };
        img.onerror = () => {
            // Si Fastly échoue, on tente sur gcore pour le fond
            const fallbackUrl = url.replace('fastly.jsdelivr.net', 'gcore.jsdelivr.net');
            const imgFallback = new Image();
            imgFallback.onload = () => {
                const layer = document.getElementById('bg-layer');
                if (layer) layer.style.backgroundImage = `url('${fallbackUrl}')`;
            };
            imgFallback.src = fallbackUrl;
        };
        img.src = url;
    } catch (e) {}
}

// ═══════════════════════════════════════════════════════════
//  NAVBAR / MENU & RECHERCHE
// ═══════════════════════════════════════════════════════════

export function toggleM() {
    const menu = document.getElementById('menu');
    const overlay = document.getElementById('overlay');
    if (!menu || !overlay) return;
    const open = menu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = open ? 'hidden' : '';
}
window.toggleM = toggleM;

export function markActiveTab() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-tab').forEach(tab => {
        if (tab.dataset.page === current) tab.classList.add('active');
    });
}

// Bouton "Au hasard" global
window.randomAnime = async () => {
    try {
        const animes = await loadAnimes(); // Utilise le cache global
        if (animes.length > 0) {
            const random = animes[Math.floor(Math.random() * animes.length)];
            window.location.href = `fiche.html?name=${encodeURIComponent(random.nom)}`;
        }
    } catch (e) { console.error("Erreur random anime", e); }
};

// Configuration de la barre de recherche
let _headerSearchSetup = false;
async function setupHeaderSearch() {
    if (_headerSearchSetup) return;
    const searchInput = document.getElementById('search');
    const searchSuggestions = document.getElementById('search-suggestions');
    if (!searchInput || !searchSuggestions) return;

    _headerSearchSetup = true;

    searchInput.addEventListener('input', async function() {
        const val = this.value.trim();
        if (val.length < 2) { searchSuggestions.classList.remove('active'); return; }
        
        // Affiche "Chargement..." si le fichier CSV n'est pas encore en cache
        if (!_animesCache) {
            searchSuggestions.innerHTML = '<div class="sugg-empty">Chargement...</div>';
            searchSuggestions.classList.add('active');
        }

        // Attend que les animés soient chargés (utilise la promesse globale si déjà en cours)
        const animes = await loadAnimes(); 

        const results = searchAnimes(val, animes, 8);
        if (results.length === 0) {
            searchSuggestions.innerHTML = '<div class="sugg-empty">Aucun résultat</div>';
        } else {
            searchSuggestions.innerHTML = results.map(a => 
                `<div class="suggestion-item" data-name="${a.nom.replace(/"/g, '&quot;')}">
                    <img src="${getCoverPath(a.ordreAjout, 1)}" class="sugg-img" onerror="this.onerror=null;this.src='${IMG_LOGO}'">
                    <span>${highlightTitle(a.nom, val)}</span>
                </div>`
            ).join('');
        }
        searchSuggestions.classList.add('active');
    });

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = this.value.trim();
            if (val) window.location.href = 'index.html?search=' + encodeURIComponent(val);
            searchSuggestions.classList.remove('active');
            this.blur();
        }
    });

    searchSuggestions.addEventListener('click', function(e) {
        const item = e.target.closest('.suggestion-item');
        if (item && item.dataset.name) {
            window.location.href = 'fiche.html?name=' + encodeURIComponent(item.dataset.name);
        }
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-wrapper')) searchSuggestions.classList.remove('active');
    });
}

// ═══════════════════════════════════════════════════════════
//  AUTH FIREBASE
// ═══════════════════════════════════════════════════════════

let _currentUser = null;
export function getCurrentUser() { return _currentUser; }

export function initAuth() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('.js-login-btn')) signInWithPopup(auth, provider);
        if (e.target.closest('.js-logout-btn')) signOut(auth);
    });

    onAuthStateChanged(auth, async (user) => {
        const slots = document.querySelectorAll('.auth-ui-slot');
        if (user) {
            _currentUser = user;
            try {
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid, email: user.email, displayName: user.displayName || '',
                    photoURL: user.photoURL || '', lastSeen: new Date().toISOString()
                }, { merge: true });
            } catch (e) {}

            const cachedPseudo = sessionStorage.getItem('userPseudo');
            let displayName = cachedPseudo || user.displayName || 'Utilisateur';
            if (!cachedPseudo) {
                try {
                    const snap = await getDoc(doc(db, "users", user.uid));
                    if (snap.exists() && snap.data().pseudo) {
                        displayName = snap.data().pseudo;
                        sessionStorage.setItem('userPseudo', displayName);
                    }
                    if (snap.exists() && snap.data().photoURL) {
                        sessionStorage.setItem('userAvatar', snap.data().photoURL);
                    }
                } catch (e) {}
            }
            const avatarUrl = sessionStorage.getItem('userAvatar') || user.photoURL || IMG_LOGO;
            const html = `<a href="profil.html" class="auth-account"><img src="${avatarUrl}" class="auth-avatar" onerror="this.src='${IMG_LOGO}'"><span class="auth-name">${displayName}</span></a><button class="js-logout-btn auth-logout-btn">Quitter</button>`;
            slots.forEach(el => { el.innerHTML = html; });
            
            const mobAvatar = document.getElementById('nav-avatar-mobile');
            const mobPseudo = document.getElementById('nav-pseudo-mobile');
            const mobWrap = document.getElementById('menu-account-wrap');
            if(mobAvatar && mobPseudo) {
                mobAvatar.src = avatarUrl;
                mobAvatar.style.display = 'inline-block';
                mobPseudo.textContent = displayName;
                mobPseudo.style.display = 'inline';
                if(mobWrap) mobWrap.classList.remove('js-hidden');
            }
        } else {
            _currentUser = null;
            const html = `<button class="js-login-btn auth-login-btn">Connexion</button>`;
            slots.forEach(el => { el.innerHTML = html; });
        }
    });
}

// ═══════════════════════════════════════════════════════════
//  INIT GLOBALE
// ═══════════════════════════════════════════════════════════

export function initCommon() {
    renderHeader(); // Injecte la navbar
    setBackground();
    lockBackground(true);
    window.addEventListener('resize', () => lockBackground(false));
    window.addEventListener('orientationchange', () => setTimeout(() => lockBackground(true), 250));
    window.addEventListener('scroll', () => {
        const bg = document.getElementById('bg-overlay');
        if (bg) bg.style.opacity = Math.min(window.scrollY / 600, 0.65);
    });
    initAuth();
    setTimeout(markActiveTab, 50); 
    
    // Enregistre la visite
    logVisit();
}