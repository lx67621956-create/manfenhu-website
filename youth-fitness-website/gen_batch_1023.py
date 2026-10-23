# -*- coding: utf-8 -*-
"""2026-10-23 批次封面 — SUB gpt-image-2.5-sunburst（重试/落盘校验在 gen_sub.run_jobs）"""
import sys
sys.path.insert(0, r"D:\manfenhu-website\youth-fitness-website")
from gen_sub import run_jobs

OUT = r"D:\manfenhu-website\youth-fitness-website\public\images\news"

JOBS = [
    ("heart-rate-training",
     "写实摄影：学校操场边，一位穿运动服的教练用两根手指按在一名中国中学生的手腕上测脉搏，"
     "学生刚跑完步、额头有薄汗、呼吸略快但站姿放松，红色跑道背景虚化，"
     "下午明亮自然光，画面干净真实、专业。画面中不要出现任何文字、数字、logo、水印。"),
    ("sick-day-training",
     "写实摄影：家里客厅，一名中国中学生裹着薄毯坐在沙发上休息，脸色略显疲惫，"
     "手里捧着一杯温水，茶几上放着纸巾盒；家长坐在旁边椅子上，伸手轻触孩子额头试探体温，"
     "室内柔和自然光，氛围安静温暖。画面中不要出现任何文字、logo、水印。"),
    ("coach-communication",
     "写实摄影：室内体育馆场边，一位中国家长（三十多岁，便装）正与一位穿运动服的教练面对面交谈，"
     "两人神态自然、专注倾听，背景中虚化出学生正在垫子上训练的场景，"
     "明亮室内光线，画面真实干净。画面中不要出现任何文字、logo、水印。"),
]

if __name__ == "__main__":
    print(f"=== {run_jobs(JOBS, OUT)}/{len(JOBS)} generated", flush=True)
