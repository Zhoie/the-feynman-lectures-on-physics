#!/usr/bin/env python3
import json
import re
import time
import html as html_module
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_TS = ROOT / "features" / "lectures" / "data.ts"
OUT_MANIFEST = ROOT / "manifest.json"


def slugify(text: str) -> str:
    text = text.lower()
    text = text.replace("&", "and")
    text = re.sub(r"[\'\"]", "", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"(^-|-$)", "", text)
    return text


def load_chapter_titles() -> list[list[str]]:
    content = DATA_TS.read_text(encoding="utf-8")
    matches = re.findall(r"chapterTitles:\s*\[(.*?)\],", content, re.S)
    volumes = []
    for block in matches:
        titles = re.findall(r"\"([^\"]+)\"", block)
        volumes.append(titles)
    if len(volumes) != 3:
        raise RuntimeError(f"Expected 3 volume title lists, found {len(volumes)}")
    return volumes


_SCRAPER = None


def fetch_html(url: str) -> str:
    global _SCRAPER
    try:
        import cloudscraper  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "cloudscraper is required: /tmp/feynman-venv/bin/pip install cloudscraper"
        ) from exc
    if _SCRAPER is None:
        _SCRAPER = cloudscraper.create_scraper(
            browser={
                "custom": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/122.0.0.0 Safari/537.36"
                )
            }
        )
    response = _SCRAPER.get(url, timeout=30)
    response.raise_for_status()
    return response.text


def parse_sections(html: str) -> list[tuple[int, int, str]]:
    sections: list[tuple[int, int, str]] = []
    pattern = re.compile(
        r"<h3 class=\"section-title\">\s*<span class=\"tag\">(.*?)</span>(.*?)</h3>",
        re.S,
    )
    for match in pattern.finditer(html):
        tag_text = re.sub(r"<[^<]+?>", "", match.group(1)).strip()
        title = re.sub(r"<[^<]+?>", "", match.group(2)).strip()
        title = html_module.unescape(title)
        title = fix_mojibake(title)
        # Extract digits from tag (handles weird dash encodings).
        numbers = [int(value) for value in re.findall(r"\d+", tag_text)]
        if len(numbers) < 2:
            continue
        chapter, section = numbers[0], numbers[1]
        if title:
            sections.append((chapter, section, title))
    return sections


def fix_mojibake(text: str) -> str:
    replacements = {
        "â€™": "'",
        "â€˜": "'",
        "â€œ": '"',
        "â€�": '"',
        "â€“": "-",
        "â€”": "-",
        "â€¦": "...",
        "â\u0080\u0099": "'",
        "â\u0080\u0098": "'",
        "â\u0080\u009c": '"',
        "â\u0080\u009d": '"',
        "â\u0080\u0093": "-",
        "â\u0080\u0094": "-",
        "â\u0080\u00a6": "...",
        "Â": "",
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)
    return text


def build_manifest() -> dict:
    volume_titles = load_chapter_titles()
    volumes = [
        {"id": "volume-1", "roman": "I", "chapterCount": len(volume_titles[0])},
        {"id": "volume-2", "roman": "II", "chapterCount": len(volume_titles[1])},
        {"id": "volume-3", "roman": "III", "chapterCount": len(volume_titles[2])},
    ]
    manifest_sections = []
    for volume_index, volume in enumerate(volumes):
        chapter_titles = volume_titles[volume_index]
        for chapter_index, chapter_title in enumerate(chapter_titles, start=1):
            chapter_title = fix_mojibake(chapter_title)
            chapter_slug = slugify(chapter_title)
            url = f"https://www.feynmanlectures.caltech.edu/{volume['roman']}_{chapter_index:02d}.html"
            html = fetch_html(url)
            sections = parse_sections(html)
            if not sections:
                raise RuntimeError(f"No sections found for {url}")
            for _, section_number, section_title in sections:
                section_title = fix_mojibake(section_title)
                section_label = f"{chapter_index}-{section_number}"
                section_slug = slugify(section_title)
                lab_id = (
                    f"v{volume_index + 1}-ch{chapter_index:02d}-"
                    f"s{section_number:02d}-{section_slug}"
                )
                manifest_sections.append(
                    {
                        "id": lab_id,
                        "labId": lab_id,
                        "volumeId": volume["id"],
                        "volumeNumber": volume_index + 1,
                        "chapterIndex": chapter_index,
                        "chapterTitle": chapter_title,
                        "chapterSlug": chapter_slug,
                        "sectionNumber": section_label,
                        "sectionIndex": section_number,
                        "sectionTitle": section_title,
                        "sectionSlug": section_slug,
                        "archetype": None,
                    }
                )
            time.sleep(0.15)
    return {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sections": manifest_sections,
    }


def main() -> None:
    manifest = build_manifest()
    OUT_MANIFEST.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUT_MANIFEST} with {len(manifest['sections'])} sections")


if __name__ == "__main__":
    main()
