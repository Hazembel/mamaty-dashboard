#!/bin/bash

# Stop on errors
set -e

echo "Building React app..."
npm install
npm run build

echo "Deploying to 'deploy' branch..."
cd dist

# Initialize git if not already
git init
git checkout -B deploy

# Add and commit
git add .
git commit -m "Deploy $(date '+%Y-%m-%d %H:%M:%S')"

# Push to deploy branch (force)
git remote add origin https://github.com/Hazembel/mamaty-dashboard.git 2>/dev/null || true
git push --force origin deploy

# Cleanup
rm -rf .git
cd ..

echo "Deployment complete! Check your GitHub Pages link."
