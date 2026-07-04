import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    default: null,
  },
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true,
  },
  sizeBytes: {
    type: Number,
  }
}, {
  timestamps: true,
});

const Media = mongoose.model('Media', mediaSchema);
export default Media;
