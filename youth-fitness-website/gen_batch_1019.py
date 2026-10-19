# -*- coding: utf-8 -*-
"""2026-10-19 批次封面 — SUB gpt-image-2.5-sunburst（重试/落盘校验在 gen_sub.run_jobs）"""
import sys
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
from gen_sub import run_jobs

OUT = r"D:\manfenhu-website\youth-fitness-website\public\images\news"

JOBS = [
    ("make-your-own-plan",
     "写实摄影：学校田径场边，一位穿黑色运动服的中年男教练站着，用手势向旁边一位家长讲解训练安排，"
     "中景是几名穿统一运动服的中学生在跑道上跑步，下午明亮阳光，"
     "画面干净有序、专业，真实感强。画面中不要出现任何文字、logo、水印、纸板文字。"),
    ("other-sports-carryover",
     "写实摄影：中国青少年室内篮球场上，一名穿球衣的中学生正在运球突破，"
     "木地板上有清晰反光，场边有一位教练在观察，"
     "明亮室内光线，运动感强，真实自然。画面中不要出现任何文字、logo、水印。"),
    ("muscle-fear-guide",
     "写实摄影：室内体育馆里，一名中国中学生女生正在做深蹲或弹力带力量训练，"
     "动作标准、穿统一运动服，一位女教练蹲在旁边纠正动作，"
     "明亮室内光线，画面专业干净，氛围积极。画面中不要出现任何文字、logo、水印。"),
]

if __name__ == "__main__":
    print(f"=== {run_jobs(JOBS, OUT)}/{len(JOBS)} generated", flush=True)
