# Troubleshooting Guide

This guide covers common issues you might encounter with the CI/CD pipeline and how to resolve them.

## Table of Contents

1. [PNPM and Lockfile Issues](#pnpm-and-lockfile-issues)
2. [Build and Test Failures](#build-and-test-failures)
3. [Deployment Issues](#deployment-issues)
4. [Security Scanning Problems](#security-scanning-problems)
5. [General Debugging](#general-debugging)

## PNPM and Lockfile Issues

### Problem: "Cannot install with frozen-lockfile because pnpm-lock.yaml is absent"

**Cause**: Version mismatch between local pnpm and CI pnpm, or missing/corrupted lockfile.

**Solutions**:

#### ✅ **Immediate Fix (Already Applied)**
The CI workflow now automatically falls back to `--no-frozen-lockfile` if the frozen install fails:

```bash
if ! pnpm install --frozen-lockfile; then
  echo "⚠️ Frozen lockfile failed, trying with --no-frozen-lockfile"
  pnpm install --no-frozen-lockfile
fi
```

#### 🔧 **Local Development Fix**
1. **Check pnpm version compatibility**:
   ```bash
   # Check your local pnpm version
   pnpm --version
   
   # Should be v9.x to match lockfile
   # If not, update pnpm:
   npm install -g pnpm@latest
   ```

2. **Regenerate lockfile** (if needed):
   ```bash
   # Remove existing lockfile and node_modules
   rm -rf pnpm-lock.yaml node_modules backend/node_modules frontend/node_modules
   
   # Reinstall with current pnpm version
   pnpm install
   
   # Commit the new lockfile
   git add pnpm-lock.yaml
   git commit -m "fix: regenerate pnpm lockfile for compatibility"
   ```

3. **Verify workspace setup**:
   ```bash
   # Check workspace configuration
   cat pnpm-workspace.yaml
   
   # Should show:
   # packages:
   #   - 'backend'
   #   - 'frontend'
   ```

### Problem: "Ignoring not compatible lockfile"

**Cause**: Lockfile was created with a different pnpm version.

**Solutions**:
1. **Update CI pnpm version**: ✅ Already updated to v9.x
2. **Local version alignment**:
   ```bash
   # Check lockfile version
   head -5 pnpm-lock.yaml
   
   # Update local pnpm to match
   npm install -g pnpm@9
   ```

### Problem: Workspace Dependencies Not Found

**Cause**: Incorrect workspace structure or missing workspace configuration.

**Solutions**:
1. **Verify workspace structure**:
   ```
   project-root/
   ├── pnpm-workspace.yaml
   ├── pnpm-lock.yaml
   ├── package.json
   ├── backend/
   │   └── package.json
   └── frontend/
       └── package.json
   ```

2. **Check workspace configuration**:
   ```yaml
   # pnpm-workspace.yaml
   packages:
     - 'backend'
     - 'frontend'
   ```

3. **Reinstall from workspace root**:
   ```bash
   # Always run from project root
   cd /path/to/project-root
   pnpm install
   ```

## Build and Test Failures

### Problem: TypeScript Compilation Errors

**Cause**: Version mismatches, missing types, or configuration issues.

**Solutions**:
1. **Check TypeScript versions**:
   ```bash
   # In each workspace
   cd backend && pnpm list typescript
   cd ../frontend && pnpm list typescript
   ```

2. **Clean and rebuild**:
   ```bash
   # Clean all builds
   pnpm run clean  # if you have this script
   rm -rf backend/dist frontend/.next
   
   # Rebuild
   pnpm run build
   ```

3. **Verify tsconfig.json** files are properly configured

### Problem: Test Database Connection Failures

**Cause**: PostgreSQL service not ready or incorrect connection settings.

**Solutions**:
1. **Check CI logs** for PostgreSQL startup
2. **Verify test environment variables**:
   ```yaml
   env:
     DATABASE_HOST: localhost
     DATABASE_PORT: 5432
     DATABASE_USERNAME: test_user
     DATABASE_PASSWORD: test_password
     DATABASE_NAME: test_db
     NODE_ENV: test
   ```

3. **Add connection retry logic** in tests

### Problem: Frontend Build Failures

**Cause**: Missing environment variables or dependency issues.

**Solutions**:
1. **Check required environment variables**:
   ```bash
   # Ensure NEXT_PUBLIC_API_URL is set
   echo $NEXT_PUBLIC_API_URL
   ```

2. **Verify Next.js configuration**:
   ```bash
   cd frontend
   cat next.config.ts
   ```

## Deployment Issues

### Problem: Terraform Authentication Failures

**Cause**: Missing or incorrect Terraform Cloud API token, Render API key issues.

**Solutions**:
1. **Verify GitHub Secrets**:
   - `TF_API_TOKEN`
   - `RENDER_API_KEY`
   - `GEMINI_API_KEY`

2. **Test credentials locally**:
   ```bash
   # Test Terraform Cloud authentication
   terraform login
   
   # Test Render API key
   curl -H "Authorization: Bearer $RENDER_API_KEY" \
        https://api.render.com/v1/services
   ```

3. **Check Terraform Cloud workspace** permissions and organization access

### Problem: Render Service Creation Failures

**Cause**: Invalid configuration, resource limits, or API issues.

**Solutions**:
1. **Check Terraform logs** for specific errors
2. **Verify Render account** has sufficient resources
3. **Review service configurations** in Terraform files

### Problem: Health Check Failures

**Cause**: Services not starting properly or taking too long to initialize.

**Solutions**:
1. **Check service logs** in Render dashboard
2. **Verify environment variables** are set correctly
3. **Increase health check timeout**:
   ```bash
   # In deployment script
   sleep 60  # Instead of 30
   ```

## Security Scanning Problems

### Problem: SARIF Upload Failures

**Cause**: Missing permissions or GitHub Advanced Security not enabled.

**Solutions**: ✅ Already fixed with fallback mechanisms
1. **Check repository settings** for Advanced Security
2. **Download artifacts** for manual review
3. **See [Security Scanning Guide](./SECURITY-SCANNING.md)** for details

## General Debugging

### Debug GitHub Actions Workflow

1. **Enable debug logging**:
   ```bash
   # Add to workflow secrets
   ACTIONS_STEP_DEBUG: true
   ACTIONS_RUNNER_DEBUG: true
   ```

2. **Add diagnostic steps**:
   ```yaml
   - name: Debug environment
     run: |
       echo "Node: $(node --version)"
       echo "PNPM: $(pnpm --version)"
       echo "Working dir: $(pwd)"
       ls -la
   ```

3. **Use tmate for SSH debugging** (temporary):
   ```yaml
   - name: Setup tmate session
     uses: mxschmitt/action-tmate@v3
     if: failure()
   ```

### Local Development Environment

1. **Match CI environment**:
   ```bash
   # Use same Node version as CI
   nvm use 18
   
   # Use same pnpm version as CI
   npm install -g pnpm@9
   ```

2. **Run CI commands locally**:
   ```bash
   # Test the exact CI commands
   pnpm install --frozen-lockfile
   pnpm run lint
   pnpm run test:backend
   pnpm run build
   ```

3. **Docker testing**:
   ```bash
   # Build and test Docker images locally
   docker build -t test-backend .
   docker build -f Dockerfile.frontend -t test-frontend .
   docker build -f Dockerfile.worker -t test-worker .
   ```

### Performance Issues

1. **Check cache usage**:
   ```yaml
   # Ensure cache is working
   - name: Setup pnpm cache
     uses: actions/cache@v4
     with:
       path: ${{ env.STORE_PATH }}
       key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
   ```

2. **Optimize dependencies**:
   ```bash
   # Check for duplicate dependencies
   pnpm dedupe
   
   # Analyze bundle size
   pnpm run build:analyze  # if you have this script
   ```

### Getting Help

1. **Check GitHub Actions logs** for detailed error messages
2. **Review recent commits** that might have introduced issues
3. **Compare with working commits** to identify changes
4. **Use git bisect** for systematic debugging:
   ```bash
   git bisect start
   git bisect bad  # current broken commit
   git bisect good <last-working-commit>
   ```

### Emergency Fixes

#### Skip CI for urgent fixes:
```bash
git commit -m "hotfix: urgent fix [skip ci]"
```

#### Force deployment:
```bash
# Use workflow_dispatch with force_deploy=true
# Or deploy manually with scripts
./scripts/deploy.sh production plan
./scripts/deploy.sh production apply
```

#### Rollback deployment:
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or use Terraform to rollback
terraform plan -destroy
```

## Prevention

1. **Pre-commit hooks** (already set up with husky)
2. **Regular dependency updates** (automated via security workflow)
3. **Environment parity** between local, CI, and production
4. **Documentation updates** when making infrastructure changes
5. **Testing in staging** before production deployment

Remember: Most issues are environment-related. Always check versions, environment variables, and network connectivity first! 