# PulseGuard - Testing Guide

PulseGuard maintains high code quality and reliability through automated unit tests and integration (E2E) tests. This guide outlines how tests are structured, how to mock database operations, and how to execute tests across workspaces.

---

## 1. Testing Architecture

The codebase separates tests into two primary buckets:
- **Unit Tests**: Test individual components, services, or controllers in isolation. All external network calls, file system actions, and databases (Prisma) are mocked.
- **End-to-End (E2E) Tests**: Verify the request-response lifecycle of endpoints from the external router down to the database. These tests run against a physical PostgreSQL instance.

---

## 2. Unit Testing & Prisma Mocking

Because NestJS services rely extensively on `PrismaService` for database interaction, unit tests mock Prisma to keep execution fast and prevent data corruption.

### Setup Mocking using `jest-mock-extended`

We mock the `PrismaClient` using Jest mocks. Below is an example pattern used to write unit tests for services relying on Prisma:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('AppService', () => {
  let service: AppService;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    // 1. Create deep mock of PrismaClient
    prismaMock = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: prismaMock, // Provide the mock instead of actual DB instance
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should return user count from database', async () => {
    // Arrange: Mock the DB query response
    prismaMock.user.count.mockResolvedValue(5);

    // Act: Call the service function
    // (Assume service.getUserCount() executes this.prisma.user.count())
    const count = await service.getUserCount();

    // Assert: Verify results and mocks
    expect(count).toBe(5);
    expect(prismaMock.user.count).toHaveBeenCalledTimes(1);
  });
});
```

---

## 3. End-to-End (E2E) Testing

E2E tests reside under `test/` within individual applications (e.g. `apps/api/test`). 

### Running E2E tests against PostgreSQL
1. E2E tests read environment variables from a `.env.test` file.
2. Prior to running tests, ensure your test database container is up and migrations are applied:
   ```bash
   bun prisma db push --schema=prisma/schema.prisma
   ```
3. Use the NestJS testing package to bootstrap the server context:
   ```typescript
   import { Test, TestingModule } from '@nestjs/testing';
   import { INestApplication } from '@nestjs/common';
   import * as request from 'supertest';
   import { AppModule } from '../src/app.module';

   describe('AuthController (e2e)', () => {
     let app: INestApplication;

     beforeAll(async () => {
       const moduleFixture: TestingModule = await Test.createTestingModule({
         imports: [AppModule],
       }).compile();

       app = moduleFixture.createNestApplication();
       await app.init();
     });

     afterAll(async () => {
       await app.close();
     });

     it('/auth/me (GET) - Unauthorized without token', () => {
       return request(app.getHttpServer())
         .get('/auth/me')
         .expect(401);
     });
   });
   ```

---

## 4. CLI Test Runner Commands

We use **Bun** workspaces to run testing suites targeting individual apps.

### Running API service tests
```bash
# Run unit tests
bun --filter api test

# Run E2E tests
bun --filter api test:e2e

# Run tests in watch mode
bun --filter api test:watch
```

### Running Worker service tests
```bash
# Run unit tests
bun --filter worker test

# Run E2E tests
bun --filter worker test:e2e
```
