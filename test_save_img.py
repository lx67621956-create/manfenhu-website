import urllib.request, json, base64, pathlib

api_key = 'REDACTED_IMG_API_KEY'
url = 'https://aiapi.up.railway.app/v1/images/generations'

payload = json.dumps({
    'model': 'gpt-image-2',
    'prompt': 'Chinese middle school student running on red track at school sports field, sunny day, realistic photo',
    'n': 1,
    'size': '1024x1024'
}).encode('utf-8')

req = urllib.request.Request(url, data=payload, headers={
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {api_key}'
}, method='POST')

try:
    resp = urllib.request.urlopen(req, timeout=60)
    data = json.loads(resp.read())
    # Save base64 image
    b64 = data['data'][0]['b64_json']
    img_bytes = base64.b64decode(b64)
    out_path = pathlib.Path(r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\public\images\news\test-api-image.png')
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(img_bytes)
    print(f'SUCCESS: saved {len(img_bytes)} bytes to {out_path}')
    print(f'Response keys: {list(data.keys())}')
except urllib.error.HTTPError as e:
    body = e.read().decode('utf-8', errors='replace')
    print(f'HTTP {e.code}: {body[:500]}')
except Exception as e:
    print(f'Error: {e}')
