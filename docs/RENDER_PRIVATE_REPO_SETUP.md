# 🔐 Render Private Repository Setup Guide

This guide explains how to configure Render to access your private GitHub repository for automatic deployments.

## Overview

Your current setup uses **Terraform with the Render provider** to manage infrastructure. For private repositories, Render needs authentication to access your GitHub repository.

## 🎯 Quick Answer

**Yes, Render will pull code from your private repository**, but you need to configure GitHub authentication first.

## 📋 Required Additional Steps

### Option 1: GitHub Personal Access Token (Recommended for Personal Projects)

#### Step 1: Create GitHub Personal Access Token

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. Click **"Generate new token"**
3. Configure the token:
   - **Repository access**: Select your private repository (`mohityadav/rsa-task`)
   - **Permissions**: 
     - ✅ **Contents**: Read
     - ✅ **Metadata**: Read
     - ✅ **Pull requests**: Read (if using PR previews)

#### Step 2: Add Token to GitHub Secrets

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Add new repository secret:
   - **Name**: `GITHUB_ACCESS_TOKEN`
   - **Value**: Your generated token (starts with `github_pat_`)

#### Step 3: Update Repository URL (if needed)

Make sure your repository URL in `infrastructure/variables.tf` matches your actual repo:

```hcl
variable "github_repo_url" {
  description = "GitHub repository URL for the application"
  type        = string
  default     = "https://github.com/mohityadav/rsa-task"  # ← Update this
}
```

### Option 2: GitHub App (Recommended for Organizations)

#### Step 1: Create GitHub App

1. Go to GitHub → **Settings** → **Developer settings** → **GitHub Apps**
2. Click **"New GitHub App"**
3. Configure:
   - **GitHub App name**: `Render Deployment App`
   - **Repository permissions**:
     - Contents: Read
     - Metadata: Read
   - **Subscribe to events**: Push, Pull request

#### Step 2: Install App and Get Credentials

1. **Install** the app on your repository
2. Note down:
   - **App ID**
   - **Installation ID** 
   - **Private Key** (download and keep secure)

#### Step 3: Add GitHub App Secrets

Add these secrets to your repository:

```
GITHUB_APP_ID=123456
GITHUB_APP_INSTALLATION_ID=78910
GITHUB_APP_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----...
```

## 🚀 Deployment Process

### Current Workflow

Your CD pipeline now supports both authentication methods:

```yaml
# .github/workflows/cd.yml
- name: Terraform Plan with detailed output
  run: |
    terraform plan \
      -var="render_api_key=${{ secrets.RENDER_API_KEY }}" \
      -var="render_owner_id=${{ secrets.RENDER_OWNER_ID }}" \
      -var="github_access_token=${{ secrets.GITHUB_ACCESS_TOKEN }}" \
      -var="github_repo_url=${{ github.repositoryUrl }}" \
      # ... other vars
```

### How It Works

1. **GitHub Actions** triggers on push/PR
2. **Terraform** configures Render services with GitHub authentication
3. **Render** uses the provided credentials to access your private repository
4. **Automatic deployments** happen when you push to configured branches

## 🔧 Configuration Details

### Services Configured for Private Repo Access

Your Terraform now configures these services with GitHub authentication:

1. **Backend Service** (`job-assistant-backend`)
   - Pulls from repository root
   - Runs: `pnpm install && pnpm run build:backend`

2. **Frontend Service** (`job-assistant-frontend`)
   - Pulls from `frontend/` directory
   - Runs: `pnpm install && pnpm run build:frontend`

### Authentication Priority

The Terraform configuration uses this priority:

1. **Personal Access Token** (if `github_access_token` is provided)
2. **GitHub App** (if `github_app_id` is provided)
3. **No authentication** (for public repos)

## ✅ Verification Steps

### 1. Test GitHub Token Access

```bash
# Test your token locally
curl -H "Authorization: token $GITHUB_ACCESS_TOKEN" \
  https://api.github.com/repos/mohityadav/rsa-task
```

### 2. Check Render Service Configuration

After deployment, verify in Render Dashboard:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Check your services show **Connected** status
3. Verify **Auto-Deploy** is enabled
4. Check recent deployments are successful

### 3. Test Auto-Deployment

1. Make a small change to your code
2. Push to your configured branch (`main` or `develop`)
3. Watch the deployment in:
   - GitHub Actions (Infrastructure + Health checks)
   - Render Dashboard (Service deployment)

## 🚨 Troubleshooting

### Common Issues

#### "Repository not accessible"
```
Error: Failed to create service: repository not accessible
```

**Solutions:**
- ✅ Verify token has correct permissions
- ✅ Check repository URL is correct
- ✅ Ensure token isn't expired

#### "Authentication failed"
```
Error: GitHub authentication failed
```

**Solutions:**
- ✅ Regenerate GitHub token with correct scopes
- ✅ Update `GITHUB_ACCESS_TOKEN` secret
- ✅ Re-run the deployment

#### "Build failed"
```
Error: Build command failed
```

**Solutions:**
- ✅ Test build commands locally: `pnpm install && pnpm run build:backend`
- ✅ Check build logs in Render Dashboard
- ✅ Verify all environment variables are set

### Debug Commands

```bash
# Check if repository is accessible
curl -H "Authorization: token $GITHUB_ACCESS_TOKEN" \
  https://api.github.com/repos/mohityadav/rsa-task/contents

# Test Render API connectivity
curl -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services

# Check current deployments
curl -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services/$SERVICE_ID/deploys
```

## 📊 Security Best Practices

### Token Security

1. **Use Fine-grained tokens** with minimal permissions
2. **Set expiration dates** (90 days max recommended)
3. **Rotate tokens regularly**
4. **Monitor token usage** in GitHub Settings

### Repository Security

1. **Enable branch protection** on main branches
2. **Require PR reviews** for production deployments
3. **Use environment-specific secrets**
4. **Monitor deployment logs**

## 🔗 Additional Resources

- [Render GitHub Integration Docs](https://render.com/docs/github)
- [GitHub Fine-grained Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Terraform Render Provider](https://registry.terraform.io/providers/render-oss/render/latest/docs)

## ✨ Summary

After completing these steps:

1. ✅ **Render will automatically pull** from your private repository
2. ✅ **Auto-deployments work** on every push to configured branches  
3. ✅ **Secure authentication** protects your repository access
4. ✅ **Infrastructure as Code** manages everything through Terraform

Your next deployment will use the private repository authentication! 🚀 