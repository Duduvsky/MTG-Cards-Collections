// src/routes/decksRoutes.js
const express = require('express');
const router = express.Router();
const decksController = require('../controllers/decksController');

router.get('/search', decksController.search);
router.get('/', decksController.list);
router.post('/', decksController.create);
router.get('/:id', decksController.get);
router.put('/:id', decksController.update);
router.delete('/:id', decksController.delete);
router.post('/:id/cards', decksController.addCard);
router.post('/by-name/:deckName/cards', decksController.addCardByName); 

module.exports = router;