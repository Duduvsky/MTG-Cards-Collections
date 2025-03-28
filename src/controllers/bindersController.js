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

  addCard: async (req, res) => {
    try {
      const { cardId, cardName, quantity, condition, notes } = req.body;
      
      if (!cardId && !cardName) {
        return res.status(400).json({ 
          error: 'cardId ou cardName é obrigatório.',
          suggestion: 'Forneça um ID de carta ou um nome exato'
        });
      }
  
      // Verifica se o binder existe primeiro
      const binder = await bindersRepository.getById(req.params.id);
      if (!binder) {
        return res.status(404).json({ error: 'Binder não encontrado.' });
      }
  
      let cardToAdd;
      if (cardId) {
        // Busca pelo ID
        cardToAdd = await cardsRepository.getById(cardId);
        if (!cardToAdd) {
          return res.status(404).json({ 
            error: 'Carta não encontrada pelo ID.',
            cardId,
            suggestion: 'Verifique o ID ou use o nome da carta'
          });
        }
      } else {
        // Busca pelo nome (exato)
        cardToAdd = await cardsRepository.getByName(cardName);
        if (!cardToAdd) {
          return res.status(404).json({ 
            error: 'Carta não encontrada pelo nome.',
            cardName,
            suggestion: 'Verifique a ortografia ou use a busca flexível primeiro'
          });
        }
      }
  
      // Verificação adicional para garantir que temos um card_id válido
      if (!cardToAdd.id) {
        return res.status(500).json({ 
          error: 'ID da carta inválido.',
          details: 'A carta foi encontrada mas não tem um ID válido'
        });
      }
  
      const result = await bindersRepository.addCard(
        req.params.id,
        cardToAdd.id, // Garantimos que é o ID real
        quantity || 1,
        condition || 'NM',
        notes || ''
      );
  
      res.status(201).json({
        success: true,
        message: 'Carta adicionada com sucesso',
        binder_id: req.params.id,
        card: {
          id: cardToAdd.id,
          name: cardToAdd.name,
          set: cardToAdd.set_code
        },
        quantity: quantity || 1,
        condition: condition || 'NM'
      });
    } catch (error) {
      console.error('Erro ao adicionar carta ao binder:', error);
      
      if (error.message.includes('violates foreign key constraint')) {
        return res.status(400).json({
          error: 'Carta não existe no banco de dados',
          details: 'A carta precisa ser criada primeiro antes de adicionar ao binder',
          solution: 'Use o endpoint /cards/createFromScryfall primeiro'
        });
      }
      
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