"""
豆包5.0 Lite 生图脚本（火山引擎/Volcengine Ark）
用法: from gen_doubao5 import generate
"""
import httpx, base64, os
from PIL import Image
import io

API_KEY = "REDACTED_ARK_API_KEY"
MODEL = "doubao-seedream-5-0-260128"  # 豆包5.0

def generate(prompt: str, output_path: str, size: str = "2560x1440", max_w: int = None, 
             blur_radius: float = 0.3, jpeg_q: int = 95) -> bool:
    """Generate image via Doubao Seedream 5.0 API."""
    
    # Load and encode reference images
    ref_paths = [
        r"C:\Users\lx676\Desktop\jimeng-2026-07-10-4036-将@图片1（正面）、@图片2（背面）、@图片3（侧面）三个角度的卡通老虎MANF....png"
    ]
    ref_b64_list = []
    for rp in ref_paths:
        if not os.path.exists(rp):
            print(f"[Doubao5] Reference image not found: {rp}")
            continue
        with open(rp, "rb") as f:
            ref_b64_list.append(base64.b64encode(f.read()).decode())
    
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "size": size,
        "jpeg_quality": jpeg_q,
    }
    if ref_b64_list:
        payload["reference_images"] = [{"image_base64": b, "description": "tiger mascot reference"} for b in ref_b64_list]
    
    try:
        resp = httpx.post(
            "https://ark.cn-beijing.volces.com/api/v3/bvpc/ark/vision/arc/generate",
            headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
            json=payload, timeout=120
        )
        data = resp.json()
        
        if data.get("code") != 0 or data.get("message") != "success":
            print(f"[Doubao5] API error: code={data.get('code')}, msg={data.get('message')}")
            return False
        
        img_data = base64.b64decode(data["data"]["image_base64"])
        img = Image.open(io.BytesIO(img_data))
        
        # Apply blur to text areas
        if blur_radius > 0:
            from PIL import ImageFilter
            img = img.filter(ImageFilter.GaussianBlur(radius=blur_radius * 10))
        
        # Resize if needed
        if max_w and img.width > max_w:
            ratio = max_w / img.width
            new_h = int(img.height * ratio)
            img = img.resize((max_w, new_h), Image.LANCZOS)
        
        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        img.save(output_path, quality=jpeg_q)
        size_kb = os.path.getsize(output_path) / 1024
        print(f"[Doubao5] Saved {output_path} ({size_kb:.0f} KB)")
        return True
        
    except Exception as e:
        print(f"[Doubao5] Exception: {e}")
        return False

if __name__ == "__main__":
    print(f"Model: {MODEL}")
    print(f"API Key starts with: {API_KEY[:15]}...")
    ref_path = r"C:\Users\lx676\Desktop\jimeng-2026-07-10-4036-将@图片1（正面）、@图片2（背面）、@图片3（侧面）三个角度的卡通老虎MANF....png"
    print(f"Ref exists: {os.path.exists(ref_path)}")
