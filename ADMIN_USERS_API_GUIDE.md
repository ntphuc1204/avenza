# Admin Users Page - API Integration Guide

## 📋 Overview
Complete admin users management page with full CRUD operations integrated with the backend API.

## 🔗 Backend API Endpoints

### Base URL
```
http://localhost:8081/api/v1/users
```

### Endpoints

#### 1. Get All Users (with Pagination)
- **Method**: `GET`
- **URL**: `/api/v1/users`
- **Query Parameters**:
  - `current`: Page number (default: 1)
  - `pageSize`: Items per page (default: 10)
- **Headers**: 
  - `Authorization: Bearer {access_token}`
- **Response**:
```json
{
  "statusCode": 200,
  "message": "Danh sách người dùng",
  "data": {
    "meta": {
      "current": 1,
      "pageSize": 10,
      "pages": 5,
      "total": 42
    },
    "results": [
      {
        "_id": "mongodb_id",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "accountType": "individual",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z"
      }
    ]
  }
}
```

#### 2. Create User
- **Method**: `POST`
- **URL**: `/api/v1/users`
- **Headers**: 
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`
- **Request Body**:
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "phone": "0123456789",
  "address": "123 Main St",
  "image": "image_url"
}
```
- **Response**:
```json
{
  "statusCode": 201,
  "message": "Tạo người dùng thành công",
  "data": {
    "_id": "mongodb_id"
  }
}
```

#### 3. Get Single User
- **Method**: `GET`
- **URL**: `/api/v1/users/:id`
- **Headers**: 
  - `Authorization: Bearer {access_token}`
- **Response**:
```json
{
  "statusCode": 200,
  "message": "Chi tiết người dùng",
  "data": {
    "_id": "mongodb_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "0123456789",
    "address": "123 Main St",
    "role": "user",
    "accountType": "individual",
    "isActive": true
  }
}
```

#### 4. Update User
- **Method**: `PATCH`
- **URL**: `/api/v1/users`
- **Headers**: 
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`
- **Request Body**:
```json
{
  "_id": "mongodb_id",
  "name": "Updated Name",
  "phone": "0987654321",
  "address": "456 Oak St",
  "image": "new_image_url"
}
```
- **Note**: Only `_id` is required. Other fields are optional.
- **Response**:
```json
{
  "statusCode": 200,
  "message": "Cập nhật người dùng thành công",
  "data": {
    "acknowledged": true,
    "modifiedCount": 1
  }
}
```

#### 5. Delete User
- **Method**: `DELETE`
- **URL**: `/api/v1/users/:id`
- **Headers**: 
  - `Authorization: Bearer {access_token}`
- **Response**:
```json
{
  "statusCode": 200,
  "message": "Xóa người dùng thành công",
  "data": {
    "acknowledged": true,
    "deletedCount": 1
  }
}
```

## 📁 Frontend Implementation

### Components

#### 1. **AdminCard** (`src/components/admin/admin.card.tsx`)
- Displays user statistics
- Shows: Total Users, Active Users, Inactive Users
- Fetches data from `/api/v1/users` endpoint
- Updates on component mount

#### 2. **UserTable** (`src/components/admin/user.table.tsx`)
- Main user list table with pagination
- Features:
  - Server-side pagination
  - Edit action (opens UserUpdate modal)
  - Delete action (with confirmation)
  - Sortable columns
  - Responsive design

#### 3. **UserCreate** (`src/components/admin/user.create.tsx`)
- Modal form for creating new users
- Fields:
  - Email (required, must be valid)
  - Password (required, min 6 chars)
  - Name (required)
- Calls `handleCreateUserAction` server action
- Reloads page on success

#### 4. **UserUpdate** (`src/components/admin/user.update.tsx`)
- Modal form for updating users
- Fields:
  - Email (disabled)
  - Name (required)
  - Phone (optional)
  - Address (optional)
- Calls `handleUpdateUserAction` server action
- Reloads page on success

### Server Actions (`src/utils/actions.ts`)

#### `handleCreateUserAction(data)`
- Creates new user via POST request
- Revalidates "list-users" cache tag
- Returns response from backend

#### `handleUpdateUserAction(data)`
- Updates user via PATCH request
- Requires: `_id`, and any fields to update
- Revalidates "list-users" cache tag
- Returns response from backend

#### `handleDeleteUserAction(id)`
- Deletes user via DELETE request
- Requires: user MongoDB ID
- Revalidates "list-users" cache tag
- Returns response from backend

### API Helper (`src/utils/api.ts`)
- `sendRequest<T>(props)` - Generic fetch wrapper
- Handles authentication headers
- Supports query parameters
- Returns typed responses

## 🔐 Authentication

All endpoints require:
- Valid JWT access token
- Token passed in `Authorization: Bearer {token}` header
- User must have `ADMIN` role

## 📊 Data Flow

```
User Action (Create/Update/Delete)
    ↓
Client Component (UserCreate/UserUpdate/UserTable)
    ↓
Server Action (handleCreateUserAction/handleUpdateUserAction/handleDeleteUserAction)
    ↓
API Helper (sendRequest)
    ↓
Backend API (/api/v1/users)
    ↓
Response + Revalidation
    ↓
Page Reload / UI Update
```

## ✅ Features Implemented

- [x] List users with pagination
- [x] Create new users with validation
- [x] Update user information
- [x] Delete users with confirmation
- [x] Admin statistics dashboard
- [x] Error handling and notifications
- [x] Loading states
- [x] Vietnamese UI text
- [x] Responsive design
- [x] Cache invalidation

## 🚀 Testing

1. **Login as Admin**: Navigate to admin dashboard
2. **View Users**: Go to `/dashboard/user`
3. **Create User**: Click "+ Thêm người dùng", fill form, submit
4. **Update User**: Click edit icon, modify fields, submit
5. **Delete User**: Click delete icon, confirm deletion
6. **Check Stats**: View statistics on dashboard

## ⚠️ Important Notes

1. All passwords must be at least 6 characters
2. Email validation is required for new users
3. Emails must be unique in the system
4. Pagination defaults to page 1, 10 items per page
5. User passwords are never returned from API (excluded with `.select("-password")`)
6. Changes trigger full page reload to refresh all data

## 🔧 Environment Variables

Required in `.env`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8081
AUTH_SECRET=your_secret_key
```

## 📝 Type Definitions

User type:
```typescript
interface IUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  accountType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

Pagination meta:
```typescript
interface IMeta {
  current: number;      // Current page
  pageSize: number;     // Items per page
  pages: number;        // Total pages
  total: number;        // Total items
}
```
