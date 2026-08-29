"""生成 3 张配图，带重试（SUB gpt-image-2 502 时退避重试）"""
import os, sys, time
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
from gen_sub import generate

BASE = r"D:\manfenhu-website\youth-fitness-website\public\images\news"

jobs = [
    ("sit-up-guide", "A Chinese teenage girl doing sit-ups on a yoga mat in a bright indoor gym, knees bent, arms crossed near chest, focused expression, East Asian Chinese, realistic photography, natural light, sports training"),
    ("parallel-bar-dips", "A Chinese teenage boy doing parallel bar dips on parallel bars in a school gym, strong arms, determined look, East Asian Chinese, realistic photography, natural light"),
    ("o-x-legs-guide", "A Chinese primary school child standing barefoot on a white tiled floor, full body legs posture check, bright clean home interior, East Asian Chinese, realistic photography, natural light"),
]

for slug, prompt in jobs:
    out = os.path.join(BASE, f"{slug}.jpg")
    if os.path.exists(out) and os.path.getsize(out) > 50000:
        print(f"{slug}: already exists, skip")
        continue
    ok = False
    for attempt in range(1, 5):
        print(f"== {slug} attempt {attempt} ==")
        try:
            ok = generate(prompt, out)
            if ok:
                break
        except Exception as e:
            print(f"  attempt {attempt} error: {e}")
        time.sleep(8)
    if not ok:
        print("FAILED", slug)
        raise SystemExit(1)
    print("OK", slug)

print("ALL_IMAGES_DONE")