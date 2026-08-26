#!/usr/bin/env python3
"""
满分虎网站资讯文章配图批量生成脚本
- 读取所有 src/pages/news/*.astro
- 为每篇生成主题匹配图片（gpt-image-2）
- 保存为 public/images/news/<slug>.png
- 更新 .astro 文件中的 image prop
- 更新 news/index.astro 中的图片引用（一次性处理）
"""

import os, re, json, base64, urllib.request, time, pathlib, glob

API_KEY = __import__('os').environ.get('IMG_API_KEY', '')
API_URL = 'https://aiapi.up.railway.app/v1/images/generations'
MODEL   = 'gpt-image-2'
SIZE    = '1024x1024'
OUT_DIR = pathlib.Path(r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\public\images\news')
ARTICLES_DIR = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\src\pages\news'
INDEX_PATH   = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\src\pages\news\index.astro'

# 为每篇文章定制生图 prompt（英文，模型理解更好）
PROMPTS = {
    'zhongkao-22x4-analysis':        'Chinese middle school students taking physical exam, choosing sports items, red track field, realistic photo, bright sunlight',
    'qingnian-tiyu-policy':          'Chinese teenager playing basketball in school uniform, sports policy concept, bright and inspiring, realistic photo',
    'youth-fitness-data':             'Chinese school students running on red track, physical fitness test, sunny day, realistic photo',
    'youth-injury-prevention-guide': 'Young athlete stretching leg after running, sports injury prevention, outdoor track, realistic photo',
    'youth-pullup-master':           'Chinese teenage boy doing pull-up on metal bar, school gym, realistic photo',
    'brain-fitness-study':            'Happy Chinese schoolboy holding books and running on campus, sports and study balance, bright sunny day, realistic photo',
    'zhongkao-running':              'Chinese student running on red track, middle school sports day, realistic photo, sunny',
    'zhongkao-jump':                'Chinese teenager doing standing long jump on sports field, realistic photo',
    'zhongkao-ball':                 'Chinese teenager dribbling basketball on outdoor court, realistic photo',
    'zhongkao-breathing':            'Chinese coach teaching breathing technique to student on sports field, realistic photo',
    'zhongkao-diet':                'Healthy food plate for athlete, chicken rice vegetables, nutrition for sports, realistic photo',
    'zhongkao-injury-prevention':    'Sports injury prevention, young athlete wrapping ankle, outdoor track, realistic photo',
    'zhongkao-parent-training':       'Parent watching child training on sports field, supportive family, realistic photo',
    'zhongkao-pullup':              'Teenage boy practicing pull-up on bar, school gym, realistic photo',
    'zhongkao-selection':            'Chinese student choosing sports event, coach advising, outdoor track, realistic photo',
    'zhongkao-warmup':              'Chinese students warming up before running, dynamic stretching, outdoor track, realistic photo',
    'zhongkao-winter':               'Chinese students jogging in winter, cold weather, breath visible, realistic photo',
    'choose-institution':              'Chinese parents visiting sports training center, coach explaining, bright indoor, realistic photo',
    'exam-psychology':                 'Chinese middle school student confident before sports exam, thumbs up, realistic photo',
    'growth-development':             'Chinese teenager growing tall, before and after sports training, realistic photo',
    'international-training':         'Chinese and international students playing sports together, soccer field, realistic photo',
    'parent-mistakes':                'Chinese parent and child talking about sports training, supportive conversation, realistic photo',
    'posture-correction':             'Chinese coach correcting running posture, outdoor track, realistic photo',
    'science-youth-training':         'Chinese science teacher explaining sports physiology to students, classroom, realistic photo',
    'sports-injury':                  'Young athlete with knee ice pack, sports injury recovery, realistic photo',
    'sports-sensitive-period':        'Young children doing agility ladder drill, sports sensitive period training, realistic photo',
    'us-sports-education':           'American high school students playing American football, sports education, realistic photo',
}

def generate_image(slug: str) -> bytes | None:
    prompt = PROMPTS.get(slug, 'Chinese middle school student sports training, realistic photo')
    payload = json.dumps({
        'model': MODEL,
        'prompt': prompt,
        'n': 1,
        'size': SIZE,
    }).encode('utf-8')

    req = urllib.request.Request(API_URL, data=payload, headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {API_KEY}',
    }, method='POST')

    try:
        resp = urllib.request.urlopen(req, timeout=90)
        data = json.loads(resp.read())
        b64 = data['data'][0]['b64_json']
        return base64.b64decode(b64)
    except Exception as e:
        print(f'  [!] {slug}: generate FAILED: {e}')
        return None

def update_article_image(astro_path: str, img_path: str):
    """Update image prop in .astro file (JSX attribute format)"""
    with open(astro_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match image="..." (the full value including quotes)
    pattern = r'image="[^"]*"'
    replacement = f'image="{img_path}"'

    if re.search(pattern, content):
        updated = re.sub(pattern, replacement, content)
    else:
        # No image prop exists, add it before the closing > of ArticleLayout tag
        # Insert after pubDate prop if exists, otherwise before the closing >
        if 'pubDate=' in content:
            updated = re.sub(r'(pubDate=\{pubDate\})', r'\1\n  image="' + img_path + '"', content)
        else:
            # Insert before the closing > of the opening ArticleLayout tag
            updated = re.sub(r'(<ArticleLayout[^>]*)(>)', r'\1\n  image="' + img_path + r'"\2', content, count=1)

    with open(astro_path, 'w', encoding='utf-8') as f:
        f.write(updated)

def update_index( slug_map: dict):
    """Update news/index.astro all at once"""
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    for slug, img_filename in slug_map.items():
        # Case 1: current src is a local SVG or PNG
        content = re.sub(
            rf'src="/images/news/{slug}\.(svg|png)"',
            f'src="/images/news/{img_filename}"',
            content
        )
        # Case 2: current src is an Unsplash URL
        content = re.sub(
            rf'src="[^"]*photo-[^"]*"',
            f'src="/images/news/{img_filename}"',
            content
        )

    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    astro_files = sorted(glob.glob(os.path.join(ARTICLES_DIR, '*.astro')))

    # Exclude index.astro itself
    astro_files = [f for f in astro_files if os.path.basename(f) != 'index.astro']

    print(f'Found {len(astro_files)} article files')
    success = 0
    fail = 0
    slug_map = {}  # slug -> img_filename for batch index update

    for astro_path in astro_files:
        slug = os.path.splitext(os.path.basename(astro_path))[0]
        img_filename = f'{slug}.png'
        img_path_local = f'/images/news/{img_filename}'
        out_file = OUT_DIR / img_filename

        # Skip if image already exists (set FORCE_REGEN=True to force)
        FORCE_REGEN = False
        if out_file.exists() and not FORCE_REGEN:
            print(f'[skip] {slug} (image exists)')
            success += 1
            slug_map[slug] = img_filename
            continue

        print(f'Generating ({success+fail+1}/{len(astro_files)}): {slug} ...')
        img_bytes = generate_image(slug)
        if img_bytes:
            out_file.write_bytes(img_bytes)
            print(f'  -> Saved {len(img_bytes)//1024} KB')

            # Update .astro file
            update_article_image(astro_path, img_path_local)
            print(f'  -> Updated {os.path.basename(astro_path)}')

            success += 1
            slug_map[slug] = img_filename
            time.sleep(2)  # rate limit
        else:
            fail += 1
            print(f'  -> FAILED, skipping')

    # Batch update index.astro
    print(f'\nUpdating index.astro ...')
    update_index(slug_map)
    print(f'Index updated with {len(slug_map)} entries')

    print(f'\n===== DONE: {success} success, {fail} failed, {success+fail} total =====')

if __name__ == '__main__':
    main()
