const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'recruitment_jwt_secret_change_me_in_production';

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authMiddleware, JWT_SECRET };
