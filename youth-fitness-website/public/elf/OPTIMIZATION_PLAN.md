# 精灵世界优化计划

## 一、音效系统改进 🔇
### 目标
- 加音效开关按钮
- 修复音效重叠bug

### 修改 student.js
1. 全局变量 `var _soundEnabled = localStorage.getItem('elf_sound') !== 'off';`
2. `playSound()` 开头加 `if(!_soundEnabled) return;`
3. 全局click音效加 `_lastSoundTime` 守卫（100ms内已播自定义音效则跳过）
4. `rHome()` 顶栏头像区加音效开关按钮 🔊/🔇
5. `toggleSound()` 函数切换开关+保存到localStorage

### 修改 student.css
1. 加 `.sound-toggle` 按钮样式

## 二、CSS瘦身 🎯
### 目标
- 25KB → ~12KB
- 去冗余、合并重复规则、短色值

### 方法
- 合并重复的CSS规则
- 去掉未使用的选择器
- 保留重要的可读注释
- 所有颜色缩写成3位hex

## 三、JS瘦身 📦
### 目标
- 45KB → ~25KB
- 压缩但不破坏功能

### 方法
- 去除多余空白/注释
- 保留功能完整

## 四、PWA增强 ⚡
### 目标
- Service Worker 缓存精灵图片
- 离线降级页面
- 更好的缓存策略
