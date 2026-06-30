"""Generate one image and save to public/images/ui/"""
import urllib.request, urllib.error, json, sys, time, os

KEY = open("C:/Users/lx676/manfenhu-website/sn_key.txt").read().strip()
OUT = "C:/Users/lx676/manfenhu-website/youth-fitness-website/public/images/ui"
ENDPOINT = "https://token.sensenova.cn/v1/images/generations"

name = sys.argv[1]
prompt = sys.argv[2]

print(f"[{time.strftime('%H:%M:%S')}] {name}: {prompt}")
body = json.dumps({"model":"sensenova-u1-fast","prompt":prompt,"n":1,"size":"2048x2048"}).encode()
req = urllib.request.Request(ENDPOINT, data=body, headers={
    "Content-Type":"application/json","Authorization":f"Bearer {KEY}"
}, method="POST")

try:
    with urllib.request.urlopen(req, timeout=1200) as r:
        data = json.loads(r.read())
    url = data.get("data",[{}])[0].get("url","")
    if url:
        save = os.path.join(OUT, name)
        urllib.request.urlretrieve(url, save)
        kb = os.path.getsize(save)/1024
        print(f"[{time.strftime('%H:%M:%S')}] OK {name} {kb:.0f}KB")
    else:
        print(f"[{time.strftime('%H:%M:%S')}] No URL")
except Exception as e:
    print(f"[{time.strftime('%H:%M:%S')}] FAIL: {e}")
