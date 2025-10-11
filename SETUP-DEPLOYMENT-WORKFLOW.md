# Setup Deployment Workflow - Quick Start (Solo Developer)

## Overview

This workflow is optimized for solo development:
- ✅ Direct commits to `develop` (staging) - fast iteration
- ✅ PR required for `main` (production) - safety checkpoint
- ✅ Automatic CI tests on all commits
- ✅ Automatic Vercel deployments

## Step 1: Create Develop Branch

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create and push develop branch
git checkout -b develop
git push -u origin develop
```

## Step 2: Configure GitHub Branch Protection

### Protect Main Branch (REQUIRED)
1. Go to: `https://github.com/niozzo/KN-React-App/settings/branches`
2. Click "Add rule"
3. Branch name pattern: `main`
4. Enable these settings:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - Select: "validate" (from GitHub Actions)
   - ✅ Require conversation resolution before merging (optional, but good practice)
   - ⚠️ **Do NOT enable "Require approvals"** (you're solo, can't approve your own PRs without GitHub Pro)
   - ✅ **IMPORTANT:** Check "Do not allow bypassing the above settings" to prevent accidents
5. Click "Create"

### Develop Branch Protection (OPTIONAL - Skip for Solo Dev)
- No protection needed for `develop` branch
- You can commit directly for faster development
- CI will still run automatically on every commit
- Vercel will still auto-deploy to staging

## Step 3: Verify Vercel Configuration

### Confirm Production Branch
1. Go to your Vercel project dashboard
2. Settings → Git
3. Production Branch: Confirm it's set to `main`

### Verify Environment Variables (Single Database Setup)

Since you're using the **same Supabase database** for all environments, you only need to verify your environment variables are set once:

1. Go to Settings → Environment Variables
2. Verify these variables exist:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

3. **Environment Settings**: Select **ALL** environments (Production, Preview, Development)
   - This makes the same database accessible from all branches
   - Simplifies configuration
   - Both staging and production use the same data

**Note:** If you don't have these variables set yet:
- Click "Add New"
- Enter variable name and value
- Check: ✅ Production, ✅ Preview, ✅ Development
- Click "Save"

### Enable Deployment Comments (Optional)
1. Settings → Git → GitHub
2. Enable "Vercel for GitHub"
3. ✅ Comment on Pull Requests

### Troubleshooting: If Vercel Doesn't Auto-Deploy

If pushing to Git doesn't trigger deployments, you may need to establish the branches first using Vercel CLI:

```bash
# Deploy main as production (one-time)
git checkout main
vercel --prod --yes

# Deploy develop as preview (one-time)
git checkout develop
vercel --yes
```

After this, auto-deploy from Git should work normally. See "Alternative: Using Vercel CLI" section below for details.

## Step 4: Test the Workflow

### Test Direct Commit to Develop (Staging)
```bash
# Switch to develop
git checkout develop
git pull origin develop

# Make a small test change
echo "\n## Deployment Test - $(date)" >> README.md

# Commit and push directly
git add README.md
git commit -m "test: deployment workflow"
git push origin develop
```

**Verify:**
1. ✅ GitHub Actions runs automatically
2. ✅ Vercel deploys to staging automatically
3. ✅ Check staging URL for your change

### Test PR to Production
```bash
# From develop, create PR to main
# (Do this via GitHub UI)
```

**Steps:**
1. Go to GitHub: `https://github.com/niozzo/KN-React-App`
2. Click "Compare & pull request" or create manually
3. Base: `main` ← Compare: `develop`
4. Create Pull Request
5. Verify:
   - ✅ GitHub Actions runs production validation
   - ✅ All checks pass
   - ✅ Review the diff carefully (this is your safety check!)
6. Click "Merge pull request"
7. Verify production deployment on Vercel

## Step 5: Understanding Your Supabase Setup

**Current Setup: Single Database** ✅

You're using the **same Supabase database** for both staging (`develop`) and production (`main`) branches:

- ✅ **Simpler**: One database to manage
- ✅ **Faster**: No need to sync schemas or data
- ⚠️ **Be careful**: Changes in staging affect production data

### Best Practices with Single Database:
1. Test thoroughly on staging before deploying to production
2. Use Row Level Security (RLS) policies in Supabase
3. Back up your database regularly
4. Consider separate databases later as your app grows

### Future: Separate Databases (Optional)
When you're ready to scale, you can:
- Create a staging Supabase project
- Update Vercel env vars to use different URLs per environment
- Use test data in staging without affecting production

## Your New Daily Workflow (Solo Dev - Streamlined)

### Option A: Work Directly on Develop (Recommended for Solo)
```bash
# 1. Switch to develop and get latest
git checkout develop
git pull origin develop

# 2. Make your changes
# ... edit files ...

# 3. Commit and push directly to develop
git add .
git commit -m "feat: my feature"
git push origin develop
# → Auto-deploys to staging, CI runs automatically

# 4. Test on staging environment
# Visit your staging URL and verify changes

# 5. When ready for production, create PR
# Go to GitHub and create PR: develop → main
# Review the diff, wait for CI, then merge
# → Auto-deploys to production
```

### Option B: Use Feature Branches (Optional)
```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Develop and commit
git add .
git commit -m "feat: my feature"
git push -u origin feature/my-feature
# → Creates preview deployment on Vercel

# 3. When done, merge to develop (no PR needed)
git checkout develop
git merge feature/my-feature
git push origin develop
# → Deploys to staging

# 4. Clean up feature branch
git branch -d feature/my-feature
git push origin --delete feature/my-feature

# 5. Deploy to production via PR
# Create PR: develop → main on GitHub
```

### 🎯 Key Points
- **Develop → Main ALWAYS requires PR** (your safety net)
- **Direct commits to develop are fine** (fast iteration)
- **Feature branches are optional** (use if you want preview URLs)
- **Always test on staging before production**

## Checklist

Before considering this setup complete:

- [ ] `develop` branch created and pushed
- [ ] Branch protection rules set for `main` (REQUIRED)
- [ ] ~~Branch protection rules set for `develop`~~ (Skip for solo dev)
- [ ] Vercel environment variables verified (same for all environments)
- [ ] GitHub Actions workflows committed to repo
- [ ] Test commit pushed directly to develop
- [ ] Staging deployment verified
- [ ] Test PR from develop to main created
- [ ] Production deployment verified
- [ ] Documentation reviewed

## Alternative: Using Vercel CLI

If you prefer using the command line or can't find the Vercel UI settings:

### Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
vercel login
```

### Deploy Main to Production (One-Time Setup)
```bash
git checkout main
vercel --prod --yes
```

### Deploy Develop as Preview (One-Time Setup)
```bash
git checkout develop
vercel --yes
```

**After this initial setup**, Git auto-deploy should work for future pushes!

### Optional: Use CLI for All Deployments
If you prefer CLI over auto-deploy:
```bash
# Preview (staging)
git checkout develop
vercel

# Production
git checkout main
vercel --prod
```

## Need Help?

See the full [Deployment Guide](./docs/DEPLOYMENT-GUIDE.md) for:
- Detailed workflows
- Rollback procedures
- Troubleshooting
- Emergency hotfix process

