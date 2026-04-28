import csv
import json
import os
import hashlib
from datetime import date

CSV_FILE = "animes.csv"
BACKUP_FILE = "animes_backup.csv"
RECENTS_FILE = "recents.json"
MAX_RECENTS = 20

def hash_row(row):
    return hashlib.md5(";".join(row).encode("utf-8")).hexdigest()

def load_csv(path):
    rows = {}
    if not os.path.exists(path):
        return rows
    with open(path, encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f, delimiter=";")
        next(reader, None)  # skip header
        for row in reader:
            if row and row[0].strip():
                titre = row[0].strip().strip('"')
                rows[titre] = hash_row(row)
    return rows

def load_recents():
    if not os.path.exists(RECENTS_FILE):
        return []
    with open(RECENTS_FILE, encoding="utf-8") as f:
        return json.load(f)

def save_recents(recents):
    with open(RECENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(recents, f, ensure_ascii=False, indent=2)

def main():
    today = str(date.today())

    print("Lecture du CSV actuel...")
    current = load_csv(CSV_FILE)

    print("Lecture du backup...")
    backup = load_csv(BACKUP_FILE)

    # Detect changed or new rows
    changed = []
    for titre, h in current.items():
        if titre not in backup or backup[titre] != h:
            changed.append(titre)

    print(f"{len(changed)} ligne(s) modifiée(s) ou ajoutée(s).")

    if changed:
        # Load existing recents
        recents = load_recents()

        # Remove entries that are being updated
        recents = [r for r in recents if r["nom"] not in changed]

        # Add new entries at the top
        new_entries = [{"nom": titre, "date": today} for titre in changed]
        recents = new_entries + recents

        # Keep only MAX_RECENTS
        recents = recents[:MAX_RECENTS]

        save_recents(recents)
        print(f"recents.json mis à jour avec {len(new_entries)} entrée(s).")
    else:
        print("Aucun changement détecté, recents.json inchangé.")

    # Update backup
    import shutil
    shutil.copy2(CSV_FILE, BACKUP_FILE)
    print("Backup mis à jour.")
    print("Terminé !")

if __name__ == "__main__":
    main()
