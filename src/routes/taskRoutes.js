const express = require('express');
const controller = require('../controllers/taskController');
const {
  createTaskSchema, updateTaskSchema, updateStatusSchema, validate
} = require('../validators/taskValidators');

const router = express.Router();

router.get('/weekly-summary', controller.getWeeklySummary);
router.get('/weeks/:weekStart', controller.getTasksForWeek);

router.route('/')
  .post(validate(createTaskSchema), controller.createTask)
  .get(controller.listTasks);

router.route('/:id')
  .get(controller.getTask)
  .patch(validate(updateTaskSchema), controller.updateTask)
  .delete(controller.deleteTask);

router.patch('/:id/status', validate(updateStatusSchema), controller.updateTaskStatus);

module.exports = router;
