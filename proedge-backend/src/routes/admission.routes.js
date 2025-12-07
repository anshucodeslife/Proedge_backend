const express = require('express');
const router = express.Router();
const admissionController = require('../controllers/admission.controller');

// New Admission (Form Submit)
router.post('/', admissionController.saveBatch1Admission); // Public

// Admin Management
router.get('/', admissionController.getBatch1Admissions);
router.get('/:id', admissionController.getBatch1AdmissionById);
router.put('/:id', admissionController.updateBatch1Admission);
router.delete('/:id', admissionController.deleteBatch1Admission);

// Enrollment Actions (Move to Logic)
router.post('/:id/enroll', admissionController.enrollStudentFromAdmission); // Enroll Admission
router.post('/enquiry/:id/enroll', admissionController.enrollStudentFromEnquiry); // Enroll Enquiry

module.exports = router;
