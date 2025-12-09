const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');

router.get('/', referralController.getReferrals);
router.get('/validate/:code', referralController.validateReferral); // Public validate
router.get('/stats', referralController.getReferralStats); // Public stats
router.get('/students', referralController.getStudentsByReferral); // Public students list
router.post('/', referralController.createReferral);
router.get('/code/:code', referralController.getReferralByCode); // Public check
router.put('/:id', referralController.updateReferral);
router.delete('/:id', referralController.deleteReferral);

module.exports = router;
