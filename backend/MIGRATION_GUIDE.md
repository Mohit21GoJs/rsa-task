# Database Migration Guide for Production

## Overview

This guide explains how database migrations are set up and managed in production for the Job Assistant application.

## Current Setup

### Configuration Files

1. **`src/data-source.ts`** - TypeORM DataSource configuration
2. **`src/migrations/`** - Directory containing migration files
3. **`package.json`** - Migration scripts
4. **`scripts/deploy-production.sh`** - Production deployment script

### Key Configuration Points

- **Development**: `synchronize: true` (auto-creates tables)
- **Production**: `synchronize: false` (requires explicit migrations)
- **Migrations**: Located in `src/migrations/` directory
- **Migration naming**: Uses timestamp format (e.g., `1703875200000-CreateApplicationTable.ts`)

## Migration Commands

### Available Scripts

```bash
# Generate a new migration (compares entities with database)
npm run migration:generate -- src/migrations/MigrationName

# Create a blank migration file
npm run migration:create -- src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

## Production Deployment Process

### 1. Pre-Deployment Checklist

- [ ] Database server is running and accessible
- [ ] Environment variables are set:
  - `DATABASE_HOST`
  - `DATABASE_PORT`
  - `DATABASE_NAME`
  - `DATABASE_USERNAME`
  - `DATABASE_PASSWORD`
  - `NODE_ENV=production`

### 2. Migration Files

Current migration files:

- `1703875200000-CreateApplicationTable.ts` - Creates the main applications table

### 3. Deployment Steps

#### Manual Deployment

```bash
# 1. Set environment variables
export NODE_ENV=production
export DATABASE_HOST=your-db-host
export DATABASE_NAME=job_assistant
export DATABASE_USERNAME=your-username
export DATABASE_PASSWORD=your-password

# 2. Install dependencies
npm ci --only=production

# 3. Build application
npm run build

# 4. Run migrations
npm run migration:run

# 5. Start application
npm run start:prod
```

#### Automated Deployment

```bash
# Use the provided deployment script
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

## Database Schema

### Applications Table

The main `applications` table contains:

- **id**: UUID primary key
- **company**: Company name (varchar)
- **role**: Job role (varchar)
- **jobDescription**: Job description (text)
- **resume**: Resume content (text)
- **coverLetter**: Generated cover letter (text, nullable)
- **deadline**: Application deadline (timestamp)
- **status**: Application status (enum: pending, interview, offer, rejected, withdrawn, archived)
- **notes**: Additional notes (text, nullable)
- **workflowId**: Temporal workflow ID (varchar, unique)
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

### Indexes

Performance indexes created:

- `IDX_applications_company` - for company-based queries
- `IDX_applications_status` - for status filtering
- `IDX_applications_deadline` - for deadline sorting
- `IDX_applications_created_at` - for chronological ordering

## Troubleshooting

### Common Issues

1. **"AppDataSource must be initialized"**
   - Ensure database connection parameters are correct
   - Check if database server is running
   - Verify environment variables are set

2. **Migration files not found**
   - Ensure migrations are in `src/migrations/` directory
   - Check file naming follows timestamp format

3. **Migration fails to run**
   - Check database permissions
   - Verify migration SQL syntax
   - Review error logs for specific issues

### Rollback Strategy

```bash
# Revert last migration
npm run migration:revert

# If multiple migrations need to be reverted
npm run migration:revert  # Run multiple times
```

## Best Practices

1. **Always test migrations** in staging before production
2. **Backup database** before running migrations
3. **Review migration files** for correctness
4. **Monitor application** after deployment
5. **Keep migration files** in version control
6. **Use descriptive migration names** (e.g., `AddIndexesToApplications`)

## Environment Variables

Required for production:

```env
NODE_ENV=production
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=job_assistant
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your-secure-password
```

## Monitoring

After deployment, monitor:

- Application startup logs
- Database connection status
- Migration execution results
- Application health endpoint: `/api/health`

## Security Considerations

1. **Database credentials** should be stored securely
2. **Migration files** should be reviewed for security implications
3. **Database permissions** should follow least privilege principle
4. **Connection strings** should use SSL in production
