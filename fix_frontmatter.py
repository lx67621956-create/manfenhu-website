#!/usr/bin/env python3
import os, re

ARTICLES_DIR = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\src\pages\news'
new_slugs = ['beijing-district-diff','zhongkao-girls-guide','zhongkao-online-offline','zhongkao-hd-cost','zhongkao-late-start']
for slug in new_slugs:
    fpath = os.path.join(ARTICLES_DIR, slug + '.astro')
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    # Add quotes around description value if not already quoted
    def fix_desc(m):
        val = m.group(1)
        if val.startswith('"'):
            return m.group(0)
        return f'description: "{val}"'
    new_content = re.sub(r'^description: (.+)$', fix_desc, content, flags=re.MULTILINE)
    if new_content != content:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Fixed: {slug}.astro')
    else:
        print(f'OK (no change): {slug}.astro')
print('Done!')
