# API Configuration Guide

## Environment Variables

Create a `.env` file in the backend directory with the following configuration:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=job_assistant

# Temporal Configuration
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default

# LLM Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# API Security Configuration
# Multiple API keys separated by commas - these are the keys your clients will use
API_KEYS=dev-key-12345,prod-key-67890,client-key-abcde

# Application Configuration
NODE_ENV=development
PORT=3000
DEFAULT_DEADLINE_WEEKS=4

# Rate Limiting Configuration (optional overrides)
RATE_LIMIT_TTL_SHORT=1000
RATE_LIMIT_LIMIT_SHORT=10
RATE_LIMIT_TTL_MEDIUM=60000
RATE_LIMIT_LIMIT_MEDIUM=100
RATE_LIMIT_TTL_LONG=3600000
RATE_LIMIT_LIMIT_LONG=1000

# CORS Configuration
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
CORS_CREDENTIALS=true

# Security Headers
HELMET_ENABLED=true
COMPRESSION_ENABLED=true
```

## API Key Usage

### For Clients

Clients need to include the API key in their requests using the `x-api-key` header:

```bash
# Example using curl
curl -H "x-api-key: dev-key-12345" \
     -H "Content-Type: application/json" \
     -X GET http://localhost:3000/api/applications
```

```javascript
// Example using fetch
fetch('http://localhost:3000/api/applications', {
  headers: {
    'x-api-key': 'dev-key-12345',
    'Content-Type': 'application/json',
  },
});
```

### Public Endpoints

Some endpoints can be made public (no API key required) by using the `@Public()` decorator:

```typescript
import { Public } from '../common/guards/api-key.guard';

@Controller('health')
export class HealthController {
  @Get()
  @Public() // This endpoint doesn't require API key
  getHealth() {
    return { status: 'ok' };
  }
}
```

## Security Best Practices Implemented

1. **API Key Authentication**: Simple but effective for service-to-service communication
2. **Rate Limiting**: Multi-tier rate limiting (per second, minute, hour)
3. **Security Headers**: Helmet.js for security headers
4. **Request Compression**: Gzip compression for better performance
5. **Request Logging**: Comprehensive logging with sensitive data filtering
6. **Response Time Tracking**: Performance monitoring headers
7. **Input Validation**: Global validation pipes with whitelist
8. **CORS Configuration**: Proper CORS setup for cross-origin requests

## API Key Management

- Generate strong, unique API keys for each client
- Use different keys for different environments (dev, staging, prod)
- Rotate keys regularly
- Monitor API usage per key
- Consider implementing key expiration if needed

## Rate Limiting

The API implements three tiers of rate limiting:

- **Short**: 10 requests per second
- **Medium**: 100 requests per minute
- **Long**: 1000 requests per hour

Clients will receive `429 Too Many Requests` if they exceed these limits.
