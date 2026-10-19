const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [1, 'Task title cannot be empty'],
      maxlength: [120, 'Task title cannot exceed 120 characters']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date and time are required'],
      validate: {
        validator: value => value instanceof Date && !Number.isNaN(value.getTime()),
        message: 'scheduledAt must be a valid date'
      }
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      lowercase: true
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress'
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      }
    }
  }
);

taskSchema.index({ scheduledAt: 1, status: 1 });
taskSchema.index({ status: 1, priority: 1, scheduledAt: 1 });
taskSchema.index({ title: 1 });

module.exports = mongoose.model('Task', taskSchema);
