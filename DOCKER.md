# Docker Deployment Guide

This guide explains how to run the JIRA MCP Server as a Docker container.

## 📋 Prerequisites

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher (optional, for easier management)
- **JIRA Account**: With API access

## 🚀 Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Configure environment**:
   ```bash
   cp .env.docker .env
   # Edit .env and set your JIRA_BASE_URL
   ```

2. **Build and run**:
   ```bash
   docker-compose up -d
   ```

3. **Check status**:
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

4. **Stop the container**:
   ```bash
   docker-compose down
   ```

### Option 2: Using Docker CLI

1. **Build the image**:
   ```bash
   docker build -t jira-mcp-server:latest .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     --name jira-mcp-server \
     -p 3000:3000 \
     -e JIRA_BASE_URL=https://your-domain.atlassian.net \
     -e PORT=3000 \
     -e CORS_ORIGIN=* \
     jira-mcp-server:latest
   ```

3. **Check logs**:
   ```bash
   docker logs -f jira-mcp-server
   ```

4. **Stop the container**:
   ```bash
   docker stop jira-mcp-server
   docker rm jira-mcp-server
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JIRA_BASE_URL` | Yes | - | Your JIRA instance URL (e.g., `https://company.atlassian.net`) |
| `PORT` | No | `3000` | HTTP server port |
| `CORS_ORIGIN` | No | `*` | CORS allowed origins |
| `CORS_ORIGIN` | No | `*` | CORS allowed origins |

### Authentication

Credentials are passed via HTTP headers on each request (not in environment variables):
- **Authorization**: `Bearer YOUR_JIRA_API_TOKEN`
- **X-JIRA-Email**: `your-email@company.com`

## 📊 Health Check

The container includes a health check that pings the `/health` endpoint every 30 seconds.

Check health status:
```bash
docker inspect --format='{{.State.Health.Status}}' jira-mcp-server
```

## 🛠️ Development

### Build with custom tag:
```bash
docker build -t jira-mcp-server:dev .
```

### Run with volume mount for development:
```bash
docker run -d \
  --name jira-mcp-dev \
  -p 3000:3000 \
  -v $(pwd)/src:/app/src \
  -e JIRA_BASE_URL=https://your-domain.atlassian.net \
  jira-mcp-server:dev
```

### Interactive shell access:
```bash
docker exec -it jira-mcp-server sh
```

## 📦 Multi-Architecture Support

Build for multiple platforms:
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t jira-mcp-server:latest \
  --push .
```

## 🚢 Production Deployment

### Using Docker Compose in Production

1. **Create production `.env`**:
   ```bash
   JIRA_BASE_URL=https://production.atlassian.net
   PORT=3000
   CORS_ORIGIN=https://your-frontend.com
   ```

2. **Deploy**:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **Monitor**:
   ```bash
   # View logs
   docker-compose logs -f --tail=100
   
   # Check resource usage
   docker stats jira-mcp-server
   
   # View health
   curl http://localhost:3000/health
   ```

### Kubernetes Deployment

Example Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jira-mcp-server
spec:
  replicas: 2
  selector:
    matchLabels:
      app: jira-mcp-server
  template:
    metadata:
      labels:
        app: jira-mcp-server
    spec:
      containers:
      - name: jira-mcp-server
        image: jira-mcp-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: JIRA_BASE_URL
          value: "https://your-domain.atlassian.net"
        - name: PORT
          value: "3000"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: jira-mcp-server
spec:
  selector:
    app: jira-mcp-server
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs jira-mcp-server

# Common issues:
# - Missing JIRA_BASE_URL
# - Port 3000 already in use
```

### Health check failing
```bash
# Check if server is responding
docker exec jira-mcp-server wget -qO- http://localhost:3000/health

# Check if port is accessible
curl http://localhost:3000/health
```

### Network issues
```bash
# Inspect network
docker network inspect jira-mcp-network

# Check container network settings
docker inspect jira-mcp-server | grep -A 20 NetworkSettings
```

## 🔒 Security Best Practices

1. **Don't include credentials in the image**
   - Use environment variables or secrets management
   - Never commit `.env` files

2. **Run as non-root user**
   - The Dockerfile creates and uses a `nodejs` user

3. **Use specific image tags**
   - Avoid `latest` in production
   - Pin to specific versions

4. **Scan for vulnerabilities**
   ```bash
   docker scan jira-mcp-server:latest
   ```

5. **Use HTTPS in production**
   - Put behind a reverse proxy (nginx, Traefik)
   - Use Let's Encrypt for SSL certificates

## 📚 Additional Commands

```bash
# View container size
docker images jira-mcp-server

# Remove old containers and images
docker system prune -a

# Export image
docker save jira-mcp-server:latest | gzip > jira-mcp-server.tar.gz

# Import image
gunzip -c jira-mcp-server.tar.gz | docker load

# Update and restart
docker-compose pull
docker-compose up -d
```

## 🤝 Contributing

When updating the Docker setup:
1. Test build locally
2. Verify health checks work
3. Test with docker-compose
4. Update this documentation

---

**Built with ❤️ using Docker and Node.js**
