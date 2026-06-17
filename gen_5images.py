#!/usr/bin/env python3
"""Generate images for 5 new articles."""
import os, time

API = "https://api.sparkadmin.vip/v1/images/generations"
API_KEY = "sk-test-key-placeholder"
IMG_DIR = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\public\images\news'

articles = [
    ("zhongkao-late-start", "Chinese teenage girl doing stretching exercises in bright gym, focused expression, modern sportswear, natural lighting"),
    ("zhongkao-hd-cost", "Asian mother and teenage son looking at price list at sports training center, consultation desk, professional atmosphere"),
    ("zhongkao-online-offline", "Teenage boy following online fitness video on tablet at home, also showing professional coach teaching in background, comparison"),
    ("zhongkao-girls-guide", "Group of active teenage Chinese girls in sports uniforms doing warm-up exercises together, sunny outdoor track, team spirit"),
    ("beijing-district-diff", "Beijing city map with markers showing different districts, silhouette of students running, educational context, clean modern style"),
]

for slug, prompt in articles:
    out_path = os.path.join(IMG_DIR, f"{slug}.png")
    if os.path.exists(out_path):
        print(f"Skip {slug} (already exists)")
        continue
    print(f"Generating {slug}...")
    import urllib.request, json
    data = json.dumps({
        "model": "gpt-image-2",
        "prompt": prompt,
        "n": 1,
        "size": "1024x1024"
    }).encode()
    req = urllib.request.Request(API, data=data, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
            img_data = result["data"][0]["b64_json"]
        from PIL import Image
        import base64, io
        img = Image.open(io.BytesIO(base64.b64decode(img_data)))
        img.save(out_path, "PNG")
        size_kb = os.path.getsize(out_path) // 1024
        print(f"  {slug}.png: {img.size} ({size_kb}KB) saved")
    except Exception as e:
        print(f"  Error: {e}")
    time.sleep(2)

print("Done!")
