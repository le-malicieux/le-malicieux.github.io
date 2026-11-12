// analytics.js
import { db } from './common.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function logVisit() {
    try {
        // On ne compte pas les visites faites par toi-même en local (localhost)
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