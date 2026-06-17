#!/usr/bin/env python3
"""
Update all .png references to .jpg:
1. index.astro (news list page)
2. All src/pages/news/*.astro (image= prop)
3. Unify CSS for image display (2:1 aspect ratio)
"""
import os, re

YOUTH = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website'
INDEX = os.path.join(YOUTH, 'src', 'pages', 'news', 'index.astro')
LAYOUT = os.path.join(YOUTH, 'src', 'layouts', 'ArticleLayout.astro')

# 1. Update index.astro: /images/news/XXX.png -> /images/news/XXX.jpg
with open(INDEX, 'r', encoding='utf-8') as f:
    content = f.read()

new_content = content.replace('/images/news/', '/images/news/').replace('.png"', '.jpg"').replace('.png"', '.jpg"')
# Actually, let me be more precise:
new_content = re.sub(r'/images/news/([^"]+)\.png', r'/images/news/\1.jpg', content)

with open(INDEX, 'w', encoding='utf-8') as f:
    f.write(new_content)

count = len(re.findall(r'\.jpg', new_content))
print(f'index.astro: updated {count} image references to .jpg')

# 2. Update all news article .astro files: image="/images/news/XXX.png" -> image="/images/news/XXX.jpg"
news_dir = os.path.join(YOUTH, 'src', 'pages', 'news')
for fname in os.listdir(news_dir):
    if not fname.endswith('.astro') or fname == 'index.astro':
        continue
    fpath = os.path.join(news_dir, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '.png' in content:
        new_content = re.sub(r'(image="[^"]+)\.png"', r'\1.jpg"', content)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'  Updated: {fname}')

print('\nDone updating .png -> .jpg references')
