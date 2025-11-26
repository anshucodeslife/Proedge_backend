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
const studentRoutes = require('./routes/student.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

// Security middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(xss()); // XSS protection
app.use(sanitizeMiddleware); // Sanitize inputs
app.use(apiLimiter); // Rate limiting
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

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
app.use('/payments', paymentRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/students', adminStudentsRoutes);
app.use('/student', studentRoutes);
app.use('/notifications', notificationRoutes);

// Error Handler
app.use(errorHandler);

module.exports = app;
