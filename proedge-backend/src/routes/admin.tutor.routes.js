const express = require('express');
const router = express.Router();
const tutorController = require('../controllers/admin.tutor.controller');

router.post('/', tutorController.createTutor);
router.get('/', tutorController.getAllTutors);
router.patch('/:id', tutorController.updateTutor);
router.delete('/:id', tutorController.deleteTutor);

module.exports = router;
