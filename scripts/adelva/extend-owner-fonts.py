"""Extend the ADELVA Noto JP subsets with the /challenges/owner corpus.

Run with fontTools and brotli (for example `uv run --no-project --with fonttools
--with brotli python scripts/adelva/extend-owner-fonts.py
NotoSansJP[wght].ttf NotoSerifJP[wght].ttf`), passing the licensed full variable
fonts from google/fonts (ofl/notosansjp, ofl/notoserifjp). Every existing cmap
entry is kept; the source version must match the one the subsets came from.
"""

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

CORPUS = [
    "src/content/adelva-owner.ts",
    "src/content/adelva-navigation.ts",
    *sorted(str(p) for p in Path("src/components/owner").glob("*.tsx")),
]
TARGETS = {
    "public/fonts/adelva-noto-sans-jp.woff2": sys.argv[1],
    "public/fonts/adelva-noto-serif-jp.woff2": sys.argv[2],
}

text = "".join(Path(p).read_text() for p in CORPUS)
wanted = {ord(c) for c in text if not c.isspace()} | set(range(32, 127))

for asset_path, source_path in TARGETS.items():
    asset = Path(asset_path)
    existing = TTFont(asset)
    previous = set(existing.getBestCmap())
    source = TTFont(source_path)
    if existing["head"].fontRevision != source["head"].fontRevision:
        raise SystemExit(f"{asset}: source revision differs; refusing to re-subset")
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=(previous | wanted) & set(source.getBestCmap()))
    subsetter.subset(source)
    source.flavor = "woff2"
    source.save(asset)
    current = set(TTFont(asset).getBestCmap())
    assert previous <= current, f"{asset}: lost codepoints"
    print(
        {
            "font": asset_path,
            "previous": len(previous),
            "current": len(current),
            "added": "".join(sorted(chr(c) for c in current - previous)),
            "bytes": asset.stat().st_size,
        }
    )
