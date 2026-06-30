"""Generate UI assets with simple prompts."""
import urllib.request, json, time, os

API_KEY = open("C:/Users/lx676/manfenhu-website/sn_key.txt").read().strip()
OUT = "C:/Users/lx676/manfenhu-website/youth-fitness-website/public/images/ui"

prompts = {
    "pokeball.png": "Pokeball red and white, simple icon",
    "arena_bg.png": "Dragon Ball arena, white stage on grass, blue sky",
    "trophy.png": "Golden trophy cup, simple icon",
    "star.png": "Golden five-pointed star, simple icon",
}

for name, prompt in prompts.items():
    print(f"\n[{name}] {prompt}")
    body = json.dumps({"model":"sensenova-u1-fast","prompt":prompt,"n":1,"size":"2048x2048"}).encode()
    req = urllib.request.Request(
        "https://token.sensenova.cn/v1/images/generations",
        data=body,
        headers={"Content-Type":"application/json","Authorization":f"Bearer {API_KEY}"},
        method="POST"
    )
    try:
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=1200) as r:
            data = json.loads(r.read())
        url = data.get("data",[{}])[0].get("url","")
        if url:
            save = os.path.join(OUT, name)
            urllib.request.urlretrieve(url, save)
            kb = os.path.getsize(save)/1024
            print(f"  OK {kb:.0f}KB in {time.time()-t0:.0f}s")
        else:
            print(f"  No URL in response")
    except Exception as e:
        print(f"  FAIL: {e}")
