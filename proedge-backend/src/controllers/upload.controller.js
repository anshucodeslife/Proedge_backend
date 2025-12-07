const s3Service = require('../services/s3.service');
const { success } = require('../utils/response');

const getUploadUrl = async (req, res, next) => {
  try {
    const { fileName, fileType, folder } = req.body;

    if (!fileName || !fileType) {
      throw { statusCode: 400, message: 'fileName and fileType are required' };
    }

    // Pass folder to service
    const result = await s3Service.getSignedUploadUrl(fileName, fileType, folder);

    console.log('Controller Result:', result); // Debug log
    success(res, result, 'Signed upload URL generated successfully (DEBUG MODE)');
  } catch (err) {
    next(err);
  }
};

const getViewUrl = async (req, res, next) => {
  try {
    const { key } = req.body;
    const { expiresIn } = req.query;

    if (!key) {
      throw { statusCode: 400, message: 'key is required' };
    }

    const url = await s3Service.getSignedUrl(key, expiresIn ? parseInt(expiresIn) : 3600);
    success(res, { url }, 'Signed view URL generated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUploadUrl,
  getViewUrl,

};
