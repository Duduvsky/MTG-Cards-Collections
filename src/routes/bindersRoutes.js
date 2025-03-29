const express = require('express');
const router = express.Router();
const bindersController = require('../controllers/bindersController');

// Rotas públicas (sem autenticação)
router.post('/', bindersController.create);
router.get('/', bindersController.list);
router.get('/:id', bindersController.get);
router.put('/:id', bindersController.update);
router.delete('/:id', bindersController.delete);

// Rotas para gerenciar cartas nos binders
router.post('/by-name/:binderName/cards', bindersController.addCardByName);
router.post('/:id/cards', bindersController.addCard); // Original por ID
 // Nova por nome
router.delete('/:id/cards/:cardId', bindersController.removeCard);
router.get('/:id/cards', bindersController.listCards);
router.get('/search/by-name', bindersController.searchByName);

module.exports = router;