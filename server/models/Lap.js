const mongoose = require('mongoose');

const lapSchema = new mongoose.Schema({
  race: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Race',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  driverName: {
    type: String,
    required: true
  },
  lapNumber: {
    type: Number,
    required: true
  },
  lapTime: {
    type: Number, // en millisecondes
    required: true
  },
  totalTime: {
    type: Number, // en millisecondes
    required: true
  },
  stintStartTime: {
    type: Date,
    required: true
  },
  stintEndTime: {
    type: Date,
    required: true
  },
  isBestLap: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour améliorer les performances
lapSchema.index({ race: 1, lapNumber: 1 });
lapSchema.index({ driver: 1, createdAt: -1 });
lapSchema.index({ race: 1, createdAt: -1 });

module.exports = mongoose.model('Lap', lapSchema); 