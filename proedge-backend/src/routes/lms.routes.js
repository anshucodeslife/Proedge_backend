const express = require('express');
const lmsController = require('../controllers/lms.controller');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

const router = express.Router();

// Module routes
router.post('/modules', authMiddleware, roleMiddleware(['ADMIN']), lmsController.createModule);
router.get('/courses/:courseId/modules', lmsController.getModulesByCourse);
router.put('/modules/:id', authMiddleware, roleMiddleware(['ADMIN']), lmsController.updateModule);

// Lesson routes
router.post('/lessons', authMiddleware, roleMiddleware(['ADMIN']), lmsController.createLesson);
router.get('/modules/:moduleId/lessons', lmsController.getLessonsByModule);
router.put('/lessons/:id', authMiddleware, roleMiddleware(['ADMIN']), lmsController.updateLesson);

// Batch routes
router.post('/batches', authMiddleware, roleMiddleware(['ADMIN']), lmsController.createBatch);
router.get('/batches', lmsController.getBatches);
router.put('/batches/:id', authMiddleware, roleMiddleware(['ADMIN']), lmsController.updateBatch);

module.exports = router;
