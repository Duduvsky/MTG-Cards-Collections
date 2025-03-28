const bindersRepository = require('../repositories/bindersRepository');
const cardsRepository = require('../repositories/cardsRepository');
const axios = require('axios');

const cardsController = {
  // Busca por ID do Scryfall (mantido para compatibilidade)
  getById: async (req, res) => {
    try {
      const card = await cardsRepository.getById(req.params.id);
      if (card) {
        res.json(card);
      } else {
        res.status(404).json({ error: 'Carta não encontrada.' });
      }
    } catch (error) {
      console.error('Erro ao buscar carta por ID:', error);
      res.status(500).json({ error: 'Erro ao buscar carta.' });
    }
  },

  // Busca por nome exato (nova rota)
  getByName: async (req, res) => {
    try {
      const card = await cardsRepository.getByName(req.params.name);
      if (card) {
        res.json(card);
      } else {
        res.status(404).json({ 
          error: 'Carta não encontrada na coleção.',
          suggestion: 'Verifique a ortografia ou use a busca flexível (/cards/search)'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar carta por nome:', error);
      res.status(500).json({ error: 'Erro ao buscar carta.' });
    }
  },

  // Busca flexível (nova rota)
  search: async (req, res) => {
    try {
      const { query, set } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: 'Parâmetro "query" é obrigatório.' });
      }

      const cards = await cardsRepository.searchCards(query, set);
      
      if (cards.length === 0) {
        return res.status(404).json({ 
          error: 'Nenhuma carta encontrada.',
          suggestion: 'Tente termos mais gerais ou verifique o set especificado'
        });
      }
      
      res.json({
        count: cards.length,
        results: cards
      });
    } catch (error) {
      console.error('Erro na busca flexível:', error);
      res.status(500).json({ error: 'Erro ao buscar cartas.' });
    }
  },

  // Criação a partir do Scryfall (melhorado)
  createFromScryfall: async (req, res) => {
    try {
      const { cardName, set } = req.body;
      
      if (!cardName) {
        return res.status(400).json({ error: 'cardName é obrigatório.' });
      }

      // Busca no Scryfall com tratamento de set
      const scryfallUrl = set 
        ? `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&set=${set}`
        : `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`;
      
      const response = await axios.get(scryfallUrl);
      const scryfallData = response.data;
      
      // Verifica existência por nome e set (mais preciso que só ID)
      const existingCard = await cardsRepository.getBySetAndNumber(
        scryfallData.set,
        scryfallData.collector_number
      );
      
      if (existingCard) {
        return res.status(409).json({ 
          error: 'Carta já existe na coleção.',
          existing_card: existingCard,
          scryfall_data: scryfallData
        });
      }
      
      // Prepara dados padronizados
      const cardData = {
        id: scryfallData.id,
        name: scryfallData.name,
        set_code: scryfallData.set,
        collector_number: scryfallData.collector_number,
        image_url: scryfallData.image_uris?.normal || scryfallData.card_faces?.[0]?.image_uris?.normal || null,
        usd_price: scryfallData.prices?.usd || null,
        eur_price: scryfallData.prices?.eur || null,
        scryfall_data: scryfallData
      };
      
      const newCard = await cardsRepository.create(cardData);
      
      res.status(201).json({
        message: 'Carta adicionada com sucesso!',
        card: newCard,
        prices: {
          usd: cardData.usd_price,
          eur: cardData.eur_price
        }
      });
    } catch (error) {
      console.error('Erro ao criar carta:', error);
      
      if (error.response?.status === 404) {
        return res.status(404).json({ 
          error: 'Carta não encontrada no Scryfall.',
          details: error.response.data?.details || 'Verifique o nome e o set especificado',
          suggestion: 'Tente usar a busca flexível no Scryfall primeiro'
        });
      }
      
      res.status(500).json({ 
        error: 'Erro ao criar carta.',
        details: error.message,
        scryfall_error: error.response?.data
      });
    }
  },

  // Atualização (melhorada)
  update: async (req, res) => {
    try {
      const identifier = decodeURIComponent(req.params.identifier);
      const updateData = req.body;
      const { set } = req.query; // Parâmetro opcional para especificar o set
  
      // Verifica se é UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
      
      let cardToUpdate;
  
      if (isUUID) {
        // Caso 1: Update por ID
        cardToUpdate = await cardsRepository.getById(identifier);
      } else {
        // Caso 2: Update por nome
        const cards = await cardsRepository.getByNameWithSet(identifier, set);
        
        if (!cards || cards.length === 0) {
          return res.status(404).json({ 
            error: 'Carta não encontrada.',
            suggestion: 'Verifique o nome ou use um ID válido'
          });
        }
  
        if (cards.length > 1 && !set) {
          return res.status(300).json({
            error: 'Múltiplas versões encontradas',
            options: cards.map(c => ({ 
              id: c.id, 
              name: c.name, 
              set: c.set_code,
              image: c.image_url 
            })),
            suggestion: 'Especifique o parâmetro ?set=xxx na URL'
          });
        }
  
        cardToUpdate = set 
          ? cards.find(c => c.set_code.toLowerCase() === set.toLowerCase())
          : cards[0];
      }
  
      if (!cardToUpdate) {
        return res.status(404).json({ error: 'Carta não encontrada.' });
      }
  
      // Atualiza a carta
      const updatedCard = await cardsRepository.update(cardToUpdate.id, updateData);
      
      res.json({
        success: true,
        message: 'Carta atualizada com sucesso',
        updated_card: updatedCard
      });
  
    } catch (error) {
      console.error('Erro ao atualizar carta:', error);
      res.status(500).json({
        error: 'Erro ao atualizar carta',
        details: error.message
      });
    }
  },

  // Exclusão (melhorada)
  delete: async (req, res) => {
    try {
      const identifier = decodeURIComponent(req.params.identifier);
      const { force } = req.query; // Opcional: força a exclusão mesmo com binders
  
      // Verifica se é UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
      
      let cardToDelete;
  
      if (isUUID) {
        // Caso 1: Delete por ID
        cardToDelete = await cardsRepository.getById(identifier);
      } else {
        // Caso 2: Delete por nome (busca exata)
        const cards = await cardsRepository.getExactByName(identifier);
        
        if (!cards || cards.length === 0) {
          return res.status(404).json({ 
            error: 'Carta não encontrada.',
            suggestion: 'Verifique o nome exato ou use um ID válido'
          });
        }
  
        if (cards.length > 1) {
          return res.status(300).json({
            error: 'Múltiplas versões encontradas',
            options: cards.map(c => ({ 
              id: c.id, 
              name: c.name, 
              set: c.set_code,
              image: c.image_url 
            })),
            suggestion: 'Use o ID específico da versão que deseja deletar'
          });
        }
  
        cardToDelete = cards[0];
      }
  
      if (!cardToDelete) {
        return res.status(404).json({ error: 'Carta não encontrada.' });
      }
  
      // Verifica se a carta está em binders (a menos que force=true)
      if (force !== 'true') {
        const inBinders = await bindersRepository.isCardInAnyBinder(cardToDelete.id);
        if (inBinders.count > 0) {
          return res.status(400).json({
            error: 'Carta está vinculada a binders',
            binder_count: inBinders.count,
            suggestion: 'Use force=true para deletar mesmo assim (irá remover dos binders automaticamente)'
          });
        }
      }
  
      const deletedCard = await cardsRepository.delete(cardToDelete.id);
      
      res.json({
        success: true,
        message: 'Carta deletada com sucesso',
        deleted_card: {
          id: deletedCard.id,
          name: deletedCard.name,
          set: deletedCard.set_code
        }
      });
  
    } catch (error) {
      console.error('Erro ao deletar carta:', error);
      res.status(500).json({
        error: 'Erro interno ao deletar carta',
        details: error.message
      });
    }
  }
};

module.exports = cardsController;