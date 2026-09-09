"""Run in an environment with fontTools and brotli, passing the licensed full TTF."""
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset

source = Path(sys.argv[1])
corpus_files = [
    'src/components/nosigner/home.tsx',
    'src/content/adelva-navigation.ts',
    'src/content/nosigner/home.json',
]
text = ''.join(Path(p).read_text() for p in corpus_files)
text += ''.join(chr(i) for i in range(32, 127))
asset = Path('public/fonts/adelva-noto-sans-jp.woff2')
previous = set(TTFont(asset).getBestCmap())
font = TTFont(source)
options = subset.Options()
options.flavor = 'woff2'
options.layout_features = ['*']
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=(previous | set(map(ord, text))) & set(font.getBestCmap()))
subsetter.subset(font)
font.flavor = 'woff2'
font.save(asset)
assert previous <= set(TTFont(asset).getBestCmap())
print({'previous': len(previous), 'current': len(font.getBestCmap()), 'bytes': asset.stat().st_size})
