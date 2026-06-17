import os
d = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\src\pages\news'
bad = ['性价比', '便宜', '实惠', '划算']
files = ['zhongkao-late-start.astro','zhongkao-online-offline.astro','zhongkao-girls-guide.astro','zhongkao-district.astro']
found = False
for f in files:
    content = open(os.path.join(d, f), encoding='utf-8').read()
    for w in bad:
        if w in content:
            print(f'{f}: found "{w}"')
            found = True
if not found:
    print('CLEAN - no forbidden words')
