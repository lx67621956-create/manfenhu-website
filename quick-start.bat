@echo off
chcp 65001 >nul
REM 满分虎项目快速启动脚本 (Windows)

echo ========================================
echo    满分虎学员档案系统 快速启动
echo ========================================
echo.

REM 检查当前目录
if not exist "youth-fitness-website\package.json" (
    echo ❌ 错误：请在 manfenhu-website 目录下运行此脚本
    pause
    exit /b 1
)

cd youth-fitness-website

echo 当前项目状态:
for /f "tokens=*" %%a in ('git branch --show-current') do set branch=%%a
echo   分支: %branch%
for /f "tokens=*" %%a in ('git log --oneline -1') do echo   最新提交: %%a
echo.

:menu
echo 选择操作:
echo   1) 本地开发预览
echo   2) 部署到生产环境
echo   3) 导出数据备份
echo   4) 查看项目状态
echo   5) 回滚到备份点
echo   0) 退出
echo.

set /p choice="请输入数字 (0-5): "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto deploy
if "%choice%"=="3" goto backup
if "%choice%"=="4" goto status
if "%choice%"=="5" goto rollback
if "%choice%"=="0" goto end
echo ❌ 无效选择
echo.
goto menu

:dev
echo.
echo 🚀 启动本地开发服务器...
call npm install
call npx astro dev
goto end

:deploy
echo.
set /p confirm="⚠️  确认部署到生产环境？(y/n): "
if /i "%confirm%"=="y" (
    if "%VERCEL_TOKEN%"=="" (
        echo ❌ 未设置 VERCEL_TOKEN 环境变量，无法部署。
        echo   请先执行：set VERCEL_TOKEN=你的token
        pause
        goto end
    )
    echo 📦 部署中...
    call npx vercel@58.9.0 --prod --yes
    echo.
    echo ✅ 部署完成！
    echo    访问: https://www.manfenhu.com
) else (
    echo ❌ 已取消部署
)
echo.
pause
goto end

:backup
echo.
echo 📥 数据备份方式:
echo    1. 访问 https://www.manfenhu.com/students.html
echo    2. 点击 '批量导出' 按钮
echo    3. 保存 CSV 文件到本地
echo.
echo 💡 提示: 建议每周备份一次
echo.
pause
goto end

:status
echo.
echo 📊 项目状态:
echo.
git status --short
echo.
echo 🌐 线上页面:
echo    工具导航: https://www.manfenhu.com/tools/
echo    学员列表: https://www.manfenhu.com/students.html
echo    成绩测评: https://www.manfenhu.com/tools/assessment.html
echo    课后总结: https://www.manfenhu.com/tools/summary.html
echo    群话术海报: https://www.manfenhu.com/tools/group.html
echo.
pause
goto end

:rollback
echo.
set /p confirm="⚠️  确认回滚到备份点 backup-before-ui-polish？(y/n): "
if /i "%confirm%"=="y" (
    git checkout backup-before-ui-polish
    echo ✅ 已回滚到备份点
    echo 💡 如需恢复，运行: git checkout master
) else (
    echo ❌ 已取消回滚
)
echo.
pause
goto end

:end
echo.
echo ✨ 完成！
pause
