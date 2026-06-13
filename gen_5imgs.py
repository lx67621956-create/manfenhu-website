import urllib.request, json, base64, pathlib, time

API_KEY = '1XdPF07AHZsvMwr1PHLX0174Kn9JJA2HtXnhdMriLGVuLAM6'
API_URL = 'https://aiapi.up.railway.app/v1/images/generations'

ARTICLES = [
    ('zhongkao-sprint',           'Chinese middle school students sprinting on red track, final exam preparation, sunny day, realistic photo'),
    ('zhongkao-myths',            'Chinese coach explaining common mistakes to students on sports field, realistic photo'),
    ('science-training-principles', 'Chinese science teacher drawing training plan on whiteboard, sports science concept, realistic photo'),
    ('exam-psychology-guide',      'Chinese middle school student taking deep breath before sports exam, confident, realistic photo'),
    ('student-case-study',         'Chinese teenage boy showing pull-up result to coach and parent, happy, realistic photo'),
]

OUT = pathlib.Path(r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\public\images\news')

for slug, prompt in ARTICLES:
    out_path = OUT / f'{slug}.png'
    if out_path.exists():
        print(f'[skip] {slug}')
        continue
    print(f'Generating: {slug} ...')
    payload = json.dumps({'model':'gpt-image-2','prompt':prompt,'n':1,'size':'1024x1024'}).encode()
    req = urllib.request.Request(API_URL, data=payload, headers={'Content-Type':'application/json','Authorization':f'Bearer {API_KEY}'}, method='POST')
    try:
        resp = urllib.request.urlopen(req, timeout=90)
        data = json.loads(resp.read())
        img = base64.b64decode(data['data'][0]['b64_json'])
        out_path.write_bytes(img)
        print(f'  -> {len(img)//1024} KB saved')
    except Exception as e:
        print(f'  -> FAILED: {e}')
    time.sleep(2)

print('DONE')
