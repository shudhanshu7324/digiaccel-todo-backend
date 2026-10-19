const express = require("express");
const cors = require("cors");

const taskRoutes = require("./routes/taskRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
  })
);

app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running"
  });
});

app.use("/api/v1/tasks", taskRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
