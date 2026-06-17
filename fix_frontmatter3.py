#!/usr/bin/env python3
import os, re

ARTICLES_DIR = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\src\pages\news'
new_slugs = ['beijing-district-diff','zhongkao-girls-guide','zhongkao-online-offline','zhongkao-hd-cost','zhongkao-late-start']

for slug in new_slugs:
    fpath = os.path.join(ARTICLES_DIR, slug + '.astro')
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    def add_quotes(m):
        key = m.group(1)  # title or description
        val = m.group(2)  # the value
        if val.startswith('"') or val.startswith("'"):
            return m.group(0)  # already quoted
        return f'{key}: "{val}"'  # add quotes
    
    new_content = re.sub(r'^(title|description): (.+)$', add_quotes, content, flags=re.MULTILINE)
    
    if new_content != content:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Fixed: {slug}.astro')
    else:
        print(f'OK: {slug}.astro')

print('Done!')
