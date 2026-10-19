const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

let server;

async function start() {
  await connectDB();
  server = http.createServer(app);
  server.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received; shutting down gracefully...`);
  if (server) {
    server.close(async error => {
      if (error) {
        console.error('Error closing HTTP server:', error);
        process.exitCode = 1;
      }
      try {
        await mongoose.connection.close();
      } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError);
        process.exitCode = 1;
      }
      process.exit();
    });
  } else {
    await mongoose.connection.close().catch(() => {});
    process.exit();
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch(error => {
  console.error('Failed to start API:', error);
  process.exit(1);
});
