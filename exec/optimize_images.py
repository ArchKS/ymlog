#!/usr/bin/env python3
"""Clean and convert images referenced by Markdown files.

The script scans Markdown image references, moves unreferenced raster images to
the project's ``unuse`` directory, converts referenced PNG/JPEG files to WebP,
and updates the corresponding Markdown URLs. It is a dry run unless ``--apply``
is supplied.
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import unquote, urlsplit

try:
    from PIL import Image, ImageOps, features
except ImportError as exc:  # pragma: no cover - depends on the host machine
    raise SystemExit("Pillow is required: python3 -m pip install Pillow") from exc


CONVERTIBLE_SUFFIXES = {".png", ".jpg", ".jpeg"}
KNOWN_IMAGE_SUFFIXES = CONVERTIBLE_SUFFIXES | {".webp", ".gif", ".bmp", ".tif", ".tiff"}

# Capture normal Markdown images, HTML <img> sources, and root/relative image
# URLs that may appear in reference definitions. Spans are deduplicated later.
REFERENCE_PATTERNS = (
    re.compile(r"!\[[^\]]*\]\(\s*<(?P<url>[^>]+)>", re.IGNORECASE),
    re.compile(r"!\[[^\]]*\]\(\s*(?P<url>[^\s)]+)", re.IGNORECASE),
    re.compile(r"<img\b[^>]*?\bsrc\s*=\s*[\"'](?P<url>[^\"']+)[\"']", re.IGNORECASE),
    re.compile(
        r"(?P<url>(?:https?://[^\s<>\"']+)?(?:/|\.\./)img/[^\s<>\"')]+)",
        re.IGNORECASE,
    ),
)


@dataclass(frozen=True)
class Reference:
    start: int
    end: int
    url: str
    image_path: Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--project-root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="project root (default: parent of scripts/)",
    )
    parser.add_argument("--image-dir", default="source/img", help="image directory under project root")
    parser.add_argument(
        "--markdown-dir", default="source", help="directory scanned recursively for Markdown"
    )
    parser.add_argument("--unused-dir", default="unuse", help="unused-image directory under project root")
    parser.add_argument("--quality", type=int, default=85, help="WebP quality for JPEG input (1-100)")
    parser.add_argument(
        "--lossy-png",
        action="store_true",
        help="encode PNG input with --quality instead of lossless WebP",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="perform changes; without this flag only a dry-run report is printed",
    )
    return parser.parse_args()


def image_path_from_url(url: str) -> Path | None:
    """Return the path below img/ represented by a Markdown image URL."""
    path = unquote(urlsplit(url).path).replace("\\", "/")
    match = re.search(r"(?:^|/)img/(.+)$", path, re.IGNORECASE)
    if not match:
        return None
    relative = Path(match.group(1))
    if relative.is_absolute() or ".." in relative.parts:
        return None
    return relative


def find_references(text: str) -> list[Reference]:
    candidates: dict[tuple[int, int], Reference] = {}
    for pattern in REFERENCE_PATTERNS:
        for match in pattern.finditer(text):
            start, end = match.span("url")
            url = match.group("url")
            image_path = image_path_from_url(url)
            if image_path is not None:
                candidates[(start, end)] = Reference(start, end, url, image_path)

    # A generic URL match can sit inside a wider Markdown/HTML match (notably
    # when a quoted HTML path contains spaces). Keep only the widest match for
    # every overlapping region so suffix replacement cannot edit it twice.
    references: list[Reference] = []
    for candidate in sorted(candidates.values(), key=lambda item: (item.start, -item.end)):
        if references and candidate.start < references[-1].end:
            continue
        references.append(candidate)
    return references


def replace_reference_suffixes(text: str, conversions: dict[Path, Path]) -> str:
    references = find_references(text)
    replacements: list[tuple[int, int, str]] = []
    for reference in references:
        target = conversions.get(reference.image_path)
        if target is None:
            continue
        new_url = re.sub(
            re.escape(reference.image_path.suffix) + r"(?=([?#]|$))",
            target.suffix,
            reference.url,
            count=1,
            flags=re.IGNORECASE,
        )
        replacements.append((reference.start, reference.end, new_url))

    for start, end, replacement in reversed(replacements):
        text = text[:start] + replacement + text[end:]
    return text


def convert_to_webp(source: Path, target: Path, quality: int, lossy_png: bool) -> None:
    temporary = target.with_name(f".{target.name}.{os.getpid()}.tmp")
    try:
        with Image.open(source) as opened:
            if getattr(opened, "n_frames", 1) != 1:
                raise RuntimeError(f"animated image is not supported: {source}")
            image = ImageOps.exif_transpose(opened)
            save_options: dict[str, object] = {"format": "WEBP", "method": 6}
            if source.suffix.lower() == ".png" and not lossy_png:
                save_options["lossless"] = True
            else:
                save_options["quality"] = quality
            image.save(temporary, **save_options)
        temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)


def main() -> int:
    args = parse_args()
    if not 1 <= args.quality <= 100:
        raise SystemExit("--quality must be between 1 and 100")
    if not features.check("webp"):
        raise SystemExit("this Pillow installation does not support WebP")

    project_root = args.project_root.resolve()
    image_dir = (project_root / args.image_dir).resolve()
    markdown_dir = (project_root / args.markdown_dir).resolve()
    unused_dir = (project_root / args.unused_dir).resolve()
    if not image_dir.is_dir():
        raise SystemExit(f"image directory does not exist: {image_dir}")
    if not markdown_dir.is_dir():
        raise SystemExit(f"Markdown directory does not exist: {markdown_dir}")

    markdown_files = sorted(markdown_dir.rglob("*.md"))
    markdown_text = {path: path.read_text(encoding="utf-8") for path in markdown_files}
    referenced_paths: set[Path] = set()
    for text in markdown_text.values():
        referenced_paths.update(reference.image_path for reference in find_references(text))

    image_files = sorted(
        path for path in image_dir.rglob("*") if path.is_file() and path.suffix.lower() in KNOWN_IMAGE_SUFFIXES
    )
    existing_paths = {path.relative_to(image_dir) for path in image_files}
    missing = sorted(path for path in referenced_paths if path not in existing_paths)
    if missing:
        print("References with no matching file:", file=sys.stderr)
        for path in missing:
            print(f"  {path}", file=sys.stderr)
        return 2

    used_files = [path for path in image_files if path.relative_to(image_dir) in referenced_paths]
    unused_files = [path for path in image_files if path.relative_to(image_dir) not in referenced_paths]
    unsupported_used = [path for path in used_files if path.suffix.lower() not in CONVERTIBLE_SUFFIXES | {".webp"}]
    if unsupported_used:
        print("Referenced formats that cannot be converted:", file=sys.stderr)
        for path in unsupported_used:
            print(f"  {path.relative_to(project_root)}", file=sys.stderr)
        return 2

    conversions: dict[Path, Path] = {}
    target_sources: dict[Path, Path] = {}
    for source in used_files:
        relative = source.relative_to(image_dir)
        if source.suffix.lower() not in CONVERTIBLE_SUFFIXES:
            continue
        target_relative = relative.with_suffix(".webp")
        target = image_dir / target_relative
        previous = target_sources.get(target)
        if previous is not None and previous != source:
            raise SystemExit(f"conversion collision: {previous} and {source} -> {target}")
        if target.exists() and target != source:
            raise SystemExit(f"conversion target already exists: {target}")
        target_sources[target] = source
        conversions[relative] = target_relative

    moves: list[tuple[Path, Path]] = []
    for source in unused_files:
        relative = source.relative_to(image_dir)
        target = unused_dir / relative
        if target.exists():
            raise SystemExit(f"unused target already exists: {target}")
        moves.append((source, target))

    changed_markdown: dict[Path, str] = {}
    for path, text in markdown_text.items():
        updated = replace_reference_suffixes(text, conversions)
        if updated != text:
            changed_markdown[path] = updated

    mode = "APPLY" if args.apply else "DRY RUN"
    print(f"[{mode}] Markdown files scanned: {len(markdown_files)}")
    print(f"[{mode}] Referenced images: {len(used_files)}")
    print(f"[{mode}] Images to convert: {len(conversions)}")
    print(f"[{mode}] Images to move to {unused_dir.relative_to(project_root)}: {len(moves)}")
    print(f"[{mode}] Markdown files to update: {len(changed_markdown)}")
    for source, target in moves:
        print(f"  MOVE {source.relative_to(project_root)} -> {target.relative_to(project_root)}")
    for source_relative, target_relative in conversions.items():
        print(f"  WEBP {image_dir.joinpath(source_relative).relative_to(project_root)} -> "
              f"{image_dir.joinpath(target_relative).relative_to(project_root)}")

    if not args.apply:
        print("Dry run only. Re-run with --apply to perform these changes.")
        return 0

    # Convert first, then update Markdown, then remove/move originals. A failed
    # conversion therefore cannot leave Markdown pointing at a missing file.
    created_targets: list[Path] = []
    try:
        for source_relative, target_relative in conversions.items():
            target = image_dir / target_relative
            convert_to_webp(
                image_dir / source_relative,
                target,
                args.quality,
                args.lossy_png,
            )
            created_targets.append(target)
    except Exception:
        for target in created_targets:
            target.unlink(missing_ok=True)
        raise
    for path, text in changed_markdown.items():
        path.write_text(text, encoding="utf-8")
    for source_relative in conversions:
        (image_dir / source_relative).unlink()
    for source, target in moves:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(source, target)

    print("Image cleanup completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
