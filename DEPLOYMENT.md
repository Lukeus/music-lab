# 🚀 GitHub Deployment Guide

## Quick Deploy (5 minutes)

### 1. Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and click "New repository"
2. Repository name: `music-lab` (or your preferred name)
3. Set to **Public** (required for free GitHub Pages)
4. Don't initialize with README (we already have files)
5. Click "Create repository"

### 2. Connect and Push Your Code
```bash
# Navigate to your project
cd /Users/lukeusadams/source/repos/music-site

# Rename branch to main (GitHub's default)
git branch -M main

# Add your GitHub repository as origin
git remote add origin https://github.com/YOUR_USERNAME/music-lab.git

# Push your code to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

### 3. Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section (left sidebar)
4. Under **Source**, select **"GitHub Actions"**
5. The deployment will start automatically!

### 4. Your Site is Live! 🎉
Your music lab will be available at: `https://YOUR_USERNAME.github.io/music-lab`

## 🛠️ Advanced Options

### Custom Domain Setup
If you own a domain like `music.lukeus.com`:

1. **DNS Configuration**:
   - Add CNAME record: `music` → `YOUR_USERNAME.github.io`
   - Or A records pointing to GitHub's IPs

2. **GitHub Setup**:
   - Edit `CNAME` file in your repo
   - Replace content with your domain: `music.lukeus.com`
   - Push changes to GitHub

3. **Enable in Settings**:
   - Go to repository Settings → Pages
   - Add your custom domain
   - Enable "Enforce HTTPS"

### Automatic Deployments
- ✅ **Already configured!** Every push to `main` branch automatically deploys
- 📁 The `.github/workflows/deploy.yml` handles this
- 🔄 Usually takes 1-2 minutes to update live site

### Avatar Image
Don't forget to:
1. Replace `assets/images/lukeus-avatar.png` with your actual photo
2. Keep it 400x400 pixels minimum
3. Push the updated image to GitHub

## 📋 Pre-Deployment Checklist

- [ ] GitHub repository created and set to public
- [ ] Code pushed to `main` branch
- [ ] GitHub Pages enabled with "GitHub Actions" source
- [ ] Avatar image replaced with your actual photo
- [ ] All links and content reviewed
- [ ] Custom domain configured (if applicable)

## 🔧 Troubleshooting

**Site not updating?**
- Check Actions tab for deployment status
- Wait 5-10 minutes for changes to propagate
- Clear browser cache

**404 Error?**
- Ensure repository is public
- Check that `index.html` exists in root directory
- Verify GitHub Pages is enabled

**Custom domain issues?**
- Check DNS propagation (can take up to 24 hours)
- Ensure HTTPS is enabled in Pages settings
- Verify CNAME file content matches your domain

## 🎵 What Gets Deployed

Your complete music lab includes:
- 🏠 Professional homepage with avatar
- 🎸 Acoustic storytelling project showcase
- 🎛️ Electronic transformation experiments
- 📝 Creative journal with your personal journey
- 📱 Full mobile responsiveness
- ✨ All animations and interactive effects

## 🔄 Future Updates

To update your live site:
```bash
# Make your changes to files
# Then commit and push:
git add .
git commit -m "Update website content"
git push origin main
```

The site will automatically update within 1-2 minutes! 🚀
