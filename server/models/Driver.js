const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    default: '#1f2937'
  },
  profileImage: {
    type: String, // URL de l'image ou base64
    default: null
  },
  totalTime: {
    type: Number, // en millisecondes
    default: 0
  },
  laps: {
    type: Number,
    default: 0
  },
  bestLap: {
    type: Number, // en millisecondes
    default: null
  },
  averageLap: {
    type: Number, // en millisecondes
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
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
driverSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Méthode pour calculer la moyenne des tours
driverSchema.methods.calculateAverageLap = function() {
  if (this.laps > 0) {
    this.averageLap = this.totalTime / this.laps;
  }
  return this.averageLap;
};

module.exports = mongoose.model('Driver', driverSchema); 