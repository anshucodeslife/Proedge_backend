const s3Utils = require('../utils/s3');
const { success } = require('../utils/response');

const getUploadUrl = async (req, res, next) => {
  try {
    const { fileName, fileType, folder } = req.body;
    
    if (!fileName || !fileType) {
      throw { statusCode: 400, message: 'fileName and fileType are required' };
    }

    const result = s3Utils.getSignedUploadUrl(fileName, fileType, folder || 'uploads');
    success(res, result, 'Signed upload URL generated successfully');
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

    const url = s3Utils.getSignedViewUrl(key, expiresIn ? parseInt(expiresIn) : 3600);
    success(res, { url }, 'Signed view URL generated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUploadUrl,
  getViewUrl,
};
