const express = require('express');
const uploadController = require('../controllers/upload.controller');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

const router = express.Router();

/**
 * @swagger
 * /upload/signed-url:
 *   post:
 *     summary: Get a signed URL for uploading files to S3
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileName, fileType]
 *             properties:
 *               fileName:
 *                 type: string
 *               fileType:
 *                 type: string
 *               folder:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signed upload URL generated
 */
router.post(
  '/signed-url',
  authMiddleware,
  roleMiddleware(['ADMIN', 'TUTOR']),
  uploadController.getUploadUrl
);

/**
 * @swagger
 * /upload/view-url:
 *   post:
 *     summary: Get a signed URL for viewing files from S3
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key]
 *             properties:
 *               key:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signed view URL generated
 */
router.post('/view-url', authMiddleware, uploadController.getViewUrl);

module.exports = router;
