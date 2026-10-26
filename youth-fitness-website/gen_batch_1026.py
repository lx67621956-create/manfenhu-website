# -*- coding: utf-8 -*-
"""2026-10-26 批次封面 — SUB gpt-image-2.5-sunburst（重试/落盘校验在 gen_sub.run_jobs）"""
import sys
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
from gen_sub import run_jobs

OUT = r"D:\manfenhu-website\youth-fitness-website\public\images\news"

JOBS = [
    ("cramp-prevention",
     "写实摄影：室内体育馆，一名穿校服运动服的中国中学生面对墙壁站立，双手轻轻扶墙，"
     "一条腿向后撤半步、脚跟踩实地面做小腿拉伸，身体自然前倾，动作标准；"
     "背景是虚化的器械架和木地板，明亮自然光，画面干净。人物全身入镜、双腿结构完整，"
     "手只轻扶墙面、不在画面焦点。画面中不要出现任何文字、数字、logo、水印。"),
    ("training-surface",
     "写实摄影：室内体育馆，一名穿校服运动服的中国中学生正在一块厚厚的蓝色训练垫上跳绳，"
     "动作轻盈、全身入镜；画面一侧能看到浅色木地板地面，背景是虚化的器械架和窗户，"
     "明亮自然光，构图干净。人物四肢完整，画面中不要出现任何文字、数字、logo、水印。"),
    ("training-partner",
     "写实摄影：学校红色塑胶跑道上，两名穿统一校服运动服的中国中学生并排做高抬腿训练，"
     "动作同步、神情专注自然，两人全身入镜、四肢完整；下午明亮阳光，背景是虚化的绿色草坪和跑道围栏，"
     "画面干净真实。画面中不要出现秒表、手机等任何手持物品，不要出现任何文字、数字、logo、水印。"),
]

if __name__ == "__main__":
    print(f"=== {run_jobs(JOBS, OUT)}/{len(JOBS)} generated", flush=True)
