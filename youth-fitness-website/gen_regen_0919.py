# -*- coding: utf-8 -*-
"""2 篇文章封面重新生成 — gen_sub.py (gpt-image-2.5-sunburst)"""
import sys, os, time
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
sys.stdout.reconfigure(encoding="utf-8")
from gen_sub import generate

OUT = r"D:\manfenhu-website\youth-fitness-website\public\images\news"
os.makedirs(OUT, exist_ok=True)

JOBS = [
    ("medicine-ball-throw",
     "Realistic sports photography, an East Asian Chinese teenage boy throwing a heavy medicine ball "
     "on an outdoor school sports field, both arms extended forward and upward, the ball just leaving his hands, "
     "body leaning into the throw with legs driving, red rubber track and blurred school buildings in background, "
     "bright daylight, dynamic action shot, professional sports photo style, no text"),
    ("final-month-push",
     "Realistic sports photography, an East Asian Chinese teenage girl doing sprint training on an outdoor running track, "
     "a young male coach standing at the trackside holding a stopwatch and encouraging her, "
     "sunny daylight, dynamic composition showing focused effort and speed, professional sports photo style, no text"),
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
