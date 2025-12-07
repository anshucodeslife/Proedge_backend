const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
const config = require('../src/config/env');

const s3Client = new S3Client({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});

const enableCors = async () => {
    try {
        console.log(`Configuring CORS for bucket: ${config.aws.bucketName}`);

        const command = new PutBucketCorsCommand({
            Bucket: config.aws.bucketName,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ["*"],
                        AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                        AllowedOrigins: ["*"], // Allow all for development; restrict in prod
                        ExposeHeaders: ["ETag"],
                        MaxAgeSeconds: 3000
                    }
                ]
            }
        });

        await s3Client.send(command);
        console.log("Successfully enabled CORS on S3 bucket.");
    } catch (err) {
        console.error("Error enabling CORS:", err);
    }
};

enableCors();
