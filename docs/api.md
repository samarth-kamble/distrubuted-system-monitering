# PulseGuard - API Documentation

The PulseGuard API is built using NestJS and follows RESTful design principles. JSON is used as the data format for request payloads and responses.

---

## 1. Authentication API

All authentication routes are prefixed with `/auth`.

### Register User
Creates a new user account on the platform.

* **URL**: `/auth/register`
* **Method**: `POST`
* **Headers**: `Content-Type: application/json`
* **Body Schema**:
  ```json
  {
    "email": "user@example.com",
    "name": "John Doe",
    "password": "strongPassword123"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "id": "e29202ca-8344-48b4-a212-07e3bd2c3a50",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "VIEWER",
    "createdAt": "2026-08-14T19:30:00.000Z"
  }
  ```

### Login User
Authenticates a user and returns an access token.

* **URL**: `/auth/login`
* **Method**: `POST`
* **Headers**: `Content-Type: application/json`
* **Body Schema**:
  ```json
  {
    "email": "user@example.com",
    "password": "strongPassword123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "e29202ca-8344-48b4-a212-07e3bd2c3a50",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "VIEWER"
    }
  }
  ```

### Get Profile
Returns the profile information of the authenticated user.

* **URL**: `/auth/me`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <accessToken>`
* **Success Response (200 OK)**:
  ```json
  {
    "id": "e29202ca-8344-48b4-a212-07e3bd2c3a50",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "VIEWER",
    "isActive": true,
    "createdAt": "2026-08-14T19:30:00.000Z"
  }
  ```

---

## 2. Monitor Services API (Planned/REST Design)

Routes for managing monitored services.

### Create Monitor Service
* **URL**: `/services`
* **Method**: `POST`
* **Headers**: `Authorization: Bearer <accessToken>`
* **Body Schema**:
  ```json
  {
    "name": "Production Frontend",
    "targetUrl": "https://example.com/health",
    "method": "GET",
    "intervalSeconds": 60,
    "timeoutMs": 5000,
    "retryCount": 3,
    "failureThreshold": 3,
    "recoveryThreshold": 2
  }
  ```
* **Success Response (210 Created)**:
  ```json
  {
    "id": "8b51d45c-2041-4702-864a-3fb76ec29aa4",
    "userId": "e29202ca-8344-48b4-a212-07e3bd2c3a50",
    "name": "Production Frontend",
    "targetUrl": "https://example.com/health",
    "method": "GET",
    "intervalSeconds": 60,
    "timeoutMs": 5000,
    "retryCount": 3,
    "failureThreshold": 3,
    "recoveryThreshold": 2,
    "enabled": true,
    "status": "UNKNOWN",
    "consecutiveFailures": 0,
    "consecutiveSuccesses": 0,
    "createdAt": "2026-08-14T19:35:00.000Z"
  }
  ```

### List Monitor Services
Retrieve all monitored services associated with the current user.

* **URL**: `/services`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <accessToken>`
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "8b51d45c-2041-4702-864a-3fb76ec29aa4",
      "name": "Production Frontend",
      "targetUrl": "https://example.com/health",
      "status": "HEALTHY",
      "enabled": true
    }
  ]
  ```

### Get Service Check History
Retrieve time-series check history logs for a service.

* **URL**: `/services/:id/checks`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <accessToken>`
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "d0ee0d5d-c6a6-4bdf-87f5-19e34c2a5ba8",
      "serviceId": "8b51d45c-2041-4702-864a-3fb76ec29aa4",
      "status": "SUCCESS",
      "responseCode": 200,
      "responseTimeMs": 142,
      "attemptNumber": 1,
      "checkedAt": "2026-08-14T19:40:00.000Z"
    }
  ]
  ```
