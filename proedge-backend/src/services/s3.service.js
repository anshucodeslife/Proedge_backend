const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');
const config = require('../config/env');

// Initialize S3 Client
const s3Client = new S3Client({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});

const s3Service = {
    /**
     * Get signed URL for file access (GET)
     * @param {string} key - S3 key
     * @param {number} expiresIn - Expiration in seconds (default 3600)
     * @returns {Promise<string>} - Signed URL
     */
    getSignedUrl: async (key, expiresIn = 3600) => {
        try {
            const command = new GetObjectCommand({
                Bucket: config.aws.bucketName,
                Key: key,
            });

            const url = await getSignedUrl(s3Client, command, { expiresIn });
            return url;
        } catch (error) {
            console.error('Error generating signed URL:', error);
            throw new Error('Could not generate signed URL');
        }
    },

    /**
     * Upload file directly to S3
     * @param {Buffer} buffer - File buffer
     * @param {string} fileName - File name
     * @param {string} mimeType - MIME type
     * @returns {Promise<object>} - S3 upload result
     */
    uploadFile: async (buffer, fileName, mimeType) => {
        try {
            const command = new PutObjectCommand({
                Bucket: config.aws.bucketName,
                Key: fileName,
                Body: buffer,
                ContentType: mimeType,
            });

            await s3Client.send(command);

            return {
                Location: `https://${config.aws.bucketName}.s3.${config.aws.region}.amazonaws.com/${fileName}`,
                Key: fileName,
            };
        } catch (error) {
            console.error('Error uploading file to S3:', error);
            throw new Error('Could not upload file');
        }
    },

    /**
     * Get signed URL for direct browser upload (Presigned POST)
     * @param {string} fileName - File name
     * @param {string} fileType - MIME type
     * @returns {Promise<object>} - Presigned POST data
     */
    getSignedUploadUrl: async (fileName, fileType) => {
        try {
            const { url, fields } = await createPresignedPost(s3Client, {
                Bucket: config.aws.bucketName,
                Key: fileName,
                Conditions: [
                    ['content-length-range', 0, 104857600], // up to 100 MB
                    ['eq', '$Content-Type', fileType],
                ],
                Fields: {
                    'Content-Type': fileType,
                },
                Expires: 600, // 10 minutes
            });

            return { url, fields };
        } catch (error) {
            console.error('Error generating upload URL:', error);
            throw new Error('Could not generate upload URL');
        }
    }
};

module.exports = s3Service;
