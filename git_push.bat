@echo off
cd /d C:\Users\lx676\manfenhu-website\youth-fitness-website
"C:\Program Files\Git\cmd\git.exe" add src/layouts/ArticleLayout.astro
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: ArticleLayout兼容coverImage/date双命名，解决18篇文章配图+日期不显示问题"
"C:\Program Files\Git\cmd\git.exe" push origin master
echo Done: %ERRORLEVEL%
