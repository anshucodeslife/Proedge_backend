// Test loading routes
console.log('Testing route imports...');

try {
  console.log('Loading auth.routes...');
  const authRoutes = require('./src/routes/auth.routes');
  console.log('✓ auth.routes loaded');
} catch (e) {
  console.error('✗ auth.routes failed:', e.message);
}

try {
  console.log('Loading user.routes...');
  const userRoutes = require('./src/routes/user.routes');
  console.log('✓ user.routes loaded');
} catch (e) {
  console.error('✗ user.routes failed:', e.message);
}

try {
  console.log('Loading course.routes...');
  const courseRoutes = require('./src/routes/course.routes');
  console.log('✓ course.routes loaded');
} catch (e) {
  console.error('✗ course.routes failed:', e.message);
}

try {
  console.log('Loading upload.routes...');
  const uploadRoutes = require('./src/routes/upload.routes');
  console.log('✓ upload.routes loaded');
} catch (e) {
  console.error('✗ upload.routes failed:', e.message);
}

try {
  console.log('Loading lms.routes...');
  const lmsRoutes = require('./src/routes/lms.routes');
  console.log('✓ lms.routes loaded');
} catch (e) {
  console.error('✗ lms.routes failed:', e.message);
}

try {
  console.log('Loading enrollment.routes...');
  const enrollmentRoutes = require('./src/routes/enrollment.routes');
  console.log('✓ enrollment.routes loaded');
} catch (e) {
  console.error('✗ enrollment.routes failed:', e.message);
}

try {
  console.log('Loading payment.routes...');
  const paymentRoutes = require('./src/routes/payment.routes');
  console.log('✓ payment.routes loaded');
} catch (e) {
  console.error('✗ payment.routes failed:', e.message);
}

try {
  console.log('Loading admin.routes...');
  const adminRoutes = require('./src/routes/admin.routes');
  console.log('✓ admin.routes loaded');
} catch (e) {
  console.error('✗ admin.routes failed:', e.message);
}

console.log('\nAll route tests completed!');
