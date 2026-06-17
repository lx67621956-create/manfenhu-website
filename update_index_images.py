#!/usr/bin/env python3
import re
path = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\src\pages\news\index.astro'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace /images/news/XXX.jpg -> /images/news/XXX-2x1.jpg
new_content = re.sub(r'/images/news/([^"]+)\.jpg', r'/images/news/\1-2x1.jpg', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

count = len(re.findall(r'-2x1\.jpg', new_content))
print(f'Updated {count} image references to -2x1.jpg in index.astro')
