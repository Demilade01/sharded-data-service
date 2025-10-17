# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the Sharded Data Service.

## 📁 Files

- **deployment.yaml** - Defines the application deployment (pods, replicas, health checks)
- **service.yaml** - Exposes the application via NodePort
- **configmap.yaml** - Stores configuration (optional, can use env vars in deployment directly)

## 🚀 Quick Start

### Prerequisites
- Docker installed and running
- Kubernetes cluster (Docker Desktop, Minikube, or cloud provider)
- kubectl CLI installed

### Step 1: Build Docker Image

```bash
# From project root directory
docker build -t sharded-data-service:latest .
```

### Step 2: Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Or apply individually
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### Step 3: Verify Deployment

```bash
# Check pods are running
kubectl get pods

# Check service
kubectl get services

# Check deployment
kubectl get deployments
```

### Step 4: Access the Application

**Local (Docker Desktop or Minikube):**
```bash
# Access via NodePort
curl http://localhost:30080/health

# Or use port forwarding
kubectl port-forward service/sharded-data-service 3000:80
curl http://localhost:3000/health
```

## 📊 Accessing Endpoints

Once deployed, access via:
- **Health:** `http://localhost:30080/health`
- **Store Data:** `http://localhost:30080/api/store` (POST)
- **Get Stats:** `http://localhost:30080/api/stats`
- **Metrics:** `http://localhost:30080/metrics`

## 🔧 Useful Commands

```bash
# View pod logs
kubectl logs -l app=sharded-data-service

# Follow logs
kubectl logs -f -l app=sharded-data-service

# Scale deployment
kubectl scale deployment sharded-data-service --replicas=3

# Delete deployment
kubectl delete -f k8s/

# Describe pod (troubleshooting)
kubectl describe pod <pod-name>

# Get pod details
kubectl get pod -o wide
```

## 🐛 Troubleshooting

### Pods not starting?
```bash
# Check pod status
kubectl get pods

# View pod events
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>
```

### Image pull errors?
If using Docker Hub, update `deployment.yaml`:
```yaml
image: yourusername/sharded-data-service:latest
imagePullPolicy: Always
```

### Can't access service?
```bash
# Check service endpoints
kubectl get endpoints

# Use port forwarding instead
kubectl port-forward service/sharded-data-service 3000:80
```

## 📝 Configuration

### Environment Variables (deployment.yaml)
- `PORT` - Application port (default: 3000)
- `SHARD_COUNT` - Number of shards (default: 5)
- `NODE_ENV` - Environment (production/development)
- `METRICS_ENABLED` - Enable Prometheus metrics (true/false)

### Service Type Options
Current: `NodePort` - Good for local testing

For cloud deployment, change in `service.yaml`:
```yaml
type: LoadBalancer  # Creates cloud load balancer
```

## 🔄 Updating the Application

```bash
# 1. Build new image
docker build -t sharded-data-service:v2 .

# 2. Update deployment.yaml image tag
# image: sharded-data-service:v2

# 3. Apply changes
kubectl apply -f k8s/deployment.yaml

# 4. Check rollout status
kubectl rollout status deployment/sharded-data-service
```

## 🎯 Production Considerations

For production deployment:
1. Use LoadBalancer service type
2. Push image to container registry (Docker Hub, ECR, GCR)
3. Add resource limits/requests
4. Configure horizontal pod autoscaling
5. Add monitoring (Prometheus ServiceMonitor)
6. Use secrets for sensitive data
7. Configure ingress for routing

