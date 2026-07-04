import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true,
});

// Enforce unique voting: a user can only vote on an issue once
voteSchema.index({ issue: 1, user: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);
export default Vote;
