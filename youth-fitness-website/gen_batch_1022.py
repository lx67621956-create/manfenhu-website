# -*- coding: utf-8 -*-
"""2026-10-22 批次封面 — SUB gpt-image-2.5-sunburst（重试/落盘校验在 gen_sub.run_jobs）"""
import sys
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
from gen_sub import run_jobs

OUT = r"D:\manfenhu-website\youth-fitness-website\public\images\news"

JOBS = [
    ("foul-mistakes",
     "写实摄影：学校操场投掷区，一名穿运动服的中国中学生双手持实心球站在投掷线后准备投掷，"
     "身体姿态规范、目光向前，一位教练站在侧后方观察，红色跑道和绿色草坪背景，"
     "下午明亮阳光，真实感强。画面中不要出现任何文字、logo、水印。"),
    ("asymmetry-fix",
     "写实摄影：室内体育馆里，一名中国中学生正在做单腿蹲训练，一条腿支撑、另一条腿前伸，"
     "动作标准专注，一位中年男教练蹲在旁边观察膝盖和脚踝的位置，"
     "木地板和蓝色训练垫，明亮室内光线，画面专业干净。画面中不要出现任何文字、logo、水印。"),
    ("sideline-parent",
     "写实摄影：学校田径场边的看台或围栏外，一位中国家长安静站着看向场内，"
     "手里拿着一瓶水，神情平和专注；远处中景是穿统一运动服的学生在跑道上训练，"
     "下午明亮阳光，画面自然真实、不拥挤。画面中不要出现任何文字、logo、水印。"),
]

if __name__ == "__main__":
    print(f"=== {run_jobs(JOBS, OUT)}/{len(JOBS)} generated", flush=True)
