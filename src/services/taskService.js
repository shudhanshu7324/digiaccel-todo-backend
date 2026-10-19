const mongoose = require('mongoose');
const Task = require('../models/Task');
const { parseDateOnly, startOfUtcMonday, addUtcDays } = require('../utils/date');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildTaskFilter(query) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;

  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q.trim()), 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  if (query.from || query.to) {
    filter.scheduledAt = {};
    if (query.from) filter.scheduledAt.$gte = parseDateOnly(query.from, 'from');
    if (query.to) {
      // Date-only "to" is inclusive: use next midnight as an exclusive upper bound.
      filter.scheduledAt.$lt = addUtcDays(parseDateOnly(query.to, 'to'), 1);
    }
    if (filter.scheduledAt.$gte && filter.scheduledAt.$lt &&
        filter.scheduledAt.$gte >= filter.scheduledAt.$lt) {
      const error = new Error('from must be on or before to');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
  }
  return filter;
}

async function createTask(payload) {
  return Task.create(payload);
}

async function listTasks(query) {
  const page = Math.max(1, Number.parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit || '10', 10)));
  const allowedSortFields = ['scheduledAt', 'createdAt', 'updatedAt', 'title', 'priority', 'status'];
  const sortField = allowedSortFields.includes(query.sort) ? query.sort : 'scheduledAt';
  const sortOrder = query.order === 'desc' ? -1 : 1;
  const filter = buildTaskFilter(query);

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ [sortField]: sortOrder, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Task.countDocuments(filter)
  ]);

  return {
    data: tasks.map(task => ({ ...task, id: task._id.toString(), _id: undefined })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1
    }
  };
}

async function getTaskById(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Task.findById(id);
}

async function updateTask(id, payload) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Task.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
    context: 'query'
  });
}

async function deleteTask(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Task.findByIdAndDelete(id);
}

async function getTasksForWeek(weekStartString) {
  const start = parseDateOnly(weekStartString, 'weekStart');
  if (start.getUTCDay() !== 1) {
    const error = new Error('weekStart must be a Monday');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  const end = addUtcDays(start, 7);
  const tasks = await Task.find({ scheduledAt: { $gte: start, $lt: end } })
    .sort({ scheduledAt: 1, createdAt: 1 })
    .lean();
  return {
    weekStart: start.toISOString().slice(0, 10),
    weekEnd: addUtcDays(start, 6).toISOString().slice(0, 10),
    tasks: tasks.map(task => ({ ...task, id: task._id.toString(), _id: undefined }))
  };
}

async function getWeeklySummary(query) {
  let from;
  let toExclusive;

  if (query.from || query.to) {
    if (!query.from || !query.to) {
      const error = new Error('Provide both from and to dates');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    const fromDate = parseDateOnly(query.from, 'from');
    const toDate = parseDateOnly(query.to, 'to');
    if (fromDate > toDate) {
      const error = new Error('from must be on or before to');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    from = startOfUtcMonday(fromDate);
    toExclusive = addUtcDays(startOfUtcMonday(toDate), 7);
  } else {
    const currentWeek = startOfUtcMonday(new Date());
    from = addUtcDays(currentWeek, -77); // 12 weeks including current week
    toExclusive = addUtcDays(currentWeek, 7);
  }

  const rows = await Task.aggregate([
    { $match: { scheduledAt: { $gte: from, $lt: toExclusive } } },
    {
      $addFields: {
        weekStart: {
          $dateTrunc: { date: '$scheduledAt', unit: 'week', startOfWeek: 'monday', timezone: 'UTC' }
        }
      }
    },
    {
      $group: {
        _id: '$weekStart',
        totalCount: { $sum: 1 },
        completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        openCount: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const byWeek = new Map(rows.map(row => [
    row._id.toISOString().slice(0, 10),
    {
      weekStart: row._id.toISOString().slice(0, 10),
      weekEnd: addUtcDays(row._id, 6).toISOString().slice(0, 10),
      totalCount: row.totalCount,
      openCount: row.openCount,
      completedCount: row.completedCount,
      progressPercent: row.totalCount ? Math.round((row.completedCount / row.totalCount) * 100) : 0
    }
  ]));

  // Include empty weeks so the frontend can render a consistent weekly timeline.
  const weeks = [];
  for (let cursor = new Date(from); cursor < toExclusive; cursor = addUtcDays(cursor, 7)) {
    const key = cursor.toISOString().slice(0, 10);
    weeks.push(byWeek.get(key) || {
      weekStart: key,
      weekEnd: addUtcDays(cursor, 6).toISOString().slice(0, 10),
      totalCount: 0,
      openCount: 0,
      completedCount: 0,
      progressPercent: 0
    });
  }
  return weeks;
}

module.exports = {
  createTask, listTasks, getTaskById, updateTask, deleteTask,
  getTasksForWeek, getWeeklySummary
};
