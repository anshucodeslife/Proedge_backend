# 🎓 Proedge Backend LMS - Complete API

A production-ready Node.js backend for **Proedge Learning Management System** with 65+ endpoints, complete authentication, role-based access control, payment integration, and comprehensive API documentation.

**Version:** 2.1.0  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Security Features](#security-features)
- [Deployment](#deployment)
- [Postman Collection](#postman-collection)

---

## ✨ Features

### Core Features
- ✅ **Enhanced Authentication** - Student ID verification, OTP-based password reset
- ✅ **Admin Student Management** - CRUD operations, bulk CSV upload, course/batch assignment
- ✅ **Student Course Access** - Batch-specific video delivery, progress tracking
- ✅ **Auto Attendance** - Automatic marking based on 70% watch threshold
- ✅ **Payment Automation** - Razorpay integration with auto-enrollment and invoice generation (18% GST)
- ✅ **Enhanced Watch Logs** - Events tracking (play/pause/seek), percentage calculation
- ✅ **Tutor Management** - Batch management, student progress monitoring
- ✅ **Notification System** - In-app notifications with email support
- ✅ **Swagger Documentation** - Interactive API docs at `/api-docs`

### Security Features
- ✅ Rate Limiting (100 req/15min API, 5 req/15min Auth)
- ✅ XSS Protection
- ✅ Input Sanitization
- ✅ JWT Authentication
- ✅ Role-Based Access Control (RBAC)
- ✅ Helmet Security Headers
- ✅ CORS Configuration

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js 22+ |
| **Framework** | Express.js 5.x |
| **ORM** | Prisma 6.x |
| **Database** | PostgreSQL |
| **Storage** | AWS S3 |
| **Payments** | Razorpay |
| **Authentication** | JWT (jsonwebtoken) |
| **Validation** | express-validator |
| **Security** | helmet, xss-clean, express-rate-limit |
| **Logging** | Winston + Morgan |
| **Documentation** | Swagger (swagger-jsdoc, swagger-ui-express) |
| **Testing** | Jest + Supertest |

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** 22+ installed
- **PostgreSQL** database (local or cloud)
- **AWS Account** with S3 bucket configured
- **Razorpay Account** for payment processing
- **SMTP Server** (optional, for email notifications)

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd proedge-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/proedge_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="ap-south-1"
S3_BUCKET_NAME="your-s3-bucket-name"

# Razorpay
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"

# Email (Optional - for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@proedge.com"

# CORS (Optional - for production)
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

---

## 🗄️ Database Setup

### 1. Create PostgreSQL Database
```bash
# Using psql
createdb proedge_db

# Or using SQL
CREATE DATABASE proedge_db;
```

### 2. Run Prisma Migrations
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Or run migrations (for production)
npx prisma migrate deploy
```

### 3. Seed Database with Demo Data
```bash
npm run seed
```

**Seed Data Includes:**
- 1 Admin user
- 1 Tutor
- 10 Students (pre-approved)
- 3 Courses with modules and lessons
- 2 Batches
- 5 Enrollments
- Sample watch logs, attendance, and notifications

**Demo Credentials:**
```
Admin:    admin@proedge.com / admin123
Tutor:    tutor@proedge.com / tutor123
Students: student1@proedge.com to student10@proedge.com / student123
```

---

## ▶️ Running the Application

### Development Mode
```bash
npm run dev
```
Server runs on `http://localhost:3000` with auto-reload (nodemon)

### Production Mode
```bash
npm start
```

### Other Commands
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# View database in Prisma Studio
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
npm run seed
```

---

## 📚 API Documentation

### Swagger UI
Access interactive API documentation:
- **Primary:** http://localhost:3000/api-docs
- **Alternative:** http://localhost:3000/docs

Features:
- 📖 Complete endpoint documentation
- 🧪 Try-it-out functionality
- 🔐 Authentication support
- 📝 Request/response schemas

### Endpoint Summary

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Authentication** | 6 | Login, signup, student ID verification, OTP reset |
| **Admin Students** | 7 | CRUD, bulk upload, course/batch assignment |
| **Student Access** | 5 | Enrolled courses, modules, lessons, progress |
| **Courses** | 5 | Public listing, admin CRUD |
| **LMS** | 9 | Modules, lessons, batches management |
| **Enrollments** | 7 | Enrollment, watch logs, attendance |
| **Payments** | 2 | Order creation, webhook |
| **Upload** | 2 | S3 signed URLs |
| **Users** | 2 | Profile, student listing |
| **Admin Analytics** | 2 | Dashboard stats, reports |
| **Notifications** | 4 | Send, get, mark read, delete |
| **Documentation** | 2 | Swagger UI access |
| **TOTAL** | **65+** | Complete LMS API |

---

## 🧪 Testing

### Run Tests
```bash
# Run all tests with coverage
npm test

# Watch mode for development
npm run test:watch
```

### Test Coverage
Tests include:
- ✅ Authentication (login, student ID verification)
- ✅ Public endpoints (courses)
- ✅ Protected routes (profile)
- ✅ Student course access
- ✅ Notification system
- ✅ Error handling

---

## 📁 Project Structure

```
proedge-backend/
├── prisma/
│   ├── schema.prisma          # Database schema (12 models)
│   └── seed.js                # Seed script
├── src/
│   ├── config/
│   │   ├── env.js             # Environment configuration
│   │   ├── logger.js          # Winston logger
│   │   ├── prisma.js          # Prisma client
│   │   └── swagger.js         # Swagger configuration
│   ├── controllers/           # Request handlers (10 controllers)
│   │   ├── auth.controller.js
│   │   ├── auth.enhanced.controller.js
│   │   ├── admin.student.controller.js
│   │   ├── student.controller.js
│   │   ├── notification.controller.js
│   │   └── ...
│   ├── services/              # Business logic (10 services)
│   │   ├── auth.service.js
│   │   ├── auth.enhanced.service.js
│   │   ├── student.service.js
│   │   ├── notification.service.js
│   │   └── ...
│   ├── middlewares/           # Express middleware
│   │   ├── auth.js            # JWT authentication
│   │   ├── role.js            # RBAC middleware
│   │   ├── error.js           # Global error handler
│   │   ├── validate.js        # Request validation
│   │   ├── rate-limit.js      # Rate limiting
│   │   └── sanitize.js        # Input sanitization
│   ├── routes/                # API routes (12 route files)
│   │   ├── auth.routes.js
│   │   ├── student.routes.js
│   │   ├── notification.routes.js
│   │   └── ...
│   ├── utils/                 # Utility functions
│   │   └── response.js        # Standardized responses
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
├── tests/
│   └── api.test.js            # Jest test suite
├── uploads/                   # Temporary file uploads
├── .env                       # Environment variables
├── .env.example               # Environment template
├── jest.config.json           # Jest configuration
├── package.json               # Dependencies
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker Compose setup
└── README.md                  # This file
```

---

## 👥 User Roles

### ADMIN
**Full System Access**
- Manage students (CRUD, bulk upload)
- Manage courses, modules, lessons, batches
- View all analytics and reports
- Send notifications
- Override attendance
- Access all endpoints

### TUTOR
**Batch Management**
- View assigned batches
- List students in batches
- Mark attendance
- View student progress
- Upload lessons (if permitted)

### STUDENT
**Learning Access**
- View enrolled courses
- Access batch-specific videos
- Track learning progress
- View notifications
- Update watch logs
- View attendance

---

## 🔒 Security Features

### 1. Rate Limiting
```javascript
// Public routes: 100 requests / 15 minutes
// Auth routes: 5 requests / 15 minutes
// Authenticated routes: 500 requests / 15 minutes
```

### 2. Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Token expiry: 7 days
- Password hashing: bcrypt (10 rounds)

### 3. Input Validation & Sanitization
- express-validator for request validation
- xss-clean for XSS protection
- express-mongo-sanitize for NoSQL injection prevention

### 4. Security Headers
- Helmet.js for HTTP headers
- CORS with whitelist support
- Referrer policy configured

### 5. Error Handling
- Global error handler
- Sensitive data hidden in production
- Detailed logs in development

---

## 🚀 Deployment

### AWS S3 Setup

1. **Create S3 Bucket**
```bash
# Using AWS CLI
aws s3 mb s3://your-bucket-name --region ap-south-1
```

2. **Configure Bucket Policy**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

3. **Enable CORS**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### Razorpay Setup

1. **Create Razorpay Account**
   - Sign up at https://razorpay.com
   - Get API keys from Dashboard

2. **Configure Webhook**
   - URL: `https://yourdomain.com/payments/webhook`
   - Events: `payment.captured`, `payment.failed`
   - Secret: Auto-generated

3. **Test Mode**
   - Use test keys for development
   - Switch to live keys for production

### Docker Deployment

```bash
# Build image
docker build -t proedge-backend .

# Run with docker-compose
docker-compose up -d
```

### Render/Heroku Deployment

1. **Set Environment Variables** in platform dashboard
2. **Add Build Command:** `npm install && npx prisma generate`
3. **Add Start Command:** `npm start`
4. **Configure Database:** Use platform's PostgreSQL addon

---

## 📮 Postman Collection

### Import Collection

1. **Download Collection**
   - File: `Proedge_Backend.postman_collection.json`
   - Version: 2.1.0

2. **Import to Postman**
   - Open Postman
   - Click **Import**
   - Select the JSON file
   - Collection appears in sidebar

3. **Configure Variables**
   - `base_url`: `http://localhost:3000` (or your deployed URL)
   - `auth_token`: Auto-saved on login

### Collection Features
- ✅ 65+ endpoints organized in 12 folders
- ✅ Auto-save authentication token
- ✅ Pre-configured request bodies
- ✅ Environment variables support
- ✅ Complete workflow examples

### Quick Test Workflow

```
1. Authentication → Login (Admin)
   → Token auto-saves

2. Admin Students → Create Student
   → Creates new student

3. Student Access → Get Enrolled Courses
   → Login as student first

4. Notifications → Get My Notifications
   → View notifications

5. Documentation → Swagger UI
   → Access API docs
```

---

## 📊 Database Models

### Core Models (12)
1. **User** - Authentication & profiles
2. **PreApprovedStudent** - Student ID whitelist
3. **Course** - Course information
4. **Module** - Course modules
5. **Lesson** - Individual lessons
6. **Batch** - Student batches
7. **BatchVideoMap** - Batch-specific videos
8. **Enrollment** - Student enrollments
9. **Attendance** - Attendance records
10. **WatchLog** - Video watch tracking
11. **Payment** - Payment records
12. **Invoice** - Payment invoices
13. **Notification** - User notifications

---

## 🐛 Troubleshooting

### Common Issues

**Issue:** Database connection error
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
sudo service postgresql start
```

**Issue:** Prisma Client not generated
```bash
npx prisma generate
```

**Issue:** S3 upload fails
```bash
# Check AWS credentials in .env
# Verify S3 bucket permissions
```

**Issue:** Rate limit exceeded
```bash
# Wait 15 minutes or adjust limits in:
# src/middlewares/rate-limit.js
```

---

## 📞 Support & Maintenance

### Logs
```bash
# View combined logs
tail -f combined.log

# View error logs
tail -f error.log
```

### Database Management
```bash
# Prisma Studio (GUI)
npx prisma studio

# Reset database
npx prisma db push --force-reset
npm run seed
```

### Health Check
```bash
curl http://localhost:3000/courses
# Should return 200 OK with course list
```

---

## 📄 License

This project is proprietary and confidential.

---

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests: `npm test`
4. Submit pull request

---

## 📝 Changelog

### v2.1.0 (2025-11-26)
- ✅ Added notification system (4 endpoints)
- ✅ Added Swagger documentation
- ✅ Added Jest test suite
- ✅ Enhanced security features
- ✅ Updated Postman collection

### v2.0.0 (2025-11-26)
- ✅ Complete LMS implementation
- ✅ 60+ endpoints
- ✅ Enhanced authentication
- ✅ Admin student management
- ✅ Auto attendance system
- ✅ Payment automation

---

**🎓 Proedge Backend LMS - Production Ready**

For detailed API documentation, visit: http://localhost:3000/api-docs
