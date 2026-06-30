import subprocess, json, sys

key = open("/tmp/sn_key.txt").read().strip()

models = ["sensenova-u1", "sensenova-u1-flash", "nano-banana", 
          "gpt-image-2", "sensenova-image", "dall-e-3", "sensenova-image-gen"]

for model in models:
    payload = json.dumps({
        "model": model,
        "prompt": "a cute cat, digital art",
        "n": 1,
        "size": "1024x1024"
    })
    r = subprocess.run([
        "curl", "-s", "https://token.sensenova.cn/v1/images/generations",
        "-H", "Authorization: Bearer " + key,
        "-H", "Content-Type: application/json",
        "-d", payload
    ], capture_output=True, text=True, timeout=60)
    
    try:
        data = json.loads(r.stdout)
        if "data" in data:
            print(f"  {model}: ✅ SUCCESS! URL: {str(data['data'][0].get('url',''))[:60]}")
        elif "error" in data:
            msg = data["error"].get("message", "")
            code = data["error"].get("code", "")
            print(f"  {model}: ❌ {msg} (code={code})")
        else:
            print(f"  {model}: ❌ {r.stdout[:100]}")
    except:
        print(f"  {model}: ❌ {r.stdout[:100]}")
