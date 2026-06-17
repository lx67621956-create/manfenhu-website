#!/usr/bin/env python3
"""
Recrop 2:1 images - FIXED: keep TOP portion (where heads are)
Previous version cropped from h//4, which DISCARDED the top portion (heads)!
"""
import os
from PIL import Image

IMG_DIR = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\public\images\news'

pngs = [f for f in os.listdir(IMG_DIR) if f.endswith('.png') and f != 'test-api-image.png']
print(f'Recropping {len(pngs)} images (keep TOP 512px)...\n')

for png in sorted(pngs):
    slug = png.replace('.png', '')
    png_path = os.path.join(IMG_DIR, png)
    out_path = os.path.join(IMG_DIR, slug + '-2x1.jpg')
    
    img = Image.open(png_path).convert('RGB')
    w, h = img.size  # 1024x1024
    
    # FIXED: Keep TOP portion (0 to 512)
    # Previous bug: cropped from h//4 (256) to h//4 + 512 (768) = DISCARDED top 256px!
    cropped = img.crop((0, 0, w, 512))  # Keep top 512px
    cropped.save(out_path, 'JPEG', quality=88, optimize=True)
    
    size_kb = os.path.getsize(out_path) // 1024
    print(f'  {slug}-2x1.jpg: 1024x512 ({size_kb}KB) [KEPT TOP]')

print('\nDone! Now heads are in the images.')
