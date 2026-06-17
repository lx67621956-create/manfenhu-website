#!/usr/bin/env python3
"""
Compress all news images:
- Resize to max 1200px width (keep aspect ratio)
- Convert to JPEG at quality 85
- Target: ~100-200KB per image
- Output as .jpg, update references from .png to .jpg
"""
import os, glob, subprocess, sys

IMG_DIR = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\public\images\news'
QUALITY = 85
MAX_WIDTH = 1200

# Check if ImageMagick or Pillow is available
try:
    from PIL import Image
    HAS_PIL = True
    print('Using Pillow')
except ImportError:
    HAS_PIL = False
    print('Pillow not available, trying ImageMagick...')
    # Check for magick
    r = subprocess.run(['magick', '-version'], capture_output=True)
    if r.returncode == 0:
        HAS_MAGICK = True
        print('Using ImageMagick')
    else:
        HAS_MAGICK = False
        print('ERROR: Need Pillow or ImageMagick')
        sys.exit(1)

def compress_with_pil(inpath, outpath):
    img = Image.open(inpath)
    # Resize if too wide
    w, h = img.size
    if w > MAX_WIDTH:
        ratio = MAX_WIDTH / w
        new_h = int(h * ratio)
        img = img.resize((MAX_WIDTH, new_h), Image.LANCZOS)
    # Convert to RGB (in case of RGBA)
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    img.save(outpath, 'JPEG', quality=QUALITY, optimize=True)
    size = os.path.getsize(outpath)
    print(f'  {os.path.basename(outpath)}: {size//1024}KB (from {w}x{h})')
    return size

def compress_with_magick(inpath, outpath):
    cmd = [
        'magick', inpath,
        '-resize', f'{MAX_WIDTH}x>',
        '-quality', str(QUALITY),
        outpath
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f'  ERROR: {r.stderr}')
        return 0
    size = os.path.getsize(outpath)
    print(f'  {os.path.basename(outpath)}: {size//1024}KB')
    return size

# Process all PNGs
pngs = [f for f in os.listdir(IMG_DIR) if f.endswith('.png') and f != 'test-api-image.png']
print(f'Found {len(pngs)} PNG images to compress\n')

sizes = []
for png in sorted(pngs):
    inpath = os.path.join(IMG_DIR, png)
    jpg = png.replace('.png', '.jpg')
    outpath = os.path.join(IMG_DIR, jpg)
    
    print(f'Processing: {png}')
    if HAS_PIL:
        sz = compress_with_pil(inpath, outpath)
    else:
        sz = compress_with_magick(inpath, outpath)
    sizes.append(sz)

print(f'\nDone: {len(sizes)} images compressed')
print(f'Total size: {sum(sizes)//1024}KB')
print(f'Average: {sum(sizes)//len(sizes)//1024}KB')
