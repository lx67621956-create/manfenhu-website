import os, re, json

BASE = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\src\pages\news'
articles = []

for f in sorted(os.listdir(BASE)):
    if f == 'index.astro' or not f.endswith('.astro'):
        continue
    path = os.path.join(BASE, f)
    with open(path, 'r', encoding='utf-8') as fh:
        content = fh.read()
    
    # Extract image URL
    img_match = re.search(r'image="(https://images\.unsplash\.com/photo-[^"]+)"', content)
    img = img_match.group(1) if img_match else 'NO_IMAGE'
    
    # Extract title from h1
    title_match = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL)
    title = title_match.group(1).strip() if title_match else f.replace('.astro', '')
    
    # Extract pubDate
    date_match = re.search(r'pubDate:\s*\'([^\']+)', content)
    if not date_match:
        date_match = re.search(r'pubDate:\s*"([^"]+)', content)
    date = date_match.group(1) if date_match else '2026-05-08'
    
    slug = f.replace('.astro', '')
    articles.append({
        'file': f,
        'slug': slug,
        'title': title,
        'image': img,
        'date': date
    })

print(json.dumps(articles, ensure_ascii=False, indent=2))
print(f'\nTotal: {len(articles)} articles')