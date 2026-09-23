# -*- coding: utf-8 -*-
"""小红书个人主页背景图 v2 — 专业训练课场景, SUB gpt-image-2.5-sunburst, 16:9"""
import sys, os, time
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
sys.stdout.reconfigure(encoding="utf-8")
from gen_sub import generate

OUT = r"C:\Users\lx676\AppData\Local\hermes\profiles\reviewer\cache\scratch"

prompt = (
    "Wide 16:9 banner for a professional youth fitness training coach profile. "
    "A structured outdoor training session on a red running track: a row of East Asian Chinese "
    "middle school students in matching navy training uniforms doing fitness-test drills, one student "
    "mid standing-long-jump takeoff, others waiting in an orderly line, while a professional male coach "
    "in coaching attire holding a stopwatch gives instructions. "
    "Bright clear daylight, clean and organized composition, subtle warm orange brand accents, "
    "crisp professional sports photography, credible disciplined atmosphere. "
    "Group on the left, clean empty space on the right for text overlay. No text, no watermark."
)
out = os.path.join(OUT, "xhs_profile_bg_v2.jpg")
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
