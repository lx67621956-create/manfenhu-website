"""
GPT-Image-2 生图脚本（gpt88.cc / img.gpt88.cc）
用法: py gen_gpt88.py <prompt> <output_path> [size] [quality]
示例: py gen_gpt88.py "a teenage boy doing pull-ups" public/images/news/pullup.jpg
"""
import httpx, json, base64, sys, os
from PIL import Image, ImageFilter
import io

API_KEY = os.environ.get("GPT88_API_KEY", "")
URL = "https://img.gpt88.cc/v1/images/generations"

def generate(prompt, output_path, size="1024x1024", quality="high", n=1,
             max_w=1200, blur_radius=1.0, jpeg_q=85):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-image-2",
        "prompt": prompt,
        "size": size,
        "quality": quality,
        "n": n
    }

    print(f"[GPT88] Generating -> {output_path}")
    with httpx.Client(timeout=120) as client:
        resp = client.post(URL, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

        if "data" not in data or not data["data"]:
            print(f"[GPT88] Error: {data}")
            return False

        for i, item in enumerate(data["data"]):
            if "b64_json" in item:
                img_bytes = base64.b64decode(item["b64_json"])
            elif "url" in item:
                img_resp = client.get(item["url"])
                img_bytes = img_resp.content
            else:
                print(f"[GPT88] Unknown format: {list(item.keys())}")
                continue

            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

            # resize to max_w
            w, h = img.size
            if w > max_w:
                ratio = max_w / w
                img = img.resize((max_w, int(h * ratio)), Image.LANCZOS)

            # gaussian blur for natural feel
            if blur_radius > 0:
                img = img.filter(ImageFilter.GaussianBlur(radius=blur_radius))

            # save
            suffix = f"_{i}" if n > 1 else ""
            ext = os.path.splitext(output_path)[1]
            out_name = os.path.splitext(os.path.basename(output_path))[0] + suffix + ext
            out_dir = os.path.dirname(output_path)
            img_path = os.path.join(out_dir, out_name) if out_dir else out_name

            img.save(img_path, "JPEG", quality=jpeg_q, optimize=True)
            size_kb = os.path.getsize(img_path) // 1024
            print(f"[GPT88] Saved {img_path} ({size_kb} KB)")

    return True


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    prompt = sys.argv[1]
    output = sys.argv[2]
    size = sys.argv[3] if len(sys.argv) > 3 else "1024x1024"
    quality = sys.argv[4] if len(sys.argv) > 4 else "high"
    generate(prompt, output, size, quality)
