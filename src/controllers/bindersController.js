// src/controllers/bindersController.js
const bindersRepository = require('../repositories/bindersRepository');
const cardsRepository = require('../repositories/cardsRepository')

const bindersController = {
  list: async (req, res) => {
    try {
      const binders = await bindersRepository.getAll(1);
      res.json(binders);
    } catch (error) {
      console.error('Erro ao listar binders:', error);
      res.status(500).json({ error: 'Erro ao listar binders.' });
    }
  },

  get: async (req, res) => {
    try {
      const binder = await bindersRepository.getById(req.params.id);
      if (binder) {
        res.json(binder);
      } else {
        res.status(404).json({ error: 'Binder não encontrado.' });
      }
    } catch (error) {
      console.error('Erro ao buscar binder:', error);
      res.status(500).json({ error: 'Erro ao buscar binder.' });
    }
  },

  create: async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Nome é obrigatório.' });
      }

      const newBinder = await bindersRepository.create({
        user_id: 1, // ID fixo como discutido
        name,
        description
      });

      res.status(201).json(newBinder);
    } catch (error) {
      console.error('Erro ao criar binder:', error);
      res.status(500).json({ error: 'Erro ao criar binder.' });
    }
  },

  update: async (req, res) => {
    try {
      const updatedBinder = await bindersRepository.update(req.params.id, req.body);
      if (updatedBinder) {
        res.json(updatedBinder);
      } else {
        res.status(404).json({ error: 'Binder não encontrado.' });
      }
    } catch (error) {
      console.error('Erro ao atualizar binder:', error);
      res.status(500).json({ error: 'Erro ao atualizar binder.' });
    }
  },

  delete: async (req, res) => {
    try {
      const deletedBinder = await bindersRepository.delete(req.params.id);
      if (deletedBinder) {
        res.json({ message: 'Binder excluído com sucesso.', binder: deletedBinder });
      } else {
        res.status(404).json({ error: 'Binder não encontrado.' });
      }
    } catch (error) {
      console.error('Erro ao excluir binder:', error);
      res.status(500).json({ error: 'Erro ao excluir binder.' });
    }
  },

  searchByName: async (req, res) => {
    try {
      const { name } = req.query;
      if (!name) {
        return res.status(400).json({ error: 'Parâmetro "name" é obrigatório.' });
      }
  
      // Substitua por searchByNameWithCards
      const binders = await bindersRepository.searchByName(1, name); // user_id fixo
      
      res.json({
        success: true,
        count: binders.length,
        binders
      });
    } catch (error) {
      console.error('Erro ao buscar binders:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar binders.',
        details: error.message 
      });
    }
  },

  addCard: async (req, res) => {
    try {
      const binderId = req.params.id;
      const { cardIdentifier, quantity, condition, notes } = req.body;

      if (!cardIdentifier) {
        return res.status(400).json({ error: 'cardIdentifier (nome/ID da carta) é obrigatório.' });
      }

      const binder = await bindersRepository.getById(binderId);
      if (!binder) {
        return res.status(404).json({ error: 'Binder não encontrado.' });
      }

      // Restante da lógica (igual ao original)
      // ... (ver implementação anterior) ...
    } catch (error) {
      console.error('Erro ao adicionar carta:', error);
      res.status(500).json({ 
        error: 'Erro ao adicionar carta ao binder.',
        details: error.message 
      });
    }
  },

  addCardByName: async (req, res) => {
    try {
      const binderName = decodeURIComponent(req.params.binderName);
      const { cardIdentifier, quantity, condition, notes } = req.body;

      if (!cardIdentifier) {
        return res.status(400).json({ error: 'cardIdentifier (nome/ID da carta) é obrigatório.' });
      }

      // Busca binder por NOME
      const binder = await bindersRepository.getByName(1, binderName); // user_id fixo
      if (!binder) {
        return res.status(404).json({ error: `Binder "${binderName}" não encontrado.` });
      }

      // Busca carta por nome ou ID
      let card;
      if (isNaN(cardIdentifier)) {
        card = await cardsRepository.getByName(cardIdentifier);
      } else {
        card = await cardsRepository.getById(cardIdentifier);
      }

      if (!card) {
        return res.status(404).json({ error: 'Carta não encontrada.' });
      }

      // Adiciona ao binder
      const result = await bindersRepository.addCard(
        binder.id,
        card.id,
        quantity || 1,
        condition || 'NM',
        notes || ''
      );

      res.status(201).json({
        success: true,
        binder: binder.name,
        card: card.name,
        quantity: result.quantity
      });

    } catch (error) {
      console.error('Erro ao adicionar carta:', error);
      res.status(500).json({ 
        error: 'Erro ao adicionar carta ao binder.',
        details: error.message 
      });
    }
  },

  removeCard: async (req, res) => {
    try {
      const { cardId, quantity } = req.body;
      
      // Verifica se o binder existe
      const binder = await bindersRepository.getById(req.params.id);
      if (!binder) {
        return res.status(404).json({ error: 'Binder não encontrado.' });
      }

      // Remove a carta
      const result = await bindersRepository.removeCard(
        req.params.id, 
        cardId, 
        quantity || 1
      );

      res.json({
        message: 'Carta removida com sucesso.',
        result
      });
    } catch (error) {
      console.error('Erro ao remover carta do binder:', error);
      res.status(500).json({ 
        error: 'Erro ao remover carta do binder.',
        details: error.message
      });
    }
  },

  getCardsByCondition: async (req, res) => {
    try {
      const { condition } = req.params;
      
      // Verifica se o binder existe
      const binder = await bindersRepository.getById(req.params.id);
      if (!binder) {
        return res.status(404).json({ error: 'Binder não encontrado.' });
      }

      // Busca cartas pela condição
      const cards = await bindersRepository.getCardsByCondition(
        req.params.id,
        condition
      );

      res.json(cards);
    } catch (error) {
      console.error('Erro ao buscar cartas por condição:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar cartas por condição.',
        details: error.message
      });
    }
  },

  listCards: async (req, res) => {
    try {
      const binderId = req.params.id;
      
      // Verifica se o binder existe
      const binder = await bindersRepository.getById(binderId);
      if (!binder) {
        return res.status(404).json({ error: 'Binder não encontrado.' });
      }

      // Obtém as cartas do binder
      const cards = await bindersRepository.getBinderCards(binderId);
      
      res.json(cards);
    } catch (error) {
      console.error('Erro ao listar cartas do binder:', error);
      res.status(500).json({ 
        error: 'Erro ao listar cartas do binder.',
        details: error.message
      });
    }
  },
};

module.exports = bindersController;