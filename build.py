#!/usr/bin/env python3
"""Build the solunar widget into a deployable WordPress block.

Assembles lib/solunar.js + lib/regions.js + widgets/01-solunar-bite-times/widget.js
into one self-contained Custom-HTML (wp:html) block, wrapped in
<!-- FBF:solunar:start --> ... <!-- FBF:solunar:end --> markers so deploy.py can
upsert it idempotently. The {{REGION}} placeholder is filled per page by deploy.py.

Outputs:
  dist/solunar-bundle.js            the concatenated JS (engine + regions + widget)
  dist/solunar-block.template.html  the full block with a {{REGION}} placeholder

Usage: python3 build.py
"""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)

def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()

def write(rel, content):
    with open(os.path.join(ROOT, rel), 'w', encoding='utf-8') as f:
        f.write(content)

bundle = '\n\n'.join([
    read('lib/solunar.js'),
    read('lib/regions.js'),
    read('widgets/01-solunar-bite-times/widget.js'),
])
write('dist/solunar-bundle.js', bundle)

block = (
    '<!-- FBF:solunar:start -->\n'
    '<!-- wp:html -->\n'
    '<div data-fbf-solunar data-region="{{REGION}}"></div>\n'
    '<script>\n' + bundle + '\n</script>\n'
    '<!-- /wp:html -->\n'
    '<!-- FBF:solunar:end -->'
)
write('dist/solunar-block.template.html', block)

def kb(rel):
    return f'{os.path.getsize(os.path.join(ROOT, rel)) / 1024:.1f} KB'

print('Built:')
print(f'  dist/solunar-bundle.js            {kb("dist/solunar-bundle.js")}')
print(f'  dist/solunar-block.template.html  {kb("dist/solunar-block.template.html")}')
print('\nNext: python3 deploy.py --dry-run   then   python3 deploy.py')
