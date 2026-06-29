"""
SeeDream 5.0 生图脚本（火山引擎/Volcengine Ark）
用法: py gen_seedream.py <prompt> <output_path> [size] [quality]
示例: py gen_seedream.py "a teenage boy running" public/images/news/test.jpg
"""
import httpx, json, base64, sys, os
from PIL import Image, ImageFilter
import io

API_KEY = "ark-5e86c9ea-20d2-4210-ac8b-1a2ca655c2c7-2d76c"
MODEL = "doubao-seedream-4-5-251128"
URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations"

VALID_SIZES = ["1920x1920", "2048x2048", "2560x1440", "2560x2560"]

def generate(prompt, output_path, size="1920x1920", quality="high", n=1,
             max_w=1200, blur_radius=1.0, jpeg_q=85):
    """
    生成图片并保存到 output_path
    
    参数:
        prompt: 图片描述文字
        output_path: 保存路径
        size: 图片尺寸，必须 >= 3686400 像素，如 "1920x1920", "2048x2048"
        quality: 图片质量 ("standard" 或 "high")
        n: 生成数量
        max_w: 输出最大宽度（后处理缩放到此宽度）
        blur_radius: 高斯模糊半径 (0=不模糊)
        jpeg_q: JPEG 压缩质量 (1-100)
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "size": size,
        "quality": quality,
        "n": n,
        "response_format": "b64_json",
        "watermark": False
    }

    print(f"[Seedream] Generating -> {output_path}")
    with httpx.Client(timeout=120) as client:
        resp = client.post(URL, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

        if "data" not in data or not data["data"]:
            print(f"[Seedream] Error: {data}")
            return False

        for i, item in enumerate(data["data"]):
            if "b64_json" in item:
                img_bytes = base64.b64decode(item["b64_json"])
            elif "url" in item:
                img_resp = client.get(item["url"])
                img_bytes = img_resp.content
            else:
                print(f"[Seedream] Unknown format: {list(item.keys())}")
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
            print(f"[Seedream] Saved {img_path} ({size_kb} KB)")

    return True


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        print(f"可用尺寸: {', '.join(VALID_SIZES)}")
        sys.exit(1)
    prompt = sys.argv[1]
    output = sys.argv[2]
    size = sys.argv[3] if len(sys.argv) > 3 else "1920x1920"
    quality = sys.argv[4] if len(sys.argv) > 4 else "high"
    generate(prompt, output, size, quality)
