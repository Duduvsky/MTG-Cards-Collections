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
router.post('/:id/cards', bindersController.addCard);
router.delete('/:id/cards/:cardId', bindersController.removeCard);
router.get('/:id/cards', bindersController.listCards);

module.exports = router;