#!/usr/bin/env python3
"""Build all FBF widgets into deployable bundles + loaders.

WHY loaders (not inline blocks): WordPress garbles inline <script> that builds
HTML strings (it reads '<div>' etc. as real tags). So each widget's JS is hosted
on GitHub -> jsDelivr, and each page gets only a tiny loader: a placeholder <div>
+ a <script src>. The loader has no inline code to mangle.

For each widget: dist/<key>-bundle.js (served by jsDelivr) + dist/<key>-block.template.html
(the per-page loader, with a placeholder for deploy.py to fill).

After editing lib/ or a widget.js: run this, COMMIT + PUSH (so jsDelivr serves the
new bundle; purge https://purge.jsdelivr.net/gh/<repo>@main/dist/<key>-bundle.js for
an instant refresh), then run deploy.py.

Usage: python3 build.py [key ...]   (default: all)
"""
import os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
JSD = 'https://cdn.jsdelivr.net/gh/mypgnzcv92-boop/floridasbestfishing-widgets@main/dist/'

WIDGETS = {
    'solunar': {
        'marker': 'solunar',
        'libs': ['lib/solunar.js', 'lib/regions.js'],
        'widget': 'widgets/01-solunar-bite-times/widget.js',
        'mount': '<div data-fbf-solunar data-region="{{REGION}}"></div>',
    },
    'whatsthrow': {
        'marker': 'throw',
        'libs': ['lib/affiliate.js'],
        'widget': 'widgets/02-what-should-i-throw/widget.js',
        'mount': '<div data-fbf-throw data-species="{{SPECIES}}"></div>',
    },
}

def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()

def write(rel, content):
    with open(os.path.join(ROOT, rel), 'w', encoding='utf-8') as f:
        f.write(content)

def build(key):
    w = WIDGETS[key]
    bundle = '\n\n'.join([read(p) for p in w['libs']] + [read(w['widget'])])
    write('dist/' + key + '-bundle.js', bundle)
    block = (
        '<!-- FBF:' + w['marker'] + ':start -->\n'
        '<!-- wp:html -->\n'
        + w['mount'] + '\n'
        '<script src="' + JSD + key + '-bundle.js" defer></script>\n'
        '<!-- /wp:html -->\n'
        '<!-- FBF:' + w['marker'] + ':end -->'
    )
    write('dist/' + key + '-block.template.html', block)
    kb = os.path.getsize(os.path.join(ROOT, 'dist/' + key + '-bundle.js')) / 1024
    print('  ' + key + ': dist/' + key + '-bundle.js (%.1f KB) + loader' % kb)

if __name__ == '__main__':
    keys = [k for k in sys.argv[1:]] or list(WIDGETS)
    print('Built:')
    for k in keys:
        if k not in WIDGETS:
            sys.exit('unknown widget: ' + k)
        build(k)
    print('\nNext: commit + push (jsDelivr), then python3 deploy.py')
