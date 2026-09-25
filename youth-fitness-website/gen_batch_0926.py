# -*- coding: utf-8 -*-
"""3 篇新文章封面批量生成 (2026-09-26) — gen_sub.py gpt-image-2.5-sunburst"""
import sys, os, time
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
sys.stdout.reconfigure(encoding="utf-8")
from gen_sub import generate

OUT = r"D:\manfenhu-website\youth-fitness-website\public\images\news"
os.makedirs(OUT, exist_ok=True)

JOBS = [
    ("multi-event-test-order",
     "Realistic sports photography, an East Asian Chinese teenage girl in sportswear resting on a bench "
     "at the edge of an outdoor school running track between events, holding a stopwatch and a water bottle, "
     "catching her breath, several other students waiting in line behind her, bright daylight, "
     "organized competitive sports meet atmosphere, professional sports photo style, no text"),
    ("parent-school-sports-coordination",
     "Realistic photography, a male Chinese middle school PE teacher in a tracksuit standing on an outdoor "
     "school sports field talking with a parent, both smiling and gesturing, other students training blurred "
     "in the background, warm daylight, friendly professional communication moment, professional photo style, "
     "no text, no readable writing anywhere"),
    ("training-vs-homework",
     "Realistic lifestyle photography, an East Asian Chinese teenage boy at a simple home desk in the evening "
     "doing homework in an open notebook, beside the desk a school sports bag and a jump rope, warm desk lamp "
     "light, calm focused atmosphere, soft evening indoor light, professional photo style, no text, "
     "no readable writing anywhere"),
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
