const authService = require('../services/auth.service');
const { success } = require('../utils/response');

const signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);
    success(res, result, 'User registered successfully', 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    success(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    success(res, result, 'OTP sent successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
};
