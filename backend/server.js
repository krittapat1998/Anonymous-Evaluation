const app = require('./src/app');
const pool = require('./src/config/database');

const PORT = process.env.PORT || 5001;

// Test database connection
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  } else {
    console.log('✓ Database connected:', result.rows[0]);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║  Anonymous Voting System - Backend Server          ║
╠════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                        ║
║  API Base URL: http://localhost:${PORT}/api           ║
║  Health Check: http://localhost:${PORT}/api/health    ║
║  Environment: ${process.env.NODE_ENV || 'development'}                       ║
╚════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  pool.end(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});
