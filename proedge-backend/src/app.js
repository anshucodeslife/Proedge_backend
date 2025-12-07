const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/env');
const logger = require('./config/logger');
const errorHandler = require('./middlewares/error');
const swaggerSpecs = require('./config/swagger');
const { apiLimiter } = require('./middlewares/rate-limit');
const { sanitizeMiddleware, xss } = require('./middlewares/sanitize');

// Routes
const authRoutes = require('./routes/auth.routes');
const authEnhancedRoutes = require('./routes/auth.enhanced.routes');
const userRoutes = require('./routes/user.routes');
const courseRoutes = require('./routes/course.routes');
const uploadRoutes = require('./routes/upload.routes');
const lmsRoutes = require('./routes/lms.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');
const adminStudentsRoutes = require('./routes/admin.students.routes');
const adminCoursesRoutes = require('./routes/admin.courses.routes');
const studentRoutes = require('./routes/student.routes');
const notificationRoutes = require('./routes/notification.routes');
const attendanceRoutes = require('./routes/attendance.routes');

const systemRoutes = require('./routes/system.routes');
const logRoutes = require('./routes/log.routes');
const enquiryRoutes = require('./routes/enquiry.routes');
const referralRoutes = require('./routes/referral.routes');
const admissionRoutes = require('./routes/admission.routes');
const referralController = require('./controllers/referral.controller');

const app = express();

// Security middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(xss()); // XSS protection
app.use(sanitizeMiddleware); // Sanitize inputs
app.use(apiLimiter); // Rate limiting
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// API Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs)); // Alternative route

// Routes
app.use('/auth', authRoutes);
app.use('/auth', authEnhancedRoutes);
app.use('/users', userRoutes);
app.use('/courses', courseRoutes);
app.use('/upload', uploadRoutes);
app.use('/lms', lmsRoutes);
app.use('/enrollments', enrollmentRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/payments', paymentRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/students', adminStudentsRoutes);
app.use('/admin/courses', adminCoursesRoutes);
app.use('/student', studentRoutes);
app.use('/notifications', notificationRoutes);
app.use('/admin/attendance', attendanceRoutes);

// Merged Routes (Phase 5)
app.use('/system', systemRoutes);
app.use('/logs', logRoutes);
app.use('/enquiries', enquiryRoutes); // API for Enquiries
app.use('/referrals', referralRoutes);
app.use('/admissions', admissionRoutes); // API for Batch1Admissions

// Compatibility Routes for proedgelearning-main frontend
// These allow the old API paths to work without frontend changes

app.use('/api/admin', adminRoutes); // Alias for proedge_admin dashboard routes
app.use('/api/admin', authRoutes); // Alias for /auth (admin login)
app.use('/api/courses', courseRoutes); // Alias for /courses
app.use('/api/enquiries', enquiryRoutes); // Alias for /enquiries
app.use('/api/referrals', referralRoutes); // Alias for /referrals
app.use('/api/logs', logRoutes); // Alias for /logs
app.use('/api/system', systemRoutes); // Alias for /system
app.use('/api/students/batch1admissions', admissionRoutes); // Alias for /admissions
app.use('/api/students/batch1admissions', admissionRoutes); // Alias for /admissions

// Specific public legacy routes for Referrals (bypass auth)
app.get('/api/students/referrals', referralController.getReferralStats);

app.get('/api/students/by-referral', referralController.getStudentsByReferral);
app.post('/api/students/enquiry', require('./controllers/enquiry.controller').saveEnquiry); // Public alias for enquiry form

app.use('/api/students', adminStudentsRoutes); // Alias for /admin/students
app.use('/api/admin/attendance', attendanceRoutes); // Alias for /admin/attendance
app.use('/api/upload', uploadRoutes); // Alias for /upload

// Error Handler
app.use(errorHandler);

module.exports = app;
