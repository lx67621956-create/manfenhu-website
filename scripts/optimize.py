"""Optimize generated UI images"""
from PIL import Image
import os

DIR = "C:/Users/lx676/manfenhu-website/youth-fitness-website/public/images/ui"

sizes = {
    'pokeball.png': (256, 256),
    'arena_bg.png': (1024, 768),
    'trophy.png': (256, 256),
    'star.png': (256, 256),
}

for fname, new_size in sizes.items():
    path = os.path.join(DIR, fname)
    if not os.path.exists(path):
        print(f"{fname}: not found")
        continue
    old_kb = os.path.getsize(path) / 1024
    img = Image.open(path)
    img = img.resize(new_size, Image.LANCZOS)
    if fname == 'arena_bg.png':
        img = img.convert('RGB')
        img.save(path, 'JPEG', quality=85, optimize=True)
    else:
        if img.mode == 'RGBA':
            img = img.convert('P', palette=Image.ADAPTIVE, colors=128)
            img.save(path, 'PNG', optimize=True)
        else:
            img.save(path, 'PNG', optimize=True)
    new_kb = os.path.getsize(path) / 1024
    print(f"{fname}: {old_kb:.0f}KB -> {new_kb:.0f}KB")
