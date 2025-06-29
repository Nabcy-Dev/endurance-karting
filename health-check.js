// Script de vérification de santé pour Render
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Route de vérification de santé
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    version: process.version
  };
  
  res.status(200).json(health);
});

// Route de test API
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API Karting Endurance fonctionnelle!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

module.exports = app; 