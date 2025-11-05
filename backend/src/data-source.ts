import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './entities/User';
import { Note } from './entities/Note';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mongodb',
  url:
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/notes_service?authSource=admin&directConnection=true',
  database: process.env.DB_NAME || 'notes_service',
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Note],
});
