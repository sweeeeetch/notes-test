import 'reflect-metadata';
import { ServiceBroker } from 'moleculer';
import * as dotenv from 'dotenv';
import brokerConfig from './moleculer.config';
import ApiService from './services/api.service';
import AuthService from './services/auth.service';
import NotesService from './services/notes.service';
import { connectDB, closeDB } from './db';

dotenv.config();

const broker = new ServiceBroker(brokerConfig);

broker.createService(ApiService);
broker.createService(AuthService);
broker.createService(NotesService);

async function startServer() {
  try {
    await connectDB();
    broker.logger.info('MongoDB connection established');

    await broker.start();
    broker.logger.info('Moleculer broker started successfully');
  } catch (error) {
    broker.logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function stopServer() {
  try {
    broker.logger.info('Shutting down gracefully...');

    await broker.stop();

    await closeDB();
    broker.logger.info('MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    broker.logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', stopServer);
process.on('SIGTERM', stopServer);

startServer();
