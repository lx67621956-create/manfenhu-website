# -*- coding: utf-8 -*-
"""重跑 growth-pain-guide 封面（503/超时后重试，单张）"""
import sys, os, time
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
from gen_sub import generate

OUT = r"D:\manfenhu-website\youth-fitness-website\public\images\news"
PROMPT = ("写实摄影：中国青少年坐在田径场边，一位教练蹲下帮他做小腿后侧放松拉伸，"
          "孩子表情放松、穿着运动服，背景是绿色草坪和红色塑胶跑道，傍晚明亮光线，"
          "真实自然。画面中不要出现任何文字、logo、水印。")

dst = os.path.join(OUT, "growth-pain-guide.jpg")
for attempt in range(1, 6):
    try:
        print(f"[growth-pain-guide] attempt {attempt}", flush=True)
        if generate(PROMPT, dst, size="1024x1024", quality="high"):
            if os.path.exists(dst) and os.path.getsize(dst) > 50 * 1024:
                print(f"[growth-pain-guide] OK {os.path.getsize(dst)//1024} KB", flush=True)
                break
    except Exception as e:
        print(f"[growth-pain-guide] attempt {attempt} failed: {e}", flush=True)
    time.sleep(8)
else:
    print("[growth-pain-guide] FAILED after 5 attempts", flush=True)
