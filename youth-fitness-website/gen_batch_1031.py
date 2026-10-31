# -*- coding: utf-8 -*-
"""2026-10-31 批次封面 — SUB gpt-image-2.5-sunburst（重试/落盘校验在 gen_sub.run_jobs）"""
import sys
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
from gen_sub import run_jobs

OUT = r"D:\manfenhu-website\youth-fitness-website\public\images\news"

JOBS = [
    ("early-training-why",
     "写实摄影：学校红色塑胶跑道上，一名穿校服运动服的中国初中生正在向前慢跑，"
     "双臂自然摆动、全身入镜、四肢完整；一位穿深色运动服的教练走在跑道内侧，侧身看着学生、做指导手势，"
     "两人距离自然；下午明亮阳光，背景是虚化的绿色草坪和围栏。人物手部不接触地面、不在画面焦点。"
     "画面中不要出现任何文字、数字、logo、水印。"),
    ("training-conflict",
     "写实摄影：家里客厅，一位中国家长和一名穿校服的初中生面对面坐着谈话，"
     "两人姿态克制、神情认真，中间隔着一张茶几，没有争吵动作；"
     "室内柔和的自然光，背景是书架和沙发，画面安静真实。两人全身或半身完整入镜、四肢自然。"
     "画面中不要出现任何文字、logo、水印。"),
    ("pe-class-use",
     "写实摄影：学校操场上，一排穿统一校服的中国初中生正在做热身动作，"
     "一名穿运动服的体育老师站在队伍前方正面示范，动作舒展；"
     "上午明亮阳光，背景是教学楼和绿色草坪，画面干净有序。人物四肢完整。"
     "画面中不要出现任何文字、数字、logo、水印。"),
]

if __name__ == "__main__":
    print(f"=== {run_jobs(JOBS, OUT)}/{len(JOBS)} generated", flush=True)
