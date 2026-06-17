"""图片后处理脚本：所有AI生图→"手机随手拍"质感
用法: python scripts/image_fixer.py [路径]
不传路径则处理 public/images/ 下所有 JPG
"""

from PIL import Image, ImageFilter, ImageEnhance
import numpy as np, os, sys

BASE = os.path.join(os.path.dirname(__file__), '..', 'public', 'images')

def process_image(path, dry_run=False):
    """给单张图片加活人感"""
    img = Image.open(path)
    # 1) 高斯模糊 — 去AI锐利感
    img = img.filter(ImageFilter.GaussianBlur(radius=0.7))
    # 2) 降锐度
    img = ImageEnhance.Sharpness(img).enhance(0.6)
    # 3) 降对比度
    img = ImageEnhance.Contrast(img).enhance(0.92)
    # 4) 胶片颗粒
    arr = np.array(img).astype(np.float32)
    noise = np.random.normal(0, 5, arr.shape)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(arr)
    # 5) 降饱和度
    img = ImageEnhance.Color(img).enhance(0.88)
    
    if not dry_run:
        img.save(path, 'JPEG', quality=82)
    return os.path.getsize(path)

def main(target=None):
    if target and os.path.isfile(target):
        files = [target]
    else:
        root = target or BASE
        files = []
        for r, _, fs in os.walk(root):
            for f in fs:
                if f.lower().endswith('.jpg'):
                    files.append(os.path.join(r, f))
    
    total_before = total_after = 0
    for f in sorted(files):
        sz = os.path.getsize(f)
        total_before += sz
        new_sz = process_image(f)
        total_after += new_sz
        rel = os.path.relpath(f, BASE if not target else os.path.dirname(target))
        print(f'{rel}: {sz//1024}KB → {new_sz//1024}KB')
    
    print(f'\nTotal: {total_before//1024}KB → {total_after//1024}KB')
    print(f'Saved: {(total_before - total_after)//1024}KB')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
