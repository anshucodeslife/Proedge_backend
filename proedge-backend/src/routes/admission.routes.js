const express = require('express');
const router = express.Router();
const admissionController = require('../controllers/admission.controller');

// New Admission (Form Submit)
router.post('/', admissionController.saveBatch1Admission); // Public

// Basic Admission CRUD (Mapped to Enrollment)
router.get('/', admissionController.getBatch1Admissions); // List
router.get('/:id', admissionController.getBatch1AdmissionById); // View
router.put('/:id', admissionController.updateBatch1Admission); // Edit
router.delete('/:id', admissionController.deleteBatch1Admission); // Delete
router.put('/:id/restore', admissionController.restoreBatch1Admission); // Restore

// Enrollment Actions (Move to Logic)
router.post('/:id/enroll', admissionController.enrollStudentFromAdmission); // Enroll Admission
router.post('/enquiry/:id/enroll', admissionController.enrollStudentFromEnquiry); // Enroll Enquiry

module.exports = router;
