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
  // Serve swagger.json
  app.get('/api-docs.json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve Swagger UI with CDN assets (reliable for serverless)
  const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mini E-Commerce API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: '/api-docs.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true
      });
    };
  </script>
</body>
</html>`;

  app.get('/api-docs', (req: any, res: any) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(swaggerHtml);
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