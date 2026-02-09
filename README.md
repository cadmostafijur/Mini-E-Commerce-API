# 🛒 Mini E-Commerce Backend API

A complete, production-ready mini e-commerce backend API built with **Node.js**, **Express.js**, **TypeScript**, and **PostgreSQL**. This API provides all the essential features needed for a modern e-commerce platform.

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Role-based authorization (ADMIN/CUSTOMER)
- Secure password hashing with bcrypt
- Account management (profile updates, password changes)
- Multi-device login support with token management

### 📦 Product Management
- Complete CRUD operations for products
- Inventory management with stock tracking
- Product search and filtering
- Pagination for large catalogs
- Soft delete functionality
- Low stock alerts and statistics
- Bulk operations for admin users

### 🛒 Shopping Cart
- User-specific shopping cart
- Add/remove/update cart items
- Stock validation before adding items
- Cart cleanup for unavailable products
- Real-time cart totals and summaries

### 📋 Order Management
- Order creation from cart with atomic transactions
- Order status tracking (PENDING → SHIPPED → DELIVERED/CANCELLED)
- Customer order history with pagination
- Admin order management and analytics
- Order cancellation with abuse prevention
- Revenue analytics and reporting

### 💳 Payment Simulation
- Mock payment processing with configurable success rates
- Payment validation and error handling
- Transaction tracking

### 🛡️ Security & Performance
- Rate limiting for different endpoints
- CORS configuration
- Security headers with Helmet
- Input validation with Zod schemas
- Database transactions for data consistency
- Graceful error handling and logging
- Health check endpoints

### 📚 Documentation & Monitoring
- Comprehensive Swagger/OpenAPI documentation
- Request/response logging
- Health monitoring
- API versioning support

## 🏗️ Architecture

```
src/
├── config/          # Configuration files
│   ├── index.ts     # Main configuration
│   ├── database.ts  # Database connection
│   └── swagger.ts   # API documentation
├── controllers/     # Request handlers
├── services/        # Business logic
├── middlewares/     # Express middlewares
├── routes/          # API routes
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
└── server.ts        # Application entry point
```

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Security**: bcrypt, helmet, cors, rate-limiting
- **Documentation**: Swagger/OpenAPI
- **Logging**: Morgan
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js (v18.0.0 or higher)
- PostgreSQL (v13.0 or higher)
- npm or yarn

## ⚡ Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd mini-ecommerce-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment setup
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mini_ecommerce_db"

# JWT Secrets (Generate strong secrets!)
JWT_ACCESS_SECRET="your_super_secret_access_key_min_32_chars"
JWT_REFRESH_SECRET="your_super_secret_refresh_key_min_32_chars"

# Server Configuration
PORT=3000
NODE_ENV=development

# Other configurations...
```

### 4. Database setup
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with sample data
npm run db:seed
```

### 5. Start the application
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

The API will be available at `http://localhost:3000`

## 📖 API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs.json

## 🔗 API Endpoints

### Authentication
```
POST   /api/auth/register     # Register new user
POST   /api/auth/login        # Login user  
POST   /api/auth/refresh      # Refresh access token
POST   /api/auth/logout       # Logout user
POST   /api/auth/logout-all   # Logout from all devices
GET    /api/auth/profile      # Get user profile
PUT    /api/auth/profile      # Update profile
PUT    /api/auth/change-password # Change password
```

### Products
```
GET    /api/products          # Get all products (with pagination & filters)
GET    /api/products/:id      # Get product by ID
POST   /api/products          # Create product (Admin only)
PUT    /api/products/:id      # Update product (Admin only)
DELETE /api/products/:id      # Delete product (Admin only)
PATCH  /api/products/:id/restore # Restore deleted product (Admin only)
GET    /api/products/low-stock    # Get low stock products (Admin only)
GET    /api/products/statistics   # Get product statistics (Admin only)
```

### Shopping Cart
```
GET    /api/cart              # Get user's cart
POST   /api/cart/add          # Add item to cart
POST   /api/cart/remove       # Remove item from cart
PUT    /api/cart/item/:productId # Update item quantity
DELETE /api/cart/clear        # Clear cart
GET    /api/cart/count        # Get cart item count
GET    /api/cart/summary      # Get cart summary
GET    /api/cart/validate     # Validate cart for checkout
```

### Orders
```
POST   /api/orders            # Create new order
GET    /api/orders            # Get orders (user's own or all for admin)
GET    /api/orders/:id        # Get order by ID
PUT    /api/orders/:id/status # Update order status (Admin only)
PATCH  /api/orders/:id/cancel # Cancel order
GET    /api/orders/statistics # Get order statistics (Admin only)
GET    /api/orders/recent     # Get recent orders (Admin only)
GET    /api/orders/revenue    # Get revenue analytics (Admin only)
```

### Health & Monitoring
```
GET    /api/health            # Health check endpoint
GET    /                      # API information
```

## 🔑 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-access-token>
```

### Sample Authentication Flow

1. **Register/Login** to get tokens:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "Customer123!"
  }'
```

2. **Use the access token** for protected endpoints:
```bash
curl -X GET http://localhost:3000/api/cart \
  -H "Authorization: Bearer <your-access-token>"
```

## 👥 User Roles

### CUSTOMER
- Browse products
- Manage shopping cart
- Place and track orders
- Cancel pending orders (with limits)
- Manage profile

### ADMIN
- All customer permissions
- Manage products (CRUD operations)
- View all orders and analytics
- Update order statuses
- Access admin-only statistics and reports

## 📊 Sample Data

The database comes pre-seeded with:
- **Admin user**: `admin@example.com` / `Admin123!`
- **Customer user**: `customer@example.com` / `Customer123!`
- **12 sample products** with varying stock levels
- **Sample cart items** for the customer
- **Sample order** for testing

## 🗄️ Database Schema

### Users
- `id`, `email`, `name`, `password`, `role`, `isActive`, `cancellationCount`

### Products  
- `id`, `name`, `description`, `price`, `stock`, `isActive`

### Cart & CartItems
- Cart: `id`, `userId`
- CartItem: `id`, `cartId`, `productId`, `quantity`

### Orders & OrderItems
- Order: `id`, `userId`, `status`, `totalAmount`
- OrderItem: `id`, `orderId`, `productId`, `quantity`, `price`

### RefreshTokens
- `id`, `token`, `userId`, `expiresAt`

## 🔒 Security Features

### Rate Limiting
- **Authentication**: 5 requests / 15 minutes
- **Orders**: 10 requests / 5 minutes  
- **Cart**: 30 requests / minute
- **Admin operations**: 50 requests / minute
- **General**: 100 requests / 15 minutes

### Data Protection
- Password hashing with bcrypt (12 rounds)
- JWT token expiration (15m access, 7d refresh)
- SQL injection prevention with Prisma
- Input validation with Zod schemas
- XSS protection with security headers

### Business Rules
- Stock cannot go negative
- Order cancellation limits (5 per user)
- Atomic transactions for order processing
- Cart validation before checkout

## 📸 API Documentation (Swagger UI)

The API features comprehensive interactive documentation powered by Swagger UI. Access it at:

```
http://localhost:3000/api-docs
```

**Visual Preview:**

![Swagger API Documentation](screencapture-localhost-3000-api-docs-2026-02-09-21_06_37.png)

The Swagger UI provides:
- Interactive API testing interface
- Complete endpoint documentation with request/response schemas
- Built-in authentication support
- Real-time API exploration


### Using Sample Data
```bash
# Login as customer
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@example.com", "password": "Customer123!"}'

# Login as admin  
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Admin123!"}'

# Get products
curl http://localhost:3000/api/products

# Add to cart (customer)
curl -X POST http://localhost:3000/api/cart/add \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"productId": "<product-id>", "quantity": 2}'

# Create order (customer)
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod": "credit_card"}'
```
<!-- 
## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@prod-db:5432/ecommerce"
JWT_ACCESS_SECRET="production-access-secret-min-32-chars"
JWT_REFRESH_SECRET="production-refresh-secret-min-32-chars"
CORS_ORIGIN="https://yourdomain.com"
ENABLE_SWAGGER=false
```

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Database Migrations
```bash
# Production migration
npm run db:migrate
```

## 🔧 Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database (DEV ONLY) -->