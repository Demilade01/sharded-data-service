# Sharded Data Service - Architecture Design

This document contains the system architecture diagrams for the Sharded Data Service.

## 1. High-Level System Architecture

This diagram shows the overall system architecture including Kubernetes deployment.

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#c8e6c9','primaryTextColor':'#000','primaryBorderColor':'#2e7d32','lineColor':'#666','secondaryColor':'#e1bee7','tertiaryColor':'#b3e5fc'}}}%%
graph TB
    subgraph "External"
        Client[Client/User<br/>Browser, HTTPie, Postman]
    end

    subgraph "Kubernetes Cluster"
        subgraph "Service Layer"
            LB[Service LoadBalancer<br/>NodePort: 30080]
        end

        subgraph "Application Pods"
            Pod1[Pod 1<br/>Sharded Data Service<br/>Port: 3000]
            Pod2[Pod 2<br/>Sharded Data Service<br/>Port: 3000]
        end

        subgraph "Configuration"
            CM[ConfigMap<br/>SHARD_COUNT=5<br/>PORT=3000]
        end
    end

    subgraph "Monitoring"
        Prom[Prometheus<br/>Scrapes /metrics]
    end

    Client -->|HTTP Requests| LB
    LB -->|Load Balance| Pod1
    LB -->|Load Balance| Pod2
    CM -.->|Config| Pod1
    CM -.->|Config| Pod2
    Pod1 -->|Expose Metrics| Prom
    Pod2 -->|Expose Metrics| Prom

    style Client fill:#b3e5fc,stroke:#01579b,stroke-width:3px,color:#000
    style LB fill:#ffe0b2,stroke:#e65100,stroke-width:3px,color:#000
    style Pod1 fill:#c8e6c9,stroke:#2e7d32,stroke-width:3px,color:#000
    style Pod2 fill:#c8e6c9,stroke:#2e7d32,stroke-width:3px,color:#000
    style CM fill:#e1bee7,stroke:#6a1b9a,stroke-width:3px,color:#000
    style Prom fill:#fff59d,stroke:#f57f17,stroke-width:3px,color:#000
```

**Key Components:**
- **Client**: External users/applications making HTTP requests
- **Load Balancer**: Kubernetes Service distributing traffic across pods
- **Application Pods**: Two replicas of the sharded data service
- **ConfigMap**: Configuration management (shard count, port, etc.)
- **Prometheus**: Metrics collection and monitoring

---

## 2. Sharding Algorithm Flow

This diagram explains how the sharding mechanism works - the core feature of this system.

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#c8e6c9','primaryTextColor':'#000','primaryBorderColor':'#2e7d32','lineColor':'#666'}}}%%
graph TD
    Start([User Request]) --> Input[Input: userId + data<br/>Example: user123]
    Input --> Hash[Hash Function<br/>Convert string to number]
    Hash --> HashCalc[hash user123 = 1847238974]
    HashCalc --> Modulo[Modulo Operation<br/>hash % SHARD_COUNT]
    Modulo --> ModCalc[1847238974 % 5 = 4]
    ModCalc --> ShardId[Shard ID = 4]
    ShardId --> Store[Store data in Shard 4]
    Store --> UpdateMetrics[Update Prometheus Metrics<br/>shard_requests_total shard_id=4]
    UpdateMetrics --> Response[Return Response<br/>shardId: 4, success: true]
    Response --> End([End])

    style Start fill:#b3e5fc,stroke:#01579b,stroke-width:3px,color:#000
    style Hash fill:#ffe0b2,stroke:#e65100,stroke-width:3px,color:#000
    style Modulo fill:#e1bee7,stroke:#6a1b9a,stroke-width:3px,color:#000
    style Store fill:#c8e6c9,stroke:#2e7d32,stroke-width:3px,color:#000
    style UpdateMetrics fill:#fff59d,stroke:#f57f17,stroke-width:3px,color:#000
    style End fill:#b3e5fc,stroke:#01579b,stroke-width:3px,color:#000
    style Input fill:#f0f0f0,stroke:#424242,stroke-width:2px,color:#000
    style HashCalc fill:#f0f0f0,stroke:#424242,stroke-width:2px,color:#000
    style ModCalc fill:#f0f0f0,stroke:#424242,stroke-width:2px,color:#000
    style ShardId fill:#ffcdd2,stroke:#c62828,stroke-width:3px,color:#000
    style Response fill:#f0f0f0,stroke:#424242,stroke-width:2px,color:#000
```

**How It Works:**

1. **User Request**: Client sends data with a userId
2. **Hash Function**: Convert userId string to numeric value (e.g., "user123" → 1847238974)
3. **Modulo Operation**: Calculate shard ID using `hash % SHARD_COUNT` (e.g., 1847238974 % 5 = 4)
4. **Store Data**: Data is stored in the calculated shard (Shard 4)
5. **Update Metrics**: Prometheus metrics are updated
6. **Response**: Return success with shard ID

**Key Benefits:**
- ✅ Same userId always maps to the same shard (consistency)
- ✅ Automatic load distribution across shards
- ✅ Fast lookup - O(1) shard determination
- ✅ Scalable - can adjust shard count via configuration

---

## 3. Shard Distribution Example

This diagram shows how data is distributed across shards in practice.

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#e0e0e0','primaryTextColor':'#000','primaryBorderColor':'#616161','lineColor':'#666'}}}%%
graph LR
    subgraph "Users"
        U1[user1]
        U2[user2]
        U3[user3]
        U4[user4]
        U5[user5]
        U6[user6]
        U7[user7]
        U8[user8]
        U9[user9]
        U10[user10]
    end

    subgraph "Shards"
        S0[Shard 0<br/>2 records]
        S1[Shard 1<br/>3 records]
        S2[Shard 2<br/>1 record]
        S3[Shard 3<br/>2 records]
        S4[Shard 4<br/>2 records]
    end

    U1 -.->|hash % 5 = 2| S2
    U2 -.->|hash % 5 = 1| S1
    U3 -.->|hash % 5 = 4| S4
    U4 -.->|hash % 5 = 0| S0
    U5 -.->|hash % 5 = 1| S1
    U6 -.->|hash % 5 = 3| S3
    U7 -.->|hash % 5 = 1| S1
    U8 -.->|hash % 5 = 4| S4
    U9 -.->|hash % 5 = 0| S0
    U10 -.->|hash % 5 = 3| S3

    style S0 fill:#ffcdd2,stroke:#c62828,stroke-width:3px,color:#000
    style S1 fill:#c8e6c9,stroke:#2e7d32,stroke-width:3px,color:#000
    style S2 fill:#bbdefb,stroke:#1565c0,stroke-width:3px,color:#000
    style S3 fill:#fff59d,stroke:#f57f17,stroke-width:3px,color:#000
    style S4 fill:#e1bee7,stroke:#6a1b9a,stroke-width:3px,color:#000
    style U1 fill:#e0e0e0,stroke:#424242,stroke-width:2px,color:#000
    style U2 fill:#e0e0e0,stroke:#424242,stroke-width:2px,color:#000
    style U3 fill:#e0e0e0,stroke:#424242,stroke-width:2px,color:#000
    style U4 fill:#e0e0e0,stroke:#424242,stroke-width:2px,color:#000
    style U5 fill:#e0e0e0,stroke:#424242,stroke-width:2px,color:#000
    style U6 fill:#e0e0e0,stroke:#424242,stroke-width:2px,color:#000
    style U7 fill:#e0e0e0,stroke:#424242,stroke-width:2px,color:#000
    style U8 fill:#e0e0e0,stroke:#424242,stroke-width:2px,color:#000
    style U9 fill:#e0e0e0,stroke:#424242,stroke-width:2px,color:#000
    style U10 fill:#e0e0e0,stroke:#424242,stroke-width:2px,color:#000
```

**Distribution Analysis:**

This example shows 10 users distributed across 5 shards:
- **Shard 0**: 2 users (user4, user9)
- **Shard 1**: 3 users (user2, user5, user7) - slightly higher load
- **Shard 2**: 1 user (user1)
- **Shard 3**: 2 users (user6, user10)
- **Shard 4**: 2 users (user3, user8)

**Key Observations:**
- ✅ Reasonably balanced distribution
- ✅ Each user always maps to the same shard
- ✅ As more users are added, distribution becomes more even
- ✅ No single shard becomes a bottleneck


