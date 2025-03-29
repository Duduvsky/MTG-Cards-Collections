// src/repositories/bindersRepository.js
const client = require('../db/postgresql');

const bindersRepository = {
  getAll: async (userId) => {
    try {
      const query = `
        SELECT b.*, 
               COUNT(bc.card_id) as card_count
        FROM binders b
        LEFT JOIN binder_cards bc ON b.id = bc.binder_id
        WHERE b.user_id = $1
        GROUP BY b.id
        ORDER BY b.name
      `;
      const result = await client.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar binders:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      // Busca os dados básicos do binder
      const binderQuery = 'SELECT * FROM binders WHERE id = $1';
      const binderResult = await client.query(binderQuery, [id]);
      
      if (!binderResult.rows[0]) {
        return null;
      }

      // Busca as cartas associadas
      const cardsQuery = `
        SELECT 
          c.id, c.name, c.set_code, c.image_url, c.usd_price,
          bc.quantity, bc.condition, bc.notes
        FROM binder_cards bc
        JOIN cards c ON bc.card_id = c.id
        WHERE bc.binder_id = $1
        ORDER BY c.name
      `;
      const cardsResult = await client.query(cardsQuery, [id]);

      return {
        ...binderResult.rows[0],
        cards: cardsResult.rows
      };
    } catch (error) {
      console.error('Erro ao buscar binder por ID:', error);
      throw error;
    }
  },

  getByName: async (userId, name) => {
    try {
      const query = `
        SELECT * FROM binders 
        WHERE user_id = $1 AND name = $2
      `;
      const result = await client.query(query, [userId, name]);
      return result.rows[0];
    } catch (error) {
      console.error("Erro ao buscar binder por nome:", error);
      throw error;
    }
  },

  searchByName: async (userId, name) => {
    try {
      const query = `
        SELECT * FROM binders 
        WHERE user_id = $1 AND name ILIKE $2
        ORDER BY name
      `;
      const result = await client.query(query, [userId, `%${name}%`]);
      return result.rows;
    } catch (error) {
      console.error("Erro ao buscar binders por nome:", error);
      throw error;
    }
  },

  create: async (binderData) => {
    try {
      const query = `
        INSERT INTO binders 
          (user_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const result = await client.query(query, [
        binderData.user_id,
        binderData.name,
        binderData.description
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar binder:', error);
      throw error;
    }
  },

  update: async (id, binderData) => {
    try {
      const query = `
        UPDATE binders
        SET 
          name = COALESCE($1, name),
          description = COALESCE($2, description)
        WHERE id = $3
        RETURNING *;
      `;
      const values = [
        binderData.name,
        binderData.description,
        id
      ];
      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar binder:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      // Primeiro deleta as cartas associadas
      await client.query('DELETE FROM binder_cards WHERE binder_id = $1', [id]);
      
      // Depois deleta o binder
      const query = 'DELETE FROM binders WHERE id = $1 RETURNING *';
      const result = await client.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao excluir binder:', error);
      throw error;
    }
  },

  addCard: async (binderId, cardId, quantity, condition, notes) => {
    try {
      // Verificação adicional para garantir que os IDs existem
      const [binderCheck, cardCheck] = await Promise.all([
        client.query('SELECT 1 FROM binders WHERE id = $1', [binderId]),
        client.query('SELECT 1 FROM cards WHERE id = $1', [cardId])
      ]);
  
      if (binderCheck.rowCount === 0) {
        throw new Error('Binder não encontrado');
      }
      if (cardCheck.rowCount === 0) {
        throw new Error('Carta não encontrada no banco de dados');
      }
  
      const query = `
        INSERT INTO binder_cards
          (binder_id, card_id, quantity, condition, notes)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (binder_id, card_id)
        DO UPDATE SET
          quantity = binder_cards.quantity + EXCLUDED.quantity,
          condition = EXCLUDED.condition,
          notes = EXCLUDED.notes
        RETURNING *;
      `;
      const result = await client.query(query, [
        binderId,
        cardId,
        quantity,
        condition,
        notes
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao adicionar carta ao binder:', error);
      
      // Transforma erros de FK em mensagens mais amigáveis
      if (error.code === '23503') {
        if (error.constraint === 'binder_cards_binder_id_fkey') {
          throw new Error('Binder não encontrado');
        } else if (error.constraint === 'binder_cards_card_id_fkey') {
          throw new Error('Carta não encontrada no banco de dados');
        }
      }
      
      throw error;
    }
  },

  removeCard: async (binderId, cardId, quantity = 1) => {
    try {
      // Verifica se a carta existe no binder
      const existingQuery = 'SELECT * FROM binder_cards WHERE binder_id = $1 AND card_id = $2';
      const existingResult = await client.query(existingQuery, [binderId, cardId]);
      
      if (!existingResult.rows[0]) {
        throw new Error('Carta não encontrada no binder');
      }

      const currentQuantity = existingResult.rows[0].quantity;
      
      if (currentQuantity <= quantity) {
        // Remove completamente se a quantidade for menor ou igual
        const deleteQuery = 'DELETE FROM binder_cards WHERE binder_id = $1 AND card_id = $2 RETURNING *';
        const deleteResult = await client.query(deleteQuery, [binderId, cardId]);
        return deleteResult.rows[0];
      } else {
        // Apenas reduz a quantidade
        const updateQuery = `
          UPDATE binder_cards
          SET quantity = quantity - $1
          WHERE binder_id = $2 AND card_id = $3
          RETURNING *;
        `;
        const updateResult = await client.query(updateQuery, [quantity, binderId, cardId]);
        return updateResult.rows[0];
      }
    } catch (error) {
      console.error('Erro ao remover carta do binder:', error);
      throw error;
    }
  },

  getCardsByCondition: async (binderId, condition) => {
    try {
      const query = `
        SELECT 
          c.id, c.name, c.set_code, c.image_url, c.usd_price,
          bc.quantity, bc.condition, bc.notes
        FROM binder_cards bc
        JOIN cards c ON bc.card_id = c.id
        WHERE bc.binder_id = $1 AND bc.condition = $2
        ORDER BY c.name
      `;
      const result = await client.query(query, [binderId, condition]);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar cartas por condição:', error);
      throw error;
    }
  },

  getBinderCards: async (binderId) => {
    try {
      const query = `
        SELECT 
          c.id,
          c.name,
          c.set_code,
          c.image_url,
          c.usd_price,
          c.eur_price,
          bc.quantity,
          bc.condition,
          bc.notes
        FROM binder_cards bc
        JOIN cards c ON bc.card_id = c.id
        WHERE bc.binder_id = $1
        ORDER BY c.name
      `;
      const result = await client.query(query, [binderId]);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar cartas do binder:', error);
      throw error;
    }
  },

  isCardInAnyBinder: async (cardId) => {
    try {
      const query = `
        SELECT COUNT(*) as count FROM binder_cards 
        WHERE card_id = $1
      `;
      const result = await client.query(query, [cardId]);
      return {
        count: parseInt(result.rows[0].count),
        in_binders: result.rows[0].count > 0
      };
    } catch (error) {
      console.error('Erro ao verificar binders:', error);
      throw error;
    }
  },
};

module.exports = bindersRepository;