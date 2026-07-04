import mongoose from 'mongoose';

const rewardRedemptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reward: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward',
    required: true,
  },
  status: {
    type: String,
    enum: ['CLAIMED', 'USED'],
    default: 'CLAIMED',
  },
  code: {
    type: String,
    required: true,
    unique: true, // voucher code returned to the client
  }
}, {
  timestamps: true,
});

const RewardRedemption = mongoose.model('RewardRedemption', rewardRedemptionSchema);
export default RewardRedemption;
