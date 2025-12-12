# 🎓 ProEdge Backend - Complete Architecture Flow

## System Overview

ProEdge is a comprehensive Learning Management System (LMS) with role-based access control, payment integration, and automated attendance tracking.

---

## 🏗️ Architecture Layers

```mermaid
graph TB
    subgraph "Client Layer"
        A1[proedge-student<br/>Student Portal]
        A2[proedge_admin<br/>Admin Dashboard]
        A3[proedgelearning-main<br/>Public Website]
    end
    
    subgraph "API Gateway Layer"
        B1[Express.js Server]
        B2[CORS Middleware]
        B3[Helmet Security]
        B4[Rate Limiter]
        B5[XSS Protection]
    end
    
    subgraph "Authentication Layer"
        C1[JWT Auth]
        C2[Role-Based Access]
        C3[Student ID Verification]
        C4[OTP System]
    end
    
    subgraph "Business Logic Layer"
        D1[Controllers]
        D2[Services]
        D3[Validators]
    end
    
    subgraph "Data Layer"
        E1[Prisma ORM]
        E2[PostgreSQL Database]
    end
    
    subgraph "External Services"
        F1[AWS S3<br/>Video Storage]
        F2[Razorpay<br/>Payments]
        F3[SMTP<br/>Email]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    B1 --> B2 --> B3 --> B4 --> B5
    B5 --> C1 --> C2
    C2 --> D1 --> D2
    D2 --> E1 --> E2
    D2 --> F1
    D2 --> F2
    D2 --> F3
```

---

## 📊 Database Schema (13 Models)

```mermaid
erDiagram
    User ||--o{ Enrollment : "enrolls in"
    User ||--o{ Attendance : "has"
    User ||--o{ WatchLog : "tracks"
    User ||--o{ Notification : "receives"
    User }o--|| Course : "linked to"
    
    Course ||--o{ Module : "contains"
    Course ||--o{ Batch : "has"
    Course ||--o{ Enrollment : "enrolled by"
    Course ||--o{ Batch1admission : "admits"
    Course ||--o{ Enquiry : "inquired"
    
    Module ||--o{ Lesson : "contains"
    
    Lesson ||--o{ WatchLog : "tracked by"
    Lesson ||--o{ BatchVideoMap : "mapped to"
    
    Batch ||--o{ Enrollment : "has"
    Batch ||--o{ Attendance : "tracks"
    Batch ||--o{ BatchVideoMap : "maps videos"
    
    Enrollment ||--o{ Payment : "has"
    Enrollment ||--o{ EnrollmentHistory : "logs"
    
    Payment ||--|| Invoice : "generates"
    
    Referral ||--o{ Batch1admission : "used by"
    
    User {
        int id PK
        string studentId UK
        string email UK
        string passwordHash
        string fullName
        enum role
        enum status
        boolean studentIdVerified
        decimal totalFees
        decimal paidFees
    }
    
    Course {
        int id PK
        string title UK
        string slug UK
        decimal price
        decimal mrp
        boolean isPaid
        boolean active
    }
    
    Enrollment {
        int id PK
        int userId FK
        int courseId FK
        int batchId FK
        enum status
        datetime enrolledAt
        datetime expiresAt
    }
    
    Payment {
        int id PK
        string orderId UK
        string paymentId
        float amount
        enum status
        int enrollmentId FK
    }
```

---

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth API
    participant DB as Database
    participant J as JWT Service
    
    Note over C,J: Student Registration Flow
    C->>A: POST /auth/signup
    A->>DB: Check if studentId is pre-approved
    alt Not Pre-Approved
        DB-->>A: Not found
        A-->>C: 403 Forbidden
    else Pre-Approved
        DB-->>A: Found
        A->>DB: Create user account
        A->>J: Generate JWT token
        J-->>A: Return token
        A-->>C: 201 Created + token
    end
    
    Note over C,J: Login Flow
    C->>A: POST /auth/login
    A->>DB: Verify credentials
    alt Invalid Credentials
        DB-->>A: Not found/wrong password
        A-->>C: 401 Unauthorized
    else Valid Credentials
        DB-->>A: User found
        A->>J: Generate JWT token
        J-->>A: Return token
        A-->>C: 200 OK + token
    end
    
    Note over C,J: Password Reset Flow
    C->>A: POST /auth/forgot-password
    A->>DB: Generate OTP code
    A->>C: Send OTP via email
    C->>A: POST /auth/verify-otp
    A->>DB: Verify OTP
    A->>DB: Update password
    A-->>C: 200 OK
```

---

## 🎯 Core User Flows

### 1. Student Enrollment Journey

```mermaid
flowchart TD
    Start([Student Visits Website]) --> Enquiry[Submit Enquiry Form]
    Enquiry --> AdminReview{Admin Reviews}
    AdminReview -->|Approved| PreApprove[Add to PreApprovedStudent]
    AdminReview -->|Rejected| End1([End])
    
    PreApprove --> StudentSignup[Student Signs Up]
    StudentSignup --> VerifyID{Student ID Verified?}
    VerifyID -->|No| End2([Registration Blocked])
    VerifyID -->|Yes| CreateAccount[Create User Account]
    
    CreateAccount --> Login[Student Logs In]
    Login --> ViewCourses[View Enrolled Courses]
    ViewCourses --> SelectCourse[Select Course]
    SelectCourse --> Payment{Payment Required?}
    
    Payment -->|Yes| InitiatePayment[Create Razorpay Order]
    InitiatePayment --> PaymentSuccess{Payment Success?}
    PaymentSuccess -->|No| End3([Payment Failed])
    PaymentSuccess -->|Yes| CreateEnrollment[Create Enrollment]
    
    Payment -->|No - Free Course| CreateEnrollment
    CreateEnrollment --> AssignBatch[Assign to Batch]
    AssignBatch --> GenerateInvoice[Generate Invoice]
    GenerateInvoice --> SendNotification[Send Welcome Notification]
    SendNotification --> AccessCourse[Access Course Content]
    AccessCourse --> End4([Student Learning])
```

### 2. Video Learning & Attendance Flow

```mermaid
flowchart TD
    Start([Student Opens Lesson]) --> CheckBatch{Enrolled in Batch?}
    CheckBatch -->|No| Deny([Access Denied])
    CheckBatch -->|Yes| GetVideo[Fetch Batch-Specific Video]
    
    GetVideo --> PlayVideo[Play Video]
    PlayVideo --> TrackEvents[Track Play/Pause/Seek Events]
    TrackEvents --> UpdateWatchLog[Update WatchLog]
    
    UpdateWatchLog --> CalcPercentage{Calculate Watch %}
    CalcPercentage --> CheckThreshold{Watch % >= 70%?}
    
    CheckThreshold -->|No| Continue[Continue Watching]
    Continue --> TrackEvents
    
    CheckThreshold -->|Yes| MarkAttendance[Auto-Mark Attendance as PRESENT]
    MarkAttendance --> UpdateProgress[Update Progress]
    UpdateProgress --> NextLesson{More Lessons?}
    
    NextLesson -->|Yes| PlayVideo
    NextLesson -->|No| CompleteCourse([Course Completed])
```

### 3. Admin Student Management Flow

```mermaid
flowchart TD
    Start([Admin Dashboard]) --> Action{Select Action}
    
    Action -->|View Students| ListStudents[GET /admin/students]
    ListStudents --> Display1[Display Student List]
    
    Action -->|Add Student| CreateForm[Fill Student Form]
    CreateForm --> Submit1[POST /admin/students]
    Submit1 --> CreateUser[Create User + PreApproved]
    CreateUser --> AssignCourse[Assign Course/Batch]
    AssignCourse --> Success1([Student Created])
    
    Action -->|Bulk Upload| UploadCSV[Upload CSV File]
    UploadCSV --> ParseCSV[Parse CSV Data]
    ParseCSV --> BulkCreate[POST /admin/students/bulk]
    BulkCreate --> CreateMultiple[Create Multiple Users]
    CreateMultiple --> Success2([Bulk Import Complete])
    
    Action -->|Assign Course| SelectStudent[Select Student]
    SelectStudent --> SelectCourse[Select Course/Batch]
    SelectCourse --> CreateEnrollment[POST /admin/students/:id/assign-course]
    CreateEnrollment --> UpdateEnrollment[Create Enrollment Record]
    UpdateEnrollment --> Success3([Course Assigned])
    
    Action -->|Edit Student| EditForm[Update Student Details]
    EditForm --> Submit2[PUT /admin/students/:id]
    Submit2 --> UpdateDB[Update Database]
    UpdateDB --> Success4([Student Updated])
    
    Action -->|Delete Student| Confirm{Confirm Delete?}
    Confirm -->|Yes| SoftDelete[DELETE /admin/students/:id]
    SoftDelete --> SetDeletedAt[Set deletedAt timestamp]
    SetDeletedAt --> Success5([Student Deleted])
    Confirm -->|No| Display1
```

---

## 🛣️ API Routes Structure

### Public Routes (No Auth Required)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/courses` | GET | List all active courses |
| `/courses/:slug` | GET | Get course details by slug |
| `/auth/login` | POST | User login |
| `/auth/signup` | POST | Student registration |
| `/auth/forgot-password` | POST | Request password reset |
| `/auth/verify-otp` | POST | Verify OTP and reset password |
| `/enquiries` | POST | Submit enquiry form |
| `/api/students/referrals` | GET | Get referral stats |
| `/payments/webhook` | POST | Razorpay payment webhook |

### Student Routes (Requires STUDENT Role)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/student/courses` | GET | Get enrolled courses |
| `/student/courses/:courseId/modules` | GET | Get course modules |
| `/student/courses/:courseId/lessons` | GET | Get all lessons |
| `/student/lessons/:lessonId` | GET | Get lesson details + video URL |
| `/student/progress` | GET | Get learning progress |
| `/enrollments/:enrollmentId/watch-logs` | POST | Update watch progress |
| `/notifications` | GET | Get student notifications |
| `/users/profile` | GET | Get student profile |

### Admin Routes (Requires ADMIN Role)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/students` | GET | List all students |
| `/admin/students` | POST | Create new student |
| `/admin/students/bulk` | POST | Bulk upload students (CSV) |
| `/admin/students/:id` | GET | Get student details |
| `/admin/students/:id` | PUT | Update student |
| `/admin/students/:id` | DELETE | Soft delete student |
| `/admin/students/:id/assign-course` | POST | Assign course to student |
| `/admin/students/:id/assign-batch` | POST | Assign batch to student |
| `/admin/courses` | GET/POST/PUT/DELETE | Course CRUD |
| `/lms/modules` | GET/POST/PUT/DELETE | Module CRUD |
| `/lms/lessons` | GET/POST/PUT/DELETE | Lesson CRUD |
| `/lms/batches` | GET/POST/PUT/DELETE | Batch CRUD |
| `/admin/attendance` | GET/POST/PUT | Attendance management |
| `/admin/stats/overview` | GET | Dashboard statistics |
| `/notifications/send` | POST | Send notifications |

### Tutor Routes (Requires TUTOR Role)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/lms/batches/my-batches` | GET | Get assigned batches |
| `/lms/batches/:id/students` | GET | List students in batch |
| `/admin/attendance` | POST | Mark attendance |

---

## 💳 Payment Integration Flow

```mermaid
sequenceDiagram
    participant S as Student
    participant F as Frontend
    participant B as Backend
    participant R as Razorpay
    participant DB as Database
    
    S->>F: Select Course & Click Pay
    F->>B: POST /payments/create-order
    B->>DB: Create Payment record (INITIATED)
    B->>R: Create Razorpay Order
    R-->>B: Return order_id
    B-->>F: Return order details
    
    F->>R: Open Razorpay Checkout
    S->>R: Complete Payment
    
    alt Payment Success
        R->>B: POST /payments/webhook (payment.captured)
        B->>DB: Update Payment (SUCCESS)
        B->>DB: Create Enrollment
        B->>DB: Generate Invoice (18% GST)
        B->>DB: Send Notification
        B-->>R: 200 OK
        R-->>F: Payment Success
        F-->>S: Redirect to Course
    else Payment Failed
        R->>B: POST /payments/webhook (payment.failed)
        B->>DB: Update Payment (FAILED)
        B-->>R: 200 OK
        R-->>F: Payment Failed
        F-->>S: Show Error
    end
```

---

## 📹 Video Delivery Architecture

```mermaid
flowchart LR
    subgraph "Admin Upload"
        A1[Admin Uploads Video] --> A2[POST /upload/signed-url]
        A2 --> A3[Get S3 Signed URL]
        A3 --> A4[Upload to S3]
        A4 --> A5[Save Video URL in Lesson]
    end
    
    subgraph "Batch-Specific Videos"
        B1[Admin Creates Batch] --> B2[Map Videos to Batch]
        B2 --> B3[BatchVideoMap Table]
        B3 --> B4[Different URLs per Batch]
    end
    
    subgraph "Student Access"
        C1[Student Requests Lesson] --> C2{Check Enrollment}
        C2 -->|Not Enrolled| C3[403 Forbidden]
        C2 -->|Enrolled| C4[Get Student's Batch]
        C4 --> C5[Fetch Batch-Specific Video URL]
        C5 --> C6[Return Video URL]
        C6 --> C7[Student Watches Video]
    end
    
    A5 --> B2
    B4 --> C5
```

---

## 🔔 Notification System

```mermaid
flowchart TD
    Trigger{Notification Trigger} --> Type{Notification Type}
    
    Type -->|Enrollment| N1[Welcome Message]
    Type -->|Payment| N2[Payment Confirmation]
    Type -->|Attendance| N3[Attendance Alert]
    Type -->|Course Update| N4[New Content Available]
    Type -->|Admin Broadcast| N5[Custom Message]
    
    N1 --> Store[Store in Database]
    N2 --> Store
    N3 --> Store
    N4 --> Store
    N5 --> Store
    
    Store --> Send{Send Method}
    Send -->|IN_APP| Display[Display in App]
    Send -->|EMAIL| SMTP[Send via SMTP]
    Send -->|PUSH| Push[Push Notification]
    
    Display --> Mark[Mark as Read/Unread]
    SMTP --> Mark
    Push --> Mark
```

---

## 🎓 Complete Student Learning Flow

```mermaid
stateDiagram-v2
    [*] --> Enquiry: Submit Enquiry
    Enquiry --> PreApproved: Admin Approves
    PreApproved --> Registered: Student Signs Up
    Registered --> LoggedIn: Login
    
    LoggedIn --> BrowseCourses: View Courses
    BrowseCourses --> PaymentPending: Select Paid Course
    BrowseCourses --> Enrolled: Select Free Course
    
    PaymentPending --> PaymentSuccess: Complete Payment
    PaymentPending --> PaymentFailed: Payment Fails
    PaymentFailed --> BrowseCourses: Retry
    
    PaymentSuccess --> Enrolled: Auto-Enroll
    Enrolled --> AssignedBatch: Admin Assigns Batch
    AssignedBatch --> WatchingVideos: Access Content
    
    WatchingVideos --> TrackingProgress: Watch >= 70%
    TrackingProgress --> AttendanceMarked: Auto-Attendance
    AttendanceMarked --> WatchingVideos: Continue Learning
    
    WatchingVideos --> CourseCompleted: All Lessons Done
    CourseCompleted --> [*]
```

---

## 🔧 Key Features Implementation

### 1. Auto-Attendance System
- Tracks video watch percentage via `WatchLog` table
- Automatically marks attendance as PRESENT when watch % >= 70%
- Stores watch events (play, pause, seek) in JSON format
- Admin can override attendance with notes

### 2. Batch-Specific Video Delivery
- Same lesson can have different videos for different batches
- `BatchVideoMap` table maps `batchId + lessonId → videoUrl`
- Students only see videos for their assigned batch
- Enables personalized content delivery

### 3. Payment Automation
- Razorpay integration with webhook support
- Auto-enrollment on successful payment
- Invoice generation with 18% GST
- Payment status tracking (INITIATED → SUCCESS/FAILED)

### 4. Role-Based Access Control (RBAC)
- **ADMIN**: Full system access, student management, course creation
- **TUTOR**: Batch management, attendance marking, student progress
- **STUDENT**: Course access, video watching, profile management

### 5. Security Features
- JWT authentication with 7-day expiry
- Rate limiting (100 req/15min for API, 5 req/15min for auth)
- XSS protection and input sanitization
- Helmet security headers
- CORS configuration
- Password hashing with bcrypt

---

## 📈 Admin Dashboard Statistics

The `/admin/stats/overview` endpoint provides:

```javascript
{
  totalStudents: 150,
  activeEnrollments: 120,
  totalRevenue: 450000,
  pendingPayments: 25000,
  coursesCount: 12,
  batchesCount: 8,
  todayAttendance: 85,
  recentEnrollments: [...],
  topCourses: [...]
}
```

---

## 🗄️ Database Relationships Summary

| Parent | Child | Relationship | Purpose |
|--------|-------|--------------|---------|
| User | Enrollment | One-to-Many | Student enrolls in multiple courses |
| User | Attendance | One-to-Many | Student has multiple attendance records |
| User | WatchLog | One-to-Many | Student watches multiple lessons |
| Course | Module | One-to-Many | Course contains multiple modules |
| Module | Lesson | One-to-Many | Module contains multiple lessons |
| Course | Batch | One-to-Many | Course has multiple batches |
| Batch | Enrollment | One-to-Many | Batch has multiple students |
| Enrollment | Payment | One-to-Many | Enrollment can have multiple payments |
| Payment | Invoice | One-to-One | Each payment generates one invoice |
| Lesson | BatchVideoMap | One-to-Many | Lesson has different videos per batch |

---

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "Frontend Deployments"
        F1[Vercel: proedge-student]
        F2[Vercel: proedge_admin]
        F3[Vercel: proedgelearning-main]
    end
    
    subgraph "Backend Deployment"
        B1[Render/Railway/Heroku<br/>Node.js Backend]
    end
    
    subgraph "Database"
        D1[AWS RDS<br/>PostgreSQL]
    end
    
    subgraph "Storage"
        S1[AWS S3<br/>Video Files]
    end
    
    subgraph "Payment Gateway"
        P1[Razorpay API]
    end
    
    F1 --> B1
    F2 --> B1
    F3 --> B1
    B1 --> D1
    B1 --> S1
    B1 --> P1
```

---

## 📝 Environment Variables Required

### Backend (.env)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
S3_BUCKET_NAME=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

---

## 🎯 Summary

The ProEdge LMS backend is a production-ready system with:
- ✅ **13 Database Models** for comprehensive data management
- ✅ **65+ API Endpoints** covering all LMS functionality
- ✅ **3 User Roles** (Admin, Tutor, Student) with RBAC
- ✅ **Automated Attendance** based on video watch percentage
- ✅ **Payment Integration** with Razorpay and auto-enrollment
- ✅ **Batch-Specific Content** delivery for personalized learning
- ✅ **Security Features** including JWT, rate limiting, XSS protection
- ✅ **Notification System** for in-app, email, and push notifications
- ✅ **Swagger Documentation** at `/api-docs`

This architecture supports scalable, secure, and feature-rich online learning platform operations.
