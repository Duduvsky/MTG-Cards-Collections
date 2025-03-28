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
      // Aceita tanto ID quanto nome como identificador
      const identifier = req.params.id;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
      
      const card = isUUID 
        ? await cardsRepository.getById(identifier)
        : await cardsRepository.getByName(identifier);
      
      if (!card) {
        return res.status(404).json({ error: 'Carta não encontrada.' });
      }

      const updatedCard = await cardsRepository.update(card.id, req.body);
      res.json({
        message: 'Carta atualizada com sucesso!',
        card: updatedCard
      });
    } catch (error) {
      console.error('Erro ao atualizar carta:', error);
      res.status(500).json({ 
        error: 'Erro ao atualizar carta.',
        details: error.message
      });
    }
  },

  // Exclusão (melhorada)
  delete: async (req, res) => {
    try {
      const identifier = req.params.id;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
      
      const card = isUUID 
        ? await cardsRepository.getById(identifier)
        : await cardsRepository.getByName(identifier);
      
      if (!card) {
        return res.status(404).json({ error: 'Carta não encontrada.' });
      }

      const deletedCard = await cardsRepository.delete(card.id);
      res.json({ 
        message: 'Carta excluída com sucesso!',
        deleted_card: deletedCard
      });
    } catch (error) {
      console.error('Erro ao excluir carta:', error);
      res.status(500).json({ 
        error: 'Erro ao excluir carta.',
        details: error.message
      });
    }
  }
};

module.exports = cardsController;