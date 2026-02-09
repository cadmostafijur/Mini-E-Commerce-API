import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create customer user
  const customerPassword = await bcrypt.hash('Customer123!', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'John Customer',
      password: customerPassword,
      role: 'CUSTOMER',
      cart: {
        create: {}, // Create cart for customer
      },
    },
  });

  console.log('👤 Users created:', { admin: admin.email, customer: customer.email });

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { name: 'Wireless Bluetooth Headphones' },
      update: {},
      create: {
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with active noise cancellation and 30-hour battery life.',
        price: 129.99,
        stock: 50,
      },
    }),
    prisma.product.upsert({
      where: { name: 'Smartphone Case' },
      update: {},
      create: {
        name: 'Smartphone Case',
        description: 'Durable protective case for smartphones with shock-resistant design.',
        price: 24.99,
        stock: 100,
      },
    }),
    prisma.product.upsert({
      where: { name: 'USB-C Cable' },
      update: {},
      create: {
        name: 'USB-C Cable',
        description: 'Fast charging USB-C cable with data transfer support.',
        price: 19.99,
        stock: 75,
      },
    }),
    prisma.product.upsert({
      where: { name: 'Wireless Mouse' },
      update: {},
      create: {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with precision tracking and rechargeable battery.',
        price: 49.99,
        stock: 30,
      },
    }),
    prisma.product.upsert({
      where: { name: 'Bluetooth Speaker' },
      update: {},
      create: {
        name: 'Bluetooth Speaker',
        description: 'Portable Bluetooth speaker with 360-degree sound and waterproof design.',
        price: 79.99,
        stock: 25,
      },
    }),
    prisma.product.upsert({
      where: { name: 'Laptop Stand' },
      update: {},
      create: {
        name: 'Laptop Stand',
        description: 'Adjustable laptop stand for better ergonomics and cooling.',
        price: 39.99,
        stock: 40,
      },
    }),
    prisma.product.upsert({
      where: { name: 'Gaming Keyboard' },
      update: {},
      create: {
        name: 'Gaming Keyboard',
        description: 'Mechanical gaming keyboard with RGB backlighting and programmable keys.',
        price: 149.99,
        stock: 20,
      },
    }),
    prisma.product.upsert({
      where: { name: 'Webcam HD' },
      update: {},
      create: {
        name: 'Webcam HD',
        description: '1080p HD webcam with auto-focus and built-in microphone.',
        price: 59.99,
        stock: 35,
      },
    }),
    prisma.product.upsert({
      where: { name: 'Power Bank' },
      update: {},
      create: {
        name: 'Power Bank',
        description: '20000mAh portable power bank with fast charging and multiple ports.',
        price: 34.99,
        stock: 60,
      },
    }),
    prisma.product.upsert({
      where: { name: 'Monitor Stand' },
      update: {},
      create: {
        name: 'Monitor Stand',
        description: 'Adjustable monitor stand with storage drawer and cable management.',
        price: 89.99,
        stock: 15,
      },
    }),
    // Low stock products for testing
    prisma.product.upsert({
      where: { name: 'Limited Edition Smartwatch' },
      update: {},
      create: {
        name: 'Limited Edition Smartwatch',
        description: 'Premium smartwatch with health monitoring and GPS.',
        price: 299.99,
        stock: 5, // Low stock
      },
    }),
    prisma.product.upsert({
      where: { name: 'Vintage Camera' },
      update: {},
      create: {
        name: 'Vintage Camera',
        description: 'Classic film camera for photography enthusiasts.',
        price: 499.99,
        stock: 3, // Low stock
      },
    }),
  ]);

  console.log(`📦 Created ${products.length} products`);

  // Create some sample cart items for the customer
  const customerCart = await prisma.cart.findUnique({
    where: { userId: customer.id },
  });

  if (customerCart && products.length > 0) {
    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: customerCart.id,
          productId: products[0].id, // Wireless Headphones
        },
      },
      update: {},
      create: {
        cartId: customerCart.id,
        productId: products[0].id,
        quantity: 1,
      },
    });

    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: customerCart.id,
          productId: products[1].id, // Smartphone Case
        },
      },
      update: {},
      create: {
        cartId: customerCart.id,
        productId: products[1].id,
        quantity: 2,
      },
    });

    console.log('🛒 Added items to customer cart');
  }

  // Create a sample order
  const sampleOrder = await prisma.order.create({
    data: {
      userId: customer.id,
      status: 'DELIVERED',
      totalAmount: 174.98, // 129.99 + (24.99 * 2)
      items: {
        create: [
          {
            productId: products[0].id, // Wireless Headphones
            quantity: 1,
            price: products[0].price,
          },
          {
            productId: products[1].id, // Smartphone Case
            quantity: 2,
            price: products[1].price,
          },
        ],
      },
    },
  });

  console.log('📋 Created sample order:', sampleOrder.id);

  console.log('✅ Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Admin user: admin@example.com (password: Admin123!)`);
  console.log(`- Customer user: customer@example.com (password: Customer123!)`);
  console.log(`- Products created: ${products.length}`);
  console.log(`- Sample order created with ID: ${sampleOrder.id}`);
  console.log('\n🚀 You can now start the application and test the API endpoints!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });