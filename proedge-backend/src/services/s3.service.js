const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('../config/env');

console.log('AWS Config:', {
    region: config.aws.region,
    bucket: config.aws.bucketName,
    hasAccessKey: !!config.aws.accessKeyId
});

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
     * Get signed URL for direct browser upload (PUT)
     */
    getSignedUploadUrl: async (fileName, fileType) => {
        try {
            console.log('Generating Signed Upload URL for:', fileName, fileType);
            const command = new PutObjectCommand({
                Bucket: config.aws.bucketName,
                Key: fileName,
                ContentType: fileType,
            });

            const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
            console.log('Generated URL:', uploadUrl);

            return { uploadUrl, key: fileName };
        } catch (error) {
            console.error('Error generating upload URL:', error);
            throw new Error('Could not generate upload URL');
        }
    }
};

module.exports = s3Service;
