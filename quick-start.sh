#!/bin/bash
# 满分虎项目快速启动脚本

echo "=== 满分虎学员档案系统 快速启动 ==="
echo ""

# 检查当前目录
if [ ! -f "youth-fitness-website/package.json" ]; then
    echo "❌ 错误：请在 manfenhu-website 目录下运行此脚本"
    exit 1
fi

echo "当前项目状态:"
cd youth-fitness-website
echo "  分支: $(git branch --show-current)"
echo "  最新提交: $(git log --oneline -1)"
echo ""

echo "选择操作:"
echo "  1) 本地开发预览"
echo "  2) 部署到生产环境"
echo "  3) 导出数据备份"
echo "  4) 查看项目状态"
echo "  5) 回滚到备份点"
echo ""

read -p "请输入数字 (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 启动本地开发服务器..."
        npm install
        npx astro dev
        ;;
    2)
        echo ""
        read -p "⚠️  确认部署到生产环境？(y/n): " confirm
        if [ "$confirm" = "y" ]; then
            echo "📦 部署中..."
            export VERCEL_TOKEN="REDACTED_VERCEL_TOKEN"
            npx vercel@58.9.0 --prod --yes
            echo ""
            echo "✅ 部署完成！"
            echo "   访问: https://www.manfenhu.com"
        else
            echo "❌ 已取消部署"
        fi
        ;;
    3)
        echo ""
        echo "📥 数据备份方式:"
        echo "   1. 访问 https://www.manfenhu.com/students.html"
        echo "   2. 点击 '批量导出' 按钮"
        echo "   3. 保存 CSV 文件到本地"
        echo ""
        echo "💡 提示: 建议每周备份一次"
        ;;
    4)
        echo ""
        echo "📊 项目状态:"
        echo ""
        git status --short
        echo ""
        echo "🌐 线上页面:"
        echo "   工具导航: https://www.manfenhu.com/tools/"
        echo "   学员列表: https://www.manfenhu.com/students.html"
        echo "   成绩测评: https://www.manfenhu.com/tools/assessment.html"
        echo "   课后总结: https://www.manfenhu.com/tools/summary.html"
        echo "   群话术海报: https://www.manfenhu.com/tools/group.html"
        ;;
    5)
        echo ""
        read -p "⚠️  确认回滚到备份点 backup-before-ui-polish？(y/n): " confirm
        if [ "$confirm" = "y" ]; then
            git checkout backup-before-ui-polish
            echo "✅ 已回滚到备份点"
            echo "💡 如需恢复，运行: git checkout master"
        else
            echo "❌ 已取消回滚"
        fi
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "✨ 完成！"
