const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const Lap = require('../models/Lap');

// GET - Récupérer tous les pilotes
router.get('/', async (req, res) => {
  try {
    const drivers = await Driver.find({ isActive: true }).sort({ name: 1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Récupérer un pilote par ID
router.get('/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ message: 'Pilote non trouvé' });
    }
    
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Créer un nouveau pilote
router.post('/', async (req, res) => {
  try {
    const driver = new Driver(req.body);
    const savedDriver = await driver.save();
    res.status(201).json(savedDriver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT - Mettre à jour un pilote
router.put('/:id', async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!driver) {
      return res.status(404).json({ message: 'Pilote non trouvé' });
    }
    
    res.json(driver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE - Supprimer un pilote (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ message: 'Pilote non trouvé' });
    }
    
    driver.isActive = false;
    await driver.save();
    
    res.json({ message: 'Pilote supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Statistiques d'un pilote
router.get('/:id/stats', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ message: 'Pilote non trouvé' });
    }
    
    const laps = await Lap.find({ driver: req.params.id })
      .populate('race', 'name startTime')
      .sort({ createdAt: -1 });
    
    const stats = {
      driver,
      totalLaps: laps.length,
      totalRaces: [...new Set(laps.map(lap => lap.race._id.toString()))].length,
      averageLapTime: laps.length > 0 ? laps.reduce((acc, lap) => acc + lap.lapTime, 0) / laps.length : 0,
      bestLap: laps.length > 0 ? Math.min(...laps.map(lap => lap.lapTime)) : 0,
      recentLaps: laps.slice(0, 10)
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Réinitialiser les statistiques d'un pilote
router.post('/:id/reset-stats', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ message: 'Pilote non trouvé' });
    }
    
    driver.totalTime = 0;
    driver.laps = 0;
    driver.bestLap = null;
    driver.averageLap = 0;
    
    await driver.save();
    
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Classement des pilotes
router.get('/leaderboard/overall', async (req, res) => {
  try {
    const drivers = await Driver.find({ isActive: true })
      .sort({ totalTime: 1, laps: -1 })
      .limit(10);
    
    const leaderboard = drivers.map((driver, index) => ({
      rank: index + 1,
      driver: {
        id: driver._id,
        name: driver.name,
        color: driver.color
      },
      stats: {
        totalTime: driver.totalTime,
        laps: driver.laps,
        bestLap: driver.bestLap,
        averageLap: driver.averageLap
      }
    }));
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Statistiques mises à jour des pilotes basées sur les relais
router.get('/stats/calculated', async (req, res) => {
  try {
    const drivers = await Driver.find({ isActive: true });
    const calculatedStats = [];

    for (const driver of drivers) {
      // Récupérer tous les relais du pilote
      const driverLaps = await Lap.find({ driver: driver._id });
      
      const totalTime = driverLaps.reduce((acc, lap) => acc + lap.lapTime, 0);
      const lapsCount = driverLaps.length;
      const bestLap = lapsCount > 0 ? Math.min(...driverLaps.map(lap => lap.lapTime)) : 0;
      const averageLap = lapsCount > 0 ? totalTime / lapsCount : 0;

      calculatedStats.push({
        _id: driver._id,
        name: driver.name,
        color: driver.color,
        profileImage: driver.profileImage,
        totalTime: totalTime,
        laps: lapsCount,
        bestLap: bestLap,
        averageLap: averageLap,
        isActive: driver.isActive,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt
      });
    }

    // Trier par temps total (ascendant) puis par nombre de relais (descendant)
    calculatedStats.sort((a, b) => {
      if (a.totalTime !== b.totalTime) {
        return a.totalTime - b.totalTime;
      }
      return b.laps - a.laps;
    });

    res.json(calculatedStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 