# 📚 Documentation Index

Complete documentation for the Job Application Assistant project.

## 🗂️ Available Documentation

### 🚀 Getting Started

- **[Main README](../README.md)** - Project overview and quick start guide
- **[Local Development](LOCAL_DEVELOPMENT.md)** - Complete local setup and development guide
- **[Frontend Guide](../frontend/README.md)** - Frontend-specific documentation

### 🏗️ Deployment & Infrastructure

- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment with Terraform
- **[Infrastructure Config](../infrastructure/README.md)** - Terraform configuration details
- **[Private Repo Setup](RENDER_PRIVATE_REPO_SETUP.md)** - GitHub integration for private repositories

### 🔧 Operations

- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Security Policy](../SECURITY.md)** - Security guidelines and vulnerability reporting

## 📋 Quick Reference

### Common Commands

```bash
# Development
pnpm run dev:services        # Start infrastructure services
pnpm run start              # Start backend and frontend
pnpm run migration:run      # Run database migrations

# Testing
pnpm run test               # Run all tests
pnpm run test:backend       # Backend tests only
pnpm run test:frontend      # Frontend tests only

# Production
terraform plan              # Preview infrastructure changes
terraform apply             # Deploy infrastructure
```

### Service URLs

| Service     | Local Development         | Production          |
| ----------- | ------------------------- | ------------------- |
| Frontend    | http://localhost:3000     | Deployed URL        |
| Backend API | http://localhost:3001     | Backend URL         |
| API Docs    | http://localhost:3001/api | Backend URL/api     |
| Temporal UI | http://localhost:8080     | External cluster UI |

### Health Checks

```bash
# Backend health
curl http://localhost:3001/api/health

# Database health
curl http://localhost:3001/api/health/db

# Temporal health
curl http://localhost:3001/api/health/temporal
```

## 🎯 Getting Help

1. **Common Issues**: Check [Troubleshooting Guide](TROUBLESHOOTING.md)
2. **Security Issues**: Follow [Security Policy](../SECURITY.md)
3. **General Questions**: Create a GitHub issue
4. **Local Development**: See [Local Development Guide](LOCAL_DEVELOPMENT.md)

## 🔄 Document Updates

This documentation is actively maintained. If you find any issues or have suggestions:

1. Create a GitHub issue
2. Submit a pull request
3. Contact the development team

---

**Happy coding! 🚀**
