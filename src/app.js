// src/app.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const upload = multer();
const formDataParser = require('./middleware/formDataParser');
const cardsRoutes = require('./routes/cardsRoutes');
const decksRoutes = require('./routes/decksRoutes');
const bindersRoutes = require('./routes/bindersRoutes');
const seedDefaultUser = require('./db/seedUser');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(upload.none()); 
app.use(formDataParser);

// Depois de app.use(express.json());
app.use(cookieParser());

app.locals.jwtSecret = process.env.SECRET_KEY;

// Middleware para processar tanto JSON quanto Form-Data
app.use((req, res, next) => {
  if (req.headers['content-type']?.startsWith('multipart/form-data')) {
    // Se for form-data, o body já foi processado pelo fileUpload
    req.body = { ...req.body, ...req.files };
  }
  next();
});

// Rotas
app.use('/api/cards', cardsRoutes);
app.use('/api/decks', decksRoutes);
app.use('/api/binders', bindersRoutes);

// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno no servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  seedDefaultUser();
});

module.exports = app;