#!/usr/bin/env python3
"""
Regenerate all news images in 2:1 aspect ratio (1792x1024)
to avoid cropping issues when displayed in 2:1 containers.

Uses the same API as before: https://api.sparkadmin.vip/v1/images/generations
Model: gpt-image-2
Size: 1792x1024 (2:1)
"""
import os, json, base64, time, glob
import requests

API_URL = "https://api.sparkadmin.vip/v1/images/generations"
API_KEY = os.environ.get("SPARK_API_KEY", "")
MODEL = "gpt-image-2"
SIZE = "1792x1024"  # 2:1 aspect ratio

IMG_DIR = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\public\images\news'

# Slug -> English prompt mapping (2:1 composition, subject centered/upper portion visible)
PROMPTS = {
    "zhongkao-sprint": "Teenage student in sports training outfit sprinting on running track, dynamic motion, sunny day, photorealistic, horizontal composition",
    "zhongkao-myths": "Collage style illustration showing common sports training mistakes, teenage athletes, educational poster, horizontal composition",
    "science-training-principles": "Teenage athlete performing scientific sports training with coach guidance, modern gym, bright lighting, horizontal composition",
    "exam-psychology-guide": "Confident teenage student breathing calmly before sports test, sports field background, inspiring atmosphere, horizontal composition",
    "student-case-study": "Before and after transformation of teenage athlete, sports training scene, inspiring, horizontal composition",
    "zhongkao-22x4-analysis": "Infographic style illustration of sports exam with multiple event icons, clean design, horizontal composition",
    "qingnian-tiyu-policy": "Teenagers playing sports in school playground, policy document elements, bright and inspiring, horizontal composition",
    "youth-fitness-data": "Data chart and graphics combined with teenagers exercising, infographic style, horizontal composition",
    "youth-injury-prevention-guide": "Teenage athlete stretching and warming up properly, sports injury prevention, bright gym, horizontal composition",
    "youth-pullup-master": "Teenage boy doing pull-up on metal bar, outdoor sports field, action shot, horizontal composition",
    "brain-fitness-study": "Teenage student balancing books and sports equipment, study and athletics, bright classroom, horizontal composition",
    "choose-institution": "Parent and coach discussing training plan in modern sports facility, professional atmosphere, horizontal composition",
    "exam-psychology": "Teenage athlete smiling confidently before competition, supportive coach nearby, sports field, horizontal composition",
    "growth-development": "Teenage boy measuring height, growth chart graphics, bright healthcare style, horizontal composition",
    "international-training": "Teenage athletes training in modern facility with international flags, diverse group, horizontal composition",
    "parent-mistakes": "Parent watching teenager train incorrectly, common mistake illustration, educational style, horizontal composition",
    "posture-correction": "Side-by-side comparison of poor vs correct teenage posture, sports science illustration, horizontal composition",
    "science-youth-training": "Teenage athlete in scientific training session with modern equipment, coach guiding, bright gym, horizontal composition",
    "sports-injury": "Athletic trainer applying sports tape to teenage athlete knee, professional sports medicine, bright clinic, horizontal composition",
    "sports-sensitive-period": "Timeline infographic showing child development stages with sports icons, educational style, horizontal composition",
    "us-sports-education": "American high school sports team training together, coach blowing whistle, outdoor track, horizontal composition",
    "zhongkao-ball": "Teenage student throwing medicine ball in sports field, action shot, bright day, horizontal composition",
    "zhongkao-breathing": "Runner breathing deeply during mid-run, sports field, motion blur, horizontal composition",
    "zhongkao-diet": "Healthy sports meal with water bottle and towel, bright kitchen table, lifestyle photography, horizontal composition",
    "zhongkao-injury-prevention": "Teenage athlete doing proper warm-up exercises, sports field, educational demonstration, horizontal composition",
    "zhongkao-jump": "Teenage student performing standing long jump, action shot, sports field, dynamic motion, horizontal composition",
    "zhongkao-parent-training": "Parent and teenage child doing sports drill together at home, supportive family atmosphere, horizontal composition",
    "zhongkao-pullup": "Teenage boy doing pull-up training with resistance band assistance, outdoor sports area, horizontal composition",
    "zhongkao-running": "Teenage runner on outdoor track, mid-stride action, sunny day, horizontal composition",
    "zhongkao-selection": "Teenage student and coach reviewing sports event options on clipboard, training field, horizontal composition",
    "zhongkao-warmup": "Group of teenagers doing dynamic warm-up exercises before sports training, bright gym, horizontal composition",
    "zhongkao-winter": "Teenage athletes training outdoors in winter clothing, breath visible in cold air, determined expressions, horizontal composition",
}

def gen_image(slug, prompt, outpath, max_retry=3):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "n": 1,
        "size": SIZE,
        "response_format": "b64_json"
    }
    
    for attempt in range(max_retry):
        try:
            print(f'  [{attempt+1}/{max_retry}] Generating {slug}...')
            r = requests.post(API_URL, headers=headers, json=payload, timeout=60)
            if r.status_code == 200:
                data = r.json()
                b64 = data['data'][0]['b64_json']
                img_data = base64.b64decode(b64)
                with open(outpath, 'wb') as f:
                    f.write(img_data)
                size_kb = len(img_data) // 1024
                print(f'  ✅ Saved {size_kb}KB -> {os.path.basename(outpath)}')
                return True
            else:
                print(f'  ❌ HTTP {r.status_code}: {r.text[:200]}')
        except Exception as e:
            print(f'  ❌ Error: {e}')
        if attempt < max_retry - 1:
            wait = 5 * (attempt + 1)
            print(f'  Retrying in {wait}s...')
            time.sleep(wait)
    
    return False

# Main
os.makedirs(IMG_DIR, exist_ok=True)
jpgs = [f for f in os.listdir(IMG_DIR) if f.endswith('.jpg') and f != 'test-api-image.jpg']
print(f'Found {len(jpgs)} existing JPG images to regenerate in 2:1 format\n')

ok = 0
fail = 0
for slug, prompt in PROMPTS.items():
    jpg_path = os.path.join(IMG_DIR, f'{slug}.jpg')
    print(f'Processing: {slug}')
    if gen_image(slug, prompt, jpg_path):
        ok += 1
    else:
        fail += 1
    time.sleep(1)  # Rate limiting

print(f'\nDone: {ok} success, {fail} failed')
