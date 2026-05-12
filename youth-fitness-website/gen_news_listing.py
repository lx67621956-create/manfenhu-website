import os, re

BASE = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\src\pages\news'

articles = []
for f in sorted(os.listdir(BASE)):
    if f == 'index.astro' or not f.endswith('.astro'):
        continue
    path = os.path.join(BASE, f)
    with open(path, 'r', encoding='utf-8') as fh:
        content = fh.read()
    
    title_m = re.search(r'title="([^"]+)"', content)
    desc_m = re.search(r'description="([^"]+)"', content)
    date_m = re.search(r'pubDate="([^"]+)"', content)
    img_m = re.search(r'image="([^"]+)"', content)
    
    title = title_m.group(1) if title_m else f.replace('.astro', '')
    desc = desc_m.group(1) if desc_m else ''
    date = date_m.group(1) if date_m else '2026-05-08'
    img = img_m.group(1) if img_m else ''
    img = img.replace('w=1200&h=600', 'w=800&h=400')
    slug = f.replace('.astro', '')
    
    parts = date.split('-')
    date_display = f'{parts[0]}年{int(parts[1])}月{int(parts[2])}日'
    
    articles.append({'slug':slug,'title':title,'desc':desc,'date':date,'date_display':date_display,'image':img})

# Generate card HTML
cards = []
for a in articles:
    card = f'        <article class="news-card">\n          <a href="/news/{a["slug"]}" class="news-image">\n            <img src="{a["image"]}" alt="{a["title"]}" loading="lazy" />\n          </a>\n          <div class="news-content">\n            <time datetime="{a["date"]}">{a["date_display"]}</time>\n            <h2><a href="/news/{a["slug"]}">{a["title"]}</a></h2>\n            <p>{a["desc"]}</p>\n            <a href="/news/{a["slug"]}" class="read-more">阅读全文 →</a>\n          </div>\n        </article>'
    cards.append(card)

cards_html = '\n\n'.join(cards)

# Generate the full file
output = '''---
import BaseLayout from '@layouts/BaseLayout.astro';
---

<BaseLayout title="资讯动态 - 满分虎体育">
  <section class="page-hero" style="background:linear-gradient(135deg, var(--c-secondary), #00B8D4);">
    <div class="container"><h1>资讯动态</h1></div>
  </section>

  <section class="section">
    <div class="container">
      <div class="news-grid">

''' + cards_html + '''

      </div>
    </div>
  </section>
</BaseLayout>

<style>
  .page-hero { color: #fff; padding: 48px 0; text-align: center; }
  .page-hero h1 { font-size: 2rem; }
  
  .section { padding: 64px 0; }
  .news-grid { display: grid; gap: 32px; max-width: 900px; margin: 0 auto; }
  
  .news-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .news-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  
  .news-image {
    display: block;
    height: 200px;
    overflow: hidden;
    text-decoration: none;
  }
  
  .news-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .news-image:hover img {
    transform: scale(1.05);
  }
  
  .news-content {
    padding: 24px;
  }
  
  .news-content time {
    color: #888;
    font-size: 0.875rem;
  }
  
  .news-content h2 {
    margin: 12px 0;
    font-size: 1.25rem;
  }
  
  .news-content h2 a {
    color: var(--c-text);
    text-decoration: none;
  }
  
  .news-content h2 a:hover {
    color: var(--c-primary);
  }
  
  .news-content p {
    color: #666;
    line-height: 1.6;
    margin-bottom: 16px;
  }
  
  .read-more {
    color: var(--c-primary);
    text-decoration: none;
    font-weight: 500;
  }
  
  .read-more:hover {
    text-decoration: underline;
  }
</style>
'''

target = os.path.join(BASE, 'index.astro')
with open(target, 'w', encoding='utf-8') as fh:
    fh.write(output)

print(f'Generated index.astro with {len(articles)} article cards')
print(f'Filesize: {len(output)} bytes')