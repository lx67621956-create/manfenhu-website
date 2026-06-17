#!/usr/bin/env python3
"""
Fix index.astro: for each news-card, extract the article slug from href,
then update the img src to /images/news/{slug}.png
"""
import re

INDEX = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\src\pages\news\index.astro'

with open(INDEX, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern: find each news-card block, extract href slug, replace img src
# Match from <article class="news-card"> to </article>
card_pattern = re.compile(
    r'(<article class="news-card">.*?<a href="/news/([^"]+?)".*?)<img src="[^"]*"([^>]*>)',
    re.DOTALL
)

def fix_card(match):
    before = match.group(1)   # everything before <img src=
    slug = match.group(2)      # e.g. zhongkao-sprint
    after = match.group(3)      # everything after the URL in <img ...>
    # Reconstruct with correct src
    new_img = f'<img src="/images/news/{slug}.png"'
    return before + new_img + after

new_content = card_pattern.sub(fix_card, content)

# Also fix the one .svg reference (youth-injury-prevention-guide)
new_content = new_content.replace(
    '/images/news/youth-injury-prevention.svg',
    '/images/news/youth-injury-prevention-guide.png'
)

with open(INDEX, 'w', encoding='utf-8') as f:
    f.write(new_content)

# Verify
count = new_content.count('/images/news/')
bad = new_content.count('brain-fitness-study.png')
print(f'Total image references: {count}')
print(f'Remaining bad references: {bad}')

# Show first 5 and last 5 image refs for verification
refs = re.findall(r'<img src="(/images/news/[^"]+)"', new_content)
print(f'\nFirst 5 refs: {refs[:5]}')
print(f'Last 5 refs: {refs[-5:]}')
