import csv
import requests
import time
import os
import urllib.parse

# ── Configuration ──
CSV_FILE = 'animes.csv'
API_URL = 'https://api.tenrai.org/v1/anime'
DELAY = 0.5 # Pause pour respecter la limite de Tenrai

def fetch_by_id(mal_id):
    try:
        response = requests.get(f"{API_URL}/{mal_id}", timeout=10)
        if response.status_code == 200:
            return response.json().get('data', {})
    except requests.exceptions.RequestException:
        pass
    return None

def fetch_by_title(title):
    # On nettoie le titre pour améliorer la recherche (on enlève les caractères spéciaux)
    clean_title = title.split('/')[0].strip() 
    query = urllib.parse.quote(clean_title)
    
    try:
        response = requests.get(f"{API_URL}?q={query}&limit=1&sfw=false", timeout=10)
        if response.status_code == 200:
            data_list = response.json().get('data', [])
            if data_list and len(data_list) > 0:
                return data_list[0]
        elif response.status_code == 429:
            print("⏳ Limite de requêtes atteinte. Pause de 10 secondes...")
            time.sleep(10)
    except requests.exceptions.RequestException:
        pass
    return None

def update_csv():
    if not os.path.exists(CSV_FILE):
        print(f"❌ Fichier {CSV_FILE} introuvable.")
        return

    # Lecture du CSV
    with open(CSV_FILE, mode='r', encoding='utf-8-sig') as f:
        reader = csv.reader(f, delimiter=';')
        lines = list(reader)

    if not lines:
        print("❌ Le fichier CSV est vide.")
        return

    # Index (0=A titre, 1=B popularite, 2=C score, 12=M mal_id)
    idx_title = 0
    idx_pop = 1
    idx_score = 2
    idx_mal_id = 12

    updated_count = 0
    total_lines = len(lines) - 1

    print(f"🚀 Début de la mise à jour pour {total_lines} animes...")

    for i in range(1, len(lines)):
        row = lines[i]
        if not row or len(row) <= idx_mal_id:
            continue

        title = row[idx_title].strip()
        mal_id = row[idx_mal_id].strip()
        
        data = None

        # 1. On essaie d'abord par MAL ID (si présent et valide)
        if mal_id and mal_id.lower() != 'x':
            data = fetch_by_id(mal_id)
            if data:
                print(f"✅ [{i}/{total_lines}] (ID: {mal_id}) {title[:30]}...")
        else:
            # 2. Si pas de MAL ID, on cherche par titre
            data = fetch_by_title(title)
            if data:
                print(f"✅ [{i}/{total_lines}] (Titre) {title[:30]}...")

        # 3. Mise à jour des colonnes B et C si on a trouvé des données
        if data:
            new_pop = data.get('popularity')
            new_score = data.get('score')

            if new_pop is not None:
                row[idx_pop] = f"#{new_pop}"
            if new_score is not None:
                row[idx_score] = str(new_score).replace('.', ',')

            updated_count += 1
        else:
            print(f"❌ [{i}/{total_lines}] Non trouvé : {title[:40]}")

        # Pause pour ne pas se faire bloquer
        time.sleep(DELAY)

    # Réécriture du fichier
    with open(CSV_FILE, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, delimiter=';')
        writer.writerows(lines)

    print(f"\n🎉 Terminé ! {updated_count} animes mis à jour.")
    print(f"👉 Pense à re-uploader '{CSV_FILE}' sur ton GitHub.")

if __name__ == "__main__":
    update_csv()