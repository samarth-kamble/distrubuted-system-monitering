# PulseGuard - Architecture Decision Records (ADRs)

This document tracks the key architectural decisions made during the design and development of PulseGuard, including context, alternatives considered, and consequences.

---

## ADR-001: Monorepo Workspaces Configuration

### Status
Approved

### Context
We need a structure that allows code sharing between frontend/dashboard applications, backend APIs, and distributed worker services. Maintaining multiple repositories introduces package version mismatches, complex release management, and duplicate typescript declarations.

### Decision
Utilize a monorepo setup managed via **Bun Workspaces** with the following directories:
- `apps/*` (for deployable services: `api`, `worker`)
- `packages/*` (for shared libraries: `shared`)

### Alternatives Considered
- **Separate Repositories**: High maintenance overhead, hard to sync shared types.
- **npm/yarn workspaces**: Bun provides faster install times, native TypeScript support, and a single lockfile (`bun.lock`) with excellent speed.

### Consequences
- Shared TypeScript interfaces can be imported directly without local npm packaging.
- Monorepo dependency management is centralized at the root `package.json`.
- Deployment pipelines must run filters (e.g. `bun --filter api build`) to isolate artifacts.

---

## ADR-002: PostgreSQL & Prisma ORM

### Status
Approved

### Context
The platform stores relational schemas representing structured metrics, check logs, alerts, users, and incidents. Quick indexing, support for transactions, and type-safe query building are necessary.

### Decision
Use **PostgreSQL** as the primary database and **Prisma ORM** as the interface library.

### Alternatives Considered
- **MongoDB**: Schema validation is weaker; relational schemas (linking user/service/checks/incidents) are harder to optimize.
- **TypeORM / Type-safe SQL**: Prisma provides a highly readable schema format (`schema.prisma`), automated migrations (`prisma migrate`), and generates a robust TypeScript client.

### Consequences
- Rapid prototyping with type safety across both NestJS services.
- Database changes are tracked version-by-version using Prisma migrations.
- Time-series checks can grow rapidly in volume. In the future, a partition policy or transition to TimescaleDB (which is PostgreSQL compatible) might be needed.

---

## ADR-003: Scheduling Mechanism for Polling Checks

### Status
Approved

### Context
Background health checks must run periodically. The interval defaults to 60 seconds but can be customized per service down to a few seconds. We need a reliable mechanism to execute checks.

### Decision
For the initial version, use NestJS’s `@nestjs/schedule` (wrapper around `cron`) inside `apps/worker` to pull active targets and run them. In phase 2, we will migrate to **BullMQ** or **RabbitMQ** to distribute checks as jobs across multiple workers.

### Alternatives Considered
- **BullMQ/Redis**: Highly scalable, supports distributed rate-limiting and worker scaling. However, it introduces Redis as a hard infrastructure dependency.
- **Serverless/AWS Lambda timers**: High latency, hard to run sub-minute configurations cost-effectively.

### Consequences
- Easy startup with no extra infrastructure dependencies (only PG database).
- Limit to scale: Single worker node bottleneck. A transition plan to BullMQ is mapped out for scale.

---

## ADR-004: Auth Token Strategy (JWT + Refresh Token Rotation)

### Status
Approved

### Context
Clients accessing the API must authenticate. To reduce database hits on every request, JWTs are ideal. However, JWTs are stateless and cannot be easily revoked. We need a mechanism to keep access tokens short-lived while maintaining user sessions securely.

### Decision
Use short-lived JWT Access Tokens (e.g., 15 minutes) and database-stored Refresh Tokens with **Refresh Token Rotation**.

### Alternatives Considered
- **Stateful sessions (Redis/Database sessions)**: High database/cache dependency on every single API request.
- **Long-lived JWTs**: Security vulnerability if the token is leaked.

### Consequences
- Good performance: API servers only verify the JWT signature without querying the database for every request.
- Rotation detection: If a refresh token is used twice (potentially stolen), its entire token family is revoked to prevent unauthorized access.
