// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.cookies.session_id;
    
    if (!token) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    
    // Certifique-se que está adicionando o user à requisição
    req.user = {
      id: decoded.id, // Isso deve corresponder ao que está no token
      username: decoded.username,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(401).json({ error: 'Sessão inválida' });
  }
};