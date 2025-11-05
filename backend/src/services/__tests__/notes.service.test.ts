import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ServiceBroker } from 'moleculer';
import { DataSource } from 'typeorm';
import { ObjectId } from 'mongodb';
import NotesService from '../notes.service';
import {
  connectTestDB,
  closeTestDB,
  resetDatabase,
  createTestUser,
  createTestNote,
} from './utils/test-helpers';

describe('Сервис заметок', () => {
  let broker: ServiceBroker;
  let notesService: NotesService;
  let db: DataSource;

  beforeAll(async () => {
    db = await connectTestDB();

    broker = new ServiceBroker({ logger: false });
    notesService = new NotesService(broker);
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
    await resetDatabase(db);
  });

  describe('notes.list', () => {
    it('должен вернуть список заметок для аутентифицированного пользователя', async () => {
      const user = await createTestUser(db);
      await createTestNote(db, user._id.toString(), { title: 'Заметка 1' });
      await createTestNote(db, user._id.toString(), { title: 'Заметка 2' });

      const result: any = await broker.call(
        'notes.list',
        {},
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('content');
    });

    it('должен вернуть пустой массив если у пользователя нет заметок', async () => {
      const user = await createTestUser(db);

      const result: any = await broker.call(
        'notes.list',
        {},
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result).toHaveLength(0);
    });

    it('должен фильтровать заметки по категории', async () => {
      const user = await createTestUser(db);
      await createTestNote(db, user._id.toString(), {
        title: 'Рабочая заметка',
        category: 'работа',
      });
      await createTestNote(db, user._id.toString(), {
        title: 'Личная заметка',
        category: 'личное',
      });

      const result: any = await broker.call(
        'notes.list',
        { category: 'работа' },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Рабочая заметка');
      expect(result[0].category).toBe('работа');
    });

    it('должен искать заметки по заголовку', async () => {
      const user = await createTestUser(db);
      await createTestNote(db, user._id.toString(), {
        title: 'Важная встреча',
        content: 'Обсудить проект',
      });
      await createTestNote(db, user._id.toString(), {
        title: 'Список покупок',
        content: 'Купить продукты',
      });

      const result: any = await broker.call(
        'notes.list',
        { search: 'встреча' },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Важная встреча');
    });

    it('должен искать заметки по содержимому', async () => {
      const user = await createTestUser(db);
      await createTestNote(db, user._id.toString(), {
        title: 'Заметка 1',
        content: 'Обсудить проект',
      });
      await createTestNote(db, user._id.toString(), {
        title: 'Заметка 2',
        content: 'Купить продукты',
      });

      const result: any = await broker.call(
        'notes.list',
        { search: 'проект' },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Обсудить проект');
    });

    it('должен вернуть только заметки текущего пользователя', async () => {
      const user1 = await createTestUser(db, 'user1@example.com');
      const user2 = await createTestUser(db, 'user2@example.com');

      await createTestNote(db, user1._id.toString(), { title: 'Заметка пользователя 1' });
      await createTestNote(db, user2._id.toString(), { title: 'Заметка пользователя 2' });

      const result: any = await broker.call(
        'notes.list',
        {},
        { meta: { user: { userId: user1._id.toString() } } }
      );

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Заметка пользователя 1');
    });

    it('должен выбросить ошибку если пользователь не аутентифицирован', async () => {
      await expect(broker.call('notes.list', {}, { meta: {} })).rejects.toThrow(
        'Требуется авторизация'
      );
    });
  });

  describe('notes.get', () => {
    it('должен вернуть заметку по id', async () => {
      const user = await createTestUser(db);
      const note = await createTestNote(db, user._id.toString(), {
        title: 'Тестовая заметка',
        content: 'Тестовое содержимое',
      });

      const result: any = await broker.call(
        'notes.get',
        { id: note._id.toString() },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result.id).toBe(note._id.toString());
      expect(result.title).toBe('Тестовая заметка');
      expect(result.content).toBe('Тестовое содержимое');
    });

    it('должен выбросить ошибку если заметка не найдена', async () => {
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

    it('должен выбросить ошибку если id невалиден', async () => {
      const user = await createTestUser(db);

      await expect(
        broker.call(
          'notes.get',
          { id: 'invalid-id' },
          { meta: { user: { userId: user._id.toString() } } }
        )
      ).rejects.toThrow('Заметка не найдена');
    });

    it('должен выбросить ошибку если пользователь пытается получить чужую заметку', async () => {
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

    it('должен выбросить ошибку если пользователь не аутентифицирован', async () => {
      const fakeId = new ObjectId().toString();

      await expect(broker.call('notes.get', { id: fakeId }, { meta: {} })).rejects.toThrow(
        'Требуется аутентификация'
      );
    });
  });

  describe('notes.create', () => {
    it('должен создать заметку с валидными данными', async () => {
      const user = await createTestUser(db);

      const result: any = await broker.call(
        'notes.create',
        {
          title: 'Новая заметка',
          content: 'Содержимое заметки',
          category: 'работа',
        },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Новая заметка');
      expect(result.content).toBe('Содержимое заметки');
      expect(result.category).toBe('работа');
      expect(result.userId).toBe(user._id.toString());
    });

    it('должен создать заметку без категории', async () => {
      const user = await createTestUser(db);

      const result: any = await broker.call(
        'notes.create',
        {
          title: 'Заметка без категории',
          content: 'Содержимое',
        },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result.category).toBeNull();
    });

    it('должен обрезать пробелы в заголовке', async () => {
      const user = await createTestUser(db);

      const result: any = await broker.call(
        'notes.create',
        {
          title: '  Заметка с пробелами  ',
          content: 'Содержимое',
        },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result.title).toBe('Заметка с пробелами');
    });

    it('должен выбросить ошибку для пустого заголовка', async () => {
      const user = await createTestUser(db);

      await expect(
        broker.call(
          'notes.create',
          {
            title: '',
            content: 'Содержимое',
          },
          { meta: { user: { userId: user._id.toString() } } }
        )
      ).rejects.toThrow();
    });

    it('должен выбросить ошибку для заголовка только из пробелов', async () => {
      const user = await createTestUser(db);

      await expect(
        broker.call(
          'notes.create',
          {
            title: '   ',
            content: 'Содержимое',
          },
          { meta: { user: { userId: user._id.toString() } } }
        )
      ).rejects.toThrow('Заголовок обязателен');
    });

    it('должен выбросить ошибку для слишком длинного заголовка', async () => {
      const user = await createTestUser(db);
      const longTitle = 'a'.repeat(201);

      await expect(
        broker.call(
          'notes.create',
          {
            title: longTitle,
            content: 'Содержимое',
          },
          { meta: { user: { userId: user._id.toString() } } }
        )
      ).rejects.toThrow();
    });

    it('должен выбросить ошибку для слишком длинного содержимого', async () => {
      const user = await createTestUser(db);
      const longContent = 'a'.repeat(10001);

      await expect(
        broker.call(
          'notes.create',
          {
            title: 'Заголовок',
            content: longContent,
          },
          { meta: { user: { userId: user._id.toString() } } }
        )
      ).rejects.toThrow();
    });

    it('должен выбросить ошибку для слишком длинной категории', async () => {
      const user = await createTestUser(db);
      const longCategory = 'a'.repeat(51);

      await expect(
        broker.call(
          'notes.create',
          {
            title: 'Заголовок',
            content: 'Содержимое',
            category: longCategory,
          },
          { meta: { user: { userId: user._id.toString() } } }
        )
      ).rejects.toThrow();
    });

    it('должен выбросить ошибку если пользователь не аутентифицирован', async () => {
      await expect(
        broker.call(
          'notes.create',
          {
            title: 'Заголовок',
            content: 'Содержимое',
          },
          { meta: {} }
        )
      ).rejects.toThrow('Требуется аутентификация');
    });
  });

  describe('notes.update', () => {
    it('должен обновить заголовок заметки', async () => {
      const user = await createTestUser(db);
      const note = await createTestNote(db, user._id.toString(), {
        title: 'Старый заголовок',
        content: 'Содержимое',
      });

      const result: any = await broker.call(
        'notes.update',
        {
          id: note._id.toString(),
          title: 'Новый заголовок',
        },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result.title).toBe('Новый заголовок');
      expect(result.content).toBe('Содержимое');
    });

    it('должен обновить содержимое заметки', async () => {
      const user = await createTestUser(db);
      const note = await createTestNote(db, user._id.toString(), {
        title: 'Заголовок',
        content: 'Старое содержимое',
      });

      const result: any = await broker.call(
        'notes.update',
        {
          id: note._id.toString(),
          content: 'Новое содержимое',
        },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result.title).toBe('Заголовок');
      expect(result.content).toBe('Новое содержимое');
    });

    it('должен обновить категорию заметки', async () => {
      const user = await createTestUser(db);
      const note = await createTestNote(db, user._id.toString(), {
        title: 'Заголовок',
        category: 'старая',
      });

      const result: any = await broker.call(
        'notes.update',
        {
          id: note._id.toString(),
          category: 'новая',
        },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result.category).toBe('новая');
    });

    it('должен обновить несколько полей одновременно', async () => {
      const user = await createTestUser(db);
      const note = await createTestNote(db, user._id.toString());

      const result: any = await broker.call(
        'notes.update',
        {
          id: note._id.toString(),
          title: 'Новый заголовок',
          content: 'Новое содержимое',
          category: 'новая категория',
        },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result.title).toBe('Новый заголовок');
      expect(result.content).toBe('Новое содержимое');
      expect(result.category).toBe('новая категория');
    });

    it('должен выбросить ошибку если заметка не найдена', async () => {
      const user = await createTestUser(db);
      const fakeId = new ObjectId().toString();

      await expect(
        broker.call(
          'notes.update',
          {
            id: fakeId,
            title: 'Новый заголовок',
          },
          { meta: { user: { userId: user._id.toString() } } }
        )
      ).rejects.toThrow('Заметка не найдена');
    });

    it('должен выбросить ошибку если пользователь пытается обновить чужую заметку', async () => {
      const user1 = await createTestUser(db, 'user1@example.com');
      const user2 = await createTestUser(db, 'user2@example.com');
      const note = await createTestNote(db, user1._id.toString());

      await expect(
        broker.call(
          'notes.update',
          {
            id: note._id.toString(),
            title: 'Взломанный заголовок',
          },
          { meta: { user: { userId: user2._id.toString() } } }
        )
      ).rejects.toThrow('У вас нет прав на изменение этой заметки');
    });

    it('должен выбросить ошибку для пустого заголовка', async () => {
      const user = await createTestUser(db);
      const note = await createTestNote(db, user._id.toString());

      await expect(
        broker.call(
          'notes.update',
          {
            id: note._id.toString(),
            title: '',
          },
          { meta: { user: { userId: user._id.toString() } } }
        )
      ).rejects.toThrow();
    });

    it('должен выбросить ошибку если пользователь не аутентифицирован', async () => {
      const fakeId = new ObjectId().toString();

      await expect(
        broker.call(
          'notes.update',
          {
            id: fakeId,
            title: 'Новый заголовок',
          },
          { meta: {} }
        )
      ).rejects.toThrow('Требуется аутентификация');
    });
  });

  describe('notes.delete', () => {
    it('должен удалить заметку', async () => {
      const user = await createTestUser(db);
      const note = await createTestNote(db, user._id.toString());

      const result: any = await broker.call(
        'notes.delete',
        { id: note._id.toString() },
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result.success).toBe(true);

      const { Note } = await import('../../entities/Note');
      const noteRepository = db.getMongoRepository(Note);
      const deletedNote = await noteRepository.findOne({ where: { _id: note._id } });
      expect(deletedNote).toBeNull();
    });

    it('должен выбросить ошибку если заметка не найдена', async () => {
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

    it('должен выбросить ошибку если пользователь пытается удалить чужую заметку', async () => {
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

    it('должен выбросить ошибку если пользователь не аутентифицирован', async () => {
      const fakeId = new ObjectId().toString();

      await expect(broker.call('notes.delete', { id: fakeId }, { meta: {} })).rejects.toThrow(
        'Требуется аутентификация'
      );
    });
  });

  describe('notes.categories', () => {
    it('должен вернуть список уникальных категорий пользователя', async () => {
      const user = await createTestUser(db);
      await createTestNote(db, user._id.toString(), { category: 'работа' });
      await createTestNote(db, user._id.toString(), { category: 'личное' });
      await createTestNote(db, user._id.toString(), { category: 'работа' });

      const result: any = await broker.call(
        'notes.categories',
        {},
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result).toHaveLength(2);
      expect(result).toContain('работа');
      expect(result).toContain('личное');
    });

    it('должен вернуть пустой массив если у пользователя нет заметок с категориями', async () => {
      const user = await createTestUser(db);
      await createTestNote(db, user._id.toString(), { category: null });

      const result: any = await broker.call(
        'notes.categories',
        {},
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result).toHaveLength(0);
    });

    it('должен вернуть только категории текущего пользователя', async () => {
      const user1 = await createTestUser(db, 'user1@example.com');
      const user2 = await createTestUser(db, 'user2@example.com');

      await createTestNote(db, user1._id.toString(), { category: 'работа' });
      await createTestNote(db, user2._id.toString(), { category: 'личное' });

      const result: any = await broker.call(
        'notes.categories',
        {},
        { meta: { user: { userId: user1._id.toString() } } }
      );

      expect(result).toHaveLength(1);
      expect(result).toContain('работа');
      expect(result).not.toContain('личное');
    });

    it('должен выбросить ошибку если пользователь не аутентифицирован', async () => {
      await expect(broker.call('notes.categories', {}, { meta: {} })).rejects.toThrow(
        'Требуется аутентификация'
      );
    });
  });
});
