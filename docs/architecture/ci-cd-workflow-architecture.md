# CI/CD Workflow Architecture

## Overview

This document defines the purpose and triggers for each GitHub Actions workflow to prevent duplication and ensure efficient CI/CD pipeline execution.

## Workflow Separation of Concerns

### 1. **test.yml** - PR Test Feedback
**Purpose:** Fast test feedback during pull request review  
**Triggers:** Pull requests to `develop` or `main`  
**Runs:** 
- Unit tests (without coverage for speed)
- Coverage generation (separate job, allows timeout)

**Why separate coverage job?**
- Test job provides fast feedback (~2-3 min)
- Coverage can timeout gracefully without failing the build
- Parallel execution for efficiency

**Timeouts:**
- Tests: 8 minutes
- Coverage: 12 minutes (graceful degradation)

---

### 2. **staging-validation.yml** - Integration Validation
**Purpose:** Validate changes after merge to develop  
**Triggers:** Push to `develop` branch  
**Runs:**
- Full test suite
- Build verification

**Why this exists?**
- Catch integration issues post-merge
- Validate build succeeds before promotion
- Staging environment validation

---

### 3. **ci-cd.yml** - Production Pipeline
**Purpose:** Full CI/CD pipeline with deployment  
**Triggers:** Push to `main` branch  
**Runs:**
- Linting
- Full test suite with coverage
- Codecov upload
- Production build
- PWA audit
- Vercel deployment

**Why separate from staging?**
- Production requires full quality gates
- Includes deployment step
- More comprehensive checks (lighthouse, etc.)

---

### 4. **production-validation.yml** - Pre-Production Gate
**Purpose:** Validate PRs before merging to main  
**Triggers:** Pull requests to `main`  
**Runs:**
- Full test suite
- Production build check
- Code quality checks

---

## Workflow Decision Matrix

| Event | Workflow Triggered | Purpose | Duration |
|-------|-------------------|---------|----------|
| PR → `develop` | `test.yml` | Fast test feedback | 2-3 min |
| PR → `main` | `test.yml` + `production-validation.yml` | Comprehensive validation | 5-7 min |
| Push → `develop` | `staging-validation.yml` | Integration check | 3-5 min |
| Push → `main` | `ci-cd.yml` | Full pipeline + deploy | 8-12 min |

## Architectural Principles

1. **No Duplication:** Each workflow has distinct purpose and triggers
2. **Fast Feedback:** PR tests run quickly without coverage
3. **Graceful Degradation:** Coverage can timeout without failing build
4. **Progressive Quality Gates:** More checks as code moves toward production
5. **Resource Efficiency:** Avoid running same tests multiple times

## Timeout Strategy

All workflows include timeout protection to prevent indefinite hangs:

```yaml
# In each workflow
- name: Run tests
  run: timeout 8m npm run test:ci || exit 1
```

**Why timeouts?**
- Prevent CI resource exhaustion
- Catch hanging tests early
- Force fail-fast behavior

## Future Improvements

1. **Caching Strategy:** Implement npm dependency caching across workflows
2. **Test Sharding:** Split tests across multiple runners for faster execution
3. **Conditional Jobs:** Skip coverage on draft PRs
4. **Performance Budgets:** Add lighthouse score thresholds
5. **Deployment Previews:** Add preview deployments for PRs

## Troubleshooting

### Multiple workflows running on same commit
- Check trigger conditions in each workflow file
- Ensure no overlap in `on.push.branches`
- Review this document for intended behavior

### Tests hanging in CI
- Check timeout values in workflow files
- Review `vitest.config.ts` timeout settings
- Check for mock state bleeding in test setup

### Build failing in one workflow but not another
- Different workflows may have different quality gates
- Check if coverage is enabled (may cause timeouts)
- Verify Node.js versions match across workflows

---

**Last Updated:** 2025-10-12  
**Maintained By:** Architecture Team

