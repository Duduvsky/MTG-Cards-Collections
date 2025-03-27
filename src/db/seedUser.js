// db/seedUser.js
const pool = require("./postgresql");

async function seedDefaultUser() {
  try {
    // Verifica se já existe o usuário padrão
    const { rows } = await pool.query("SELECT id FROM users WHERE id = 1");

    if (rows.length === 0) {
      console.log("Criando usuário padrão...");
      await pool.query(`
        INSERT INTO users (id, username, email) 
        VALUES (1, 'default', 'default@example.com')
      `);
    }
  } catch (error) {
    console.error("Erro ao verificar/criar usuário padrão:", error);
  }
}

module.exports = seedDefaultUser;
