const asyncHandler = require('../utils/asyncHandler');
const taskService = require('../services/taskService');

exports.createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.body);
  res.status(201).json({ success: true, data: task });
});

exports.listTasks = asyncHandler(async (req, res) => {
  const result = await taskService.listTasks(req.query);
  res.status(200).json({ success: true, ...result });
});

exports.getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { code: 'TASK_NOT_FOUND', message: 'Task not found' }
    });
  }
  res.status(200).json({ success: true, data: task });
});

exports.updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.body);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { code: 'TASK_NOT_FOUND', message: 'Task not found' }
    });
  }
  res.status(200).json({ success: true, data: task });
});

exports.updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, { status: req.body.status });
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { code: 'TASK_NOT_FOUND', message: 'Task not found' }
    });
  }
  res.status(200).json({ success: true, data: task });
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await taskService.deleteTask(req.params.id);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { code: 'TASK_NOT_FOUND', message: 'Task not found' }
    });
  }
  res.status(200).json({ success: true, message: 'Task deleted successfully' });
});

exports.getTasksForWeek = asyncHandler(async (req, res) => {
  const result = await taskService.getTasksForWeek(req.params.weekStart);
  res.status(200).json({ success: true, data: result });
});

exports.getWeeklySummary = asyncHandler(async (req, res) => {
  const weeks = await taskService.getWeeklySummary(req.query);
  res.status(200).json({ success: true, data: weeks });
});
