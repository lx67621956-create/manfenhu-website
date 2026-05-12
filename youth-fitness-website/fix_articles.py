"""
修复所有文章文件的HTML格式问题：
1. 删除重复的 <h1> 标签（每篇开头那个）
2. 修复嵌套的 <ul><ul> 结构
3. 修复 <p><ul> 和 <p><div> 等乱嵌套
4. 确保每篇文章以 <p> 开头，中间有 h2/h3，结尾有 <p class="conclusion">
"""
import os
import re

NEWS_DIR = r"C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\src\pages\news"

# 需要修复的文章
articles = [
    "zhongkao-running.astro",
    "choose-institution.astro",
    "zhongkao-selection.astro",
    "zhongkao-winter.astro",
    "zhongkao-pullup.astro",
    "zhongkao-jump.astro",
    "zhongkao-ball.astro",
    "exam-psychology.astro",
    "growth-development.astro",
    "international-training.astro",
    "parent-mistakes.astro",
    "us-sports-education.astro",
    "science-youth-training.astro",
    "sports-sensitive-period.astro",
    "posture-correction.astro",
]

def fix_article(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. 删除 ArticleLayout 开始标签后紧跟的 <h1>xxx</h1>（重复的）
    # 匹配 <ArticleLayout ...> 之后紧跟的 <h1>...</h1> 并删除
    content = re.sub(
        r'(<ArticleLayout[^>]*>)\s*<h1>[^<]*</h1>\s*',
        r'\1\n',
        content
    )

    # 2. 修复嵌套的 <ul><ul> 或 <ul>\n<ul> 模式
    # 把连续单独的 <ul><li>...</li></ul> 合并成一个 <ul><li>...</li><li>...</li></ul>
    # 先处理 newline 形式的
    content = re.sub(
        r'<ul>\s*\n\s*<ul>',
        '<ul>',
        content
    )
    # 处理 </ul>\n<ul><ul> 的情况
    content = re.sub(
        r'</ul>\s*\n\s*<ul>\s*\n\s*<ul>',
        '</ul>\n<ul>',
        content
    )
    # 处理 </ul>\n<ul> 合并到上一个 ul
    content = re.sub(
        r'</ul>\s*\n\s*<ul>',
        '',  # 直接去掉换行+单独的ul开头
        content
    )
    # 处理 <p>xxx</p>\n<ul> 改成 \n<ul>
    content = re.sub(
        r'</p>\s*\n\s*<ul>',
        '</p>\n<ul>',
        content
    )
    # 处理 <p>xxx\n<ul> 改成 <p>xxx</p>\n<ul>
    content = re.sub(
        r'(<p>[^<]*)\n\s*<ul>',
        r'\1</p>\n<ul>',
        content
    )
    # 处理 <p><strong>xxx</strong>xxx\n<ul> 改成 <p><strong>xxx</strong>xxx</p>\n<ul>
    content = re.sub(
        r'(<p>(?:(?!</p>).)*)\n\s*<ul>',
        r'\1</p>\n<ul>',
        content,
        flags=re.DOTALL
    )

    # 3. 修复 <p><ul> 和 <p><div> 等乱嵌套
    # <p><ul>...</ul></p> -> <ul>...</ul>
    content = re.sub(
        r'<p>\s*(<ul>)',
        r'\1',
        content
    )
    content = re.sub(
        r'(</ul>)\s*</p>',
        r'\1',
        content
    )
    # <p><div -> <div
    content = re.sub(
        r'<p>\s*(<div)',
        r'\1',
        content
    )
    content = re.sub(
        r'(</div>)\s*</p>',
        r'\1',
        content
    )
    # <p><br 改成 </p><br
    content = re.sub(
        r'<p>\s*(<br)',
        r'\1',
        content
    )
    # <br></p> 改成 <br>
    content = re.sub(
        r'(<br[^>]*>)\s*</p>',
        r'\1',
        content
    )
    # 修复 <p>...\n<p>...</p>\n</p> 这种嵌套
    content = re.sub(
        r'<p>\s*\n\s*<p>',
        '<p>',
        content
    )
    content = re.sub(
        r'</p>\s*\n\s*</p>',
        '</p>',
        content
    )

    # 4. 确保结尾有 conclusion paragraph
    # 如果没有 </ArticleLayout> 前的 <p> 有 class="conclusion"，找一个合适的段落加上
    if '</ArticleLayout>' in content:
        # 检查是否已有 conclusion
        if 'class="conclusion"' not in content:
            # 找最后一个 </p> 前面插一个 conclusion
            # 找到 </ArticleLayout> 前的最后一段
            before_end = content.split('</ArticleLayout>')[0]
            # 找最后一个 </p>
            last_p_match = list(re.finditer(r'</p>', before_end))
            if last_p_match:
                last_p_pos = last_p_match[-1].end()
                conclusion = '<p class="conclusion">欢迎预约满分虎的免费体能测试，了解孩子的体能状况，制定科学的训练计划。</p>'
                content = content[:last_p_pos] + conclusion + content[last_p_pos:]

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

total = len(articles)
fixed = 0
for i, fname in enumerate(articles):
    path = os.path.join(NEWS_DIR, fname)
    if os.path.exists(path):
        ok = fix_article(path)
        if ok:
            print(f"[{i+1}/{total}] FIXED: {fname}")
            fixed += 1
        else:
            print(f"[{i+1}/{total}] SKIP:   {fname}")
    else:
        print(f"[{i+1}/{total}] MISSING: {fname}")

print(f"\n完成！共修复 {fixed}/{total} 个文件")
