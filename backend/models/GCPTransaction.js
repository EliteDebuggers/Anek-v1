import mongoose from 'mongoose';

const gcpTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true, // e.g. +10, +50, -80
  },
  type: {
    type: String,
    enum: ['EARN', 'REDEEM', 'BONUS'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  referenceModel: {
    type: String,
    enum: ['Issue', 'RewardRedemption', 'User'],
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'referenceModel'
  }
}, {
  timestamps: true,
});

const GCPTransaction = mongoose.model('GCPTransaction', gcpTransactionSchema);
export default GCPTransaction;
