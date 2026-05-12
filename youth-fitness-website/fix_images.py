import os, re

BASE = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\src\pages\news'

replacements = {
    'zhongkao-jump.astro': 'photo-1549060279-7e168fcee0c2',
    'zhongkao-ball.astro': 'photo-1571902943202-507ec2618e8f',
    'science-youth-training.astro': 'photo-1534258936925-c58bed479fcb',
    'sports-injury.astro': 'photo-1571008887538-b36bb32f4571',
    'sports-sensitive-period.astro': 'photo-1608571423902-eed4a5ad8108',
    'zhongkao-winter.astro': 'photo-1583454110551-21f2fa2afe61',
    'zhongkao-breathing.astro': 'photo-1574680096145-d05b474e2155',
    'zhongkao-warmup.astro': 'photo-1517836357463-d25dfeac3438',
}

changed = 0
for filename, new_id in replacements.items():
    fp = os.path.join(BASE, filename)
    with open(fp, 'r', encoding='utf-8') as f:
        content = f.read()
    pattern = r'image="https://images\.unsplash\.com/photo-[^"]+\?w=1200&h=600&fit=crop"'
    new_url = f'image="https://images.unsplash.com/{new_id}?w=1200&h=600&fit=crop"'
    new_content = re.sub(pattern, new_url, content)
    if new_content != content:
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"[OK] {filename} -> {new_id}")
        changed += 1
    else:
        print(f"[--] {filename} (no change)")

print(f"\nTotal: {changed} files updated")