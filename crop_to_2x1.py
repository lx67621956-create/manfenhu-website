#!/usr/bin/env python3
"""
Fix existing square images (1024x1024) by cropping to 2:1 aspect ratio.
Since subjects are usually centered in AI-generated images,
crop from top (keep top 50% + middle 50% = 1024x512).
This preserves the top portion (where heads are).
"""
import os
from PIL import Image

IMG_DIR = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\public\images\news'

jpgs = [f for f in os.listdir(IMG_DIR) if f.endswith('.jpg') and f != 'test-api-image.jpg']
print(f'Found {len(jpgs)} JPG images to crop to 2:1\n')

for jpg in sorted(jpgs):
    path = os.path.join(IMG_DIR, jpg)
    img = Image.open(path)
    w, h = img.size
    
    if w == h:
        # Square image: crop to 2:1 by taking top half + middle
        # Actually, crop from top: keep (0, 0, w, w/2) = top half
        # But 2:1 from square means height = w/2
        # Crop from CENTER to preserve subject:
        # top = (h - h/2) / 2 = h/4
        top = h // 4
        crop_h = w // 2  # 2:1 aspect
        cropped = img.crop((0, top, w, top + crop_h))
        cropped.save(path, 'JPEG', quality=88, optimize=True)
        new_size = os.path.getsize(path)
        print(f'  {jpg}: {w}x{h} -> {cropped.size[0]}x{cropped.size[1]} ({new_size//1024}KB)')
    else:
        print(f'  {jpg}: already {w}x{h}, skipping')

print('\nDone. Images now 2:1 aspect ratio.')
