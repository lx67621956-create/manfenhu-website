import urllib.request, json, base64

api_key = __import__('os').environ.get('IMG_API_KEY', '')
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
    print(json.dumps(data, ensure_ascii=False, indent=2)[:1000])
except urllib.error.HTTPError as e:
    body = e.read().decode('utf-8', errors='replace')
    print(f'HTTP {e.code}: {body[:500]}')
except Exception as e:
    print(f'Error: {e}')
