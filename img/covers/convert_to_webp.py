#!/usr/bin/env python3
"""Convertit récursivement AVIF/GIF/JFIF/JPEG/JPG/PNG → WebP sans perte, en parallèle."""
from pathlib import Path
from PIL import Image, ImageSequence
from concurrent.futures import ProcessPoolExecutor
import argparse, os, shutil, subprocess

try:
    import pillow_avif  # noqa
except ImportError:
    pass

EXTS = {".avif", ".gif", ".jfif", ".jpeg", ".jpg", ".png"}
CWEBP = shutil.which("cwebp")  # encodeur natif, si dispo


def convert_one(job):
    src_str, force, method = job
    src, dst = Path(src_str), Path(src_str).with_suffix(".webp")
    if dst.exists() and not force:
        return ("skip", src_str, None)
    try:
        # Chemin rapide : cwebp pour PNG/JPEG (pas de GIF/AVIF)
        if CWEBP and src.suffix.lower() in {".png", ".jpg", ".jpeg", ".jfif"}:
            r = subprocess.run(
                [CWEBP, "-quiet", "-lossless", "-exact", "-z", str(method),
                 str(src), "-o", str(dst)],
                capture_output=True,
            )
            if r.returncode == 0:
                return ("ok", src_str, None)

        # Fallback Pillow (GIF animé, AVIF, ou si cwebp échoue)
        with Image.open(src) as img:
            if getattr(img, "is_animated", False) and getattr(img, "n_frames", 1) > 1:
                frames = [f.convert("RGBA") for f in ImageSequence.Iterator(img)]
                img.seek(0)
                durations = [f.info.get("duration", 100) for f in ImageSequence.Iterator(img)]
                frames[0].save(dst, "WEBP", save_all=True, append_images=frames[1:],
                               duration=durations, loop=img.info.get("loop", 0),
                               lossless=True, quality=100, method=method, exact=True)
            else:
                has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
                img.convert("RGBA" if has_alpha else "RGB").save(
                    dst, "WEBP", lossless=True, quality=100, method=method, exact=True)
        return ("ok", src_str, None)
    except Exception as e:
        return ("err", src_str, str(e))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("path", nargs="?", default=".")
    p.add_argument("-f", "--force", action="store_true")
    p.add_argument("-d", "--delete", action="store_true")
    p.add_argument("-m", "--method", type=int, default=4, choices=range(7),
                   help="effort 0-6 (4 par défaut ; 6 = plus petit mais très lent)")
    p.add_argument("-j", "--jobs", type=int, default=os.cpu_count())
    a = p.parse_args()

    root = Path(a.path).resolve()
    files = [str(p) for p in root.rglob("*")
             if p.is_file() and p.suffix.lower() in EXTS]
    if not files:
        print("Aucun fichier.")
        return

    print(f"{len(files)} fichier(s) · {a.jobs} workers · method={a.method} · cwebp={'oui' if CWEBP else 'non'}\n")

    ok = skip = err = 0
    with ProcessPoolExecutor(max_workers=a.jobs) as ex:
        for status, s, error in ex.map(convert_one, [(f, a.force, a.method) for f in files]):
            rel = Path(s).relative_to(root)
            if status == "ok":
                ok += 1
                print(f"  ✓ {rel}")
                if a.delete:
                    try: Path(s).unlink()
                    except OSError: pass
            elif status == "skip":
                skip += 1
            else:
                err += 1
                print(f"  ✗ {rel} : {error}")

    print(f"\n✅ {ok} converti(s) · {skip} ignoré(s) · {err} erreur(s)")


if __name__ == "__main__":
    main()