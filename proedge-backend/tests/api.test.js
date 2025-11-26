const request = require('supertest');
const app = require('../src/app');

describe('Authentication API', () => {
  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@proedge.com',
          password: 'admin123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should fail with invalid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@proedge.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@proedge.com',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/verify-student-id', () => {
    it('should verify valid student ID', async () => {
      const res = await request(app)
        .post('/auth/verify-student-id')
        .send({
          studentId: 'STU0001',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isValid).toBe(true);
    });

    it('should reject invalid student ID', async () => {
      const res = await request(app)
        .post('/auth/verify-student-id')
        .send({
          studentId: 'INVALID999',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.isValid).toBe(false);
    });
  });
});

describe('Courses API', () => {
  describe('GET /courses', () => {
    it('should return list of courses', async () => {
      const res = await request(app).get('/courses');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.courses)).toBe(true);
    });
  });
});

describe('Protected Routes', () => {
  describe('GET /users/profile', () => {
    it('should fail without token', async () => {
      const res = await request(app).get('/users/profile');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should succeed with valid token', async () => {
      // First login to get token
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@proedge.com',
          password: 'admin123',
        });

      const token = loginRes.body.token;

      // Then access protected route
      const res = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
    });
  });
});
