"""Test one actual prompt - pokeball"""
import urllib.request, urllib.error, json, time
from pathlib import Path

api_key_file = Path(__file__).resolve().parent.parent / "sn_key.txt"
API_KEY = api_key_file.read_text().strip()

ENDPOINT="https://token.sensenova.cn/v1/images/generations"

body=json.dumps({
    "model":"sensenova-u1-fast",
    "prompt":"Pokeball icon, simple vector style, red and white halves with black center band and white inner circle, clean minimal design, transparent background, centered, flat vector illustration",
    "n":1,
    "size":"2048x2048",
}).encode("utf-8")

headers={
    "Content-Type":"application/json",
    "Authorization":f"Bearer {API_KEY}",
}

print(f"[{time.strftime('%H:%M:%S')}] Sending pokeball prompt...", flush=True)
start=time.time()
req=urllib.request.Request(ENDPOINT, data=body, headers=headers, method="POST")
try:
    with urllib.request.urlopen(req, timeout=600) as resp:
        result=json.loads(resp.read().decode("utf-8"))
        elapsed=time.time()-start
        url=result.get("data",[{}])[0].get("url","")
        print(f"[{time.strftime('%H:%M:%S')}] OK in {elapsed:.1f}s", flush=True)
        print(f"URL: {url[:120]}...", flush=True)
        
        # Download
        save_path = Path(__file__).resolve().parent.parent / "public" / "images" / "ui" / "pokeball_test.png"
        save_path.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(url, save_path)
        size_kb = save_path.stat().st_size / 1024
        print(f"Downloaded: {size_kb:.1f} KB", flush=True)
        
        from PIL import Image
        img = Image.open(save_path)
        print(f"Image: {img.size}, mode={img.mode}", flush=True)
except Exception as e:
    print(f"[{time.strftime('%H:%M:%S')}] ERROR after {time.time()-start:.1f}s: {type(e).__name__}: {e}", flush=True)
