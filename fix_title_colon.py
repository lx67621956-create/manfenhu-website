#!/usr/bin/env python3
import os, re

ARTICLES_DIR = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\src\pages\news'
new_slugs = ['beijing-district-diff','zhongkao-girls-guide','zhongkao-online-offline','zhongkao-hd-cost','zhongkao-late-start']

for slug in new_slugs:
    fpath = os.path.join(ARTICLES_DIR, slug + '.astro')
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix title: missing colon before quote
    new_content = content.replace('title"北京', 'title: "北京')
    new_content = new_content.replace('title"女生', 'title: "女生')
    new_content = new_content.replace('title"中考体育线上课', 'title: "中考体育线上课')
    new_content = new_content.replace('title"北京中考体育培训', 'title: "北京中考体育培训')
    new_content = new_content.replace('title"中考体育什么时候', 'title: "中考体育什么时候')
    
    if new_content != content:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Fixed: {slug}.astro')
    else:
        print(f'OK: {slug}.astro')

# Verify
with open(os.path.join(ARTICLES_DIR, 'beijing-district-diff.astro'), 'r') as f:
    print('\nVerify beijing-district-diff.astro frontmatter:')
    for i, line in enumerate(f):
        if i < 5:
            print(f'  {i+1}: {line}', end='')
print('\nDone!')
