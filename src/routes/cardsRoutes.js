// src/routes/cardsRoutes.js
const express = require('express');
const router = express.Router();
const cardsController = require('../controllers/cardsController');

router.get('/:id', cardsController.get);
router.post('/', cardsController.createFromScryfall);
router.put('/:id', cardsController.update);
router.delete('/:id', cardsController.delete);

module.exports = router;