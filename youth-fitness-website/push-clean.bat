@echo off
cd /d "%~dp0"

echo Deleting index.lock if exists...
del /f /q .git\index.lock 2>nul

echo Removing node_modules from git tracking...
git rm --cached -r node_modules/
if errorlevel 1 (
    echo ERROR: git rm failed
    del /f /q .git\index.lock 2>nul
    git rm --cached -r node_modules/
)

echo Adding to .gitignore...
echo node_modules/ >> .gitignore
echo dist/ >> .gitignore

echo Staging .gitignore and committing...
git add .gitignore
git commit -m "chore: untrack node_modules, add to gitignore"

echo Pushing...
git push origin main
