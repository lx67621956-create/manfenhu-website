"""Test each prompt individually"""
import urllib.request, urllib.error, json, time, sys, os

KEY=os.environ.get("SENSENOVA_API_KEY", "")
ENDPOINT="https://token.sensenova.cn/v1/images/generations"

prompts = {
    "pokeball": "Pokeball icon, simple vector style, red and white halves with black center band and white inner circle, clean minimal design, transparent background, centered, flat vector illustration",
    "arena_bg": "Dragon Ball style tournament arena, white circular stage on green grass field, blue sky with white clouds, wide landscape view, bright sunny day, anime style, battle stadium, high quality illustration",
    "trophy": "Golden trophy cup icon, simple vector style, shiny metallic gold, two handles, clean minimal design, transparent background, centered, flat vector illustration, award champion",
    "star": "Golden star sparkle decoration, simple vector style, shiny metallic gold, five-pointed star, clean minimal design, transparent background, centered, flat vector illustration",
}

headers={
    "Content-Type":"application/json",
    "Authorization":f"Bearer {KEY}",
}

for name, prompt in prompts.items():
    body=json.dumps({
        "model":"sensenova-u1-fast",
        "prompt":prompt,
        "n":1,
        "size":"2048x2048",
    }).encode("utf-8")
    
    print(f"[{name}] Sending...", flush=True)
    start=time.time()
    req=urllib.request.Request(ENDPOINT, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            result=json.loads(resp.read().decode("utf-8"))
            elapsed=time.time()-start
            if "data" in result and len(result["data"])>0:
                url=result["data"][0].get("url","")
                print(f"  OK in {elapsed:.1f}s, URL: {url[:80]}...", flush=True)
            else:
                print(f"  Response in {elapsed:.1f}s but no data: {json.dumps(result)[:200]}", flush=True)
    except Exception as e:
        print(f"  ERROR after {time.time()-start:.1f}s: {type(e).__name__}: {e}", flush=True)
