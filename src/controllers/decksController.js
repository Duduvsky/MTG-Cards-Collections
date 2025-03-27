// src/controllers/decksController.js
const decksRepository = require('../repositories/decksRepository');
const cardsRepository = require('../repositories/cardsRepository')

const decksController = {
  list: async (req, res) => {
    try {
      const decks = await decksRepository.getAll(1); // ID fixo
      res.json(decks);
    } catch (error) {
      console.error('Erro ao listar decks:', error);
      res.status(500).json({ error: 'Erro ao listar decks.' });
    }
  },

  get: async (req, res) => {
    try {
      const deck = await decksRepository.getById(req.params.id);
      if (!deck) {
        return res.status(404).json({ error: 'Deck não encontrado.' });
      }

      const cards = await decksRepository.getDeckCards(req.params.id);
      
      // Separa mainboard e sideboard
      deck.mainboard = cards.filter(card => !card.is_sideboard);
      deck.sideboard = cards.filter(card => card.is_sideboard);

      res.json(deck);
    } catch (error) {
      console.error('Erro ao buscar deck:', error);
      res.status(500).json({ error: 'Erro ao buscar deck.' });
    }
  },

  create: async (req, res) => {
    try {
      const { name, description, format } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Nome é obrigatório.' });
      }

      const newDeck = await decksRepository.create({
        user_id: 1, // ID fixo
        name,
        description,
        format
      });

      res.status(201).json(newDeck);
    } catch (error) {
      console.error('Erro ao criar deck:', error);
      res.status(500).json({ error: 'Erro ao criar deck.' });
    }
  },

  update: async (req, res) => {
    try {
      const updatedDeck = await decksRepository.update(req.params.id, req.body);
      if (updatedDeck) {
        res.json(updatedDeck);
      } else {
        res.status(404).json({ error: 'Deck não encontrado.' });
      }
    } catch (error) {
      console.error('Erro ao atualizar deck:', error);
      res.status(500).json({ error: 'Erro ao atualizar deck.' });
    }
  },

  delete: async (req, res) => {
    try {
      const deletedDeck = await decksRepository.delete(req.params.id);
      if (deletedDeck) {
        res.json({ message: 'Deck excluído com sucesso.', deck: deletedDeck });
      } else {
        res.status(404).json({ error: 'Deck não encontrado.' });
      }
    } catch (error) {
      console.error('Erro ao excluir deck:', error);
      res.status(500).json({ error: 'Erro ao excluir deck.' });
    }
  },

  addCard: async (req, res) => {
    try {
      const { cardId, cardName, quantity, isSideboard } = req.body;
      
      if (!cardId && !cardName) {
        return res.status(400).json({ error: 'cardId ou cardName é obrigatório.' });
      }
  
      let cardToAdd;
      if (cardId) {
        cardToAdd = await cardsRepository.getById(cardId);
      } else {
        cardToAdd = await cardsRepository.getByName(cardName);
      }
  
      if (!cardToAdd) {
        return res.status(404).json({ error: 'Carta não encontrada no banco de dados.' });
      }
  
      const result = await decksRepository.addCard(
        req.params.id, 
        cardToAdd.id, // Usa o ID interno
        quantity || 1,
        isSideboard || false
      );
  
      res.status(201).json(result);
    } catch (error) {
      console.error('Erro ao adicionar carta ao deck:', error);
      res.status(500).json({ 
        error: 'Erro ao adicionar carta ao deck.',
        details: error.message
      });
    }
  },
};

module.exports = decksController;