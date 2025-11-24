const s3 = require('../config/s3');
const config = require('../config/env');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a signed URL for uploading files to S3
 * @param {string} fileName - Original file name
 * @param {string} fileType - MIME type of the file
 * @param {string} folder - S3 folder (e.g., 'videos', 'materials')
 * @returns {object} - Signed URL and key
 */
const getSignedUploadUrl = (fileName, fileType, folder = 'uploads') => {
  const key = `${folder}/${uuidv4()}-${fileName}`;
  const params = {
    Bucket: config.aws.bucketName,
    Key: key,
    Expires: 300, // 5 minutes
    ContentType: fileType,
  };

  const url = s3.getSignedUrl('putObject', params);
  return { url, key };
};

/**
 * Generate a signed URL for viewing/downloading files from S3
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {string} - Signed URL
 */
const getSignedViewUrl = (key, expiresIn = 3600) => {
  const params = {
    Bucket: config.aws.bucketName,
    Key: key,
    Expires: expiresIn,
  };

  return s3.getSignedUrl('getObject', params);
};

/**
 * Delete a file from S3
 * @param {string} key - S3 object key
 */
const deleteFile = async (key) => {
  const params = {
    Bucket: config.aws.bucketName,
    Key: key,
  };

  return s3.deleteObject(params).promise();
};

module.exports = {
  getSignedUploadUrl,
  getSignedViewUrl,
  deleteFile,
};
