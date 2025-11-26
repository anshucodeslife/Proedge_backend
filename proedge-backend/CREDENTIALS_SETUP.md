# 🔐 Proedge Backend - Credentials Setup Guide

This file lists all the external services and credentials you need to configure for the backend to work fully.

**📍 Where to update:**  
Open the `.env` file in the root directory and update the values below.

---

## 1. Database (PostgreSQL)
Required for storing all application data.

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string | `postgresql://user:pass@localhost:5432/proedge_db` |

---

## 2. Authentication (JWT)
Required for secure user login and sessions.

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for signing tokens | `super-secret-key-change-me` |
| `JWT_EXPIRES_IN` | Token validity duration | `7d` |

---

## 3. AWS S3 (File Storage)
Required for uploading videos, thumbnails, and documents.

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `AWS_ACCESS_KEY_ID` | IAM User Access Key | AWS Console → IAM → Users |
| `AWS_SECRET_ACCESS_KEY` | IAM User Secret | AWS Console → IAM → Users |
| `AWS_REGION` | Bucket Region | e.g., `ap-south-1` (Mumbai) |
| `S3_BUCKET_NAME` | Name of your bucket | AWS Console → S3 |

---

## 4. Razorpay (Payments)
Required for processing student enrollments.

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `RAZORPAY_KEY_ID` | API Key ID | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | API Key Secret | Razorpay Dashboard → Settings → API Keys |

---

## 5. Email (SMTP) - *Optional*
Required for sending OTPs and notifications.
*If you don't have this, the app will still work but won't send emails.*

| Variable | Description | Example (Gmail) |
|----------|-------------|-----------------|
| `SMTP_HOST` | SMTP Server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP Port | `587` |
| `SMTP_USER` | Your Email | `your-email@gmail.com` |
| `SMTP_PASS` | App Password | Generate in Google Account → Security |
| `SMTP_FROM` | Sender Name | `noreply@proedge.com` |

---

## 6. Security (CORS) - *Optional*
Required for production deployment to allow specific domains.

| Variable | Description | Example |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | Comma-separated domains | `https://proedge.com,http://localhost:3000` |

---

## 📝 Example .env File

```env
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://postgres:password@localhost:5432/proedge_db"

JWT_SECRET="my-secret-key"
JWT_EXPIRES_IN="7d"

AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="wJalr..."
AWS_REGION="ap-south-1"
S3_BUCKET_NAME="proedge-lms-bucket"

RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="secret..."

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="admin@proedge.com"
SMTP_PASS="app-password-here"
```
