const mongoose = require('mongoose');

const raceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Course Karting Endurance'
  },
  teamName: {
    type: String,
    required: true,
    default: 'Endurance - Sigma Team'
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // en minutes
    default: 60
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'paused', 'finished'],
    default: 'pending'
  },
  settings: {
    minStintTime: {
      type: Number,
      default: 10 // minutes
    },
    maxStintTime: {
      type: Number,
      default: 30 // minutes
    },
    targetLaps: {
      type: Number,
      default: 0
    },
    city: {
      type: String,
      default: 'Paris'
    }
  },
  totalLaps: {
    type: Number,
    default: 0
  },
  totalTime: {
    type: Number, // en millisecondes
    default: 0
  },
  currentDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  currentStintStart: {
    type: Date,
    default: null
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

// Middleware pour mettre à jour updatedAt
raceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Race', raceSchema); 