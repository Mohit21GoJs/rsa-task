# Security Scanning Guide

This document explains the security scanning setup in the CI/CD pipeline and how to troubleshoot common issues.

## Overview

The pipeline includes multiple security scanning layers:

1. **Filesystem Scanning** - Scans source code for vulnerabilities
2. **Dependency Scanning** - Checks for known vulnerabilities in npm packages
3. **Container Scanning** - Scans Docker images for security issues
4. **Infrastructure Scanning** - Validates Terraform configurations

## Security Scan Integration

### GitHub Advanced Security

The pipeline attempts to upload security scan results to GitHub's Security tab using SARIF format. This requires:

- **GitHub Advanced Security** enabled (free for public repos, paid for private repos)
- **Proper permissions** in the workflow
- **Code scanning** enabled in repository settings

### Fallback Mechanism

If SARIF upload fails, the pipeline automatically:
- Uploads scan results as artifacts
- Continues the build process (doesn't fail)
- Stores results for 30 days for manual review

## Repository Setup

### For Public Repositories
1. Go to **Settings** → **Code security and analysis**
2. Enable **Code scanning** (should be available by default)
3. Enable **Dependency scanning**

### For Private Repositories
1. Ensure **GitHub Advanced Security** is enabled
2. Go to **Settings** → **Code security and analysis**
3. Enable **Code scanning** and **Dependency scanning**

### Alternative Setup (No Advanced Security)
If Advanced Security isn't available:
1. Security scans will still run
2. Results are uploaded as workflow artifacts
3. Download artifacts from the **Actions** tab to review results

## Troubleshooting

### Common Issues

#### 1. "Resource not accessible by integration"
**Cause**: Missing permissions or Advanced Security not enabled

**Solutions**:
- ✅ **Fixed**: Added proper permissions to workflow
- ✅ **Fixed**: Added fallback artifact upload
- Check repository settings for Advanced Security

#### 2. Dependabot Permission Issues
**Cause**: Dependabot PRs have restricted permissions

**Solution**:
- ✅ **Fixed**: Added `github.actor != 'dependabot[bot]'` condition
- Dependabot security scans are handled separately

#### 3. SARIF Upload Failures
**Cause**: Various GitHub API issues

**Solutions**:
- ✅ **Fixed**: Added `continue-on-error: true`
- Results still available via artifacts
- Manual review possible

### Manual Security Review

If SARIF upload fails, review security results manually:

1. Go to **Actions** tab in GitHub
2. Click on the failed workflow run
3. Download security scan artifacts:
   - `security-scan-results-<sha>`
   - `docker-security-scan-results-<sha>`
4. Open SARIF files with:
   - VS Code with SARIF extension
   - Online SARIF viewers
   - Convert to other formats using tools

## Security Scan Types

### 1. Trivy Filesystem Scan
- **Scans**: Source code, dependencies, configurations
- **Output**: `trivy-results.sarif`
- **Frequency**: Every push/PR

### 2. NPM Audit
- **Scans**: Node.js dependencies
- **Output**: Console output
- **Threshold**: Moderate level vulnerabilities

### 3. Docker Container Scan
- **Scans**: Built Docker images
- **Output**: `docker-trivy-results.sarif`
- **Frequency**: After successful build

### 4. Terraform Security Scan
- **Scans**: Infrastructure configurations
- **Output**: `terraform-results.sarif`
- **Location**: Security workflow (scheduled)

## Best Practices

### 1. Regular Updates
- Dependencies updated automatically via scheduled workflow
- Security patches applied promptly
- Regular review of scan results

### 2. Vulnerability Management
- **Critical/High**: Fix immediately
- **Medium**: Fix in next release
- **Low**: Monitor and fix when convenient

### 3. False Positive Handling
- Document known false positives
- Use `.trivyignore` for filesystem scans
- Add comments explaining security decisions

## Configuration Files

### Trivy Configuration
Create `.trivyignore` to suppress false positives:
```
# Example: Ignore specific CVE
CVE-2023-12345

# Example: Ignore file
secrets/test-data.json
```

### NPM Audit Configuration
Configure in `package.json`:
```json
{
  "scripts": {
    "audit:fix": "npm audit fix",
    "audit:check": "npm audit --audit-level moderate"
  }
}
```

## Monitoring

### GitHub Security Tab
- View all vulnerabilities in one place
- Track remediation progress
- Get security alerts

### Workflow Artifacts
- Download SARIF files for offline analysis
- Share results with security team
- Archive for compliance

## Support

### If Security Tab Doesn't Work
1. Check repository settings
2. Verify GitHub plan supports Advanced Security
3. Use artifact downloads as fallback
4. Contact GitHub support if needed

### For Security Questions
1. Review scan results in artifacts
2. Check CVE databases for details
3. Consult security team for remediation
4. Update dependencies promptly

## Example Workflow

```bash
# 1. Code pushed to repository
# 2. CI pipeline runs security scans
# 3. Results uploaded to Security tab (if available)
# 4. Results uploaded as artifacts (always)
# 5. Review and remediate findings
# 6. Push fixes and re-scan
```

This multi-layered approach ensures security issues are caught early and handled appropriately regardless of repository configuration. 