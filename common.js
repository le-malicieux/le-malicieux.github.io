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
// On utilise jsDelivr pour éviter le Rate Limit de GitHub Pages.
// Vérifie bien que le nom d'utilisateur est "le-malicieux" (sans "e" au début).
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/le-malicieux/le-malicieux.github.io@main';

// Si tu as converti tes logos en .webp, change l'extension ici.
export const IMG_LOGO = `${CDN_BASE}/img/bannieres_icones/logo.jpg`;
export const IMG_DISCORD = `${CDN_BASE}/img/bannieres_icones/logo-discord.jpg`;
export const DEFAULT_COVER_NUM = 1;

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
    // Utilisation de .webp
    return `${CDN_BASE}/img/covers/${getTranche(n)}/${n}-${num}.webp`;
}

export function getPlsPath(slug) {
    if (!slug) return IMG_LOGO;
    // Utilisation de .webp
    return `${CDN_BASE}/img/pls/${slug}.webp`;
}

export function getBackgroundUrl(kind, filename) {
    if (!filename) return '';
    // Assure-toi que les noms de fichiers dans ton backgrounds.json ont bien l'extension .webp
    return kind === 'mobile'
        ? `${CDN_BASE}/img/fonds_mobiles/${filename}`
        : `${CDN_BASE}/img/fonds_desktop/${filename}`;
}

// ═══════════════════════════════════════════════════════════
//  FALLBACK IMAGE (sans boucle)
// ═══════════════════════════════════════════════════════════

export function handleImgError(img, filename) {
    if (!img || img.dataset.fallbackDone === '1') return;
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

    // Si le .webp échoue, il tente le .jpg, etc.
    const chain = {
        webp: ['jpg', 'jpeg', 'png'],
        jpg: ['jpeg', 'png', 'webp'],
        jpeg: ['jpg', 'png', 'webp'],
        png: ['jpg', 'jpeg', 'webp']
    };
    const next = (chain[ext] || []).find(e => !tried.includes(e));
    if (next) {
        img.src = `${CDN_BASE}/img/covers/${getTranche(ordre)}/${ordre}-${num}.${next}`;
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

export async function loadAnimes() {
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
    return animes;
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
        const url = getBackgroundUrl(kind, file);
        const img = new Image();
        img.onload = () => {
            const layer = document.getElementById('bg-layer');
            if (layer) layer.style.backgroundImage = `url('${url}')`;
        };
        img.src = url;
    } catch (e) {}
}

// ═══════════════════════════════════════════════════════════
//  NAVBAR / MENU
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
    setBackground();
    lockBackground(true);
    window.addEventListener('resize', () => lockBackground(false));
    window.addEventListener('orientationchange', () => setTimeout(() => lockBackground(true), 250));
    window.addEventListener('scroll', () => {
        const bg = document.getElementById('bg-overlay');
        if (bg) bg.style.opacity = Math.min(window.scrollY / 600, 0.65);
    });
    initAuth();
    markActiveTab();
}