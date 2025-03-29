// src/repositories/decksRepository.js
const client = require("../db/postgresql");

const decksRepository = {
  getAll: async (userId) => {
    try {
      const query = `
        SELECT * FROM decks 
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const result = await client.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error("Erro ao buscar decks:", error);
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const query = "SELECT * FROM decks WHERE id = $1";
      const result = await client.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error("Erro ao buscar deck por ID:", error);
      throw error;
    }
  },

  getByName: async (userId, name) => {
    try {
      const query = `
        SELECT * FROM decks 
        WHERE user_id = $1 AND name = $2
      `;
      const result = await client.query(query, [userId, name]);
      return result.rows[0];
    } catch (error) {
      console.error("Erro ao buscar deck por nome:", error);
      throw error;
    }
  },

  searchByName: async (userId, name) => {
    try {
      const query = `
        SELECT * FROM decks 
        WHERE user_id = $1 AND name ILIKE $2
        ORDER BY name
      `;
      const result = await client.query(query, [userId, `%${name}%`]);
      return result.rows;
    } catch (error) {
      console.error("Erro ao buscar decks por nome:", error);
      throw error;
    }
  },

  searchByNameWithCards: async (userId, name) => {
    try {
      const query = `
        SELECT 
          d.*,
          json_agg(
            json_build_object(
              'id', c.id,
              'name', c.name,
              'set_code', c.set_code,
              'image_url', c.image_url,
              'quantity', dc.quantity,
              'is_sideboard', dc.is_sideboard
            ) ORDER BY c.name
          ) FILTER (WHERE c.id IS NOT NULL) as cards
        FROM decks d
        LEFT JOIN deck_cards dc ON d.id = dc.deck_id
        LEFT JOIN cards c ON dc.card_id = c.id
        WHERE d.user_id = $1 AND d.name ILIKE $2
        GROUP BY d.id
        ORDER BY d.name
      `;
      const result = await client.query(query, [userId, `%${name}%`]);
      
      // Converte cards null para array vazio e separa mainboard/sideboard
      return result.rows.map(deck => ({
        ...deck,
        cards: deck.cards || [],
        mainboard: deck.cards ? deck.cards.filter(card => !card.is_sideboard) : [],
        sideboard: deck.cards ? deck.cards.filter(card => card.is_sideboard) : []
      }));
    } catch (error) {
      console.error("Erro ao buscar decks com cartas:", error);
      throw error;
    }
  },

  create: async (deckData) => {
    try {
      const query = `
        INSERT INTO decks 
          (user_id, name, description, format)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const values = [
        deckData.user_id,
        deckData.name,
        deckData.description,
        deckData.format,
      ];
      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Erro ao criar deck:", error);
      throw error;
    }
  },

  update: async (id, deckData) => {
    try {
      const query = `
        UPDATE decks
        SET 
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          format = COALESCE($3, format)
        WHERE id = $4
        RETURNING *;
      `;
      const values = [deckData.name, deckData.description, deckData.format, id];
      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Erro ao atualizar deck:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      // Primeiro deleta as cartas associadas
      await client.query("DELETE FROM deck_cards WHERE deck_id = $1", [id]);

      // Depois deleta o deck
      const query = "DELETE FROM decks WHERE id = $1 RETURNING *";
      const result = await client.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error("Erro ao excluir deck:", error);
      throw error;
    }
  },

  addCard: async (deckId, cardId, quantity = 1, isSideboard = false) => {
    try {
      const query = `
        INSERT INTO deck_cards 
          (deck_id, card_id, quantity, is_sideboard)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (deck_id, card_id, is_sideboard) 
        DO UPDATE SET 
          quantity = deck_cards.quantity + EXCLUDED.quantity
        RETURNING *;
      `;
      const values = [deckId, cardId, quantity, isSideboard];
      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Erro ao adicionar carta ao deck:", error);
      throw error;
    }
  },

  getDeckCards: async (deckId) => {
    try {
      const query = `
        SELECT 
          c.id,
          c.name,
          c.set_code,
          c.image_url,
          c.usd_price,
          dc.quantity,
          dc.is_sideboard
        FROM deck_cards dc
        JOIN cards c ON dc.card_id = c.id
        WHERE dc.deck_id = $1
        ORDER BY dc.is_sideboard, c.name
      `;
      const result = await client.query(query, [deckId]);
      return result.rows;
    } catch (error) {
      console.error("Erro ao buscar cartas do deck:", error);
      throw error;
    }
  },
};

module.exports = decksRepository;
