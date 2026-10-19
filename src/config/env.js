const dotenv = require('dotenv');

dotenv.config();

function getEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: Number(getEnv('PORT', '5000')),
  mongoUri: getEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/todo_app'),
  clientOrigin: getEnv('CLIENT_ORIGIN', 'http://localhost:5173'),
};
