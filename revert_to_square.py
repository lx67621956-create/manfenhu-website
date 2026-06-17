#!/usr/bin/env python3
"""Revert index.astro image references from -2x1.jpg back to .jpg (square images)
Let CSS object-position: top handle the display."""
import re
path = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\src\pages\news\index.astro'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Revert /images/news/XXX-2x1.jpg -> /images/news/XXX.jpg
new_content = re.sub(r'/images/news/([^"]+)-2x1\.jpg', r'/images/news/\1.jpg', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

count = len(re.findall(r'/images/news/[^"]+\.jpg', new_content))
print(f'Reverted to square images. Found {count} image references.')
