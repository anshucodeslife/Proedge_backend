const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiry.controller');

router.post('/', enquiryController.saveEnquiry); // Public Form
router.get('/', enquiryController.getEnquiries);
router.put('/:id/status', enquiryController.updateEnquiryStatus);
router.put('/:id', enquiryController.updateEnquiry);
router.delete('/:id', enquiryController.deleteEnquiry);

module.exports = router;
