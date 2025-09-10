# 🚀 CI/CD Setup Guide for Firebase Deployment

This guide will help you set up automated deployments to Firebase when code is merged into the main branch.

## 📋 Prerequisites

- GitHub repository with admin access
- Firebase project (`music-labs-1d8e1`) with Hosting enabled
- Firebase CLI installed locally: `npm install -g firebase-tools`

## 🔧 Setup Steps

### 1. Generate Firebase Service Account

Run this command in your local project directory:

```bash
# Navigate to the website directory
cd apps/website

# Generate the service account key (this will open Firebase in browser)
firebase init hosting:github

# Follow the prompts:
# - Select your Firebase project: music-labs-1d8e1
# - Choose repository: lukeus/music-lab (or your repo name)
# - Set up automatic deployment to live channel when merging to main? Yes
# - Set up automatic preview deployment when PRs are opened? Yes
```

**Alternative Manual Setup:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`music-labs-1d8e1`)
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file (keep it secure!)

### 2. Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

#### Required Secrets:
- **`FIREBASE_SERVICE_ACCOUNT_MUSIC_LABS_1D8E1`**
  - Paste the entire JSON content from the service account file
  - This enables Firebase deployment access

#### Built-in Secrets (automatically available):
- `GITHUB_TOKEN` - Used for PR comments and artifact access

### 3. Verify Firebase Configuration

Ensure your Firebase configuration files are correct:

**`apps/website/firebase.json`** ✅ Already configured
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "!(assets/**|_astro/**|src/**|*.js|*.css|*.map|*.ico|*.png|*.jpg|*.gif|*.svg|*.webp|*.mp3|*.wav|*.ogg)",
        "destination": "/index.html"
      }
    ]
  }
}
```

**`apps/website/.firebaserc`** ✅ Already configured
```json
{
  "projects": {
    "default": "music-labs-1d8e1"
  }
}
```

### 4. Test the Setup

#### Automatic Deployment Test:
1. Create a small change in your code
2. Commit and push to `main` branch
3. Go to **Actions** tab in GitHub
4. Watch the "🚀 Deploy Music Lab to Firebase" workflow run
5. Verify deployment at: https://music-labs-1d8e1.web.app

#### Preview Deployment Test:
1. Create a new branch: `git checkout -b test-preview`
2. Make a small change
3. Push branch and create a Pull Request
4. Go to **Actions** tab and watch "🔍 Preview Deploy to Firebase"
5. Check the PR comment for preview URL

## 🏗️ Workflow Overview

### Production Deploy (`deploy.yml`)
**Triggers:** Push to `main` branch or manual dispatch

**Process:**
1. 🔨 **Build & Test** - Runs TypeScript checking, linting, and builds all packages
2. 🔥 **Deploy to Firebase** - Deploys the built website to live Firebase Hosting
3. 📢 **Notify Status** - Reports success/failure with details

### Preview Deploy (`preview.yml`)
**Triggers:** Pull requests to `main` branch

**Process:**
1. 🔨 **Build PR Changes** - Tests and builds the PR changes
2. 🔥 **Deploy Preview** - Creates temporary preview deployment
3. 💬 **Comment on PR** - Adds comment with preview URL and testing instructions

## 🎯 Features

### ✅ Production Deployment
- **Automatic:** Triggers on every push to main
- **Manual:** Can be triggered from Actions tab
- **Quality Gates:** TypeScript checking, linting, formatting
- **Monorepo Support:** Builds all packages correctly
- **Artifact Caching:** Speeds up deployments

### ✅ Preview Deployments  
- **PR Integration:** Automatic preview for every PR
- **Smart Comments:** Adds helpful testing instructions
- **Temporary URLs:** Auto-expire to keep Firebase clean
- **Feature Testing:** Specific callouts for music tools

### ✅ Advanced Features
- **Concurrency Control:** Cancels old deployments when new ones start
- **Build Artifacts:** Separates build and deploy for reliability
- **Environment Support:** Production/staging environments
- **Comprehensive Logging:** Detailed output with emojis for easy reading
- **Error Handling:** Clear failure notifications with troubleshooting tips

## 🛠️ Troubleshooting

### Common Issues:

#### 1. "Firebase service account not found"
- Verify the secret `FIREBASE_SERVICE_ACCOUNT_MUSIC_LABS_1D8E1` exists
- Check the JSON format is valid
- Ensure the service account has Firebase Hosting Admin role

#### 2. "Build fails during TypeScript checking"
- Run `npm run type-check` locally to identify issues
- Fix TypeScript errors before pushing
- Check that all packages build successfully with `npm run build`

#### 3. "Permission denied during deploy"
- Service account needs "Firebase Hosting Admin" role
- Project ID in `.firebaserc` should match `music-labs-1d8e1`
- Verify Firebase project exists and hosting is enabled

#### 4. "Monorepo build issues"
- Ensure all `package.json` scripts work locally
- Check TypeScript project references in root `tsconfig.json`
- Verify workspace dependencies are correctly configured

### Debug Commands:

```bash
# Test local build (should match CI)
npm ci
npm run type-check
npm run lint
npm run build

# Test Firebase deployment locally
cd apps/website
firebase deploy --only hosting

# Check workspace structure
npm run workspace ls
```

## 🎨 Customization

### Adding New Environments
1. Update `.firebaserc` with additional projects
2. Modify `deploy.yml` to add staging/development targets
3. Add environment-specific secrets if needed

### Modifying Build Process
1. Edit the build steps in both workflow files
2. Add additional testing steps (unit tests, E2E tests)
3. Configure build caching for faster deployments

### Enhanced Notifications
1. Add Slack/Discord webhooks for deployment notifications
2. Integrate with monitoring tools (Sentry, LogRocket)
3. Set up performance monitoring and alerts

## 🚀 Ready to Deploy!

Once you've completed these steps:

1. ✅ Firebase service account configured
2. ✅ GitHub secrets added
3. ✅ Workflows in place
4. ✅ Configuration verified

Your Music Lab will automatically deploy to Firebase every time you merge to main! 🎵✨

---

**Need help?** Check the GitHub Actions logs for detailed error messages and debugging information.
# CI/CD Test - Wed Sep 10 16:21:18 PDT 2025
