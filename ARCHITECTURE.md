# Sharded Data Service - Architecture Design

This document contains the system architecture diagrams for the Sharded Data Service.

## 📊 How to View These Diagrams

### Option 1: GitHub (Automatic)
- Push this file to GitHub - diagrams render automatically

### Option 2: VS Code
- Install "Markdown Preview Mermaid Support" extension
- Open preview (Ctrl+Shift+V)

### Option 3: Online Editors
- Copy diagram code to: https://mermaid.live/
- Export as PNG/SVG for presentations

---

## 1. High-Level System Architecture

This diagram shows the overall system architecture including Kubernetes deployment.

```mermaid
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

    style Client fill:#b3e5fc,stroke:#01579b,stroke-width:2px
    style LB fill:#ffe0b2,stroke:#e65100,stroke-width:2px,color:#000
    style Pod1 fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style Pod2 fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style CM fill:#e1bee7,stroke:#6a1b9a,stroke-width:2px
    style Prom fill:#fff59d,stroke:#f57f17,stroke-width:2px,color:#000
```

---

## 2. Application Architecture (Internal Components)

This diagram shows the internal structure of each pod/application instance.

```mermaid
graph TB
    subgraph "Express Application"
        subgraph "Entry Point"
            Main[index.ts<br/>Express Server<br/>Port: 3000]
        end

        subgraph "Middleware Layer"
            CORS[CORS Middleware]
            JSON[Body Parser]
            Metrics[Metrics Middleware]
        end

        subgraph "Route Handlers"
            StoreRoute[store.routes.ts<br/>POST /api/store<br/>GET /api/data/:userId]
            ShardRoute[shard.routes.ts<br/>GET /api/shard/:id<br/>GET /api/stats]
            MetricsRoute[metrics.routes.ts<br/>GET /metrics]
            HealthRoute[health.routes.ts<br/>GET /health]
        end

        subgraph "Service Layer"
            ShardMgr[ShardManager Service<br/>Core Business Logic]
        end

        subgraph "Data Layer"
            Shard0[Shard 0<br/>Map Storage]
            Shard1[Shard 1<br/>Map Storage]
            Shard2[Shard 2<br/>Map Storage]
            Shard3[Shard 3<br/>Map Storage]
            Shard4[Shard 4<br/>Map Storage]
        end

        subgraph "Observability"
            PromClient[Prometheus Client<br/>Metrics Collection]
        end
    end

    Main --> CORS
    CORS --> JSON
    JSON --> Metrics
    Metrics --> StoreRoute
    Metrics --> ShardRoute
    Metrics --> MetricsRoute
    Metrics --> HealthRoute

    StoreRoute --> ShardMgr
    ShardRoute --> ShardMgr
    HealthRoute --> ShardMgr

    ShardMgr --> Shard0
    ShardMgr --> Shard1
    ShardMgr --> Shard2
    ShardMgr --> Shard3
    ShardMgr --> Shard4

    StoreRoute --> PromClient
    ShardRoute --> PromClient
    MetricsRoute --> PromClient

    style Main fill:#bbdefb,stroke:#1565c0,stroke-width:2px
    style ShardMgr fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style PromClient fill:#fff59d,stroke:#f57f17,stroke-width:2px,color:#000
```

---

## 3. Sharding Algorithm Flow

This diagram explains how the sharding mechanism works.

```mermaid
graph TD
    Start([User Request]) --> Input[Input: userId + data<br/>Example: 'user123']
    Input --> Hash[Hash Function<br/>Convert string to number]
    Hash --> HashCalc[hash'user123' = 1847238974]
    HashCalc --> Modulo[Modulo Operation<br/>hash % SHARD_COUNT]
    Modulo --> ModCalc[1847238974 % 5 = 4]
    ModCalc --> ShardId[Shard ID = 4]
    ShardId --> Store[Store data in Shard 4]
    Store --> UpdateMetrics[Update Prometheus Metrics<br/>shard_requests_total shard_id=4]
    UpdateMetrics --> Response[Return Response<br/>shardId: 4, success: true]
    Response --> End([End])

    style Start fill:#b3e5fc,stroke:#01579b,stroke-width:2px
    style Hash fill:#ffe0b2,stroke:#e65100,stroke-width:2px,color:#000
    style Modulo fill:#e1bee7,stroke:#6a1b9a,stroke-width:2px
    style Store fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style UpdateMetrics fill:#fff59d,stroke:#f57f17,stroke-width:2px,color:#000
    style End fill:#b3e5fc,stroke:#01579b,stroke-width:2px
```

---

## 4. Data Flow - Store Operation

This shows the complete flow when storing data.

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant Route as store.routes.ts
    participant SM as ShardManager
    participant Shard as Shard 4
    participant Metrics as Prometheus

    C->>API: POST /api/store<br/>{userId: "user123", data: {...}}
    API->>Route: Route request
    Route->>Route: Validate input
    Route->>SM: store(userId, data)
    SM->>SM: hash("user123") = 1847238974
    SM->>SM: Calculate: 1847238974 % 5 = 4
    SM->>Shard: Set data in Map
    Shard-->>SM: Data stored
    SM-->>Route: Return shardId: 4
    Route->>Metrics: Increment shard_requests_total{shard_id="4"}
    Route->>Metrics: Increment store_operation_success_total
    Route->>Metrics: Record http_request_duration
    Route-->>API: Response object
    API-->>C: 201 Created<br/>{success: true, shardId: 4}
```

---

## 5. Data Flow - Retrieve Operation

This shows the flow when retrieving data.

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant Route as store.routes.ts
    participant SM as ShardManager
    participant Shard as Shard 4

    C->>API: GET /api/data/user123
    API->>Route: Route request
    Route->>SM: get("user123")
    SM->>SM: Calculate shard: hash("user123") % 5 = 4
    SM->>Shard: Retrieve from Map
    Shard-->>SM: Return data or undefined

    alt Data found
        SM-->>Route: Return ShardData object
        Route-->>API: 200 OK with data
        API-->>C: {userId, data, timestamp, shardId}
    else Data not found
        SM-->>Route: Return undefined
        Route-->>API: 404 Not Found
        API-->>C: {success: false, error: "Data not found"}
    end
```

---

## 6. Shard Distribution Example

This shows how data is distributed across shards.

```mermaid
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

    style S0 fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    style S1 fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style S2 fill:#bbdefb,stroke:#1565c0,stroke-width:2px
    style S3 fill:#fff59d,stroke:#f57f17,stroke-width:2px,color:#000
    style S4 fill:#e1bee7,stroke:#6a1b9a,stroke-width:2px
```

---

## 7. Kubernetes Deployment Architecture

This shows the Kubernetes resources and their relationships.

```mermaid
graph TB
    subgraph "Kubernetes Resources"
        subgraph "Workload"
            Deploy[Deployment<br/>sharded-data-service<br/>replicas: 2]
            RS[ReplicaSet<br/>Manages Pods]
            Pod1[Pod 1<br/>Container: sharded-data-service:latest<br/>Resources: 256Mi RAM, 0.5 CPU]
            Pod2[Pod 2<br/>Container: sharded-data-service:latest<br/>Resources: 256Mi RAM, 0.5 CPU]
        end

        subgraph "Networking"
            Svc[Service<br/>Type: NodePort<br/>Port: 80 → 3000<br/>NodePort: 30080]
        end

        subgraph "Configuration"
            CM[ConfigMap<br/>sharded-data-service-config]
        end

        subgraph "Health Checks"
            Live[Liveness Probe<br/>/health every 10s]
            Ready[Readiness Probe<br/>/health every 5s]
        end
    end

    subgraph "External Access"
        Ext[External Traffic<br/>localhost:30080]
    end

    Deploy --> RS
    RS --> Pod1
    RS --> Pod2
    CM -.->|Environment Variables| Pod1
    CM -.->|Environment Variables| Pod2
    Live -.->|Check| Pod1
    Live -.->|Check| Pod2
    Ready -.->|Check| Pod1
    Ready -.->|Check| Pod2
    Ext -->|Route Traffic| Svc
    Svc -->|Load Balance| Pod1
    Svc -->|Load Balance| Pod2

    style Deploy fill:#bbdefb,stroke:#1565c0,stroke-width:2px
    style Svc fill:#ffe0b2,stroke:#e65100,stroke-width:2px,color:#000
    style Pod1 fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style Pod2 fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style CM fill:#e1bee7,stroke:#6a1b9a,stroke-width:2px
    style Ext fill:#ffcdd2,stroke:#c62828,stroke-width:2px
```

---

## 8. Prometheus Metrics Collection

This shows how metrics are collected and exposed.

```mermaid
graph TB
    subgraph "Application"
        Request[HTTP Request]
        Handler[Route Handler]
        ShardMgr[ShardManager]

        subgraph "Prometheus Client"
            Counter[Counters<br/>http_requests_total<br/>shard_requests_total<br/>store_operation_success]
            Gauge[Gauges<br/>shard_distribution<br/>total_records]
            Histogram[Histograms<br/>http_request_duration]
        end

        Registry[Prometheus Registry]
        Endpoint[GET /metrics Endpoint]
    end

    subgraph "External"
        Prom[Prometheus Server<br/>Scrapes every 15s]
        Grafana[Grafana Dashboard<br/>Visualization]
    end

    Request --> Handler
    Handler --> ShardMgr
    Handler --> Counter
    Handler --> Histogram
    ShardMgr --> Gauge

    Counter --> Registry
    Gauge --> Registry
    Histogram --> Registry

    Registry --> Endpoint
    Prom -->|HTTP GET /metrics| Endpoint
    Prom --> Grafana

    style Counter fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    style Gauge fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style Histogram fill:#bbdefb,stroke:#1565c0,stroke-width:2px
    style Prom fill:#fff59d,stroke:#f57f17,stroke-width:2px,color:#000
    style Grafana fill:#e1bee7,stroke:#6a1b9a,stroke-width:2px
```

---

## 9. Error Handling Flow

This shows how errors are handled in the system.

```mermaid
graph TD
    Request[Incoming Request] --> Validate[Validate Input]

    Validate -->|Invalid| Error400[400 Bad Request<br/>Missing userId or data]
    Validate -->|Valid| Process[Process Request]

    Process --> Try{Try Operation}

    Try -->|Success| Metrics[Update Success Metrics]
    Try -->|Exception| Catch[Catch Error]

    Metrics --> Response200[200/201 Success Response]

    Catch --> LogError[Log Error]
    LogError --> FailMetrics[Update Failure Metrics]
    FailMetrics --> Error500[500 Internal Server Error]

    Response200 --> End([Return to Client])
    Error400 --> End
    Error500 --> End

    style Error400 fill:#ffcdd2,stroke:#c62828,stroke-width:3px
    style Error500 fill:#ffcdd2,stroke:#c62828,stroke-width:3px
    style Response200 fill:#c8e6c9,stroke:#2e7d32,stroke-width:3px
    style Metrics fill:#bbdefb,stroke:#1565c0,stroke-width:2px
```

---

## 10. Scaling Strategy

This shows how the system can be scaled.

```mermaid
graph TB
    subgraph "Current State: 2 Replicas"
        LB1[Load Balancer]
        P1[Pod 1<br/>Independent Memory<br/>Shards 0-4]
        P2[Pod 2<br/>Independent Memory<br/>Shards 0-4]

        LB1 --> P1
        LB1 --> P2
    end

    subgraph "Scaled State: 5 Replicas"
        LB2[Load Balancer]
        P3[Pod 1]
        P4[Pod 2]
        P5[Pod 3]
        P6[Pod 4]
        P7[Pod 5]

        LB2 --> P3
        LB2 --> P4
        LB2 --> P5
        LB2 --> P6
        LB2 --> P7
    end

    Note1[Note: Each pod has<br/>independent in-memory shards.<br/>Data is NOT shared between pods.]
    Note2[Scaling increases throughput<br/>but does NOT increase storage<br/>capacity per user.]

    style P1 fill:#e8f5e9
    style P2 fill:#e8f5e9
    style P3 fill:#e3f2fd
    style P4 fill:#e3f2fd
    style P5 fill:#e3f2fd
    style P6 fill:#e3f2fd
    style P7 fill:#e3f2fd
    style Note1 fill:#ffe0b2,stroke:#ff6f00,stroke-width:2px,color:#000
    style Note2 fill:#ffe0b2,stroke:#ff6f00,stroke-width:2px,color:#000
```

---

## Summary

These diagrams illustrate:

1. ✅ **System Architecture** - Overall Kubernetes deployment
2. ✅ **Application Structure** - Internal components and layers
3. ✅ **Sharding Algorithm** - How data distribution works
4. ✅ **Data Flows** - Store and retrieve operations
5. ✅ **Distribution** - How users map to shards
6. ✅ **Kubernetes Resources** - Deployment, services, config
7. ✅ **Metrics Collection** - Prometheus integration
8. ✅ **Error Handling** - How errors are managed
9. ✅ **Scaling** - Horizontal scaling strategy

---


### For GitHub README:
- Diagrams render automatically in GitHub markdown
- Can also be rendered in VS Code with extension



