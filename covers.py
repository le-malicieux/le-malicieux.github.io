#!/usr/bin/env python3
"""
Génère images.json à partir du contenu de img/covers/.

Format de sortie :
{
  "556": [1, 2, 5],
  "557": [1, 2, 3, 4]
}

Clé   : ordre_ajout (entier, stocké en str dans le JSON)
Valeur: liste triée des numéros d'images existantes

Affiche dans le terminal la liste COMPLÈTE des fichiers ignorés
(nom non conforme) et des doublons d'extension.

Usage :
    python tools/generate_images_json.py
    python tools/generate_images_json.py --covers img/covers --out images.json
"""

import argparse
import json
import re
import sys
from pathlib import Path

# Un fichier valide : <ordre_ajout>-<num>.webp
# - ordre_ajout : entier positif (1, 99, 556, 929…)
# - num         : entier positif (1, 2, 5…)
# On accepte aussi .jpg/.jpeg/.png pour tolérer une transition douce,
# mais le site ne chargera que .webp par défaut.
PATTERN = re.compile(r"^(\d+)-(\d+)\.(webp|jpg|jpeg|png)$", re.IGNORECASE)


def tranche_dir(ordre: int) -> str:
    """Retourne la tranche de dossier attendue pour un ordre_ajout donné."""
    if ordre < 100:
        return "1-99"
    debut = (ordre // 100) * 100
    return f"{debut}-{debut + 99}"


def scan_covers(covers_dir: Path):
    if not covers_dir.is_dir():
        print(f"[erreur] dossier introuvable : {covers_dir}", file=sys.stderr)
        sys.exit(1)

    # images[ordre] = set des numéros trouvés
    images: dict[str, set[int]] = {}
    # doublons d'extension : on garde .webp en priorité
    doublons: list[str] = []
    # fichiers dont le nom ne correspond pas au motif
    ignores: list[str] = []
    # fichiers placés dans la mauvaise tranche (avertissement, mais on les garde)
    mauvaise_tranche: list[str] = []

    for path in sorted(covers_dir.rglob("*")):
        if not path.is_file():
            continue

        m = PATTERN.match(path.name)
        if not m:
            ignores.append(str(path.relative_to(covers_dir)))
            continue

        ordre = int(m.group(1))
        num = int(m.group(2))
        ext = m.group(3).lower()

        attendu = tranche_dir(ordre)
        if path.parent.name != attendu:
            mauvaise_tranche.append(str(path.relative_to(covers_dir)))

        cle = str(ordre)
        if cle in images and num in images[cle]:
            # Le couple (ordre, num) existe déjà
            if ext == "webp":
                # .webp gagne : on remplace, on note l'ancien comme doublon
                # (le set ne contient que des numéros, donc pas de remplacement à faire
                #  au niveau du set ; on note juste le doublon pour information)
                doublons.append(str(path.relative_to(covers_dir)))
            else:
                # Doublon non-webp, on l'ignore
                doublons.append(str(path.relative_to(covers_dir)))
                continue
        images.setdefault(cle, set()).add(num)

    # --- Rapport : on affiche TOUT ---
    print()
    print("=" * 70)
    print("  RAPPORT DU SCAN DES COVERS")
    print("=" * 70)

    if ignores:
        print(f"\n[IGNORÉS] {len(ignores)} fichier(s) non conforme(s) :")
        for f in ignores:
            print(f"    - {f}")
    else:
        print("\n[IGNORÉS] 0 fichier non conforme.")

    if doublons:
        print(f"\n[DOUBLONS D'EXTENSION] {len(doublons)} fichier(s) :")
        for f in doublons:
            print(f"    - {f}")
    else:
        print("\n[DOUBLONS D'EXTENSION] 0 doublon.")

    if mauvaise_tranche:
        print(f"\n[MAUVAISE TRANCHE] {len(mauvaise_tranche)} fichier(s) "
              f"dans un dossier qui ne correspond pas à son ordre_ajout :")
        for f in mauvaise_tranche:
            print(f"    - {f}")
    else:
        print("\n[MAUVAISE TRANCHE] 0 fichier mal placé.")

    # Résumé
    total_fichiers = len(ignores) + len(doublons) + sum(len(v) for v in images.values())
    print()
    print("-" * 70)
    print(f"  Total fichiers parcourus : {total_fichiers}")
    print(f"  Animes distincts         : {len(images)}")
    print(f"  Images retenues          : {sum(len(v) for v in images.values())}")
    print("-" * 70)
    print()

    return {ordre: sorted(nums) for ordre, nums in sorted(images.items(), key=lambda kv: int(kv[0]))}


def write_json(data: dict[str, list[int]], out_path: Path) -> None:
    payload = json.dumps(data, indent=2, ensure_ascii=False)
    out_path.write_text(payload + "\n", encoding="utf-8")
    print(f"[OK] {len(data)} anime(s) écrit(s) dans {out_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Génère images.json pour Le Malicieux")
    parser.add_argument("--covers", default="img/covers", help="Dossier des covers (défaut: img/covers)")
    parser.add_argument("--out", default="images.json", help="Fichier de sortie (défaut: images.json)")
    args = parser.parse_args()

    covers_dir = Path(args.covers)
    out_path = Path(args.out)

    data = scan_covers(covers_dir)
    write_json(data, out_path)


if __name__ == "__main__":
    main()