# Proedge Backend - Postman Collection Guide (v2.0)

## 📦 What's Included

**Total Endpoints:** 60+  
**Version:** 2.0.0 (Complete Implementation)  
**Last Updated:** November 26, 2025

### New in v2.0 (40+ New Endpoints)
- ✅ Enhanced Authentication (5 new endpoints)
- ✅ Admin Student Management (7 new endpoints)
- ✅ Student Course Access (5 new endpoints)
- ✅ Enhanced Watch Logs with auto-attendance
- ✅ Payment automation with invoicing
- ✅ Batch-specific video delivery

---

## 🚀 Quick Start

### 1. Import Collection
1. Open Postman
2. Click **Import** button
3. Select `Proedge_Backend.postman_collection.json`
4. Collection will appear in your sidebar

### 2. Configure Environment
Set the `base_url` variable:
- **Local:** `http://localhost:3000`
- **Production:** Your deployed URL

### 3. Login & Get Token
1. Open **1. Authentication → Login**
2. Use demo credentials:
   - Admin: `admin@proedge.com` / `admin123`
   - Tutor: `tutor@proedge.com` / `tutor123`
   - Student: `student1@proedge.com` / `student123`
3. Send request
4. Token automatically saves to `{{auth_token}}`

---

## 📂 Collection Structure

### 1. Authentication (7 endpoints)
- `POST /auth/login` - Login (auto-saves token)
- `POST /auth/signup` - Basic signup
- **NEW** `POST /auth/verify-student-id` - Verify student ID
- **NEW** `POST /auth/signup-with-id` - Signup with student ID
- **NEW** `POST /auth/send-otp` - Send OTP for password reset
- **NEW** `POST /auth/verify-otp` - Verify OTP code
- **NEW** `POST /auth/reset-password` - Reset password with OTP

### 2. Admin - Student Management (7 endpoints) **NEW**
- `POST /admin/students` - Create student
- `PUT /admin/students/:id` - Update student
- `DELETE /admin/students/:id` - Delete/deactivate student
- `POST /admin/students/:id/assign-course` - Assign to course
- `POST /admin/students/:id/assign-batch` - Assign to batch
- `POST /admin/students/bulk-upload` - CSV bulk upload
- `POST /admin/students/pre-approved` - Add pre-approved student

### 3. Student - Course Access (5 endpoints) **NEW**
- `GET /student/courses` - Get enrolled courses
- `GET /student/courses/:courseId` - Get course details
- `GET /student/courses/:courseId/modules` - Get modules
- `GET /student/lessons/:lessonId` - Get lesson with batch-specific video
- `GET /student/courses/:courseId/progress` - Get progress tracking

### 4. Courses (5 endpoints)
- `GET /courses` - List all courses (public)
- `GET /courses/:slug` - Get course by slug
- `POST /courses` - Create course (Admin)
- `PUT /courses/:id` - Update course (Admin)
- `DELETE /courses/:id` - Delete course (Admin)

### 5. LMS - Modules, Lessons, Batches (9 endpoints)
- `POST /lms/modules` - Create module
- `GET /lms/courses/:courseId/modules` - Get modules
- `POST /lms/lessons` - Create lesson
- `GET /lms/modules/:moduleId/lessons` - Get lessons
- `POST /lms/batches` - Create batch
- `GET /lms/batches` - List batches
- `PUT /lms/modules/:id` - Update module
- `PUT /lms/lessons/:id` - Update lesson
- `PUT /lms/batches/:id` - Update batch

### 6. Enrollments & Watch Logs (6 endpoints)
- `POST /enrollments` - Enroll student
- `GET /enrollments` - Get enrollments
- `PUT /enrollments/:id/status` - Update status (Admin)
- **ENHANCED** `POST /enrollments/watchlogs` - Update watch log (now with events, %, auto-complete)
- `GET /enrollments/watchlogs` - Get watch logs
- **ENHANCED** `POST /enrollments/attendance` - Mark attendance (auto-marks at 70% watch)
- `GET /enrollments/attendance` - Get attendance

### 7. Payments (2 endpoints)
- **ENHANCED** `POST /payments/order` - Create order (auto-creates enrollment)
- **ENHANCED** `POST /payments/webhook` - Razorpay webhook (auto-activates + generates invoice)

### 8. Upload (S3) (2 endpoints)
- `POST /upload/signed-url` - Get upload URL
- `POST /upload/view-url` - Get view URL

### 9. Users (2 endpoints)
- `GET /users/profile` - Get current user profile
- `GET /users/students` - List students (Admin/Tutor)

### 10. Admin Analytics (2 endpoints)
- `GET /admin/stats/overview` - Dashboard stats
- `GET /admin/reports/video-engagement` - Video engagement

---

## 🔑 Demo Credentials

```
Admin:
  Email: admin@proedge.com
  Password: admin123
  
Tutor:
  Email: tutor@proedge.com
  Password: tutor123
  
Students (1-10):
  Email: student1@proedge.com to student10@proedge.com
  Password: student123
  
Pre-Approved Student IDs:
  STU0001 to STU0010
```

---

## 🎯 Common Workflows

### Workflow 1: Student Registration with ID Verification
```
1. POST /auth/verify-student-id
   Body: { "studentId": "STU0001" }
   
2. POST /auth/signup-with-id
   Body: {
     "studentId": "STU0001",
     "email": "newstudent@test.com",
     "password": "password123"
   }
   
3. POST /auth/login
   Body: { "email": "newstudent@test.com", "password": "password123" }
```

### Workflow 2: Admin Create & Assign Student
```
1. Login as Admin
   
2. POST /admin/students
   Body: {
     "email": "student@test.com",
     "password": "password123",
     "fullName": "New Student",
     "studentId": "STU0011"
   }
   
3. POST /admin/students/{studentId}/assign-course
   Body: { "courseId": "{courseId}", "batchId": "{batchId}" }
```

### Workflow 3: Student Access Course & Track Progress
```
1. Login as Student
   
2. GET /student/courses
   (Get list of enrolled courses)
   
3. GET /student/courses/{courseId}/modules
   (Get modules for course)
   
4. GET /student/lessons/{lessonId}
   (Get lesson with batch-specific video URL)
   
5. POST /enrollments/watchlogs
   Body: {
     "lessonId": "{lessonId}",
     "watchedSec": 450,
     "lastPosition": 450,
     "events": {"play": [0], "pause": [450]}
   }
   (Auto-calculates %, auto-completes at 90%, auto-marks attendance at 70%)
   
6. GET /student/courses/{courseId}/progress
   (View detailed progress)
```

### Workflow 4: Password Reset with OTP
```
1. POST /auth/send-otp
   Body: { "email": "student1@proedge.com" }
   (Check console for OTP in dev mode)
   
2. POST /auth/verify-otp
   Body: { "email": "student1@proedge.com", "otpCode": "123456" }
   
3. POST /auth/reset-password
   Body: {
     "email": "student1@proedge.com",
     "otpCode": "123456",
     "newPassword": "newpassword123"
   }
```

### Workflow 5: Payment & Auto-Enrollment
```
1. Login as Student
   
2. POST /payments/order
   Body: { "courseId": "{courseId}", "amount": 1999 }
   (Creates enrollment in PENDING status)
   
3. Simulate Razorpay webhook:
   POST /payments/webhook
   Body: {
     "event": "payment.captured",
     "payload": { "orderId": "...", "paymentId": "..." }
   }
   (Auto-activates enrollment + generates invoice with 18% GST)
```

### Workflow 6: Bulk Student Upload
```
1. Login as Admin
   
2. Create CSV file (students.csv):
   studentId,email,password,fullName
   STU0011,student11@test.com,password123,Student 11
   STU0012,student12@test.com,password123,Student 12
   
3. POST /admin/students/bulk-upload
   Form-data: file=students.csv
   (Returns success/failed counts)
```

---

## 🆕 New Features Explained

### Student ID Verification
- Students must be in pre-approved list to register
- Admin adds students to pre-approved list first
- Students verify their ID before signup

### OTP Password Reset
- 6-digit OTP sent to email (console in dev mode)
- 10-minute expiry
- Secure password reset flow

### Batch-Specific Videos
- Different batches can have different videos for same lesson
- Automatically selects correct video based on student's batch
- Falls back to default lesson video if no batch-specific video

### Auto Attendance
- Automatically marks PRESENT if watch % >= 70%
- Admin/Tutor can override
- Tracks watch percentage per attendance record

### Enhanced Watch Logs
- Tracks events (play, pause, seek)
- Calculates percentage automatically
- Auto-completes at 90% watched
- Tracks last position for resume
- Session counting

### Payment Automation
- Creates enrollment in PENDING on order
- Auto-activates enrollment on payment success
- Generates invoice with 18% GST
- Links payment to enrollment

---

## 🔒 Authentication & Authorization

### Public Endpoints (No Auth)
- `GET /courses`
- `GET /courses/:slug`
- `GET /lms/batches`
- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/verify-student-id`

### Student Role Required
- All `/student/*` endpoints
- `POST /enrollments`
- `POST /enrollments/watchlogs`

### Admin Role Required
- All `/admin/*` endpoints
- `POST /courses`
- `PUT /courses/:id`
- `DELETE /courses/:id`
- `POST /lms/modules`
- `POST /lms/lessons`
- `POST /lms/batches`

### Tutor Role Required
- `GET /users/students`
- Attendance marking
- View student progress

---

## 📊 Expected Response Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET/PUT/DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

---

## 🛡️ Security Features

- **Rate Limiting:** 100 requests/15min (API), 5 requests/15min (Auth)
- **XSS Protection:** All inputs sanitized
- **JWT Authentication:** Secure token-based auth
- **Role-Based Access:** ADMIN, TUTOR, STUDENT roles
- **Input Validation:** express-validator on all endpoints

---

## 🐛 Troubleshooting

### Issue: 401 Unauthorized
**Solution:**
1. Run Login request first
2. Check `{{auth_token}}` variable is set
3. Verify token hasn't expired (7 days)

### Issue: 403 Forbidden
**Solution:**
- Use correct role (Admin for admin endpoints, Student for student endpoints)
- Check user role in profile response

### Issue: 429 Too Many Requests
**Solution:**
- Wait 15 minutes
- Rate limits: API (100/15min), Auth (5/15min), Upload (10/hour)

### Issue: Student ID not found
**Solution:**
- Admin must add student to pre-approved list first
- Use `POST /admin/students/pre-approved`

### Issue: OTP not received
**Solution:**
- In development, OTP is logged to console
- Check server logs for OTP code
- OTP expires in 10 minutes

---

## 📝 Collection Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | API base URL | `http://localhost:3000` |
| `auth_token` | JWT token (auto-saved) | `eyJhbGc...` |
| `student_id` | Student ID for testing | `user-uuid-here` |
| `course_id` | Course ID for testing | `course-uuid-here` |

---

## 🎓 Tips & Best Practices

1. **Always login first** - Token auto-saves for protected endpoints
2. **Use variables** - Set `student_id`, `course_id` for easy testing
3. **Check console** - OTP codes appear in server console (dev mode)
4. **Test workflows** - Follow the common workflows above
5. **Role-based testing** - Login as different roles to test permissions
6. **Bulk operations** - Use CSV upload for multiple students
7. **Progress tracking** - Watch logs auto-calculate progress
8. **Attendance** - Automatically marked based on watch percentage

---

## 📚 Additional Resources

- **API Documentation:** `http://localhost:3000/api-docs` (Swagger)
- **Walkthrough:** See `walkthrough.md` for complete implementation details
- **Implementation Plan:** See `implementation_plan.md` for technical specs

---

## 🆕 What's New in v2.0

### Enhanced Authentication
- Student ID verification system
- OTP-based password reset
- Pre-approved student list

### Admin Student Management
- Complete CRUD operations
- Bulk CSV upload
- Course/batch assignment
- Pre-approved student management

### Student Experience
- Enrolled courses listing
- Batch-specific video access
- Detailed progress tracking
- Auto-attendance marking

### System Improvements
- Enhanced watch logs with events
- Auto-percentage calculation
- Payment automation with invoicing
- Rate limiting & security hardening

---

**Version:** 2.0.0  
**Last Updated:** November 26, 2025  
**Total Endpoints:** 60+  
**Status:** ✅ Production Ready
