"""Preserve all current cmap entries; add only DX copy's missing glyphs.
Uses the same source-revision check as extend-approach-fonts.py. No change
when coverage is already complete. Run with uv, fonttools and brotli.
"""
import json
import sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

corpus = [Path("src/content/adelva-dx-it-procurement.ts"), Path("src/content/adelva-navigation.ts"), Path("src/content/adelva-management-operations.ts")]
text = "".join(p.read_text() for p in corpus)
wanted = {ord(c) for c in text if not c.isspace() and (ord(c) < 127 or 0x3000 <= ord(c) <= 0x9fff)}
results = []
for name, source_path in zip(["sans", "serif"], sys.argv[1:]):
    path = Path(f"public/fonts/adelva-noto-{name}-jp.woff2")
    existing = TTFont(path)
    previous = set(existing.getBestCmap())
    source = TTFont(source_path)
    supported = set(source.getBestCmap())
    missing = wanted & supported - previous
    if missing:
        assert existing["head"].fontRevision == source["head"].fontRevision
        options = subset.Options()
        options.flavor = "woff2"
        options.layout_features = ["*"]
        sub = subset.Subsetter(options=options)
        sub.populate(unicodes=previous | (wanted & supported))
        sub.subset(source)
        source.flavor = "woff2"
        source.save(path)
    current = set(TTFont(path).getBestCmap())
    assert previous <= current
    results.append({"font": str(path), "previous": len(previous), "current": len(current), "lost": sorted(previous-current), "added": "".join(chr(c) for c in sorted(current-previous)), "complete": wanted & supported <= current})
report = Path("docs/reports/adelva-dx-it-procurement-2026-09-28/fonts.json")
report.write_text(json.dumps(results,ensure_ascii=False,indent=2)+"\n")
print(report.read_text())
