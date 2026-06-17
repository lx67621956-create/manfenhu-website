#!/usr/bin/env python3
"""
Fix: restore square JPGs for article pages, create 2:1 cropped JPGs for news list page.
- Article pages: use square images (1024x1024)
- News list page: use 2:1 cropped images (1024x512, top portion)
"""
import os, glob
from PIL import Image

IMG_DIR = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\public\images\news'
SIZE_SQUARE = (1024, 1024)
SIZE_2X1 = (1024, 512)

# 1. Restore square JPGs from original PNGs (for article pages)
print('Restoring square JPGs for article pages...')
pngs = [f for f in os.listdir(IMG_DIR) if f.endswith('.png') and f != 'test-api-image.png']
for png in sorted(pngs):
    slug = png.replace('.png', '')
    png_path = os.path.join(IMG_DIR, png)
    jpg_path = os.path.join(IMG_DIR, slug + '.jpg')
    
    img = Image.open(png_path).convert('RGB')
    img = img.resize(SIZE_SQUARE, Image.LANCZOS)
    img.save(jpg_path, 'JPEG', quality=88, optimize=True)
    size_kb = os.path.getsize(jpg_path) // 1024
    print(f'  {slug}.jpg: {SIZE_SQUARE[0]}x{SIZE_SQUARE[1]} ({size_kb}KB)')

# 2. Create 2:1 cropped JPGs (for news list page)
# Crop from top portion (keep top 50% + middle 25% = top half + middle quarter)
# Actually: for 2:1 from square, we crop height to half, starting from top quarter (h//4)
# This preserves the top portion where heads/subjects usually are.
print('\nCreating 2:1 cropped JPGs for news list page...')
for png in sorted(pngs):
    slug = png.replace('.png', '')
    png_path = os.path.join(IMG_DIR, png)
    cropped_path = os.path.join(IMG_DIR, slug + '-2x1.jpg')
    
    img = Image.open(png_path).convert('RGB')
    w, h = img.size
    # Crop to 2:1 from square: take from h//4 (top quarter) to h//4 + w//2
    top = h // 4
    crop_h = w // 2  # 2:1 aspect
    cropped = img.crop((0, top, w, top + crop_h))
    cropped = cropped.resize(SIZE_2X1, Image.LANCZOS)
    cropped.save(cropped_path, 'JPEG', quality=88, optimize=True)
    size_kb = os.path.getsize(cropped_path) // 1024
    print(f'  {slug}-2x1.jpg: {SIZE_2X1[0]}x{SIZE_2X1[1]} ({size_kb}KB)')

print('\nDone!')
print('  Article pages: /images/news/XXX.jpg (square)')
print('  News list page: /images/news/XXX-2x1.jpg (2:1 cropped)')
