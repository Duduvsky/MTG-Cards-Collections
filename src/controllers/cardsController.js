// src/controllers/cardsController.js
const cardsRepository = require('../repositories/cardsRepository');
const axios = require('axios');

const cardsController = {
  get: async (req, res) => {
    try {
      const card = await cardsRepository.getById(req.params.id);
      if (card) {
        res.json(card);
      } else {
        res.status(404).json({ error: 'Carta não encontrada.' });
      }
    } catch (error) {
      console.error('Erro ao buscar carta:', error);
      res.status(500).json({ error: 'Erro ao buscar carta.' });
    }
  },

  createFromScryfall: async (req, res) => {
    try {
      const { cardName } = req.body; // Mudei de scryfallId para cardName
      
      if (!cardName) {
        return res.status(400).json({ error: 'cardName é obrigatório.' });
      }

      // Busca dados no Scryfall por nome exato
      const response = await axios.get(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
      const scryfallData = response.data;
      
      // Verifica se a carta já existe no banco
      const existingCard = await cardsRepository.getById(scryfallData.id);
      if (existingCard) {
        return res.status(409).json({ 
          error: 'Carta já existe na coleção.',
          card: existingCard
        });
      }
      
      // Prepara dados para inserção (igual ao anterior)
      const cardData = {
        id: scryfallData.id,
        name: scryfallData.name,
        set_code: scryfallData.set,
        collector_number: scryfallData.collector_number,
        image_url: scryfallData.image_uris?.normal || null,
        usd_price: scryfallData.prices.usd || null,
        eur_price: scryfallData.prices.eur || null,
        scryfall_data: scryfallData
      };
      
      // Salva no banco
      const newCard = await cardsRepository.create(cardData);
      
      res.status(201).json(newCard);
    } catch (error) {
      console.error('Erro ao criar carta:', error);
      
      if (error.response?.status === 404) {
        return res.status(404).json({ 
          error: 'Carta não encontrada no Scryfall.',
          details: 'Verifique se o nome está correto ou tente uma busca aproximada.'
        });
      }
      
      res.status(500).json({ 
        error: 'Erro ao criar carta.',
        details: error.response?.data?.details || error.message
      });
    }
  },

  update: async (req, res) => {
    try {
      const updatedCard = await cardsRepository.update(req.params.id, req.body);
      if (updatedCard) {
        res.json(updatedCard);
      } else {
        res.status(404).json({ error: 'Carta não encontrada.' });
      }
    } catch (error) {
      console.error('Erro ao atualizar carta:', error);
      res.status(500).json({ error: 'Erro ao atualizar carta.' });
    }
  },

  delete: async (req, res) => {
    try {
      const deletedCard = await cardsRepository.delete(req.params.id);
      if (deletedCard) {
        res.json({ message: 'Carta excluída com sucesso.', card: deletedCard });
      } else {
        res.status(404).json({ error: 'Carta não encontrada.' });
      }
    } catch (error) {
      console.error('Erro ao excluir carta:', error);
      res.status(500).json({ error: 'Erro ao excluir carta.' });
    }
  }
};

module.exports = cardsController;