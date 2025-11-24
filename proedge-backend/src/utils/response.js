const success = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null,
  });
};

const error = (res, message = 'Error', statusCode = 500, errorDetails = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: errorDetails || message,
  });
};

module.exports = { success, error };
