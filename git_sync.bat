@echo off
chcp 65001 >nul
cd /d C:\Users\lx676\manfenhu-website\youth-fitness-website
"D:\APP MAKER\Git\cmd\git.exe" pull origin master --rebase
"D:\APP MAKER\Git\cmd\git.exe" push origin master
echo Done: %ERRORLEVEL%
