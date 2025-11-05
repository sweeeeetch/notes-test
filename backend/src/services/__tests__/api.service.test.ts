import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ServiceBroker } from 'moleculer';
import { DataSource } from 'typeorm';
import { ObjectId } from 'mongodb';
import AuthService from '../auth.service';
import NotesService from '../notes.service';
import {
  connectTestDB,
  closeTestDB,
  resetDatabase,
  createTestUser,
  createTestNote,
  generateTestToken,
} from './utils/test-helpers';

describe('Интеграционные тесты API', () => {
  let broker: ServiceBroker;
  let db: DataSource;

  beforeAll(async () => {
    // Initialize test database
    db = await connectTestDB();

    // Create broker with services (skip API gateway for unit tests)
    broker = new ServiceBroker({ logger: false });

    const authService = new AuthService(broker);
    const notesService = new NotesService(broker);

    broker.createService(authService.schema);
    broker.createService(notesService.schema);

    await broker.start();
  });

  afterAll(async () => {
    if (broker) {
      await broker.stop();
    }
    await closeTestDB();
  });

  beforeEach(async () => {
    // Reset database before each test
    await resetDatabase(db);
  });

  describe('POST /api/auth/register и /api/auth/login флоу', () => {
    it('должен зарегистрировать нового пользователя и вернуть токен', async () => {
      const result: any = await broker.call('auth.register', {
        email: 'newuser@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user).toHaveProperty('id');

      // Verify user exists in database
      const { User } = await import('../../entities/User');
      const userRepository = db.getMongoRepository(User);
      const user = await userRepository.findOne({
        where: { email: 'newuser@example.com' },
      });
      expect(user).toBeTruthy();
    });

    it('должен войти с зарегистрированными данными', async () => {
      // Register user first
      await broker.call('auth.register', {
        email: 'user@example.com',
        password: 'password123',
      });

      // Login with same credentials
      const result: any = await broker.call('auth.login', {
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('user@example.com');
    });

    it('должен вернуть ошибку 401 для невалидных данных входа', async () => {
      await expect(
        broker.call('auth.login', {
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Неверный email или пароль');
    });
  });

  describe('GET /api/notes с аутентификацией', () => {
    it('должен вернуть заметки для аутентифицированного пользователя', async () => {
      // Create test user and notes
      const user = await createTestUser(db, 'user@example.com');
      await createTestNote(db, user._id.toString(), {
        title: 'Note 1',
        content: 'Content 1',
      });
      await createTestNote(db, user._id.toString(), {
        title: 'Note 2',
        content: 'Content 2',
      });

      // Call notes.list with userId in meta
      const result: any = await broker.call(
        'notes.list',
        {},
        { meta: { user: { userId: user.id } } }
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('content');
    });

    it('должен вернуть ошибку 401 когда нет аутентификации', async () => {
      await expect(broker.call('notes.list', {}, { meta: {} })).rejects.toThrow(
        'Требуется авторизация'
      );
    });

    it('должен вернуть только заметки принадлежащие аутентифицированному пользователю', async () => {
      // Create two users with notes
      const user1 = await createTestUser(db, 'user1@example.com');
      const user2 = await createTestUser(db, 'user2@example.com');

      await createTestNote(db, user1._id.toString(), { title: 'User1 Note' });
      await createTestNote(db, user2._id.toString(), { title: 'User2 Note' });

      // Get notes for user1
      const result: any = await broker.call(
        'notes.list',
        {},
        { meta: { user: { userId: user1._id.toString() } } }
      );

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('User1 Note');
      expect(result[0].userId).toBe(user1._id.toString());
    });

    it('должен фильтровать заметки по категории', async () => {
      const user = await createTestUser(db);
      await createTestNote(db, user._id.toString(), {
        title: 'Work Note',
        category: 'work',
      });
      await createTestNote(db, user._id.toString(), {
        title: 'Personal Note',
        category: 'personal',
      });

      const result: any = await broker.call(
        'notes.list',
        { category: 'work' },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Work Note');
      expect(result[0].category).toBe('work');
    });

    it('должен искать заметки по заголовку и содержимому', async () => {
      const user = await createTestUser(db);
      await createTestNote(db, user._id.toString(), {
        title: 'Important Meeting',
        content: 'Discuss project timeline',
      });
      await createTestNote(db, user._id.toString(), {
        title: 'Shopping List',
        content: 'Buy groceries',
      });

      const result: any = await broker.call(
        'notes.list',
        { search: 'meeting' },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Important Meeting');
    });
  });

  describe('POST /api/notes с валидными и невалидными данными', () => {
    it('должен создать заметку с валидными данными', async () => {
      const user = await createTestUser(db);

      const result: any = await broker.call(
        'notes.create',
        {
          title: 'New Note',
          content: 'This is a new note',
          category: 'work',
        },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result).toHaveProperty('id');
      expect(result.title).toBe('New Note');
      expect(result.content).toBe('This is a new note');
      expect(result.category).toBe('work');
      expect(result.userId).toBe(user._id.toString());

      // Verify note exists in database
      const { Note } = await import('../../entities/Note');
      const noteRepository = db.getMongoRepository(Note);
      const note = await noteRepository.findOne({ where: { _id: new ObjectId(result.id) } });
      expect(note).toBeTruthy();
    });

    it('должен вернуть ошибку 400 для пустого заголовка', async () => {
      const user = await createTestUser(db);

      await expect(
        broker.call(
          'notes.create',
          {
            title: '',
            content: 'Content',
          },
          { meta: { user: { userId: user._id.toString() } } }
        )
      ).rejects.toThrow();
    });

    it('должен вернуть ошибку 400 для заголовка превышающего 200 символов', async () => {
      const user = await createTestUser(db);
      const longTitle = 'a'.repeat(201);

      await expect(
        broker.call(
          'notes.create',
          {
            title: longTitle,
            content: 'Content',
          },
          { meta: { user: { userId: user._id.toString() } } }
        )
      ).rejects.toThrow();
    });

    it('должен вернуть ошибку 400 для содержимого превышающего 10000 символов', async () => {
      const user = await createTestUser(db);
      const longContent = 'a'.repeat(10001);

      await expect(
        broker.call(
          'notes.create',
          {
            title: 'Title',
            content: longContent,
          },
          { meta: { user: { userId: user._id.toString() } } }
        )
      ).rejects.toThrow();
    });

    it('should return 401 error when not authenticated', async () => {
      await expect(
        broker.call(
          'notes.create',
          {
            title: 'Title',
            content: 'Content',
          },
          { meta: {} }
        )
      ).rejects.toThrow('Требуется аутентификация');
    });
  });

  describe('PATCH /api/notes/:id с авторизацией', () => {
    it('должен обновить заметку с валидными данными', async () => {
      const user = await createTestUser(db);
      const note = await createTestNote(db, user._id.toString(), {
        title: 'Original Title',
        content: 'Original Content',
      });

      const result: any = await broker.call(
        'notes.update',
        {
          id: note._id.toString(),
          title: 'Updated Title',
          content: 'Updated Content',
        },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result.id).toBe(note._id.toString());
      expect(result.title).toBe('Updated Title');
      expect(result.content).toBe('Updated Content');

      // Verify update in database
      const { Note } = await import('../../entities/Note');
      const noteRepository = db.getMongoRepository(Note);
      const updatedNote = await noteRepository.findOne({ where: { _id: note._id } });
      expect(updatedNote?.title).toBe('Updated Title');
    });

    it('должен вернуть ошибку 403 при обновлении чужой заметки', async () => {
      const user1 = await createTestUser(db, 'user1@example.com');
      const user2 = await createTestUser(db, 'user2@example.com');
      const note = await createTestNote(db, user1._id.toString());

      await expect(
        broker.call(
          'notes.update',
          {
            id: note._id.toString(),
            title: 'Hacked Title',
          },
          { meta: { user: { userId: user2._id.toString() } } }
        )
      ).rejects.toThrow('У вас нет прав на изменение этой заметки');
    });

    it('should return 404 error when note does not exist', async () => {
      const user = await createTestUser(db);
      const fakeId = new ObjectId().toString();

      await expect(
        broker.call(
          'notes.update',
          {
            id: fakeId,
            title: 'Updated Title',
          },
          { meta: { user: { userId: user._id.toString() } } }
        )
      ).rejects.toThrow('Заметка не найдена');
    });

    it('should return 401 error when not authenticated', async () => {
      const fakeId = new ObjectId().toString();

      await expect(
        broker.call(
          'notes.update',
          {
            id: fakeId,
            title: 'Updated Title',
          },
          { meta: {} }
        )
      ).rejects.toThrow('Требуется аутентификация');
    });
  });

  describe('DELETE /api/notes/:id с авторизацией', () => {
    it('должен успешно удалить заметку', async () => {
      const user = await createTestUser(db);
      const note = await createTestNote(db, user._id.toString());

      const result: any = await broker.call(
        'notes.delete',
        { id: note._id.toString() },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result.success).toBe(true);

      // Verify note is deleted from database
      const { Note } = await import('../../entities/Note');
      const noteRepository = db.getMongoRepository(Note);
      const deletedNote = await noteRepository.findOne({ where: { _id: note._id } });
      expect(deletedNote).toBeNull();
    });

    it('должен вернуть ошибку 403 при удалении чужой заметки', async () => {
      const user1 = await createTestUser(db, 'user1@example.com');
      const user2 = await createTestUser(db, 'user2@example.com');
      const note = await createTestNote(db, user1._id.toString());

      await expect(
        broker.call(
          'notes.delete',
          { id: note._id.toString() },
          { meta: { user: { userId: user2._id.toString() } } }
        )
      ).rejects.toThrow('У вас нет прав на удаление этой заметки');
    });

    it('should return 404 error when note does not exist', async () => {
      const user = await createTestUser(db);
      const fakeId = new ObjectId().toString();

      await expect(
        broker.call(
          'notes.delete',
          { id: fakeId },
          { meta: { user: { userId: user._id.toString() } } }
        )
      ).rejects.toThrow('Заметка не найдена');
    });

    it('should return 401 error when not authenticated', async () => {
      const fakeId = new ObjectId().toString();

      await expect(broker.call('notes.delete', { id: fakeId }, { meta: {} })).rejects.toThrow(
        'Требуется аутентификация'
      );
    });
  });

  describe('Ответы с ошибками (401, 403, 404, 400)', () => {
    it('должен вернуть 400 для ошибок валидации', async () => {
      const user = await createTestUser(db);

      await expect(
        broker.call(
          'notes.create',
          {
            title: '',
            content: 'Content',
          },
          { meta: { user: { userId: user._id.toString() } } }
        )
      ).rejects.toThrow();
    });

    it('должен вернуть 401 для отсутствующей аутентификации', async () => {
      await expect(broker.call('notes.list', {}, { meta: {} })).rejects.toThrow(
        'Требуется авторизация'
      );
    });

    it('должен вернуть 403 для неавторизованного доступа', async () => {
      const user1 = await createTestUser(db, 'user1@example.com');
      const user2 = await createTestUser(db, 'user2@example.com');
      const note = await createTestNote(db, user1._id.toString());

      await expect(
        broker.call(
          'notes.get',
          { id: note._id.toString() },
          { meta: { user: { userId: user2._id.toString() } } }
        )
      ).rejects.toThrow('У вас нет доступа к этой заметке');
    });

    it('должен вернуть 404 для несуществующих ресурсов', async () => {
      const user = await createTestUser(db);
      const fakeId = new ObjectId().toString();

      await expect(
        broker.call(
          'notes.get',
          { id: fakeId },
          { meta: { user: { userId: user._id.toString() } } }
        )
      ).rejects.toThrow('Заметка не найдена');
    });
  });
});
