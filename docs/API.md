# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /api/auth/register
Register a new teacher account.

**Request Body:**
```json
{
  "email": "teacher@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "teacher@example.com",
    "role": "teacher",
    "fullName": "John Doe"
  },
  "token": "jwt_token_here"
}
```

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "teacher@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "teacher@example.com",
    "role": "teacher",
    "fullName": "John Doe",
    "walletAddress": "0x..."
  },
  "token": "jwt_token_here"
}
```

#### GET /api/auth/me
Get current user information.

**Headers:**
- Authorization: Bearer <token>

**Response:**
```json
{
  "id": 1,
  "email": "teacher@example.com",
  "role": "teacher",
  "fullName": "John Doe",
  "walletAddress": "0x...",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Classes (Teacher Only)

#### POST /api/classes
Create a new class.

**Headers:**
- Authorization: Bearer <token>

**Request Body:**
```json
{
  "classId": "CS101",
  "name": "Introduction to Blockchain",
  "description": "Learn the basics of blockchain technology"
}
```

**Response:**
```json
{
  "message": "Class created successfully",
  "class": {
    "id": 1,
    "class_id": "CS101",
    "teacher_id": 1,
    "name": "Introduction to Blockchain",
    "description": "Learn the basics of blockchain technology",
    "status": "open",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/classes
Get all classes for the authenticated teacher.

**Headers:**
- Authorization: Bearer <token>

**Response:**
```json
[
  {
    "id": 1,
    "class_id": "CS101",
    "teacher_id": 1,
    "name": "Introduction to Blockchain",
    "status": "open",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /api/classes/:id
Get class details by ID.

**Headers:**
- Authorization: Bearer <token>

**Response:**
```json
{
  "id": 1,
  "class_id": "CS101",
  "teacher_id": 1,
  "name": "Introduction to Blockchain",
  "status": "open",
  "students": [...]
}
```

#### POST /api/classes/:id/close
Close a class.

**Headers:**
- Authorization: Bearer <token>

**Response:**
```json
{
  "message": "Class closed successfully",
  "class": {
    "id": 1,
    "status": "closed",
    "closed_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/classes/:id/students
Add students to a class.

**Headers:**
- Authorization: Bearer <token>

**Request Body:**
```json
{
  "studentEmails": ["student1@example.com", "student2@example.com"]
}
```

### Students

#### GET /api/students/my-wallet
Get student's wallet information.

**Headers:**
- Authorization: Bearer <token>

**Response:**
```json
{
  "walletAddress": "0x...",
  "privateKey": "Decrypt using your password",
  "warning": "Keep your private key secure!"
}
```

#### GET /api/students/my-classes
Get all classes the student is enrolled in.

**Headers:**
- Authorization: Bearer <token>

**Response:**
```json
[
  {
    "id": 1,
    "class_id": "CS101",
    "class_name": "Introduction to Blockchain",
    "class_status": "open",
    "enrolled_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /api/students/my-scores
Get student's scores.

**Headers:**
- Authorization: Bearer <token>

**Response:**
```json
[
  {
    "classId": "CS101",
    "className": "Introduction to Blockchain",
    "walletAddress": "0x...",
    "score": "85",
    "recordedAt": "1704067200"
  }
]
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
