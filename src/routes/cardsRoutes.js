const express = require('express');
const router = express.Router();
const cardsController = require('../controllers/cardsController');

// Rotas principais
router.get('/id/:id', cardsController.getById);
router.get('/name/:name', cardsController.getByName);
router.get('/search', cardsController.search); 

// Operações CRUD (aceitam tanto ID quanto nome)
router.post('', cardsController.createFromScryfall);
router.put('/:identifier', cardsController.update);
router.delete('/:identifier', cardsController.delete);

module.exports = router;