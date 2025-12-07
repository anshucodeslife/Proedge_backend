const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');

router.get('/', referralController.getReferrals);
router.post('/', referralController.createReferral);
router.get('/code/:code', referralController.getReferralByCode); // Public check
router.put('/:id', referralController.updateReferral);
router.delete('/:id', referralController.deleteReferral);

module.exports = router;
