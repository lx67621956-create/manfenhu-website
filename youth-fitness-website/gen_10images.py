import requests, json, base64, os, sys
from PIL import Image
import io

API_URL = 'https://aiapi.up.railway.app/v1/images/generations'
API_KEY = 'REDACTED_IMG_API_KEY'

# 10 articles with their prompts
articles = [
    {
        'slug': 'japan-youth-sports',
        'prompt': 'Japanese and Chinese middle school students playing team sports together on a school field, afternoon natural light, candid documentary photo style, slight grain, motion blur, East Asian faces, friendly atmosphere, no logos no school uniforms visible',
    },
    {
        'slug': 'spine-health',
        'prompt': 'Chinese teenager doing spine stretching exercise at home, standing side stretch with arms raised, natural indoor light from window, candid wellness photo, slight motion blur, warm tones, East Asian face',
    },
    {
        'slug': 'exam-anxiety',
        'prompt': 'Chinese teenage girl doing breathing exercise before sports test, standing on school track with eyes closed and hands on chest, morning golden hour light, candid photo, slight grain and motion blur, calm focused expression, East Asian face',
    },
    {
        'slug': 'sleep-performance',
        'prompt': 'Chinese teenager peacefully sleeping in bed with sports equipment and running shoes nearby on floor, soft morning light through curtains, candid lifestyle photo, warm muted tones, slight grain, cozy atmosphere',
    },
    {
        'slug': 'home-training',
        'prompt': 'Chinese teenage boy doing push-ups at home living room with yoga mat, parents watching encouragingly from sofa, natural indoor light, candid family photo, slight motion blur, warm tones, East Asian faces',
    },
    {
        'slug': 'zhongkao-yearly-plan',
        'prompt': 'Chinese middle school students training on school track across three seasons - spring morning run, summer sprint, autumn endurance, collage style natural candid photos, slight grain and motion blur, East Asian faces',
    },
    {
        'slug': 'parent-mistakes-2',
        'prompt': 'Chinese parent watching teenager train on school field with concerned expression, coach demonstrating proper technique nearby, afternoon natural light, candid photo, slight grain, East Asian faces, no logos',
    },
    {
        'slug': 'beijing-district-compare',
        'prompt': 'Map of Beijing districts overlaid with Chinese teenagers running on different school tracks, document style comparison layout, natural candid photo feel, slight grain, East Asian faces',
    },
    {
        'slug': 'exam-performance-tips',
        'prompt': 'Chinese teenager doing pre-exam warmup stretches on school sports field, morning golden hour light, confident focused expression, candid documentary photo, slight motion blur and grain, East Asian face',
    },
    {
        'slug': 'nutrition-guide',
        'prompt': 'Healthy Chinese meal prep scene with rice vegetables eggs and milk next to running shoes and water bottle on wooden table, natural morning light, candid lifestyle photo, warm muted tones, slight grain',
    },
]

OUT_DIR = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\public\images\news'

headers = {
    'Authorization': 'Bearer ' + API_KEY,
    'Content-Type': 'application/json'
}

success = 0
fail = 0

for i, art in enumerate(articles):
    slug = art['slug']
    prompt = art['prompt']
    out_path = os.path.join(OUT_DIR, f'{slug}.jpg')

    print(f'[{i+1}/10] Generating: {slug}...')

    payload = {
        'model': 'gpt-image-2',
        'prompt': prompt,
        'n': 1,
        'size': '1024x1024',
        'response_format': 'b64_json'
    }

    try:
        resp = requests.post(API_URL, json=payload, headers=headers, timeout=120)
        if resp.status_code != 200:
            print(f'  FAIL: HTTP {resp.status_code}')
            fail += 1
            continue

        data = resp.json()
        if 'data' not in data or len(data['data']) == 0:
            print(f'  FAIL: No data in response')
            fail += 1
            continue

        item = data['data'][0]
        if 'b64_json' in item:
            img_bytes = base64.b64decode(item['b64_json'])
            img = Image.open(io.BytesIO(img_bytes))

            # Apply "活人感" filter: slight blur, reduce sharpness, warm tones
            from PIL import ImageFilter
            img = img.filter(ImageFilter.GaussianBlur(radius=1.0))

            # Resize to max 1200px wide
            if img.width > 1200:
                ratio = 1200 / img.width
                img = img.resize((1200, int(img.height * ratio)), Image.LANCZOS)

            # Save as JPG 85% quality
            img.save(out_path, 'JPEG', quality=85)
            print(f'  OK! Saved to {out_path} ({os.path.getsize(out_path)//1024}KB)')
            success += 1
        elif 'url' in item:
            img_resp = requests.get(item['url'], timeout=60)
            img = Image.open(io.BytesIO(img_resp.content))
            img = img.filter(ImageFilter.GaussianBlur(radius=1.0))
            if img.width > 1200:
                ratio = 1200 / img.width
                img = img.resize((1200, int(img.height * ratio)), Image.LANCZOS)
            img.save(out_path, 'JPEG', quality=85)
            print(f'  OK! Saved from URL ({os.path.getsize(out_path)//1024}KB)')
            success += 1
        else:
            print(f'  FAIL: No b64_json or url in response')
            fail += 1

    except Exception as e:
        print(f'  ERROR: {e}')
        fail += 1

print(f'\nDone! Success: {success}, Fail: {fail}')