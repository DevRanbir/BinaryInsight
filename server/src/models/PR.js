const mongoose = require('mongoose');

const prSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  repoUrl: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  developerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'approved', 'rejected', 'merged', 'closed'],
    default: 'draft'
  },
  reviewers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    assignedAt: Date,
    reviewedAt: Date
  }],
  approvalCount: {
    type: Number,
    default: 0
  },
  rejectionCount: {
    type: Number,
    default: 0
  },
  githubPRNumber: {
    type: Number,
    sparse: true
  },
  githubStatus: {
    type: String,
    enum: ['open', 'merged', 'closed'],
    sparse: true
  },
  readiness: {
    type: String,
    enum: ['NOT_READY', 'READY', 'BLOCKED'],
    default: 'NOT_READY'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PR', prSchema);
