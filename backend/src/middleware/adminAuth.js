const jwt = require('jsonwebtoken');

/**
 * Middleware to verify admin JWT token
 */
async function verifyAdminToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret');
    
    if (decoded.role !== 'admin' && decoded.role !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.adminId = decoded.id;
    req.adminRole = decoded.role;

    next();
  } catch (error) {
    console.error('Admin token verification error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  verifyAdminToken,
};
