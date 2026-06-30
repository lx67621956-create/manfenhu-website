"""
Generate UI decoration assets using SenseNova U1 API (image generation).
Saves to public/images/ui/ with compression.
"""

import urllib.request
import urllib.error
import json
import time
import sys
import os
from pathlib import Path

# --- Config ---
API_KEY_FILE = Path(__file__).resolve().parent.parent / "sn_key.txt"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "images" / "ui"

ENDPOINT = "https://token.sensenova.cn/v1/images/generations"
MODEL = "sensenova-u1-fast"
SIZE = "2048x2048"

PROMPTS = {
    "pokeball.png": {
        "prompt": "Pokeball icon, simple vector style, red and white halves with black center band and white inner circle, clean minimal design, transparent background, centered, flat vector illustration",
        "n": 1,
        "size": SIZE,
    },
    "arena_bg.png": {
        "prompt": "Dragon Ball style tournament arena, white circular stage on green grass field, blue sky with white clouds, wide landscape view, bright sunny day, anime style, battle stadium, high quality illustration, 1024x768 landscape composition",
        "n": 1,
        "size": SIZE,
    },
    "trophy.png": {
        "prompt": "Golden trophy cup icon, simple vector style, shiny metallic gold, two handles, clean minimal design, transparent background, centered, flat vector illustration, award champion",
        "n": 1,
        "size": SIZE,
    },
    "star.png": {
        "prompt": "Golden star sparkle decoration, simple vector style, shiny metallic gold, five-pointed star, clean minimal design, transparent background, centered, flat vector illustration",
        "n": 1,
        "size": SIZE,
    },
}

def call_sensenova_api(prompt_data, retries=2):
    """Call SenseNova U1 image generation API. Returns image URL or None."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }
    body = json.dumps({
        "model": MODEL,
        "prompt": prompt_data["prompt"],
        "n": prompt_data.get("n", 1),
        "size": prompt_data.get("size", SIZE),
    }).encode("utf-8")

    for attempt in range(1 + retries):
        if attempt > 0:
            print(f"  Retry {attempt}/{retries}...")
        req = urllib.request.Request(ENDPOINT, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=600) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                # Try various response formats
                if "data" in result and isinstance(result["data"], list) and len(result["data"]) > 0:
                    item = result["data"][0]
                    if isinstance(item, dict):
                        return item.get("url") or item.get("b64_json") or item.get("image")
                    elif isinstance(item, str):
                        return item
                if "images" in result and len(result["images"]) > 0:
                    return result["images"][0]
                if "output" in result and "image_url" in result["output"]:
                    return result["output"]["image_url"]
                print(f"  [WARN] Unexpected response format: {json.dumps(result)[:200]}")
                return None
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            print(f"  [HTTP {e.code}] {err_body[:300]}")
            if e.code == 401:
                return None  # auth failure, no point retrying
        except Exception as e:
            print(f"  [ERROR] {type(e).__name__}: {e}")
            if attempt < retries:
                print(f"  Waiting 10s before retry...")
                time.sleep(10)
            else:
                return None
    return None


def download_image(url, save_path):
    """Download image from URL and save to path. Returns True on success."""
    try:
        urllib.request.urlretrieve(url, save_path)
        size_kb = os.path.getsize(save_path) / 1024
        print(f"    Downloaded: {size_kb:.1f} KB")
        return True
    except Exception as e:
        print(f"    [ERROR] Download failed: {e}")
        return False


def create_placeholder(filename):
    """Create a solid-color placeholder image when API fails."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("  [WARN] PIL not available, skipping placeholder")
        return False

    colors = {
        "pokeball.png": (220, 50, 50),
        "arena_bg.png": (100, 180, 255),
        "trophy.png": (255, 215, 0),
        "star.png": (255, 215, 0),
    }
    sizes = {
        "pokeball.png": (512, 512),
        "arena_bg.png": (1024, 768),
        "trophy.png": (512, 512),
        "star.png": (256, 256),
    }
    labels = {
        "pokeball.png": "POKEBALL",
        "arena_bg.png": "ARENA BG",
        "trophy.png": "TROPHY",
        "star.png": "STAR",
    }

    color = colors.get(str(filename), (128, 128, 128))
    sz = sizes.get(str(filename), (512, 512))
    label = labels.get(str(filename), str(filename))

    img = Image.new("RGBA", sz, (*color, 255))
    draw = ImageDraw.Draw(img)
    # Draw a simple shape
    cx, cy = sz[0] // 2, sz[1] // 2
    fname_str = str(filename)
    if "pokeball" in fname_str:
        # Circle with line through middle
        draw.ellipse([cx-150, cy-150, cx+150, cy+150], outline="white", width=8)
        draw.line([cx-150, cy, cx+150, cy], fill="white", width=8)
        draw.ellipse([cx-20, cy-20, cx+20, cy+20], fill="white")
    elif "arena" in fname_str:
        # Circle stage
        draw.ellipse([cx-200, cy-100, cx+200, cy+100], outline="white", width=6)
    elif "trophy" in fname_str:
        # Simple cup shape
        draw.ellipse([cx-100, cy-120, cx+100, cy+40], outline="white", width=6)
        draw.rectangle([cx-30, cy+40, cx+30, cy+80], fill="white")
    elif "star" in fname_str:
        # Simple star polygon
        import math
        points = []
        for i in range(10):
            angle = math.pi / 2 + i * math.pi / 5
            r = 80 if i % 2 == 0 else 35
            points.append((cx + r * math.cos(angle), cy - r * math.sin(angle)))
        draw.polygon(points, outline="white", width=4)

    # Try to add text label
    try:
        font = ImageFont.truetype("arial.ttf", 24)
        draw.text((10, 10), f"PLACEHOLDER: {label}", fill="white", font=font)
    except:
        draw.text((10, 10), f"PLACEHOLDER: {label}", fill="white")

    if str(filename).endswith(".png"):
        img.save(save_path, "PNG")
    else:
        img = img.convert("RGB")
        img.save(save_path, "JPEG", quality=80)
    return True


def optimize_image(filepath):
    """Optimize image size: PNG quantize or JPEG recompress."""
    try:
        from PIL import Image
    except ImportError:
        return

    original_size = os.path.getsize(filepath) / 1024
    ext = Path(filepath).suffix.lower()

    try:
        img = Image.open(filepath)
        if ext == ".png":
            # Convert to palette mode if RGBA and reasonable color count
            if img.mode == "RGBA":
                img = img.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
            img.save(filepath, "PNG", optimize=True)
        elif ext == ".jpg" or ext == ".jpeg":
            img.save(filepath, "JPEG", quality=80, optimize=True)
        new_size = os.path.getsize(filepath) / 1024
        print(f"    Optimized: {original_size:.1f} KB -> {new_size:.1f} KB")
    except Exception as e:
        print(f"    [WARN] Optimization skipped: {e}")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Read API key
    global API_KEY
    try:
        API_KEY = API_KEY_FILE.read_text().strip()
    except FileNotFoundError:
        print(f"[FATAL] API key file not found: {API_KEY_FILE}")
        sys.exit(1)

    if not API_KEY or API_KEY.startswith("YOUR_"):
        print("[FATAL] Invalid API key. Set it in sn_key.txt")
        sys.exit(1)

    print(f"API Key: {API_KEY[:8]}...{API_KEY[-4:]}")
    print(f"Output: {OUTPUT_DIR}\n")

    results = []

    for filename, prompt_data in PROMPTS.items():
        save_path = OUTPUT_DIR / filename
        print(f"[{filename}] Generating...")
        start = time.time()

        # Try API
        image_url = call_sensenova_api(prompt_data)
        success = False
        api_time = time.time() - start

        if image_url:
            print(f"  API responded in {api_time:.1f}s, downloading...")
            success = download_image(image_url, save_path)
            if success:
                print(f"  Optimizing...")
                optimize_image(save_path)

        if not success:
            print(f"  API failed or no URL returned. Creating placeholder...")
            success = create_placeholder(save_path)
            if success:
                print(f"  Placeholder created.")

        final_size_kb = os.path.getsize(save_path) / 1024 if success else 0
        status = "OK" if success else "FAILED"
        print(f"  Done: {status}, {final_size_kb:.1f} KB, {time.time()-start:.1f}s total\n")
        results.append((filename, status, final_size_kb, time.time() - start))

    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for name, status, size_kb, elapsed in results:
        print(f"  {name:20s}  {status:6s}  {size_kb:8.1f} KB  {elapsed:5.1f}s")
    print("=" * 60)


if __name__ == "__main__":
    main()
