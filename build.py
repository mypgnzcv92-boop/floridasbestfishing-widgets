#!/usr/bin/env python3
"""Build the solunar widget for deployment.

WHY a loader (not an inline block): WordPress's content formatter garbles inline
<script> that builds HTML strings (it reads '<div>' etc. as real tags). So we host
the bundle on GitHub -> jsDelivr and each page only gets a tiny, un-garble-able
loader: a placeholder <div> + a <script src>.

Outputs:
  dist/solunar-bundle.js            the concatenated engine+widget (served by jsDelivr)
  dist/solunar-block.template.html  the per-page loader, {{REGION}} filled by deploy.py

After editing lib/ or widget.js: run this, commit, push (so jsDelivr updates),
then run deploy.py. For an immediate jsDelivr refresh of @main, purge:
  https://purge.jsdelivr.net/gh/mypgnzcv92-boop/floridasbestfishing-widgets@main/dist/solunar-bundle.js

Usage: python3 build.py
"""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)

# jsDelivr URL for the hosted bundle (public GitHub repo)
JSDELIVR = ('https://cdn.jsdelivr.net/gh/mypgnzcv92-boop/'
            'floridasbestfishing-widgets@main/dist/solunar-bundle.js')

def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()

def write(rel, content):
    with open(os.path.join(ROOT, rel), 'w', encoding='utf-8') as f:
        f.write(content)

# 1) the bundle jsDelivr serves
bundle = '\n\n'.join([
    read('lib/solunar.js'),
    read('lib/regions.js'),
    read('widgets/01-solunar-bite-times/widget.js'),
])
write('dist/solunar-bundle.js', bundle)

# 2) the lightweight per-page loader (NO inline JS to garble)
block = (
    '<!-- FBF:solunar:start -->\n'
    '<!-- wp:html -->\n'
    '<div data-fbf-solunar data-region="{{REGION}}"></div>\n'
    '<script src="' + JSDELIVR + '" defer></script>\n'
    '<!-- /wp:html -->\n'
    '<!-- FBF:solunar:end -->'
)
write('dist/solunar-block.template.html', block)

def kb(rel):
    return f'{os.path.getsize(os.path.join(ROOT, rel)) / 1024:.1f} KB'

print('Built:')
print(f'  dist/solunar-bundle.js            {kb("dist/solunar-bundle.js")}   (-> commit+push for jsDelivr)')
print(f'  dist/solunar-block.template.html  loader, {os.path.getsize(os.path.join(ROOT, "dist/solunar-block.template.html"))} bytes')
print('\nNext: python3 deploy.py --dry-run   then   python3 deploy.py')
