const env = require('../config/env');

module.exports = function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || err.status || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Something went wrong';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Database validation failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid resource identifier';
  } else if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    message = 'A resource with these values already exists';
  }

  if (statusCode >= 500) {
    console.error(err);
    message = env.nodeEnv === 'production' ? 'Internal server error' : message;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(env.nodeEnv !== 'production' && err.details ? { details: err.details } : {})
    }
  });
};
