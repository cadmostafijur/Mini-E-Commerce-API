// Vercel serverless function entry point
try {
  const { app } = require('../dist/app');
  module.exports = app;
} catch (error) {
  console.error('Failed to initialize Express app:', error);
  
  // Export an error handler function for Vercel
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to initialize the API. Please check environment variables.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      requiredEnvVars: [
        'DATABASE_URL',
        'JWT_ACCESS_SECRET (min 32 chars)',
        'JWT_REFRESH_SECRET (min 32 chars)'
      ]
    });
  };
}
