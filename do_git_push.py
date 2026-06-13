import subprocess, os

os.chdir(r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website')

# Write commit message to file
msg = 'feat: 新增5篇资讯文章 + 全部配图替换为AI生图\n\n- 新增5篇文章(考前冲刺/五大误区/科学训练/心理调节/学员案例)\n- 全部32篇文章配图替换为AI生成的主题配图\n- 更新news/index.astro添加5篇新文章卡片'
with open('COMMIT_MSG.txt', 'w', encoding='utf-8') as f:
    f.write(msg)

# git add
r = subprocess.run(['git', 'add', '-A'], capture_output=True, text=True)
print('git add:', r.returncode, r.stderr[:200] if r.stderr else '')

# git commit
r = subprocess.run(['git', 'commit', '-F', 'COMMIT_MSG.txt'], capture_output=True, text=True)
print('git commit:', r.returncode, r.stdout[:300] if r.stdout else r.stderr[:300])

# git push
r = subprocess.run(['git', 'push'], capture_output=True, text=True)
print('git push:', r.returncode, r.stdout[:300] if r.stdout else r.stderr[:300])

os.remove('COMMIT_MSG.txt')
print('DONE')
