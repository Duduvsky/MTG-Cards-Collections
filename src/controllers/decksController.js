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

  search: async (req, res) => {
    try {
      const { name } = req.query;
      if (!name) {
        return res.status(400).json({ error: 'Parâmetro "name" é obrigatório.' });
      }
  
      // Substitua por searchByNameWithCards
      const decks = await decksRepository.searchByNameWithCards(1, name); // user_id fixo
      
      res.json({
        success: true,
        count: decks.length,
        decks
      });
    } catch (error) {
      console.error('Erro ao buscar decks:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar decks.',
        details: error.message 
      });
    }
  },

  addCard: async (req, res) => {
    try {
      const deckId = req.params.id;
      const { cardIdentifier, quantity, isSideboard } = req.body;

      if (!cardIdentifier) {
        return res.status(400).json({ error: 'cardIdentifier (nome/ID da carta) é obrigatório.' });
      }

      // Busca o deck por ID
      const deck = await decksRepository.getById(deckId);
      if (!deck) {
        return res.status(404).json({ error: 'Deck não encontrado.' });
      }

      // Busca a carta por nome ou ID
      let card;
      if (isNaN(cardIdentifier)) {
        card = await cardsRepository.getByName(cardIdentifier);
      } else {
        card = await cardsRepository.getById(cardIdentifier);
      }

      if (!card) {
        return res.status(404).json({ error: 'Carta não encontrada.' });
      }

      // Adiciona a carta
      const result = await decksRepository.addCard(
        deck.id,
        card.id,
        quantity || 1,
        isSideboard || false
      );

      res.status(201).json({
        success: true,
        deck: deck.name,
        card: card.name,
        quantity: result.quantity
      });

    } catch (error) {
      console.error('Erro ao adicionar carta:', error);
      res.status(500).json({ 
        error: 'Erro ao adicionar carta ao deck.',
        details: error.message 
      });
    }
  },

  // NOVO MÉTODO (por NOME do deck na URL)
  addCardByName: async (req, res) => {
    try {
      const deckName = decodeURIComponent(req.params.deckName); // Decodifica espaços (%20)
      const { cardIdentifier, quantity, isSideboard } = req.body;

      if (!cardIdentifier) {
        return res.status(400).json({ error: 'cardIdentifier (nome/ID da carta) é obrigatório.' });
      }

      // Busca o deck por NOME
      const deck = await decksRepository.getByName(1, deckName); // user_id fixo (ajuste conforme sua lógica)
      if (!deck) {
        return res.status(404).json({ error: `Deck "${deckName}" não encontrado.` });
      }

      // Restante igual ao método addCard
      let card;
      if (isNaN(cardIdentifier)) {
        card = await cardsRepository.getByName(cardIdentifier);
      } else {
        card = await cardsRepository.getById(cardIdentifier);
      }

      const result = await decksRepository.addCard(
        deck.id,
        card.id,
        quantity || 1,
        isSideboard || false
      );

      res.status(201).json({
        success: true,
        deck: deck.name,
        card: card.name,
        quantity: result.quantity
      });

    } catch (error) {
      console.error('Erro ao adicionar carta por nome do deck:', error);
      res.status(500).json({ 
        error: 'Erro ao adicionar carta.',
        details: error.message 
      });
    }
  },
};

module.exports = decksController;