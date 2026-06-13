import urllib.request, json

api_key = '1XdPF07AHZsvMwr1PHLX0174Kn9JJA2HtXnhdMriLGVuLAM6'
url = 'https://aiapi.up.railway.app/v1/images/generations'

payload = json.dumps({
    'model': 'dall-e-3',
    'prompt': 'test image',
    'n': 1,
    'size': '1024x1024'
}).encode('utf-8')

# Try different auth headers
auth_attempts = [
    ('Authorization', f'Bearer {api_key}'),
    ('api-key', api_key),
    ('X-Api-Key', api_key),
    ('Authorization', api_key),
]

for header_name, header_val in auth_attempts:
    try:
        req = urllib.request.Request(url, data=payload, headers={
            'Content-Type': 'application/json',
            header_name: header_val
        }, method='POST')
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())
        print(f'SUCCESS with {header_name}: {str(data)[:300]}')
        break
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        print(f'{header_name} -> {e.code}: {body[:200]}')
    except Exception as e:
        print(f'{header_name} -> Error: {e}')
