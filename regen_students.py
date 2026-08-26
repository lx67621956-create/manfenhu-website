import requests, base64, os, time, io
from PIL import Image

API_URL = 'https://aiapi.up.railway.app/v1/images/generations'
API_KEY = __import__('os').environ.get('IMG_API_KEY', '')

out_dir = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\public\images\students'

# 更自然的提示词：减少AI完美感，增加真实感
prompts = [
    ("students-running",     'Chinese teenage boys running on a dusty red running track at a public school, slightly sweaty, casual cotton t-shirts and sports shorts, natural daylight, candid snapshot, motion blur on legs, real outdoor PE class atmosphere, photorealistic, shot on iPhone'),
    ("students-jump-rope",   'Chinese middle school girl jumping rope alone in a small concrete community courtyard, worn basketball court surface, casual school uniform, natural sunlight afternoon, candid photo, imperfect framing, photorealistic, snapshot style'),
    ("students-standing-jump",'Chinese teenage boy mid-air doing standing long jump, outdoor school sandpit, PE class setting, slightly worn athletic shorts, candid shot, motion freeze, natural outdoor light, photorealistic'),
    ("students-situps",      'Chinese teenagers doing sit-ups on green grass school field, one partner holding feet, worn PE uniform, slightly messy hair, candid outdoor PE class, natural daylight, photorealistic, snapshot'),
    ("students-volleyball", 'Chinese teenage girl practicing volleyball bump pass alone on outdoor concrete court, school sports uniform with number, afternoon sun casting shadow, candid practice moment, photorealistic'),
    ("students-football",    'Chinese teenage boy kicking a football on a worn grass school field, goal post in background, PE class setting, casual sportswear, candid snapshot, natural light, photorealistic'),
    ("students-stretching", 'Chinese teenagers in a circle doing warm-up stretches on school grass field, slightly messy formation, PE teacher watching, casual athletic wear, candid PE class photo, natural daylight, photorealistic'),
    ("students-coaching",   'Sports coach in casual polo shirt adjusting a teenage boy arm position outdoors on school field, serious teaching moment, worn training cones nearby, candid coaching photo, natural light, photorealistic'),
    ("student-growth",       'Tall Chinese teenage boy standing at school gate, slightly smiling, wearing simple sports hoodie and joggers, natural expression, outdoor campus background, candid portrait, slightly imperfect lighting, photorealistic'),
    ("student-handball",     'Chinese teenage boy holding a handball, standing by worn outdoor handball court wall, casual school sportswear, candid pose, slight smile, school campus background, natural daylight, photorealistic'),
]

for i, (name, prompt) in enumerate(prompts):
    out_path = os.path.join(out_dir, name + '.jpg')
    print(f'[{i+1}/10] Regenerating {name}...')
    try:
        resp = requests.post(API_URL, json={
            'model': 'gpt-image-2',
            'prompt': prompt,
            'n': 1,
            'size': '1024x1024',
        }, headers={'Authorization': f'Bearer {API_KEY}'}, timeout=180)
        data = resp.json()
        if 'data' in data and len(data['data']) > 0 and data['data'][0].get('b64_json'):
            img_bytes = base64.b64decode(data['data'][0]['b64_json'])
            img = Image.open(io.BytesIO(img_bytes))
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            buf = io.BytesIO()
            img.save(buf, format='JPEG', quality=88)
            with open(out_path, 'wb') as f:
                f.write(buf.getvalue())
            sz = os.path.getsize(out_path) // 1024
            print(f'  -> {name}.jpg ({sz} KB)')
        else:
            print(f'  -> API error: {resp.status_code} {str(resp.text)[:100]}')
    except Exception as e:
        print(f'  -> ERROR: {e}')
    time.sleep(3)

print('All done.')
