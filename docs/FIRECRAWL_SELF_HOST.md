# Firecrawl Self-Hosting Guide

This guide explains how to self-host Firecrawl for use with the AiSumai (愛住) project.

## Overview

Self-hosting Firecrawl provides:
- Complete control over your web scraping infrastructure
- Enhanced security for sensitive data
- Potential cost savings for high-volume usage
- Reduced external dependencies

## Requirements

### System Requirements
- Docker and Docker Compose installed
- At least 2GB RAM (recommended 4GB+)
- 10GB+ available disk space
- Network access to target websites

### Optional but Recommended
- OpenAI API key for enhanced AI features
- Reverse proxy (nginx/traefik) for production
- SSL certificates for HTTPS

## Setup Steps

### 1. Clone Firecrawl Repository

```bash
git clone https://github.com/mendableai/firecrawl.git
cd firecrawl
```

### 2. Create Environment Configuration

Create a `.env` file in the Firecrawl root directory:

```bash
# Basic Configuration
PORT=3002
HOST=0.0.0.0
USE_DB_AUTHENTICATION=false

# Optional: OpenAI Integration (recommended for better extraction)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Proxy Configuration
# PROXY_SERVER=http://your-proxy-server:port

# Optional: Search Configuration
# SEARXNG_ENDPOINT=http://your-searxng-instance

# Optional: Queue Admin Panel
BULL_AUTH_KEY=your_secure_admin_key
```

### 3. Deploy with Docker Compose

```bash
# Build the containers
docker compose build

# Start the services
docker compose up -d

# Check status
docker compose ps
```

### 4. Verify Installation

Test the Firecrawl API:

```bash
curl -X POST http://localhost:3002/v1/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "formats": ["markdown"]
  }'
```

## AiSumai (愛住) Integration

### Environment Variables

Edge function env lives in mode files under `supabase/functions/` (see
`LOCAL_DEV_SETUP.md`). Set Firecrawl values in each:

```bash
# supabase/functions/.env.development (local mode)
# Edge runtime is containerized — reach the host via host.docker.internal.
FIRECRAWL_URL=http://host.docker.internal:3002
FIRECRAWL_API_KEY=your_firecrawl_api_key

# supabase/functions/.env.remote (remote / hosted mode)
FIRECRAWL_URL=https://your-firecrawl-domain.com
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

Activate a mode with `npm run functions:env:local` / `functions:env:remote`,
then restart Supabase. Note: `host.docker.internal` is required because the
edge runtime runs inside a Docker container — `localhost` would point at the
container itself.

## Production Deployment

### 1. Reverse Proxy Setup (nginx example)

```nginx
server {
    listen 80;
    server_name your-firecrawl-domain.com;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. SSL Certificate

```bash
# Using Let's Encrypt
sudo certbot --nginx -d your-firecrawl-domain.com
```

### 3. Resource Monitoring

Monitor resource usage:

```bash
# Check container resources
docker stats

# Check logs
docker compose logs -f
```

## API Compatibility

The self-hosted Firecrawl API is compatible with the hosted version for basic scraping operations. However, some advanced features may require additional configuration:

### Supported Features
- ✅ Basic web scraping
- ✅ HTML extraction
- ✅ Image extraction
- ✅ Custom schemas
- ✅ Action sequences (wait, scroll, click)

### Limited Features
- ⚠️ Advanced AI extraction (requires OpenAI API key)
- ⚠️ Fire-engine features (may need additional setup)
- ⚠️ Rate limiting (basic implementation)

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Check if containers are running
   docker compose ps
   
   # Check logs
   docker compose logs firecrawl
   ```

2. **Memory Issues**
   ```bash
   # Increase Docker memory allocation
   # Edit docker-compose.yml to add memory limits
   ```

3. **Network Issues**
   ```bash
   # Check network connectivity
   docker compose exec firecrawl curl -I https://example.com
   ```

### Debugging

Enable debug logging:

```bash
# Add to .env
DEBUG=true
LOG_LEVEL=debug
```

## Security Considerations

### API Key Management
- Generate strong API keys
- Rotate keys regularly
- Use environment variables (never hardcode)

### Network Security
- Use HTTPS in production
- Configure firewall rules
- Consider VPN for internal access

### Data Privacy
- Configure data retention policies
- Implement proper logging practices
- Regular security updates

## Performance Tuning

### Resource Optimization
- Adjust Docker memory limits
- Configure concurrent request limits
- Implement proper caching strategies

### Scaling
- Consider horizontal scaling with load balancers
- Implement queue-based processing for high volume
- Monitor and alert on resource usage

## Maintenance

### Regular Tasks
- Monitor disk usage
- Review and rotate logs
- Update Firecrawl version
- Security patches

### Backup Strategy
- Database backups (if using persistent storage)
- Configuration backups
- Documentation updates

## Cost Considerations

### Self-Hosting vs SaaS
- **Self-hosting**: Infrastructure costs, maintenance overhead
- **SaaS**: Per-request pricing, managed service

### Optimization Tips
- Cache frequently accessed content
- Implement request deduplication
- Use appropriate rate limiting
- Monitor usage patterns

## Support

For issues specific to:
- **Firecrawl**: Check [Firecrawl GitHub Issues](https://github.com/mendableai/firecrawl/issues)
- **AiSumai Integration**: Check project documentation
- **Docker/Infrastructure**: Consult Docker and system documentation