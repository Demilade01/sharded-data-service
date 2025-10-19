# Sharded Data Service

A high-performance, in-memory data service with built-in sharding capabilities, Prometheus metrics, and Kubernetes deployment support.

## 🎥 Video Walkthrough

**Watch the complete project demonstration:** [https://youtu.be/voTg9PEgMq4](https://youtu.be/voTg9PEgMq4)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Project Structure](#project-structure)

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

## 🏗️ Architecture

For detailed architecture diagrams and explanations, see [ARCHITECTURE.md](./ARCHITECTURE.md).

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
- hash("user123") = 1847238974
- Shard ID = 1847238974 % 5 = 4
- Data stored in Shard 4

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker (optional, for containerization)
- Kubernetes (optional, for deployment)

### Local Development

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd sharded-data-service
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Test the service**
   ```bash
   # Health check
   curl http://localhost:3000/health
   
   # Store data
   curl -X POST http://localhost:3000/api/store \
     -H "Content-Type: application/json" \
     -d '{"userId": "user123", "data": {"name": "John Doe"}}'
   ```

### Production Build

```bash
npm run build
npm start
```

## 📚 API Documentation

### Base URL
- Local: `http://localhost:3000`
- Kubernetes: `http://localhost:30080` (NodePort)

### Endpoints

#### 1. Store Data
**POST** `/api/store`

Store data associated with a userId. Data will be automatically sharded.

**Request:**
```bash
http POST http://localhost:3000/api/store \
  userId=user123 \
  data:='{"name": "John", "email": "john@example.com"}'
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
    "email": "john@example.com"
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
      }
    ]
  }
}
```

---

#### 4. Find Shard for User
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

#### 5. Health Check
**GET** `/health`

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

#### 6. Prometheus Metrics
**GET** `/metrics`

Prometheus-compatible metrics endpoint.

**Key Metrics:**
- `http_requests_total` - Total HTTP requests
- `shard_requests_total` - Requests per shard
- `shard_distribution` - Records in each shard
- `http_request_duration_seconds` - Request duration
- `store_operation_success_total` - Successful operations
- `store_operation_failure_total` - Failed operations

## ☸️ Kubernetes Deployment

### Quick Deploy

```bash
# 1. Build Docker image
docker build -t sharded-data-service:latest .

# 2. Deploy to Kubernetes
kubectl apply -f k8s/

# 3. Verify deployment
kubectl get pods
kubectl get services

# 4. Access the service
http GET http://localhost:30080/health
```

### Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment sharded-data-service --replicas=5
```

### Cleanup

```bash
kubectl delete -f k8s/
```

For detailed Kubernetes deployment instructions, see [k8s/README.md](./k8s/README.md).

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
│   └── configmap.yaml        # Configuration
├── Dockerfile                # Docker build configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## ⚙️ Configuration

Configuration is managed through environment variables. Default values are set for development.

**Key Configuration:**
- `PORT` - Server port (default: 3000)
- `SHARD_COUNT` - Number of shards (default: 5)
- `NODE_ENV` - Environment (development/production)
- `METRICS_ENABLED` - Enable Prometheus metrics (default: true)

For Kubernetes deployment, edit `k8s/configmap.yaml` or `k8s/deployment.yaml`.

## 📄 License

ISC

---

**Built with TypeScript, Express, and Kubernetes** | [Watch Video Demo](https://youtu.be/voTg9PEgMq4)
