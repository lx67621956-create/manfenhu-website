# -*- coding: utf-8 -*-
"""2026-10-04 批次封面生成 — SUB gpt-image-2.5-sunburst"""
import sys, os, time
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
from gen_sub import generate

OUT = r"D:\manfenhu-website\youth-fitness-website\public\images\news"

JOBS = [
    ("coordination-training",
     "写实摄影：中国小学生在室内体育馆做敏捷梯脚步协调训练，地面上摆着黄色敏捷梯，"
     "孩子穿着统一运动服专注抬脚过梯，一位中年男教练蹲在旁边用手势指导，"
     "明亮室内光线，画面干净有序，真实感强。画面中不要出现任何文字、logo、水印。"),
    ("growth-pain-guide",
     "写实摄影：中国青少年坐在田径场边，一位教练蹲下帮他做小腿后侧放松拉伸，"
     "孩子表情放松、穿着运动服，背景是绿色草坪和红色塑胶跑道，傍晚明亮光线，"
     "真实自然，画面中没有文字。画面中不要出现任何文字、logo、水印。"),
    ("autumn-training-plan",
     "写实摄影：秋天的中国校园田径场，一群穿统一运动服的中学生在跑道上做跑步训练，"
     "教练手持秒表站在跑道边指导，下午明亮阳光，场边树叶微微泛黄，画面整齐有序，"
     "真实感强。画面中不要出现任何文字、logo、水印。"),
]

def run(job):
    slug, prompt = job
    dst = os.path.join(OUT, slug + ".jpg")
    for attempt in range(1, 4):
        try:
            print(f"[{slug}] attempt {attempt}")
            if generate(prompt, dst, size="1024x1024", quality="high"):
                if os.path.exists(dst) and os.path.getsize(dst) > 50 * 1024:
                    print(f"[{slug}] OK {os.path.getsize(dst)//1024} KB")
                    return True
        except Exception as e:
            print(f"[{slug}] attempt {attempt} failed: {e}")
        time.sleep(5)
    print(f"[{slug}] FAILED")
    return False

if __name__ == "__main__":
    ok = sum(run(j) for j in JOBS)
    print(f"=== {ok}/{len(JOBS)} generated")
