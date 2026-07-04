import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  cost: {
    type: Number,
    required: true, // GCP cost
  },
  category: {
    type: String,
    required: true, // e.g. Local Labs, Cafes, Outdoors
  },
  imageUrl: {
    type: String,
    default: '',
  },
  minRank: {
    type: String,
    default: 'Vanguard Rank I', // minimum rank required to unlock
  }
}, {
  timestamps: true,
});

const Reward = mongoose.model('Reward', rewardSchema);
export default Reward;
