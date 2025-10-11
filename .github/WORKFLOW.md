# Git & Vercel Workflow - Visual Guide

## Solo Developer Workflow (Simplified)

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR DEVELOPMENT FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Local Development
       │
       ├── Make changes
       ├── Commit
       ├── Test locally
       │
       ▼
   git push origin develop
       │
       ├─────────────────────────────┐
       │                             │
       ▼                             ▼
   GitHub Actions              Vercel Auto-Deploy
   (Run tests)                 (Build & Deploy)
       │                             │
       ✅ Pass                        ▼
                            🌐 Staging URL
                                     │
                            Test in staging ✓
                                     │
                            Ready for production?
                                     │
                                     ▼
                        Create PR: develop → main
                                     │
                         ┌───────────┴───────────┐
                         │                       │
                         ▼                       ▼
                  GitHub Actions          Review Your Diff
                  (Full tests)            (Safety check!)
                         │                       │
                         ✅                      ✅
                         │                       │
                         └───────────┬───────────┘
                                     │
                              Merge PR on GitHub
                                     │
                                     ▼
                         Vercel Auto-Deploy
                                     │
                                     ▼
                          🚀 PRODUCTION LIVE


┌─────────────────────────────────────────────────────────────────┐
│                     PROTECTION SUMMARY                           │
└─────────────────────────────────────────────────────────────────┘

develop (staging)
  ├─ ❌ No PR required
  ├─ ✅ Direct commits allowed
  ├─ ✅ CI runs on every commit
  └─ ✅ Auto-deploys to staging

main (production)
  ├─ ✅ PR REQUIRED (cannot bypass)
  ├─ ✅ CI must pass
  ├─ ✅ Forces you to review diff
  └─ ✅ Auto-deploys to production after merge


┌─────────────────────────────────────────────────────────────────┐
│                   YOUR DAILY COMMANDS                            │
└─────────────────────────────────────────────────────────────────┘

# Morning: Start working
git checkout develop
git pull origin develop

# During the day: Make changes
# ... edit files ...
git add .
git commit -m "feat: add cool feature"
git push origin develop
# → Check staging URL

# End of day (or when ready): Deploy to prod
# 1. Go to GitHub
# 2. Create PR: develop → main
# 3. Review the diff carefully
# 4. Click "Merge pull request"
# 5. Verify production URL


┌─────────────────────────────────────────────────────────────────┐
│                      SAFETY FEATURES                             │
└─────────────────────────────────────────────────────────────────┘

✅ Can't accidentally push to main
✅ Must review changes before production
✅ Tests run automatically before deployment
✅ Easy rollback via Vercel dashboard
✅ Clear audit trail of all deployments
✅ Staging environment for testing
```

## Key Principles

1. **Develop = Your Playground**
   - Commit freely
   - Test on staging
   - Break things safely

2. **Main = Production (Protected)**
   - PR required (your safety net)
   - Final review moment
   - CI must pass
   - One-way door (requires rollback to undo)

3. **Always Test on Staging First**
   - Every change goes through staging
   - No surprises in production
   - Catch issues early

## Quick Reference

| Action | Command | Result |
|--------|---------|--------|
| Make changes | `git push origin develop` | Deploys to staging |
| Deploy to prod | Create PR on GitHub | After merge, deploys to production |
| Rollback | Vercel dashboard → Previous deployment | Instant rollback |
| View staging | Check Vercel dashboard | Find staging URL |
| View production | Check Vercel dashboard | Find production URL |

## Environment URLs

Once set up, you'll have:

- **Production**: `your-app.vercel.app` (from `main` branch)
- **Staging**: `develop-your-app.vercel.app` (from `develop` branch)
- **Feature Preview**: `feature-xyz-your-app.vercel.app` (from feature branches, optional)

**Note:** All environments use the **same Supabase database** (shared data across staging and production)

## Questions?

See full documentation:
- [Setup Guide](../SETUP-DEPLOYMENT-WORKFLOW.md) - Initial setup steps
- [Deployment Guide](../docs/DEPLOYMENT-GUIDE.md) - Complete reference

