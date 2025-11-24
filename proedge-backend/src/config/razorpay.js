const config = require('./env');

let razorpay = null;

try {
  const Razorpay = require('razorpay');
  razorpay = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
  });
} catch (error) {
  console.warn('Razorpay initialization skipped (using demo keys):', error.message);
}

module.exports = razorpay;
