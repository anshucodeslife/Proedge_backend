# Postman Collection Guide

## 📦 Proedge Backend Postman Collection

This collection contains all API endpoints for the Proedge LMS Backend, organized by feature with proper headers and request bodies.

## 🚀 Quick Start

### 1. Import Collection
1. Open Postman
2. Click **Import** button
3. Select `Proedge_Backend.postman_collection.json`
4. Collection will be imported with all endpoints

### 2. Configure Environment
Set the base URL variable:
- **Variable:** `base_url`
- **Value:** `http://localhost:3000` (or your deployed URL)

### 3. Authentication Flow
1. **Login** using the "Authentication > Login" request
2. The JWT token is **automatically saved** to `{{auth_token}}` variable
3. All protected endpoints will use this token automatically

## 📁 Collection Structure

### 🔐 Authentication (3 endpoints)
- **Signup** - Register new user (STUDENT/TUTOR/ADMIN)
- **Login** - Get JWT token (auto-saves to collection variable)
- **Forgot Password** - Send password reset OTP

### 👤 Users (2 endpoints)
- **Get Profile** - Current user profile
- **List Students** - Paginated student list (Admin/Tutor only)

### 📚 Courses (5 endpoints)
- **Create Course** - Add new course (Admin only)
- **Get All Courses** - Public course listing
- **Get Course by Slug** - Course details
- **Update Course** - Modify course (Admin only)
- **Delete Course** - Remove course (Admin only)

### 📖 LMS - Modules, Lessons, Batches (9 endpoints)
#### Modules
- Create Module
- Get Modules by Course
- Update Module

#### Lessons
- Create Lesson
- Get Lessons by Module
- Update Lesson

#### Batches
- Create Batch
- Get All Batches
- Update Batch

### 🎓 Enrollments (7 endpoints)
- **Enroll Student** - Enroll in course
- **Get Enrollments** - User's enrollments
- **Update Enrollment Status** - Change status (Admin only)
- **Mark Attendance** - Record attendance (Admin/Tutor)
- **Get Attendance** - View attendance records
- **Update Watch Log** - Track video progress
- **Get Watch Logs** - View watch history

### 💳 Payments (2 endpoints)
- **Create Payment Order** - Razorpay order creation
- **Razorpay Webhook** - Payment notification handler

### ☁️ Upload - AWS S3 (2 endpoints)
- **Get Upload Signed URL** - Upload files to S3 (Admin/Tutor)
- **Get View Signed URL** - Stream/view files from S3

### 📊 Admin (2 endpoints)
- **Get Overview Stats** - Dashboard statistics
- **Get Video Engagement Report** - Analytics report

## 🔑 Demo Credentials

### Admin
```
Email: admin@proedge.com
Password: admin123
```

### Students
```
Email: student1@proedge.com (student2, student3, student4, student5)
Password: student123
```

## 💡 Usage Tips

### Auto-Save Token
The Login request has a **test script** that automatically saves the JWT token:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.token) {
        pm.collectionVariables.set('auth_token', response.token);
    }
}
```

### Protected Endpoints
All protected endpoints use Bearer token authentication:
```
Authorization: Bearer {{auth_token}}
```

### Request Bodies
All request bodies are pre-filled with example data. Modify as needed:
- Course creation includes all fields (title, slug, price, etc.)
- Enrollment includes courseId and batchId
- Watch logs track video progress in seconds

## 📝 Common Workflows

### 1. Student Enrollment Flow
1. **Login** as student → `POST /auth/login`
2. **View Courses** → `GET /courses`
3. **Create Payment Order** → `POST /payments/order`
4. **Enroll in Course** → `POST /enrollments`

### 2. Course Creation Flow (Admin)
1. **Login** as admin → `POST /auth/login`
2. **Create Course** → `POST /courses`
3. **Create Module** → `POST /lms/modules`
4. **Create Lessons** → `POST /lms/lessons`
5. **Create Batch** → `POST /lms/batches`

### 3. Video Upload Flow (Admin/Tutor)
1. **Login** → `POST /auth/login`
2. **Get Upload URL** → `POST /upload/signed-url`
3. Upload file to S3 using returned URL
4. **Create Lesson** with S3 key → `POST /lms/lessons`

### 4. Track Student Progress
1. **Login** as student → `POST /auth/login`
2. **Get View URL** → `POST /upload/view-url`
3. Watch video
4. **Update Watch Log** → `POST /enrollments/watchlogs`

## 🎯 Response Codes

- `200` - Success (GET, PUT)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | API base URL | `http://localhost:3000` |
| `auth_token` | JWT token (auto-saved) | `eyJhbGciOiJIUzI1Ni...` |

## 📌 Notes

- All timestamps use ISO 8601 format: `2025-01-15T00:00:00.000Z`
- Prices are in smallest currency unit (paise for INR): `1999` = ₹19.99
- Video duration is in seconds: `600` = 10 minutes
- Pagination uses `page` and `limit` query parameters

## 🆘 Troubleshooting

### Token Expired
Re-run the **Login** request to get a new token

### 401 Unauthorized
Check if `{{auth_token}}` variable is set in collection variables

### 403 Forbidden
Ensure you're logged in with correct role (ADMIN/TUTOR/STUDENT)

### 404 Not Found
Verify IDs exist in database (run seed script if needed)

---

**Total Endpoints:** 40+  
**Last Updated:** November 2025  
**Version:** 1.0.0
