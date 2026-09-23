# -*- coding: utf-8 -*-
"""小红书个人主页背景图 — SUB gpt-image-2.5-sunburst, 16:9"""
import sys, os, time
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
sys.stdout.reconfigure(encoding="utf-8")
from gen_sub import generate

OUT = r"C:\Users\lx676\AppData\Local\hermes\profiles\reviewer\cache\scratch"
os.makedirs(OUT, exist_ok=True)

prompt = (
    "Wide 16:9 sports banner for a youth fitness coach profile page. "
    "An East Asian Chinese teenage athlete sprinting on an outdoor running track, "
    "dynamic mid-stride pose with motion blur, shot from a low angle. "
    "Warm vibrant orange sunset light (#FF6B35 tones), orange-red track, glowing rim light, "
    "clean sky in the upper area with plenty of empty space for text overlay. "
    "Energetic, professional sports photography style, cinematic, no text, no watermark."
)
out = os.path.join(OUT, "xhs_profile_bg.jpg")
for attempt in range(1, 4):
    print(f"=== attempt {attempt} ===", flush=True)
    try:
        if generate(prompt, out, size="1792x1024", quality="high"):
            print("[RESULT] OK", flush=True)
            break
    except Exception as e:
        print(f"[FAIL] {e}", flush=True)
        time.sleep(6)
print("ALL DONE", flush=True)
