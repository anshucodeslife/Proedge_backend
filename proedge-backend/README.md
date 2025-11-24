# Proedge Backend

A production-ready Node.js backend for **Proedge LMS** (Learning Management System) with Express, Prisma, PostgreSQL, AWS S3, and Razorpay integration.

## Features

- **Authentication:** JWT-based auth with role-based access control (ADMIN, TUTOR, STUDENT)
- **Course Management:** Courses, Modules, Lessons, and Batches
- **Enrollments:** Student enrollment with payment integration
- **Payments:** Razorpay integration with webhook verification
- **Media:** AWS S3 signed URLs for secure video streaming
- **Attendance:** Manual and CSV-based attendance tracking
- **Watch Logs:** Video consumption tracking
- **Admin Analytics:** Dashboard stats and video engagement reports
- **API Documentation:** Swagger/OpenAPI available at `/api-docs`

## Tech Stack

- **Runtime:** Node.js 22+
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Storage:** AWS S3
- **Payments:** Razorpay
- **Logging:** Winston + Morgan
- **Testing:** Jest + Supertest (coming soon)

## Prerequisites

- Node.js 22+
- PostgreSQL database
- AWS account (for S3)
- Razorpay account (for payments)

## Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd proedge-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="7d"

# AWS S3
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_REGION="ap-south-1"
S3_BUCKET_NAME="your-bucket-name"

# Razorpay
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
```

### 4. Run database migrations
```bash
npm run migrate
```

### 5. Generate Prisma client
```bash
npm run prisma:generate
```

### 6. Seed the database
```bash
npm run seed
```

This will create:
- 1 admin user (admin@proedge.com / admin123)
- 5 demo students (student1@proedge.com / student123, etc.)
- 3 demo courses
- 2 demo batches
- Demo modules and lessons

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will run on `http://localhost:3000`

## API Documentation

Access Swagger UI at: `http://localhost:3000/api-docs`

## Docker Setup

### Local Development with Docker Compose
```bash
docker-compose up
```

This will start:
- PostgreSQL database
- Node.js application

### Build Docker Image
```bash
docker build -t proedge-backend .
```

## Deployment

### Render Deployment

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Set environment variables in Render dashboard
5. Deploy!

### AWS Deployment (ECS + RDS)

1. Set up RDS PostgreSQL instance
2. Create ECR repository and push Docker image
3. Create ECS cluster and task definition
4. Configure environment variables and secrets
5. Deploy service

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/forgot-password` - Forgot password (sends OTP to console)

### Users
- `GET /users/profile` - Get current user profile
- `GET /users/students` - List all students (Admin/Tutor only)

### Courses
- `POST /courses` - Create course (Admin only)
- `GET /courses` - List all courses
- `GET /courses/:slug` - Get course by slug
- `PUT /courses/:id` - Update course (Admin only)
- `DELETE /courses/:id` - Delete course (Admin only)

### LMS (Modules, Lessons, Batches)
- `POST /lms/modules` - Create module
- `POST /lms/lessons` - Create lesson
- `POST /lms/batches` - Create batch
- `GET /lms/courses/:courseId/modules` - Get modules by course
- `GET /lms/modules/:moduleId/lessons` - Get lessons by module

### Enrollments
- `POST /enrollments` - Enroll student
- `GET /enrollments` - Get enrollments
- `POST /enrollments/attendance` - Mark attendance
- `POST /enrollments/watchlogs` - Update watch log

### Payments
- `POST /payments/order` - Create Razorpay order
- `POST /payments/webhook` - Razorpay webhook

### Upload
- `POST /upload/signed-url` - Get signed URL for upload
- `POST /upload/view-url` - Get signed URL for viewing

### Admin
- `GET /admin/stats/overview` - Get dashboard stats
- `GET /admin/reports/video-engagement` - Get video engagement report

## Project Structure

```
proedge-backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Express middlewares
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── app.js          # Express app setup
│   └── server.js       # Server entry point
├── prisma/
│   ├── schema.prisma   # Prisma schema
│   ├── migrations/     # Database migrations
│   └── seed.js         # Seed script
├── .env                # Environment variables
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose setup
└── package.json        # Dependencies and scripts
```

## Security

- **JWT Authentication:** All protected routes require valid JWT token
- **Role-based Access:** Admin, Tutor, and Student roles with different permissions
- **Helmet:** Security headers middleware
- **CORS:** Configured for cross-origin requests
- **Input Validation:** express-validator for request validation
- **Webhook Verification:** Razorpay signature verification

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

## Support

For support, email support@proedge.com or open an issue in the repository.
