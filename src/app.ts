import express from 'express';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config, validateConfig } from '@/config';
import { swaggerSpec } from '@/config/swagger';
import { apiRoutes } from '@/routes';
import { 
  errorHandler, 
  notFoundHandler,
  corsMiddleware,
  securityHeaders,
  generalLimiter 
} from '@/middlewares';

// Validate environment variables
validateConfig();

const app = express();

// Trust proxy for rate limiting and security
app.set('trust proxy', 1);

// Security headers
app.use(securityHeaders);

// CORS
app.use(corsMiddleware);

// Rate limiting
app.use(generalLimiter);

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Documentation
if (config.enableSwagger) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'Mini E-Commerce API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  }));

  // Serve swagger.json
  app.get('/api-docs.json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// Root endpoint
app.get('/', (req: any, res: any) => {
  res.json({
    message: 'Mini E-Commerce API',
    version: '1.0.0',
    environment: config.nodeEnv,
    documentation: config.enableSwagger ? `/api-docs` : null,
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
    },
  });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export { app };