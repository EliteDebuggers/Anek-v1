import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    // Optional to support passwordless logins from the current frontend
  },
  points: {
    type: Number,
    default: 0, // Initial Good Citizen Points (GCP)
  },
  profilePicture: {
    type: String,
    default: '',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index to optimize leaderboard query performance
userSchema.index({ points: -1, username: 1 });

// Virtual property to calculate user rank dynamically
userSchema.virtual('rank').get(function() {
  if (this.points > 300) return 'Vanguard Elder';
  if (this.points >= 150) return 'Vanguard Rank II';
  return 'Vanguard Rank I';
});

const User = mongoose.model('User', userSchema);
export default User;
