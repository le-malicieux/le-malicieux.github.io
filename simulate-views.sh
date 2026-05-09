#!/bin/bash

# Fichier CSV contenant les URLs SeekStreaming (dernière colonne)
CSV_FILE="/tmp/stream.csv"

# Durée de téléchargement simulé (en secondes) – 10 sec suffisent pour une vue
SIMULATION_DURATION=10

while IFS=',' read -r title poster resolution watch_url; do
    # Ignorer la première ligne d'en-tête
    if [[ "$title" == "title" ]]; then continue; fi

    # Nettoyer l'URL
    watch_url=$(echo "$watch_url" | tr -d '[:space:]')
    if [[ -z "$watch_url" || ! "$watch_url" == http* ]]; then continue; fi

    echo "-----------------------------"
    echo "Traitement de : $title"
    echo "URL SeekStreaming : $watch_url"

    # Étape 1 : Extraire l'URL directe de la vidéo avec yt-dlp
    DIRECT_URL=$(yt-dlp -g --no-playlist "$watch_url" 2>/dev/null | head -n1)
    if [[ -z "$DIRECT_URL" ]]; then
        echo "❌ Impossible d'extraire l'URL directe."
        continue
    fi

    echo "URL directe : $DIRECT_URL"

    # Étape 2 : Simuler une lecture en téléchargeant seulement les premiers octets
    #            avec une requête Range et en limitant le débit à celui d'une lecture normale.
    curl -r 0-20971520 --limit-rate 2M -o /dev/null -s "$DIRECT_URL" &
    PID=$!

    # Laisser tourner pendant $SIMULATION_DURATION secondes
    echo "⏳ Lecture simulée pendant ${SIMULATION_DURATION}s..."
    sleep $SIMULATION_DURATION
    kill $PID 2>/dev/null
    wait $PID 2>/dev/null

    echo "✅ Vue enregistrée pour : $title"
done < <(tail -n +2 "$CSV_FILE")

echo "=== Terminé ==="
