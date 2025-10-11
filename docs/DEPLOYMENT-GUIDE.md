# Deployment Guide (Solo Developer Edition)

## Branch Strategy

### Branches
- **`main`** - Production (protected, PR required)
- **`develop`** - Staging/Preview (unprotected, direct commits OK)
- **`feature/*`** - Feature development (optional)

### Protection Rules

#### Main Branch (Production) - PROTECTED
- ✅ Require pull request before merging
- ✅ Require status checks to pass
- ❌ No approvals required (solo dev)
- ✅ Cannot bypass settings
- 🎯 **Purpose:** Your safety net - forces review before production

#### Develop Branch (Staging) - UNPROTECTED
- ✅ Direct commits allowed
- ✅ CI runs automatically on every commit
- ✅ Auto-deploys to staging via Vercel
- 🎯 **Purpose:** Fast iteration and testing

## Daily Workflow

### Recommended: Direct Development on Develop Branch
```bash
# 1. Switch to develop
git checkout develop
git pull origin develop

# 2. Make your changes
# ... edit files ...

# 3. Commit and push to staging
git add .
git commit -m "feat: add new feature"
git push origin develop
# ✅ CI runs automatically
# ✅ Auto-deploys to staging
# ✅ No PR needed

# 4. Test on staging environment
# Visit your staging URL and verify everything works

# 5. Deploy to production when ready
# Go to GitHub and create PR: develop → main
# Review the diff carefully (this is your safety check!)
# After CI passes, merge the PR
# ✅ Auto-deploys to production
```

### Optional: Using Feature Branches
```bash
# 1. Create feature branch (if you want a preview URL)
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"
git push -u origin feature/my-feature
# ✅ Creates unique preview URL on Vercel

# 3. Merge to staging (no PR needed)
git checkout develop
git merge feature/my-feature
git push origin develop
# ✅ Deploys to staging

# 4. Clean up
git branch -d feature/my-feature
git push origin --delete feature/my-feature

# 5. Deploy to production via PR
# Create PR: develop → main on GitHub
```

## Vercel Configuration

### Environment Setup

**Production (main branch):**
- Domain: `your-app.vercel.app`
- Environment Variables:
  - `VITE_SUPABASE_URL` → Production Supabase URL
  - `VITE_SUPABASE_ANON_KEY` → Production Supabase Key
  - `NODE_ENV=production`

**Staging (develop branch):**
- Domain: `develop-your-app.vercel.app`
- Environment Variables:
  - `VITE_SUPABASE_URL` → Staging Supabase URL
  - `VITE_SUPABASE_ANON_KEY` → Staging Supabase Key
  - `NODE_ENV=preview`

**Preview (feature branches):**
- Domain: Auto-generated preview URLs
- Environment Variables: Inherit from staging

### Deployment Settings in Vercel Dashboard

1. **Production Branch:** Set to `main`
2. **Git Integration:**
   - Enable automatic deployments from Git
   - Enable comments on PRs
   - Enable deployment protection (optional)

3. **Environment Variables:**
   - Production: Assigned to `main` branch
   - Preview: Assigned to `develop` and all other branches
   - Development: Local only (`.env.local`)

## GitHub Settings

### Branch Protection Rules

**For `main`:**
1. Go to Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Require status checks to pass before merging
   - ✅ Require conversation resolution before merging
   - ✅ Do not allow bypassing the above settings

**For `develop`:**
1. Go to Settings → Branches → Add rule
2. Branch name pattern: `develop`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging

## Environment Variables

### Local Development (`.env.local`)
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

### Staging (Vercel)
```env
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
NODE_ENV=preview
```

### Production (Vercel)
```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
NODE_ENV=production
```

## Pre-Deployment Checklist

### Before Pushing to Develop (Staging)
- [ ] All tests pass locally (`npm run test`)
- [ ] Application builds successfully (`npm run build`)
- [ ] Feature tested locally
- [ ] No console errors in browser
- [ ] Committed with clear message

### Before Merging to Main (Production)
- [ ] Feature tested on staging environment
- [ ] All tests pass on CI
- [ ] No breaking changes
- [ ] Database migrations completed (if any)
- [ ] Performance tested
- [ ] Mobile/responsive tested
- [ ] PWA features working
- [ ] Offline functionality verified
- [ ] Final stakeholder approval

## Rollback Procedures

### Immediate Rollback (Vercel Dashboard)
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### Git Rollback
```bash
# Revert the merge commit
git checkout main
git revert -m 1 <merge-commit-hash>
git push origin main
```

### Emergency Hotfix
```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/critical-fix

# Make fix and test
git add .
git commit -m "fix: critical issue"

# Push and create PR to main (expedited review)
git push -u origin hotfix/critical-fix

# After deployment, merge back to develop
git checkout develop
git merge hotfix/critical-fix
git push origin develop
```

## Monitoring

### Post-Deployment Verification
1. Check Vercel deployment logs
2. Verify application loads correctly
3. Test critical user flows
4. Check browser console for errors
5. Verify API connections (Supabase)
6. Test PWA installation
7. Monitor error tracking (if configured)

### Regular Monitoring
- Vercel Analytics Dashboard
- Supabase Dashboard (API usage, errors)
- Browser DevTools (Console, Network)
- User feedback channels

## Common Issues

### Build Failures
- Check Node version matches `engines` in `package.json`
- Verify all environment variables are set
- Check for TypeScript errors

### Environment Variable Issues
- Ensure variables prefixed with `VITE_` for client-side access
- Remember to redeploy after changing env vars
- Variables are set for correct environment (Production vs Preview)

### Cache Issues
- Clear Vercel build cache in dashboard
- Update service worker version
- Force refresh in browser (Cmd/Ctrl + Shift + R)

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Supabase Environments](https://supabase.com/docs/guides/getting-started/local-development)

