"""Generate all 3 images for Manfenhu article illustrations using SeeDream 5.0"""
import sys, os

# Add script dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_seedream import generate

IMAGES = [
    {
        "name": "1. 运动后拉伸",
        "path": "public/images/news/post-workout-stretch.jpg",
        "prompt": "An East Asian Chinese teenage girl doing simple stretching exercises on a grass field after running, soft afternoon light, realistic photography, calm and healthy atmosphere",
    },
    {
        "name": "2. 评分标准解读",
        "path": "public/images/news/exam-scoring-guide.jpg",
        "prompt": "A close-up of a clipboard with a score sheet and a pencil on a sports field, warm sunlight, realistic photography, exam preparation atmosphere",
    },
    {
        "name": "3. 暑假场地推荐",
        "path": "public/images/news/summer-venues.jpg",
        "prompt": "A sunny park path with families walking and jogging, green trees and blue sky, summer vacation atmosphere, bright and cheerful, realistic photography, outdoor sports scene",
    },
]

base_dir = os.path.dirname(os.path.abspath(__file__))

for img in IMAGES:
    out_path = os.path.join(base_dir, img["path"])
    print(f"\n{'='*60}")
    print(f"Generating {img['name']}")
    print(f"  Prompt: {img['prompt'][:60]}...")
    print(f"  Output: {out_path}")
    print(f"{'='*60}")
    success = generate(
        prompt=img["prompt"],
        output_path=out_path,
        size="1920x1920",
        quality="high",
        n=1,
        max_w=1200,
        blur_radius=0.5,
        jpeg_q=88,
    )
    if success:
        size_kb = os.path.getsize(out_path) // 1024
        print(f"  ✅ {img['name']} -> {out_path} ({size_kb} KB)")
    else:
        print(f"  ❌ {img['name']} FAILED")
        sys.exit(1)

print(f"\n{'='*60}")
print("All 3 images generated successfully!")
print(f"{'='*60}")
