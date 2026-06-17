#!/usr/bin/env python3
"""Insert 5 new article cards at the top of index.astro news-grid."""
path = r'C:\Users\lx676\.qclaw\workspace-agent-c6cfa962\manfenhu-website\youth-fitness-website\src\pages\news\index.astro'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

new_cards = '''
        <article class="news-card">
          <a href="/news/beijing-district-diff" class="news-image">
            <img src="/images/news/beijing-district-diff.jpg" alt="北京各区中考体育标准" loading="lazy" />
          </a>
          <div class="news-content">
            <time datetime="2026-06-13">2026年6月13日</time>
            <h2><a href="/news/beijing-district-diff">北京各区中考体育标准一样吗？海淀区真的更难吗？</a></h2>
            <p>北京中考体育评分标准全市统一，但各区竞争环境差异显著。满分虎为你解答各区真实情况，助你做出最优选择。</p>
            <a href="/news/beijing-district-diff" class="read-more">阅读全文 →</a>
          </div>
        </article>

        <article class="news-card">
          <a href="/news/zhongkao-girls-guide" class="news-image">
            <img src="/images/news/zhongkao-girls-guide.jpg" alt="女生中考体育备考" loading="lazy" />
          </a>
          <div class="news-content">
            <time datetime="2026-06-13">2026年6月13日</time>
            <h2><a href="/news/zhongkao-girls-guide">女生中考体育备考全攻略：生理期、项目选择与提分技巧</a></h2>
            <p>女生备考中考体育有哪些特殊注意事项？满分虎专门整理生理期应对策略、选考项目建议，帮助女生体育拿高分。</p>
            <a href="/news/zhongkao-girls-guide" class="read-more">阅读全文 →</a>
          </div>
        </article>

        <article class="news-card">
          <a href="/news/zhongkao-online-offline" class="news-image">
            <img src="/images/news/zhongkao-online-offline.jpg" alt="中考体育线上线下对比" loading="lazy" />
          </a>
          <div class="news-content">
            <time datetime="2026-06-13">2026年6月13日</time>
            <h2><a href="/news/zhongkao-online-offline">中考体育线上课有用吗？线上vs线下训练真实对比</a></h2>
            <p>中考体育线上课越来越火。满分虎从专业角度深度对比线上课和线下训练，帮家长做出正确选择。</p>
            <a href="/news/zhongkao-online-offline" class="read-more">阅读全文 →</a>
          </div>
        </article>

        <article class="news-card">
          <a href="/news/zhongkao-hd-cost" class="news-image">
            <img src="/images/news/zhongkao-hd-cost.jpg" alt="北京中考体育培训价格" loading="lazy" />
          </a>
          <div class="news-content">
            <time datetime="2026-06-13">2026年6月13日</time>
            <h2><a href="/news/zhongkao-hd-cost">北京中考体育培训多少钱？海淀、西城最新价格对比</a></h2>
            <p>中考体育培训班价格差异大，从几千到几万都有。满分虎详细对比北京各区主流机构收费，帮你避开价格陷阱。</p>
            <a href="/news/zhongkao-hd-cost" class="read-more">阅读全文 →</a>
          </div>
        </article>

        <article class="news-card">
          <a href="/news/zhongkao-late-start" class="news-image">
            <img src="/images/news/zhongkao-late-start.jpg" alt="中考体育什么时候开始练" loading="lazy" />
          </a>
          <div class="news-content">
            <time datetime="2026-06-13">2026年6月13日</time>
            <h2><a href="/news/zhongkao-late-start">中考体育什么时候开始练最合适？晚了还能补救吗？</a></h2>
            <p>很多家长问：孩子初一初二还没开始练，来得及吗？满分虎专业教练告诉你不同年级的最佳启动时间，以及高效补救方案。</p>
            <a href="/news/zhongkao-late-start" class="read-more">阅读全文 →</a>
          </div>
        </article>

'''

# Insert after "<div class=\\"news-grid\\">"
marker = '        <div class="news-grid">\n'
if new_cards.strip() in content:
    print("Cards already inserted!")
else:
    content = content.replace(marker, marker + new_cards, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Inserted 5 new article cards at the top of news-grid!")
