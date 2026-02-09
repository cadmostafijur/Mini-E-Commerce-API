import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini E-Commerce API',
      version: '1.0.0',
      description: `
        A complete mini e-commerce backend API built with Node.js, Express.js, TypeScript, and PostgreSQL.
        
        ## Features
        - 🔐 JWT Authentication with refresh tokens
        - 👥 Role-based authorization (Admin/Customer)
        - 📦 Product management with inventory tracking
        - 🛒 Shopping cart functionality
        - 📋 Order management with status tracking
        - 💳 Payment simulation
        - 🔄 Database transactions for data consistency
        - 📊 Analytics and reporting
        - 🛡️ Rate limiting and security
        - 📝 Input validation with Zod
        - 📚 Comprehensive API documentation
        
        ## Authentication
        This API uses JWT tokens for authentication. Include the token in the Authorization header:
        \`Authorization: Bearer <your-token>\`
        
        ## Rate Limiting
        Different endpoints have different rate limits:
        - Authentication: 5 requests per 15 minutes
        - Orders: 10 requests per 5 minutes
        - Cart: 30 requests per minute
        - Admin operations: 50 requests per minute
        
        ## Error Handling
        All responses follow a consistent format:
        \`\`\`json
        {
          "success": boolean,
          "message": "string",
          "data": any,
          "error": "string",
          "statusCode": number
        }
        \`\`\`
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api`,
        description: 'Development server',
      },
    ],
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'string',
              example: 'Detailed error description',
            },
            statusCode: {
              type: 'integer',
              example: 400,
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clr1234567890',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'CUSTOMER'],
              example: 'CUSTOMER',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clr1234567890',
            },
            name: {
              type: 'string',
              example: 'Wireless Headphones',
            },
            description: {
              type: 'string',
              example: 'High-quality wireless headphones with noise cancellation',
            },
            price: {
              type: 'number',
              format: 'decimal',
              example: 99.99,
            },
            stock: {
              type: 'integer',
              example: 50,
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clr1234567890',
            },
            productId: {
              type: 'string',
              example: 'clr1234567890',
            },
            quantity: {
              type: 'integer',
              example: 2,
            },
            product: {
              $ref: '#/components/schemas/Product',
            },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clr1234567890',
            },
            userId: {
              type: 'string',
              example: 'clr1234567890',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem',
              },
            },
            totalItems: {
              type: 'integer',
              example: 5,
            },
            totalAmount: {
              type: 'number',
              format: 'decimal',
              example: 199.98,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clr1234567890',
            },
            orderId: {
              type: 'string',
              example: 'clr1234567890',
            },
            productId: {
              type: 'string',
              example: 'clr1234567890',
            },
            quantity: {
              type: 'integer',
              example: 2,
            },
            price: {
              type: 'number',
              format: 'decimal',
              example: 99.99,
              description: 'Price at time of order',
            },
            product: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                name: {
                  type: 'string',
                },
                price: {
                  type: 'number',
                },
              },
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clr1234567890',
            },
            userId: {
              type: 'string',
              example: 'clr1234567890',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
              example: 'PENDING',
            },
            totalAmount: {
              type: 'number',
              format: 'decimal',
              example: 199.98,
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {},
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  example: 1,
                },
                limit: {
                  type: 'integer',
                  example: 10,
                },
                total: {
                  type: 'integer',
                  example: 100,
                },
                totalPages: {
                  type: 'integer',
                  example: 10,
                },
                hasNext: {
                  type: 'boolean',
                  example: true,
                },
                hasPrev: {
                  type: 'boolean',
                  example: false,
                },
              },
            },
          },
        },
        TokenResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User',
            },
            tokens: {
              $ref: '#/components/schemas/TokenResponse',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and account management',
      },
      {
        name: 'Products',
        description: 'Product catalog management',
      },
      {
        name: 'Cart',
        description: 'Shopping cart operations',
      },
      {
        name: 'Orders',
        description: 'Order management and processing',
      },
    ],
  },
  apis: [
    './src/controllers/*.ts',
    './src/routes/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);