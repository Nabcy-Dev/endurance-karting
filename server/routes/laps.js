const express = require('express');
const router = express.Router();
const Lap = require('../models/Lap');
const Race = require('../models/Race');
const Driver = require('../models/Driver');

// GET - Récupérer tous les relais
router.get('/', async (req, res) => {
  try {
    const { race, driver, limit = 50, sort = '-createdAt' } = req.query;
    let query = {};
    
    if (race) query.race = race;
    if (driver) query.driver = driver;
    
    const laps = await Lap.find(query)
      .populate('race', 'name startTime')
      .populate('driver', 'name color')
      .sort(sort)
      .limit(parseInt(limit));
    
    res.json(laps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Récupérer un relais par ID
router.get('/:id', async (req, res) => {
  try {
    const lap = await Lap.findById(req.params.id)
      .populate('race', 'name startTime')
      .populate('driver', 'name color');
    
    if (!lap) {
      return res.status(404).json({ message: 'Relais non trouvé' });
    }
    
    res.json(lap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Créer un nouveau relais
router.post('/', async (req, res) => {
  try {
    const lap = new Lap(req.body);
    const savedLap = await lap.save();
    
    // Mettre à jour les statistiques du pilote
    const driver = await Driver.findById(lap.driver);
    if (driver) {
      driver.laps += 1;
      driver.totalTime += lap.lapTime;
      if (!driver.bestLap || lap.lapTime < driver.bestLap) {
        driver.bestLap = lap.lapTime;
      }
      driver.calculateAverageLap();
      await driver.save();
    }
    
    // Mettre à jour les statistiques de la course
    const race = await Race.findById(lap.race);
    if (race) {
      race.totalLaps += 1;
      race.totalTime += lap.lapTime;
      await race.save();
    }
    
    const populatedLap = await Lap.findById(savedLap._id)
      .populate('race', 'name startTime')
      .populate('driver', 'name color');
    
    res.status(201).json(populatedLap);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT - Mettre à jour un relais
router.put('/:id', async (req, res) => {
  try {
    const oldLap = await Lap.findById(req.params.id);
    if (!oldLap) {
      return res.status(404).json({ message: 'Relais non trouvé' });
    }
    
    const lap = await Lap.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('race', 'name startTime')
     .populate('driver', 'name color');
    
    // Mettre à jour les statistiques du pilote si le temps a changé
    if (oldLap.lapTime !== lap.lapTime) {
      const driver = await Driver.findById(lap.driver);
      if (driver) {
        driver.totalTime = driver.totalTime - oldLap.lapTime + lap.lapTime;
        driver.calculateAverageLap();
        
        // Recalculer le meilleur tour
        const allLaps = await Lap.find({ driver: lap.driver });
        const bestLap = Math.min(...allLaps.map(l => l.lapTime));
        driver.bestLap = bestLap;
        
        await driver.save();
      }
    }
    
    res.json(lap);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE - Supprimer un relais
router.delete('/:id', async (req, res) => {
  try {
    const lap = await Lap.findById(req.params.id);
    
    if (!lap) {
      return res.status(404).json({ message: 'Relais non trouvé' });
    }
    
    // Mettre à jour les statistiques du pilote
    const driver = await Driver.findById(lap.driver);
    if (driver) {
      driver.laps -= 1;
      driver.totalTime -= lap.lapTime;
      driver.calculateAverageLap();
      
      // Recalculer le meilleur tour
      const remainingLaps = await Lap.find({ 
        driver: lap.driver, 
        _id: { $ne: lap._id } 
      });
      driver.bestLap = remainingLaps.length > 0 ? Math.min(...remainingLaps.map(l => l.lapTime)) : null;
      
      await driver.save();
    }
    
    // Mettre à jour les statistiques de la course
    const race = await Race.findById(lap.race);
    if (race) {
      race.totalLaps -= 1;
      race.totalTime -= lap.lapTime;
      await race.save();
    }
    
    await Lap.findByIdAndDelete(req.params.id);
    res.json({ message: 'Relais supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Relais d'une course spécifique
router.get('/race/:raceId', async (req, res) => {
  try {
    const { sort = 'lapNumber', limit } = req.query;
    let query = Lap.find({ race: req.params.raceId })
      .populate('driver', 'name color')
      .sort(sort);
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const laps = await query;
    res.json(laps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Relais d'un pilote spécifique
router.get('/driver/:driverId', async (req, res) => {
  try {
    const { sort = '-createdAt', limit = 20 } = req.query;
    const laps = await Lap.find({ driver: req.params.driverId })
      .populate('race', 'name startTime')
      .sort(sort)
      .limit(parseInt(limit));
    
    res.json(laps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Meilleurs relais
router.get('/best/overall', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const bestLaps = await Lap.find()
      .populate('driver', 'name color')
      .populate('race', 'name startTime')
      .sort({ lapTime: 1 })
      .limit(parseInt(limit));
    
    res.json(bestLaps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Meilleurs relais par course
router.get('/best/race/:raceId', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const bestLaps = await Lap.find({ race: req.params.raceId })
      .populate('driver', 'name color')
      .sort({ lapTime: 1 })
      .limit(parseInt(limit));
    
    res.json(bestLaps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Enregistrer un relais avec validation
router.post('/record', async (req, res) => {
  try {
    const { raceId, driverId, lapTime, notes } = req.body;
    
    // Validation
    if (!raceId || !driverId || !lapTime) {
      return res.status(400).json({ 
        message: 'raceId, driverId et lapTime sont requis' 
      });
    }
    
    // Vérifier que la course existe et est en cours
    const race = await Race.findById(raceId);
    if (!race) {
      return res.status(404).json({ message: 'Course non trouvée' });
    }
    
    if (race.status !== 'running') {
      return res.status(400).json({ message: 'La course n\'est pas en cours' });
    }
    
    // Vérifier que le pilote existe
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Pilote non trouvé' });
    }
    
    // Créer le relais
    const lap = new Lap({
      race: raceId,
      driver: driverId,
      driverName: driver.name,
      lapNumber: race.totalLaps + 1,
      lapTime: lapTime,
      totalTime: race.totalTime + lapTime,
      stintStartTime: race.currentStintStart,
      stintEndTime: new Date(),
      notes: notes || ''
    });
    
    const savedLap = await lap.save();
    
    // Mettre à jour les statistiques
    driver.laps += 1;
    driver.totalTime += lapTime;
    if (!driver.bestLap || lapTime < driver.bestLap) {
      driver.bestLap = lapTime;
    }
    driver.calculateAverageLap();
    await driver.save();
    
    race.totalLaps += 1;
    race.totalTime += lapTime;
    race.currentStintStart = new Date();
    await race.save();
    
    const populatedLap = await Lap.findById(savedLap._id)
      .populate('race', 'name startTime')
      .populate('driver', 'name color');
    
    res.status(201).json(populatedLap);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 