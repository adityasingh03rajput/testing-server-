@echo off
echo ========================================
echo Deploying to Render
echo ========================================
echo.

echo Step 1: Creating render-deploy branch...
git checkout -b render-deploy 2>nul || git checkout render-deploy

echo Step 2: Copying server files to root...
copy /Y server\index.js index.js
copy /Y server\package.json package.json
copy /Y server\package-lock.json package-lock.json
copy /Y server\face-api-service.js face-api-service.js

echo Step 3: Creating .gitignore for render...
echo node_modules/ > .gitignore.render
echo .env >> .gitignore.render
echo uploads/* >> .gitignore.render
echo models/* >> .gitignore.render
copy /Y .gitignore.render .gitignore

echo Step 4: Adding files...
git add index.js package.json package-lock.json face-api-service.js .gitignore

echo Step 5: Committing...
git commit -m "Deploy: MongoDB Atlas integration - %date% %time%"

echo Step 6: Pushing to render repository...
git push render render-deploy:main --force

echo Step 7: Switching back to main branch...
git checkout main

echo.
echo ========================================
echo ✅ Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Go to https://dashboard.render.com
echo 2. Check deployment logs
echo 3. Add MONGODB_URI environment variable if not set
echo.
pause
