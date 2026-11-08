#!/usr/bin/env python3
"""
Recompresse les WebP > cible (500 Ko par défaut) — VERSION RAPIDE.

Un seul encodage par fichier (near_lossless 100 = meilleur compromis anime),
effort modéré (-z 4 -m 4), tout en mémoire. Fallback lossy uniquement si
la cible n'est pas atteinte.

Usage:
    py compress.py .                # rapide (recommandé)
    py compress.py . --max          # ancien comportement (lent mais + petit)
    py compress.py . --strict       # lossless pur uniquement
    py compress.py . --dry-run
"""

from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import argparse, os, shutil, subprocess

def find_exe(name):
    p = shutil.which(name)
    if p:
        return p
    here = Path(__file__).resolve().parent
    for fname in (name + ".exe", name):
        for d in (here, here / "webp"):
            c = d / fname
            if c.is_file():
                return str(c)
    return None

CWEBP = find_exe("cwebp")

# Arguments selon le mode
MODES = {
    # mode rapide par défaut : near_lossless 100, effort -z 4 -m 4
    "fast":     ["-near_lossless", "100", "-z", "4", "-m", "4"],
    # effort max (lent) : -z 9 -m 6
    "max":      ["-near_lossless", "100", "-z", "9", "-m", "6"],
    # strict lossless (peut ne pas atteindre la cible)
    "strict":   ["-lossless", "-z", "4", "-m", "4", "-exact"],
    # fallback si la cible n'est pas atteinte
    "fallback": ["-q", "92", "-m", "4"],
}


def encode_in_memory(src: Path, args) -> bytes | None:
    """Encode vers stdout, garde les bytes en RAM. Pas de fichier temporaire."""
    r = subprocess.run(
        [CWEBP, "-quiet"] + args + ["-metadata", "none", str(src), "-o", "-"],
        capture_output=True,
    )
    return r.stdout if r.returncode == 0 and r.stdout else None


def shrink_one(job):
    src_str, target, dry_run, mode = job
    src = Path(src_str)
    size0 = src.stat().st_size

    if size0 <= target:
        return ("ok", src_str, size0, size0, "sous la cible")
    if not CWEBP:
        return ("err", src_str, size0, size0, "cwebp introuvable")

    # 1er passage : mode choisi
    data = encode_in_memory(src, MODES[mode])
    if data is None:
        return ("err", src_str, size0, size0, "encodage échoué")
    label = mode

    # 2e passage seulement si nécessaire (cible non atteinte ET mode non strict)
    if len(data) > target and mode != "strict":
        data2 = encode_in_memory(src, MODES["fallback"])
        if data2 and len(data2) < len(data):
            data, label = data2, "fallback q=92"

    final_size = len(data)
    if not dry_run and final_size < size0:
        src.write_bytes(data)

    status = "ok" if final_size <= target else "warn"
    return (status, src_str, size0, final_size, label)


def human(n):
    for u in ("o", "Ko", "Mo"):
        if n < 1024:
            return f"{n:.0f} {u}" if u == "o" else f"{n:.1f} {u}"
        n /= 1024
    return f"{n:.1f} Go"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("path", nargs="?", default=".")
    p.add_argument("-t", "--target", type=float, default=0.5)
    p.add_argument("--max", action="store_true", help="effort maximum (lent)")
    p.add_argument("--strict", action="store_true", help="lossless pur")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("-j", "--jobs", type=int, default=os.cpu_count())
    a = p.parse_args()

    if not CWEBP:
        print("cwebp introuvable (installe webp ou mets cwebp.exe à côté).")
        return

    root = Path(a.path).resolve()
    target = int(a.target * 1024 * 1024)
    files = [str(f) for f in root.rglob("*.webp")
             if f.is_file() and f.stat().st_size > target]

    if not files:
        print(f"Aucun .webp > {human(target)}.")
        return

    mode = "strict" if a.strict else ("max" if a.max else "fast")
    print(f"{len(files)} .webp > {human(target)} · cible={human(target)} · "
          f"mode={mode} · workers={a.jobs}\n")

    before = after = 0
    warns = errors = 0
    with ProcessPoolExecutor(max_workers=a.jobs) as ex:
        jobs = [(f, target, a.dry_run, mode) for f in files]
        for status, s, b, aft, label in ex.map(shrink_one, jobs):
            rel = Path(s).relative_to(root)
            before += b
            after += aft
            if status == "ok":
                pct = (1 - aft / b) * 100 if b else 0
                print(f"  ✓ {rel}  {human(b)} → {human(aft)}  (-{pct:.0f}%)")
            elif status == "warn":
                warns += 1
                print(f"  ⚠ {rel}  {human(b)} → {human(aft)}  [{label}]")
            else:
                errors += 1
                print(f"  ✗ {rel}  {label}")

    gain = before - after
    pct = (gain / before * 100) if before else 0
    print(f"\n📦 {human(before)} → {human(after)}  (-{human(gain)}, -{pct:.0f}%)")
    if warns:  print(f"⚠ {warns} au-dessus de la cible")
    if errors: print(f"✗ {errors} erreur(s)")


if __name__ == "__main__":
    main()