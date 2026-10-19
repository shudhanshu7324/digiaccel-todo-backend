const { z } = require('zod');

const priority = z.enum(['low', 'medium', 'high']);
const status = z.enum(['in_progress', 'completed']);

const title = z.string().trim().min(1).max(120);
const description = z.string().trim().max(2000).optional();
const scheduledAt = z.string().datetime({ offset: true }).transform(value => new Date(value));

const createTaskSchema = z.object({
  title,
  description,
  scheduledAt,
  priority: priority.optional(),
  status: status.optional()
}).strict();

const updateTaskSchema = z.object({
  title: title.optional(),
  description,
  scheduledAt: scheduledAt.optional(),
  priority: priority.optional(),
  status: status.optional()
}).strict().refine(value => Object.keys(value).length > 0, {
  message: 'Provide at least one field to update'
});

const updateStatusSchema = z.object({ status }).strict();

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: result.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        }
      });
    }
    req[source] = result.data;
    next();
  };
}

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  validate
};
