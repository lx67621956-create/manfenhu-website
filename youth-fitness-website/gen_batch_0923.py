# -*- coding: utf-8 -*-
"""3 篇新文章封面批量生成 (2026-09-23) — gen_sub.py gpt-image-2.5-sunburst"""
import sys, os, time
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
sys.stdout.reconfigure(encoding="utf-8")
from gen_sub import generate

OUT = r"D:\manfenhu-website\youth-fitness-website\public\images\news"
os.makedirs(OUT, exist_ok=True)

JOBS = [
    ("lung-capacity-training",
     "Realistic sports photography, an East Asian Chinese teenage boy in sportswear standing on an "
     "outdoor running track taking a deep recovery breath after running, chest expanded, one hand "
     "resting on his lower ribs, eyes closed, morning sunlight, red track and green field blurred behind, "
     "healthy energetic atmosphere, professional sports photo style, no text"),
    ("pullup-grip-training",
     "Realistic sports photography, close-up of an East Asian Chinese teenage boy's hands gripping a "
     "horizontal pull-up bar in a bright indoor training gym, forearms engaged and muscles tensed, "
     "body hanging mid pull-up, shallow depth of field, gym equipment softly blurred in background, "
     "warm natural light, professional sports photo style, no text"),
    ("fitness-report-guide",
     "Realistic photography, a professional male coach in coaching attire holding a clipboard angled "
     "away from camera so its contents are not visible, explaining training results to a parent beside "
     "him in a bright modern indoor training facility, both East Asian Chinese, students training "
     "softly blurred in background, warm friendly conversation, professional sports photo style, no text, "
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
