# System Architecture Design - Full-Stack Automation + Analytics System

**Project:** Enterprise Automation & Analytics Platform  
**Date:** April 19, 2026  
**Phase:** 2 - System Architecture & Database Design  
**Status:** Complete

---

## 📐 1. System Architecture Overview

The system is designed as a distributed microservices architecture supporting 100+ concurrent users per day with real-time analytics and automated workflow orchestration. The architecture follows enterprise-grade patterns for scalability, reliability, and maintainability.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Web Browser (Next.js)  │  Mobile (React Native)  │  CLI Tools  │
└────────────┬────────────────────────────────────┬────────────────┘
             │                                    │
┌────────────▼────────────────────────────────────▼────────────────┐
│                    API GATEWAY LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Authentication  │  Rate Limiting  │  Request Routing            │
│  CORS Handling   │  Load Balancing │  Request Validation         │
└────────────┬────────────────────────────────────┬────────────────┘
             │                                    │
┌────────────▼──────────────────────────────────┬─────────────────┐
│              MICROSERVICES LAYER              │  ORCHESTRATION  │
├──────────────────────────────────────────────┼─────────────────┤
│ • Automation Service                         │ • Temporal      │
│ • Analytics Service                          │ • Conductor     │
│ • Dashboard Service                          │ • Airflow       │
│ • Integration Service (GitHub, Codex, etc.)  │                 │
│ • User Service                               │                 │
│ • Notification Service                       │                 │
└────────────┬──────────────────────────────────┬─────────────────┘
             │                                  │
┌────────────▼──────────────────────────────────▼─────────────────┐
│                  DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL (Primary)  │  Redis Cache  │  TimescaleDB (Analytics)│
│  Read Replicas         │  Session Store│  Elasticsearch (Logs)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ 2. Database Schema Design

### Core Tables

#### 2.1 Users & Authentication

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'viewer',
    status VARCHAR(50) DEFAULT 'active',
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_oauth (oauth_provider, oauth_id)
);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User roles mapping
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id)
);
```

#### 2.2 Automation & Workflows

```sql
-- Automation workflows
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    definition JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    INDEX idx_owner_id (owner_id),
    INDEX idx_status (status)
);

-- Workflow executions
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    triggered_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_ms INT,
    error_message TEXT,
    result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workflow_id (workflow_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Workflow tasks
CREATE TABLE workflow_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_execution_id (execution_id),
    INDEX idx_status (status)
);
```

#### 2.3 Analytics & Events

```sql
-- Events table (time-series data)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id),
    entity_type VARCHAR(100),
    entity_id UUID,
    action VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_entity (entity_type, entity_id)
) PARTITION BY RANGE (created_at);

-- Analytics metrics (aggregated data)
CREATE TABLE analytics_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(255) NOT NULL,
    metric_value FLOAT NOT NULL,
    dimension_1 VARCHAR(100),
    dimension_2 VARCHAR(100),
    dimension_3 VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_metric_name (metric_name),
    INDEX idx_timestamp (timestamp)
);

-- Dashboard queries (saved queries)
CREATE TABLE dashboard_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query_sql TEXT NOT NULL,
    visualization_type VARCHAR(50),
    visualization_config JSONB,
    refresh_interval_seconds INT DEFAULT 300,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_owner_id (owner_id)
);
```

#### 2.4 Integrations

```sql
-- GitHub integrations
CREATE TABLE github_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_username VARCHAR(255) NOT NULL,
    github_token VARCHAR(255) NOT NULL ENCRYPTED,
    repositories JSONB DEFAULT '[]',
    webhook_secret VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    UNIQUE(user_id)
);

-- API integrations
CREATE TABLE api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    api_type VARCHAR(100) NOT NULL,
    endpoint_url TEXT NOT NULL,
    api_key VARCHAR(255) NOT NULL ENCRYPTED,
    headers JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_api_type (api_type)
);

-- Webhook logs
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    response_status INT,
    response_body TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_integration_id (integration_id),
    INDEX idx_created_at (created_at)
);
```

#### 2.5 Dashboards & Reports

```sql
-- Dashboards
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    layout JSONB NOT NULL,
    widgets JSONB NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_owner_id (owner_id)
);

-- Dashboard widgets
CREATE TABLE dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    query_id UUID REFERENCES dashboard_queries(id),
    widget_type VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    position_x INT,
    position_y INT,
    width INT,
    height INT,
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dashboard_id (dashboard_id)
);

-- Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dashboard_id UUID REFERENCES dashboards(id),
    schedule VARCHAR(100),
    recipients TEXT[],
    format VARCHAR(50) DEFAULT 'pdf',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sent TIMESTAMP,
    INDEX idx_owner_id (owner_id)
);
```

### Database Indexing Strategy

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| users | idx_email | email | Fast user lookup by email |
| users | idx_oauth | oauth_provider, oauth_id | OAuth authentication |
| workflow_executions | idx_created_at | created_at | Time-series queries |
| events | idx_event_type | event_type | Event filtering |
| analytics_metrics | idx_timestamp | timestamp | Time-range queries |
| dashboards | idx_owner_id | owner_id | User dashboard retrieval |

---

## 🔌 3. API Architecture

### API Gateway Layer

The API gateway serves as the single entry point for all client requests, handling authentication, rate limiting, request routing, and response transformation.

**Responsibilities:**
- Request authentication and authorization
- Rate limiting per user/IP
- Request validation and sanitization
- Response compression
- CORS handling
- Request/response logging
- Load balancing across services

### Microservices API Endpoints

#### 3.1 Automation Service

```
POST   /api/v1/workflows              - Create workflow
GET    /api/v1/workflows              - List workflows
GET    /api/v1/workflows/:id          - Get workflow details
PUT    /api/v1/workflows/:id          - Update workflow
DELETE /api/v1/workflows/:id          - Delete workflow
POST   /api/v1/workflows/:id/execute  - Execute workflow
GET    /api/v1/executions             - List executions
GET    /api/v1/executions/:id         - Get execution details
GET    /api/v1/executions/:id/tasks   - Get execution tasks
```

#### 3.2 Analytics Service

```
GET    /api/v1/analytics/metrics      - Get metrics
POST   /api/v1/analytics/query        - Execute custom query
GET    /api/v1/analytics/events       - Get events
GET    /api/v1/analytics/trends       - Get trend data
GET    /api/v1/analytics/summary      - Get summary statistics
```

#### 3.3 Dashboard Service

```
POST   /api/v1/dashboards             - Create dashboard
GET    /api/v1/dashboards             - List dashboards
GET    /api/v1/dashboards/:id         - Get dashboard
PUT    /api/v1/dashboards/:id         - Update dashboard
DELETE /api/v1/dashboards/:id         - Delete dashboard
POST   /api/v1/dashboards/:id/widgets - Add widget
PUT    /api/v1/dashboards/:id/widgets/:widgetId - Update widget
DELETE /api/v1/dashboards/:id/widgets/:widgetId - Remove widget
```

#### 3.4 Integration Service

```
POST   /api/v1/integrations/github    - Connect GitHub
GET    /api/v1/integrations/github    - Get GitHub integration
DELETE /api/v1/integrations/github    - Disconnect GitHub
POST   /api/v1/integrations/api       - Add API integration
GET    /api/v1/integrations/api       - List API integrations
DELETE /api/v1/integrations/api/:id   - Remove API integration
```

### API Response Format

All API responses follow a consistent format for predictability and ease of client handling.

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Example",
    "created_at": "2026-04-19T10:00:00Z"
  },
  "meta": {
    "timestamp": "2026-04-19T10:00:00Z",
    "version": "1.0"
  },
  "error": null
}
```

Error responses follow the same structure with appropriate HTTP status codes:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "email",
      "message": "Email is required"
    }
  }
}
```

---

## 🔄 4. Data Flow Architecture

### Workflow Execution Flow

```
1. User Creates Workflow
   ↓
2. Workflow Stored in Database
   ↓
3. User Triggers Execution
   ↓
4. Automation Service Receives Request
   ↓
5. Orchestration Engine (Temporal/Conductor) Starts Workflow
   ↓
6. Tasks Executed Sequentially/Parallel
   ↓
7. Each Task Logs Events to Event Stream
   ↓
8. Execution Status Updated in Real-Time
   ↓
9. Results Stored in Database
   ↓
10. WebSocket Notification Sent to Client
```

### Analytics Data Flow

```
1. User Actions Trigger Events
   ↓
2. Events Sent to Event Stream (Kafka/Pub-Sub)
   ↓
3. Stream Processor Aggregates Events
   ↓
4. Metrics Calculated and Stored in TimescaleDB
   ↓
5. Redis Cache Updated with Latest Metrics
   ↓
6. Dashboard Queries Redis for Metrics
   ↓
7. Real-Time Updates via WebSocket
   ↓
8. Historical Data Stored in Analytics Database
```

### Real-Time Update Flow

```
Backend Event Occurs
   ↓
Event Published to Message Queue
   ↓
Real-Time Service Consumes Event
   ↓
WebSocket Message Sent to Connected Clients
   ↓
Frontend Updates UI in Real-Time
```

---

## 🔐 5. Security Architecture

### Authentication Flow

```
1. User Logs In (Email/Password or OAuth)
   ↓
2. Credentials Verified Against Database
   ↓
3. JWT Token Generated (Access + Refresh)
   ↓
4. Tokens Sent to Client (Secure HTTP-Only Cookie)
   ↓
5. Client Includes Token in API Requests
   ↓
6. API Gateway Validates Token
   ↓
7. Request Routed to Service with User Context
```

### Authorization Strategy

Role-based access control (RBAC) with fine-grained permissions:

| Role | Permissions |
|------|-------------|
| Admin | All operations, user management, system settings |
| Editor | Create/edit workflows, dashboards, reports |
| Reviewer | Approve workflows, review reports |
| Viewer | Read-only access to dashboards, reports |

---

## 📊 6. Caching Strategy

### Multi-Layer Caching

**Layer 1: Browser Cache**
- Static assets (CSS, JS, images)
- Service worker for offline support
- Cache busting via versioning

**Layer 2: CDN Cache**
- Static content distribution
- API response caching (for read-heavy endpoints)
- Geographic distribution for low latency

**Layer 3: Application Cache (Redis)**
- User sessions
- Dashboard queries results
- Analytics metrics
- API responses
- Cache TTL: 5-60 minutes based on data freshness

**Layer 4: Database Query Cache**
- Materialized views for complex queries
- Query result caching
- Incremental updates

### Cache Invalidation Strategy

```
Event Occurs (e.g., workflow execution)
   ↓
Cache Key Identified
   ↓
Cache Entry Invalidated
   ↓
Next Request Fetches Fresh Data
   ↓
Cache Repopulated
```

---

## 🚀 7. Deployment Architecture

### Multi-Environment Setup

**Development Environment**
- Local Docker Compose
- All services running locally
- Mock data for testing
- Hot reload enabled

**Staging Environment**
- Kubernetes cluster (3 nodes)
- Separate database and storage
- Full monitoring and logging
- Load testing environment

**Production Environment**
- Kubernetes cluster (5+ nodes)
- Multi-region deployment
- Auto-scaling enabled
- Managed database (Azure PostgreSQL)
- CDN for static assets
- Comprehensive monitoring

### Kubernetes Architecture

```
┌─────────────────────────────────────────┐
│         Kubernetes Cluster              │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Ingress Controller             │   │
│  │  (API Gateway)                  │   │
│  └──────────────┬──────────────────┘   │
│                 │                       │
│  ┌──────────────▼──────────────────┐   │
│  │  Service Mesh (Istio)           │   │
│  │  (Traffic Management)           │   │
│  └──────────────┬──────────────────┘   │
│                 │                       │
│  ┌──────────────▼──────────────────┐   │
│  │  Microservices Pods             │   │
│  │  • Automation (3 replicas)      │   │
│  │  • Analytics (3 replicas)       │   │
│  │  • Dashboard (3 replicas)       │   │
│  │  • Integration (2 replicas)     │   │
│  │  • User (2 replicas)            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  StatefulSets                   │   │
│  │  • PostgreSQL                   │   │
│  │  • Redis                        │   │
│  │  • Temporal Server              │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📈 8. Scalability Considerations

### Horizontal Scaling

- Stateless microservices enable easy horizontal scaling
- Load balancer distributes traffic across instances
- Auto-scaling based on CPU/memory metrics
- Database read replicas for read-heavy workloads

### Vertical Scaling

- Increase instance size for CPU/memory-intensive services
- Database optimization (indexing, query optimization)
- Caching layer to reduce database load

### Database Scaling

- Connection pooling (PgBouncer) for efficient connection management
- Read replicas for read-heavy queries
- Partitioning for large tables (events, analytics_metrics)
- Materialized views for complex aggregations

---

## 🔍 9. Monitoring & Observability

### Metrics Collection

- Prometheus scrapes metrics from services
- Custom metrics for business logic
- Infrastructure metrics (CPU, memory, disk)
- Application metrics (response time, error rate)

### Logging Strategy

- Structured logging (JSON format)
- Centralized log aggregation (ELK Stack)
- Log levels: DEBUG, INFO, WARN, ERROR
- Correlation IDs for request tracing

### Distributed Tracing

- Jaeger for distributed tracing
- Trace all requests across services
- Identify performance bottlenecks
- Debug complex issues

### Alerting

- Alert on error rate > 1%
- Alert on response time > 500ms
- Alert on database connection pool exhaustion
- Alert on disk space < 10%

---

## ✅ 10. Architecture Validation Checklist

| Component | Status | Notes |
|-----------|--------|-------|
| Microservices Design | ✅ | Independent, scalable services |
| API Gateway | ✅ | Centralized request handling |
| Database Schema | ✅ | Optimized for queries and scale |
| Caching Strategy | ✅ | Multi-layer caching |
| Security | ✅ | OAuth, JWT, RBAC |
| Monitoring | ✅ | Prometheus, Grafana, Jaeger |
| Deployment | ✅ | Kubernetes ready |
| Scalability | ✅ | Horizontal and vertical |

---

## 🎯 Next Steps

**Phase 3:** Backend Development - Automation Engine & APIs

- Implement API Gateway
- Build Automation Service
- Build Analytics Service
- Build Dashboard Service
- Implement Database
- Setup Redis Cache
- Configure Temporal/Conductor

---

**Architecture Design:** ✅ COMPLETE  
**Status:** Ready for Backend Development  
**Date:** April 19, 2026

