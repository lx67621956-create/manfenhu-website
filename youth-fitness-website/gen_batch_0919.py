# -*- coding: utf-8 -*-
"""3 篇新文章封面批量生成 — gen_sub.py (gpt-image-2.5-sunburst)"""
import sys, os, time
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
sys.stdout.reconfigure(encoding="utf-8")
from gen_sub import generate

OUT = r"D:\manfenhu-website\youth-fitness-website\public\images\news"
os.makedirs(OUT, exist_ok=True)

JOBS = [
    ("run-pace-strategy",
     "Realistic sports photography, wide shot of an outdoor running track, "
     "a group of East Asian Chinese middle school students in sportswear running a middle-distance race, "
     "one focused teenage boy in the foreground mid-stride, blurred runners behind him, "
     "bright daylight, dynamic composition, professional sports photo style, no text"),
    ("strength-training-height-myth",
     "Realistic sports photography, an East Asian Chinese teenage boy doing bodyweight squat training "
     "under the guidance of a young male coach in a bright modern indoor training gym, "
     "coach gesturing to correct his posture, fitness equipment softly blurred in background, "
     "warm natural light, professional sports photo style, no text"),
    ("jump-rope-exam-rope",
     "Realistic sports photography, close-up of an East Asian Chinese middle school girl jumping rope "
     "in an indoor school gymnasium, the rope blurred in motion above her head, "
     "focused expression, feet just off the ground, wooden gym floor, bright even lighting, "
     "professional sports photo style, no text"),
]

for slug, prompt in JOBS:
    out = os.path.join(OUT, slug + ".jpg")
    ok = False
    for attempt in range(1, 4):
        print(f"=== {slug} attempt {attempt} ===", flush=True)
        try:
            if generate(prompt, out, size="1024x1024", quality="high"):
                ok = True
                break
        except Exception as e:
            print(f"[FAIL] {slug}: {e}", flush=True)
            time.sleep(6)
    print(f"[RESULT] {slug}: {'OK' if ok else 'FAILED'}", flush=True)

print("ALL DONE", flush=True)
