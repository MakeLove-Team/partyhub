import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClubVerification',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true,
    minlength: 10
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  ticketsSold: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  isBlocked: {
    type: Boolean,
    default: false
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

// Update the updatedAt timestamp before saving
eventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
