import requests, base64, os, time, io

API_URL = 'https://aiapi.up.railway.app/v1/images/generations'
API_KEY = 'REDACTED_IMG_API_KEY'

prompts = [
    ('students-running', 'Photo of Chinese teenagers running on a school track field, athletic training, sunny day, sports clothing, dynamic action shot, realistic photography, 4k'),
    ('students-jump-rope', 'Photo of a Chinese middle school girl jumping rope in a residential community courtyard, casual sports outfit, natural sunlight, realistic photography'),
    ('students-standing-jump', 'Photo of a Chinese teenager doing standing long jump on a school playground, sand pit landing, athletic form, realistic photography, 4k'),
    ('students-situps', 'Photo of Chinese teenagers doing sit-ups on a school field, partner holding feet, fitness training, realistic photography'),
    ('students-volleyball', 'Photo of a Chinese student practicing volleyball bumping on an outdoor court, sports uniform, focused expression, realistic photography'),
    ('students-football', 'Photo of a Chinese teenager practicing football soccer shooting on a school field, goal post, action shot, realistic photography'),
    ('students-stretching', 'Photo of Chinese teenagers doing warm-up stretching exercises on a school field, group training, morning light, realistic photography'),
    ('students-coaching', 'Photo of a sports coach demonstrating exercise form to Chinese teenagers on an outdoor field, professional coaching, realistic photography'),
    ('student-growth', 'Photo of a tall healthy Chinese teenage boy standing confidently in sports outfit on a track field, growth and health transformation, realistic portrait photography'),
    ('student-handball', 'Photo of a Chinese teenage boy holding a handball in sports gear, athletic confident pose, school sports background, realistic portrait photography'),
]

out_dir = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\public\images\students'
os.makedirs(out_dir, exist_ok=True)

for i, (name, prompt) in enumerate(prompts):
    out_path = os.path.join(out_dir, name + '.jpg')
    if os.path.exists(out_path):
        print(f'[{i+1}/10] {name} already exists, skip')
        continue
    print(f'[{i+1}/10] Generating {name}...')
    try:
        resp = requests.post(API_URL, json={
            'model': 'gpt-image-2',
            'prompt': prompt,
            'n': 1,
            'size': '1024x1024',
        }, headers={'Authorization': f'Bearer {API_KEY}'}, timeout=120)
        data = resp.json()
        if 'data' in data and len(data['data']) > 0:
            img_b64 = data['data'][0].get('b64_json', '')
            if img_b64:
                from PIL import Image
                img_bytes = base64.b64decode(img_b64)
                img = Image.open(io.BytesIO(img_bytes))
                if img.mode == 'RGBA':
                    img = img.convert('RGB')
                buf = io.BytesIO()
                img.save(buf, format='JPEG', quality=85)
                with open(out_path, 'wb') as f:
                    f.write(buf.getvalue())
                sz = os.path.getsize(out_path) / 1024
                print(f'  -> Saved {name}.jpg ({sz:.0f} KB)')
            else:
                print('  -> ERROR: no b64_json in response')
        else:
            err = resp.text[:200]
            print(f'  -> ERROR: {resp.status_code} {err}')
    except Exception as e:
        print(f'  -> ERROR: {e}')
    if i < len(prompts) - 1:
        time.sleep(2)

print('Done!')
