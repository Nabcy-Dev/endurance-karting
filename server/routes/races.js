const express = require('express');
const router = express.Router();
const Race = require('../models/Race');
const Driver = require('../models/Driver');
const Lap = require('../models/Lap');

// GET - Récupérer toutes les courses
router.get('/', async (req, res) => {
  try {
    const races = await Race.find()
      .populate('currentDriver', 'name color')
      .sort({ createdAt: -1 });
    res.json(races);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Récupérer une course par ID
router.get('/:id', async (req, res) => {
  try {
    const race = await Race.findById(req.params.id)
      .populate('currentDriver', 'name color');
    
    if (!race) {
      return res.status(404).json({ message: 'Course non trouvée' });
    }
    
    res.json(race);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Créer une nouvelle course
router.post('/', async (req, res) => {
  try {
    const race = new Race(req.body);
    const savedRace = await race.save();
    res.status(201).json(savedRace);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT - Mettre à jour une course
router.put('/:id', async (req, res) => {
  try {
    const race = await Race.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('currentDriver', 'name color');
    
    if (!race) {
      return res.status(404).json({ message: 'Course non trouvée' });
    }
    
    res.json(race);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE - Supprimer une course
router.delete('/:id', async (req, res) => {
  try {
    const race = await Race.findById(req.params.id);
    
    if (!race) {
      return res.status(404).json({ message: 'Course non trouvée' });
    }
    
    // Supprimer tous les relais associés
    await Lap.deleteMany({ race: req.params.id });
    
    await Race.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Démarrer une course
router.post('/:id/start', async (req, res) => {
  try {
    const race = await Race.findById(req.params.id);
    
    if (!race) {
      return res.status(404).json({ message: 'Course non trouvée' });
    }
    
    race.status = 'running';
    race.startTime = new Date();
    race.currentStintStart = new Date();
    
    const updatedRace = await race.save();
    res.json(updatedRace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Pauser une course
router.post('/:id/pause', async (req, res) => {
  try {
    const race = await Race.findById(req.params.id);
    
    if (!race) {
      return res.status(404).json({ message: 'Course non trouvée' });
    }
    
    race.status = 'paused';
    const updatedRace = await race.save();
    res.json(updatedRace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Terminer une course
router.post('/:id/finish', async (req, res) => {
  try {
    const race = await Race.findById(req.params.id);
    
    if (!race) {
      return res.status(404).json({ message: 'Course non trouvée' });
    }
    
    race.status = 'finished';
    race.endTime = new Date();
    
    const updatedRace = await race.save();
    res.json(updatedRace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Changer de pilote actuel
router.post('/:id/change-driver', async (req, res) => {
  try {
    const { driverId } = req.body;
    const race = await Race.findById(req.params.id);
    
    if (!race) {
      return res.status(404).json({ message: 'Course non trouvée' });
    }
    
    race.currentDriver = driverId;
    race.currentStintStart = new Date();
    
    const updatedRace = await race.save();
    res.json(updatedRace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Statistiques d'une course
router.get('/:id/stats', async (req, res) => {
  try {
    const race = await Race.findById(req.params.id);
    const laps = await Lap.find({ race: req.params.id })
      .populate('driver', 'name color')
      .sort({ lapNumber: 1 });
    
    if (!race) {
      return res.status(404).json({ message: 'Course non trouvée' });
    }
    
    const stats = {
      race,
      totalLaps: laps.length,
      averageLapTime: laps.length > 0 ? laps.reduce((acc, lap) => acc + lap.lapTime, 0) / laps.length : 0,
      bestLap: laps.length > 0 ? Math.min(...laps.map(lap => lap.lapTime)) : 0,
      laps
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 