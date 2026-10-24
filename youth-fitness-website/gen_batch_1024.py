# -*- coding: utf-8 -*-
"""2026-10-24 批次封面 — SUB gpt-image-2.5-sunburst（重试/落盘校验在 gen_sub.run_jobs）"""
import sys
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
from gen_sub import run_jobs

OUT = r"D:\manfenhu-website\youth-fitness-website\public\images\news"

JOBS = [
    ("load-progression",
     "写实摄影：室内体育馆木地板上，一名穿运动服的中国中学生正在做徒手深蹲，动作标准、膝盖方向稳定，"
     "一位穿深色运动服的教练站在侧面，手掌向下做“稳住、再来一组”的手势，"
     "背景是蓝色训练垫和器材架、轻微虚化，明亮室内光线，画面干净专业。"
     "人物全身入镜、四肢完整，手部不靠近画面中心。画面中不要出现任何文字、数字、logo、水印。"),
    ("rest-intervals",
     "写实摄影：室内体育馆场边，一名穿运动服的中国中学生坐在长凳上休息，肩上搭着毛巾，"
     "手里拿着水瓶正在喝水，神情放松；一位教练站在不远处，低头看手里的秒表计时，"
     "背景虚化出训练垫和器械，明亮自然光，画面干净真实。"
     "人物四肢完整，画面中不要出现任何文字、数字、logo、水印。"),
    ("competition-value",
     "写实摄影：学校红色塑胶跑道上，几名穿统一运动服的中国中学生正在进行跑步测验，"
     "其中一名学生在画面前方冲过白色终点线，动作自然有力、全身入镜，"
     "远处跑道边有同学在等候和加油，下午明亮阳光，背景轻微虚化。"
     "画面中不要出现任何文字、数字、logo、水印，人物四肢完整。"),
]

if __name__ == "__main__":
    print(f"=== {run_jobs(JOBS, OUT)}/{len(JOBS)} generated", flush=True)
