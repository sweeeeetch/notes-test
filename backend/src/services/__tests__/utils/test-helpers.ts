import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ServiceBroker } from 'moleculer';
import { User } from '../../../entities/User';
import { Note } from '../../../entities/Note';
import { hashPassword } from '../../../utils/password.util';
import { signToken } from '../../../utils/jwt.util';
import { setDB, resetDBInstance } from '../../../db';
import { ObjectId } from 'mongodb';

const TEST_MONGODB_URI =
  process.env.TEST_MONGODB_URI ||
  'mongodb://localhost:27017/notes_service_test?authSource=admin&directConnection=true';

let testDataSource: DataSource | null = null;

export async function connectTestDB(): Promise<DataSource> {
  if (testDataSource && testDataSource.isInitialized) {
    return testDataSource;
  }

  testDataSource = new DataSource({
    type: 'mongodb',
    url: TEST_MONGODB_URI,
    database: 'notes_service_test',
    synchronize: false,
    logging: false,
    entities: [User, Note],
  });

  await testDataSource.initialize();

  try {
    const mongoDriver = testDataSource.driver as any;
    const db = mongoDriver.queryRunner?.databaseConnection?.db;
    if (db) {
      await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
      await db.collection('notes').createIndex({ userId: 1 });
    }
  } catch (error: any) {
    if (!error.message?.includes('already exists')) {
      console.error('Error creating indexes:', error);
    }
  }

  setDB(testDataSource);

  return testDataSource;
}

export async function closeTestDB(): Promise<void> {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
    testDataSource = null;
    resetDBInstance();
  }
}

export function getTestDB(): DataSource {
  if (!testDataSource || !testDataSource.isInitialized) {
    throw new Error('Тестовая база данных не инициализирована. Сначала вызовите connectTestDB().');
  }
  return testDataSource;
}

export async function resetDatabase(dataSource: DataSource): Promise<void> {
  try {
    const userRepository = dataSource.getMongoRepository(User);
    const noteRepository = dataSource.getMongoRepository(Note);

    await noteRepository.deleteMany({});
    await userRepository.deleteMany({});
  } catch (error) {
    console.error('Ошибка сброса базы данных:', error);
  }
}

export function generateTestToken(userId: string, email: string): string {
  return signToken({ userId, email });
}

export async function createTestUser(
  dataSource: DataSource,
  email: string = 'test@example.com',
  password: string = 'password123'
): Promise<User> {
  const hashedPassword = await hashPassword(password);
  const userRepository = dataSource.getMongoRepository(User);

  const user = userRepository.create({
    email,
    password: hashedPassword,
  });

  await userRepository.save(user);
  return user;
}

export async function createTestNote(
  dataSource: DataSource,
  userId: string,
  data: Partial<Note> = {}
): Promise<Note> {
  const noteRepository = dataSource.getMongoRepository(Note);

  const note = noteRepository.create({
    title: data.title || 'Тестовая заметка',
    content: data.content || 'Тестовое содержимое',
    category: data.category || null,
    userId,
  });

  await noteRepository.save(note);
  return note;
}

export async function seedTestData(dataSource: DataSource): Promise<{
  users: User[];
  notes: Note[];
}> {
  const user1 = await createTestUser(dataSource, 'user1@example.com', 'password123');
  const user2 = await createTestUser(dataSource, 'user2@example.com', 'password123');

  const note1 = await createTestNote(dataSource, user1._id.toString(), {
    title: 'Первая заметка',
    content: 'Это первая заметка',
    category: 'работа',
  });

  const note2 = await createTestNote(dataSource, user1._id.toString(), {
    title: 'Вторая заметка',
    content: 'Это вторая заметка',
    category: 'личное',
  });

  const note3 = await createTestNote(dataSource, user1._id.toString(), {
    title: 'Третья заметка',
    content: 'Это третья заметка',
    category: 'работа',
  });

  const note4 = await createTestNote(dataSource, user2._id.toString(), {
    title: 'Заметка пользователя 2',
    content: 'Это принадлежит пользователю 2',
    category: 'личное',
  });

  return {
    users: [user1, user2],
    notes: [note1, note2, note3, note4],
  };
}

export async function createTestBroker(services: any[]): Promise<ServiceBroker> {
  const broker = new ServiceBroker({ logger: false });

  for (const service of services) {
    broker.createService(service.schema);
  }

  await broker.start();
  return broker;
}
