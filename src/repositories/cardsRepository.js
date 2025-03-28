const client = require('../db/postgresql');

const cardsRepository = {
  getById: async (id) => {
    try {
      const query = 'SELECT * FROM cards WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao buscar carta por ID:', error);
      throw error;
    }
  },

  getByName: async (name) => {
    try {
      const query = 'SELECT * FROM cards WHERE name = $1 ORDER BY set_code DESC LIMIT 1';
      const result = await client.query(query, [name]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao buscar carta por nome:', error);
      throw error;
    }
  },

  getBySetAndNumber: async (setCode, collectorNumber) => {
    try {
      const query = 'SELECT * FROM cards WHERE set_code = $1 AND collector_number = $2';
      const result = await client.query(query, [setCode, collectorNumber]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao buscar carta por set e número:', error);
      throw error;
    }
  },

  searchCards: async (query, setFilter = null) => {
    try {
      let queryText;
      let params;
      
      if (setFilter) {
        queryText = `
          SELECT * FROM cards 
          WHERE name ILIKE $1 AND set_code = $2
          ORDER BY name, set_code
        `;
        params = [`%${query}%`, setFilter];
      } else {
        queryText = `
          SELECT * FROM cards 
          WHERE name ILIKE $1
          ORDER BY name, set_code
        `;
        params = [`%${query}%`];
      }
      
      const result = await client.query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Erro na busca flexível:', error);
      throw error;
    }
  },

  create: async (cardData) => {
    try {
      const query = `
        INSERT INTO cards 
          (id, name, set_code, collector_number, image_url, usd_price, eur_price, scryfall_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;
      const values = [
        cardData.id,
        cardData.name,
        cardData.set_code,
        cardData.collector_number,
        cardData.image_url,
        cardData.usd_price,
        cardData.eur_price,
        cardData.scryfall_data
      ];
      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar carta:', error);
      throw error;
    }
  },

  update: async (id, cardData) => {
    try {
      const query = `
        UPDATE cards
        SET 
          name = COALESCE($1, name),
          set_code = COALESCE($2, set_code),
          image_url = COALESCE($3, image_url),
          usd_price = COALESCE($4, usd_price),
          eur_price = COALESCE($5, eur_price),
          scryfall_data = COALESCE($6, scryfall_data),
          last_updated = NOW()
        WHERE id = $7
        RETURNING *;
      `;
      const values = [
        cardData.name,
        cardData.set_code,
        cardData.image_url,
        cardData.usd_price,
        cardData.eur_price,
        cardData.scryfall_data,
        id
      ];
      const result = await client.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar carta:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const query = 'DELETE FROM cards WHERE id = $1 RETURNING *';
      const result = await client.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao excluir carta:', error);
      throw error;
    }
  }
};

module.exports = cardsRepository;