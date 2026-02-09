import { app } from './app';
import { config } from '@/config';
import { prisma } from '@/config/database';

const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('📦 Database connected successfully');

    // Start the server
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      
      if (config.enableSwagger) {
        console.log(` API Documentation: http://localhost:${config.port}/api-docs`);
      }
      
      console.log(`API Base URL: http://localhost:${config.port}/api`);
      console.log(`Health Check: http://localhost:${config.port}/api/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('🛑 HTTP server closed');
        
        // Close database connection
        await prisma.$disconnect();
        console.log('📦 Database connection closed');
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        console.error('❌ Forceful shutdown after 30 seconds');
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();