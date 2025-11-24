const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  jwt: {
    secret: process.env.JWT_SECRET || 'demo_jwt_secret_key_12345',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  db: {
    url: process.env.DATABASE_URL,
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'demo_aws_key_id',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'demo_aws_secret_key',
    region: process.env.AWS_REGION || 'ap-south-1',
    bucketName: process.env.S3_BUCKET_NAME || 'demo-proedge-bucket',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo_key_123',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'demo_razorpay_secret_456',
  },
};
