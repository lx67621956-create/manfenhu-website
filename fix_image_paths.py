#!/usr/bin/env python3
"""Fix all Astro frontmatter: quote all values containing hyphens."""
import os, re

ARTICLES_DIR = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\src\pages\news'

new_slugs = ['zhongkao-late-start','zhongkao-hd-cost','zhongkao-online-offline',
             'zhongkao-girls-guide','zhongkao-district']

for slug in new_slugs:
    fpath = os.path.join(ARTICLES_DIR, slug + '.astro')
    if not os.path.exists(fpath):
        print(f'MISSING: {fpath}')
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix image: paths with hyphens (quote them)
    content = re.sub(r'^(image: /images/news/[a-z-]+\.jpg)$', r'\1', content, flags=re.MULTILINE)
    # Actually: if image line has unquoted value with hyphens, quote it
    def quote_image(m):
        line = m.group(0)
        # Already quoted?
        if '"' in line or "'" in line:
            return line
        # Quote the path value
        return re.sub(r'(image: )(/images/news/[a-z-]+\.jpg)$', r'\1"\2"', line)
    content = re.sub(r'^image: /images/news/[a-z-]+\.jpg$', quote_image, content, flags=re.MULTILINE)
    
    if content != original:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed: {slug}.astro')
    else:
        print(f'OK (no hyphens to fix): {slug}.astro')

# Also fix student-case-study if it has issues
case_path = os.path.join(ARTICLES_DIR, 'student-case-study.astro')
if os.path.exists(case_path):
    with open(case_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    # Check line 5
    if len(lines) >= 5:
        print(f'student-case-study line 5: {lines[4]}')

print('Done!')
