const adminTutorService = require('../services/admin.tutor.service');

const createTutor = async (req, res) => {
    try {
        const tutor = await adminTutorService.createTutor(req.body);
        res.status(201).json({ success: true, data: tutor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getAllTutors = async (req, res) => {
    try {
        const { search } = req.query;
        const tutors = await adminTutorService.getAllTutors(search);
        res.json({ success: true, data: tutors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateTutor = async (req, res) => {
    try {
        const { id } = req.params;
        const tutor = await adminTutorService.updateTutor(Number(id), req.body);
        res.json({ success: true, data: tutor });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const deleteTutor = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminTutorService.deleteTutor(Number(id));
        res.json({ success: true, message: result.message });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    createTutor,
    getAllTutors,
    updateTutor,
    deleteTutor
};
