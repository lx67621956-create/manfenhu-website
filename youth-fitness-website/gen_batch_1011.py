# -*- coding: utf-8 -*-
"""2026-10-11 批次封面 — SUB gpt-image-2.5-sunburst（重试逻辑在 gen_sub.run_jobs）"""
import sys
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
from gen_sub import run_jobs

OUT = r"D:\manfenhu-website\youth-fitness-website\public\images\news"

JOBS = [
    ("training-session-order",
     "写实摄影：中国中学生在室内体育馆进行体能训练课，一名穿统一运动服的男生正在做加速跑，"
     "旁边地面上放着标志盘和跳绳，一位中年男教练站在侧面观察并用手势讲解，"
     "明亮室内光线，画面整齐专业，真实感强。画面中不要出现任何文字、logo、水印。"),
    ("home-training-equipment",
     "写实摄影：中国家庭的客厅里，一名小学生正在木地板上跳绳做居家训练，"
     "旁边地垫上整齐摆着弹力带、瑜伽垫和一对小哑铃，阳光从窗户照进来，"
     "居家环境干净整洁，真实自然。画面中不要出现任何文字、logo、水印。"),
    ("sprain-first-aid",
     "写实摄影：中国青少年坐在操场边的长椅上，一只脚穿着运动鞋抬起，"
     "一位教练蹲下来用手轻轻托着他的脚踝查看，孩子表情平静，"
     "背景是红色塑胶跑道和绿色草坪，明亮自然光，真实感强。"
     "画面中不要出现任何文字、logo、水印。"),
]

if __name__ == "__main__":
    print(f"=== {run_jobs(JOBS, OUT)}/{len(JOBS)} generated", flush=True)
