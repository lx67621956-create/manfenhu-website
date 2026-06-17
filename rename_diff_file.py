#!/usr/bin/env python3
import os

BASE = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website'
old_slug = 'beijing-district-diff'
new_slug = 'zhongkao-district'

# Rename article file
old_file = os.path.join(BASE, 'src', 'pages', 'news', f'{old_slug}.astro')
new_file = os.path.join(BASE, 'src', 'pages', 'news', f'{new_slug}.astro')
if os.path.exists(old_file):
    os.rename(old_file, new_file)
    print(f'Renamed: {old_slug}.astro -> {new_slug}.astro')

# Rename image file (jpg)
old_img = os.path.join(BASE, 'public', 'images', 'news', f'{old_slug}.jpg')
new_img = os.path.join(BASE, 'public', 'images', 'news', f'{new_slug}.jpg')
if os.path.exists(old_img):
    os.rename(old_img, new_img)
    print(f'Renamed: {old_slug}.jpg -> {new_slug}.jpg')

# Update index.astro references
idx_path = os.path.join(BASE, 'src', 'pages', 'news', 'index.astro')
with open(idx_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace(f'/news/{old_slug}"', f'/news/{new_slug}"')
content = content.replace(f'{old_slug}.jpg', f'{new_slug}.jpg')
with open(idx_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated index.astro')

# Update self-reference in article file
with open(new_file, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace(f'/{old_slug}.jpg', f'/{new_slug}.jpg')
content = content.replace(f'/news/{old_slug}"', f'/news/{new_slug}"')
with open(new_file, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Updated {new_slug}.astro internal references')

print('All done!')
