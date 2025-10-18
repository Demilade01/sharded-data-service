# Sharded Data Service

A high-performance, in-memory data service with built-in sharding capabilities, Prometheus metrics, and Kubernetes deployment support.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Prometheus Metrics](#prometheus-metrics)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Demo](#demo)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This project implements a distributed data storage service that uses a **sharding mechanism** to distribute data across multiple in-memory shards. Each piece of data is assigned to a specific shard based on the user ID using a modulo hash function (`userId % N`).

Built with **TypeScript**, **Express.js**, and **Prometheus**, this service is production-ready and designed to be deployed on **Kubernetes**.

## ✨ Features

- ✅ **Automatic Sharding**: Data is automatically distributed across N shards using `userId % N`
- ✅ **In-Memory Storage**: Fast data access with in-memory storage (Map-based)
- ✅ **RESTful API**: Clean, well-documented API endpoints
- ✅ **Prometheus Metrics**: Comprehensive metrics for monitoring and observability
- ✅ **Health Checks**: Built-in health check endpoints for Kubernetes
- ✅ **Kubernetes Ready**: Includes deployment manifests and configuration
- ✅ **TypeScript**: Fully typed for better developer experience
- ✅ **Docker Support**: Multi-stage Docker build for optimized images
- ✅ **Scalable**: Designed to run multiple replicas in Kubernetes

## 🏗️ Architecture

### Sharding Mechanism

The service uses a simple but effective sharding algorithm:

```
1. User sends data with userId
2. Hash function converts userId to numeric value
3. Shard ID = hash(userId) % SHARD_COUNT
4. Data is stored in the calculated shard
5. Future queries for the same userId always route to the same shard
```

**Example:**
- Total shards: 5
- userId: "user123"
- hash("user123") = 123456789
- Shard ID = 123456789 % 5 = 4
- Data stored in Shard 4

### System Components

```
┌─────────────────────────────────────────────────┐
│                  Client                         │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTP Requests
                 ▼
┌─────────────────────────────────────────────────┐
│            Express API Server                    │
│  ┌─────────────────────────────────────────┐   │
│  │         Route Handlers                   │   │
│  │  • POST /api/store                       │   │
│  │  • GET /api/data/:userId                 │   │
│  │  • GET /api/stats                        │   │
│  └────────────────┬────────────────────────┘   │
│                   │                              │
│  ┌────────────────▼─────────────────────────┐  │
│  │         Shard Manager                     │  │
│  │  • Hash function                          │  │
│  │  • Shard allocation (userId % N)          │  │
│  │  • Data retrieval                         │  │
│  └────────────────┬─────────────────────────┘  │
│                   │                              │
│  ┌────────────────▼─────────────────────────┐  │
│  │    In-Memory Shards (Map Storage)         │  │
│  │  Shard 0 │ Shard 1 │ ... │ Shard N-1      │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │      Prometheus Metrics                   │  │
│  │  • Request counts                         │  │
│  │  • Shard distribution                     │  │
│  │  • Performance metrics                    │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## 📦 Prerequisites

- **Node.js** 18+ and npm
- **Docker** (for containerization)
- **Kubernetes** (for deployment)
  - Docker Desktop with Kubernetes enabled, or
  - Minikube, or
  - Cloud Kubernetes (GKE, EKS, AKS)
- **kubectl** CLI tool
- **HTTPie** or **curl** (for testing)

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sharded-data-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env

   # Edit .env if needed (defaults are fine for development)
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Test the service**
   ```bash
   # Health check
   curl http://localhost:3000/health

   # Store some data
   curl -X POST http://localhost:3000/api/store \
     -H "Content-Type: application/json" \
     -d '{"userId": "user123", "data": {"name": "John Doe"}}'
   ```

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## 📚 API Documentation

### Base URL
- Local: `http://localhost:3000`
- Kubernetes: `http://localhost:30080` (NodePort)

### Endpoints

#### 1. Store Data
**POST** `/api/store`

Store data associated with a userId. The data will be automatically sharded.

**Request:**
```bash
http POST http://localhost:3000/api/store \
  userId=user123 \
  data:='{"name": "John", "email": "john@example.com", "age": 30}'
```

**Response:**
```json
{
  "success": true,
  "message": "Data stored successfully",
  "shardId": 2,
  "userId": "user123"
}
```

---

#### 2. Retrieve Data by User ID
**GET** `/api/data/:userId`

Retrieve data for a specific userId.

**Request:**
```bash
http GET http://localhost:3000/api/data/user123
```

**Response:**
```json
{
  "success": true,
  "userId": "user123",
  "data": {
    "name": "John",
    "email": "john@example.com",
    "age": 30
  },
  "timestamp": "2025-10-18T12:34:56.789Z",
  "shardId": 2
}
```

---

#### 3. Get Shard Statistics
**GET** `/api/stats`

Get distribution statistics across all shards.

**Request:**
```bash
http GET http://localhost:3000/api/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalShards": 5,
    "totalRecords": 15,
    "shardDistribution": [
      {
        "shardId": 0,
        "dataCount": 3,
        "userIds": ["user1", "user6", "user11"]
      },
      {
        "shardId": 1,
        "dataCount": 4,
        "userIds": ["user2", "user7", "user12", "user17"]
      },
      // ... more shards
    ]
  }
}
```

---

#### 4. Get Data in Specific Shard
**GET** `/api/shard/:shardId`

View all data stored in a specific shard.

**Request:**
```bash
http GET http://localhost:3000/api/shard/2
```

**Response:**
```json
{
  "success": true,
  "shardId": 2,
  "recordCount": 3,
  "data": [
    {
      "userId": "user123",
      "data": { "name": "John" },
      "timestamp": "2025-10-18T12:34:56.789Z"
    }
    // ... more records
  ]
}
```

---

#### 5. Find Shard for User
**GET** `/api/user/:userId/shard`

Find which shard contains data for a specific userId.

**Request:**
```bash
http GET http://localhost:3000/api/user/user123/shard
```

**Response:**
```json
{
  "success": true,
  "userId": "user123",
  "shardId": 2,
  "totalShards": 5
}
```

---

#### 6. Health Check
**GET** `/health`

Health check endpoint for monitoring and Kubernetes probes.

**Request:**
```bash
http GET http://localhost:3000/health
```

**Response:**
```json
{
  "status": "healthy",
  "uptime": 1234.56,
  "timestamp": "2025-10-18T12:34:56.789Z",
  "shards": {
    "total": 5,
    "totalRecords": 15
  }
}
```

---

#### 7. Prometheus Metrics
**GET** `/metrics`

Prometheus-compatible metrics endpoint.

**Request:**
```bash
http GET http://localhost:3000/metrics
```

**Response:** (Prometheus text format)
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="POST",route="/api/store",status="201"} 15

# HELP shard_requests_total Total number of requests per shard
# TYPE shard_requests_total counter
shard_requests_total{shard_id="0"} 3
shard_requests_total{shard_id="1"} 4
...
```

## 📊 Prometheus Metrics

The service exposes the following metrics:

| Metric Name | Type | Description |
|------------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests (labeled by method, route, status) |
| `shard_requests_total` | Counter | Total requests per shard (labeled by shard_id) |
| `shard_distribution` | Gauge | Number of records in each shard |
| `total_records` | Gauge | Total records across all shards |
| `http_request_duration_seconds` | Histogram | Request duration in seconds |
| `store_operation_success_total` | Counter | Successful store operations |
| `store_operation_failure_total` | Counter | Failed store operations |

### Example Prometheus Queries

```promql
# Request rate per shard
rate(shard_requests_total[5m])

# Average request duration
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Success rate
rate(store_operation_success_total[5m]) /
  (rate(store_operation_success_total[5m]) + rate(store_operation_failure_total[5m]))
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Docker installed and running
- Kubernetes cluster (Docker Desktop, Minikube, or cloud)
- kubectl CLI configured

### Deployment Steps

#### 1. Build Docker Image
```bash
docker build -t sharded-data-service:latest .
```

#### 2. (Optional) Push to Registry
If using a remote Kubernetes cluster:
```bash
# Tag the image
docker tag sharded-data-service:latest yourusername/sharded-data-service:latest

# Push to Docker Hub
docker push yourusername/sharded-data-service:latest

# Update k8s/deployment.yaml to use your image
```

#### 3. Deploy to Kubernetes
```bash
# Apply all manifests
kubectl apply -f k8s/

# Or apply individually
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

#### 4. Verify Deployment
```bash
# Check pods
kubectl get pods

# Check service
kubectl get services

# View logs
kubectl logs -l app=sharded-data-service
```

#### 5. Access the Service

**Via NodePort (local Kubernetes):**
```bash
# Health check
http GET http://localhost:30080/health

# Store data
http POST http://localhost:30080/api/store userId=user1 data:='{"name":"Test"}'
```

**Via Port Forwarding:**
```bash
kubectl port-forward service/sharded-data-service 3000:80

# In another terminal
http GET http://localhost:3000/health
```

### Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment sharded-data-service --replicas=5

# Verify
kubectl get pods
```

### Cleanup

```bash
# Delete all resources
kubectl delete -f k8s/
```

## 🎬 Demo

### Scenario: Store and Retrieve Data Across Shards

```bash
# 1. Store data for multiple users
http POST http://localhost:3000/api/store userId=alice data:='{"name":"Alice","role":"admin"}'
http POST http://localhost:3000/api/store userId=bob data:='{"name":"Bob","role":"user"}'
http POST http://localhost:3000/api/store userId=charlie data:='{"name":"Charlie","role":"user"}'
http POST http://localhost:3000/api/store userId=diana data:='{"name":"Diana","role":"moderator"}'
http POST http://localhost:3000/api/store userId=eve data:='{"name":"Eve","role":"user"}'

# 2. Check shard distribution
http GET http://localhost:3000/api/stats

# 3. Find which shard holds Alice's data
http GET http://localhost:3000/api/user/alice/shard

# 4. Retrieve Alice's data
http GET http://localhost:3000/api/data/alice

# 5. View all data in a specific shard (e.g., shard 2)
http GET http://localhost:3000/api/shard/2

# 6. Check Prometheus metrics
http GET http://localhost:3000/metrics
```

### Expected Output

After running the demo, you should see:
- Data distributed across 5 shards
- Each userId consistently maps to the same shard
- Prometheus metrics showing request counts per shard
- Shard distribution statistics

## 📂 Project Structure

```
sharded-data-service/
├── src/
│   ├── index.ts              # Application entry point
│   ├── config/
│   │   └── index.ts          # Configuration management
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── services/
│   │   └── ShardManager.ts   # Core sharding logic
│   ├── metrics/
│   │   └── index.ts          # Prometheus metrics setup
│   └── routes/
│       ├── store.routes.ts   # Store and retrieve endpoints
│       ├── shard.routes.ts   # Shard query endpoints
│       ├── metrics.routes.ts # Metrics endpoint
│       └── health.routes.ts  # Health check endpoint
├── k8s/
│   ├── deployment.yaml       # Kubernetes Deployment
│   ├── service.yaml          # Kubernetes Service
│   ├── configmap.yaml        # Configuration
│   └── README.md             # K8s deployment guide
├── Dockerfile                # Docker build configuration
├── .dockerignore             # Docker ignore rules
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file (or use `.env.example` as a template):

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Sharding Configuration
SHARD_COUNT=5

# Metrics Configuration
METRICS_ENABLED=true
```

### Kubernetes Configuration

Edit `k8s/configmap.yaml` or `k8s/deployment.yaml` to change:
- Number of shards (`SHARD_COUNT`)
- Number of replicas
- Resource limits (CPU, memory)
- Health check intervals

## 🐛 Troubleshooting

### Application Won't Start

**Check logs:**
```bash
# Local
npm run dev

# Kubernetes
kubectl logs -l app=sharded-data-service
```

**Common issues:**
- Port 3000 already in use
- Missing dependencies: Run `npm install`
- TypeScript errors: Run `npm run build`

### Kubernetes Pods Not Running

**Check pod status:**
```bash
kubectl get pods
kubectl describe pod <pod-name>
```

**Common issues:**
- Image not found: Ensure image is built (`docker images`)
- Insufficient resources: Reduce resource requests in deployment.yaml
- ImagePullBackOff: Check `imagePullPolicy` setting

### Data Not Found

**Remember:**
- Data is stored **in-memory** only
- Each pod has its own memory (data not shared between replicas)
- Data is lost on pod restart
- This is by design for this demo project

### Can't Access Service

**Try port forwarding:**
```bash
kubectl port-forward service/sharded-data-service 3000:80
curl http://localhost:3000/health
```

## 🔒 Limitations & Future Improvements

### Current Limitations
- **In-memory storage**: Data is lost on restart
- **No data replication**: Each pod has independent memory
- **No persistence**: No database or persistent storage
- **No authentication**: API is open to all requests

### Potential Improvements
- Add Redis or another persistent storage backend
- Implement data replication across pods
- Add authentication and authorization
- Implement consistent hashing for better shard rebalancing
- Add request rate limiting
- Add API versioning
- Add integration tests
- Add CI/CD pipeline

## 📄 License

ISC

## 👤 Author

Built as a demonstration of:
- TypeScript backend development
- Distributed systems (sharding)
- Prometheus metrics integration
- Kubernetes deployment
- Production-ready code practices

---

**Questions or feedback?** Feel free to reach out!

