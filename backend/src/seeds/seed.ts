import 'reflect-metadata';
import { connectDB, closeDB } from '../db';
import { User } from '../entities/User';
import { Note } from '../entities/Note';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const sampleNotes = [
  {
    title: 'Заметки со встречи',
    content: 'Обсудили новые функции на Q1. Нужно приоритизировать аутентификацию и улучшения API.',
    category: 'Работа',
  },
  {
    title: 'Список покупок',
    content: 'Молоко, яйца, хлеб, кофе, фрукты, овощи, курица',
    category: 'Личное',
  },
  {
    title: 'Идея приложения: Менеджер задач',
    content: 'Сделать простой менеджер задач с drag-and-drop. Использовать React и TypeScript.',
    category: 'Идеи',
  },
  {
    title: 'Изучить MongoDB',
    content: 'Почитать документацию MongoDB, попрактиковать агрегации и индексы',
    category: 'Задачи',
  },
  {
    title: 'Планирование отпуска',
    content: 'Поискать направления для летнего отпуска. Рассмотреть Италию или Грецию.',
    category: 'Личное',
  },
  {
    title: 'Фидбек по код ревью',
    content: 'Не забывать проверять обработку ошибок и добавлять юнит-тесты для новых фич',
    category: 'Работа',
  },
  {
    title: 'Рекомендации книг',
    content: 'Чистый код от Роберта Мартина, Паттерны проектирования от Gang of Four',
    category: 'Личное',
  },
  {
    title: 'Фича: Темная тема',
    content: 'Реализовать переключатель темной темы с сохранением в localStorage',
    category: 'Идеи',
  },
  {
    title: 'Пофиксить баг в логине',
    content: 'Пользователи жалуются на таймауты при входе. Проверить настройки JWT.',
    category: 'Задачи',
  },
  {
    title: 'Оптимизация базы данных',
    content: 'Добавить индексы на часто запрашиваемые колонки. Рассмотреть кеширование запросов.',
    category: 'Работа',
  },
  {
    title: 'План тренировок',
    content: 'Пн: Грудь, Вт: Спина, Ср: Ноги, Чт: Плечи, Пт: Руки',
    category: 'Личное',
  },
  {
    title: 'Паттерны проектирования API',
    content: 'Изучить best practices REST, сравнение GraphQL vs REST',
    category: 'Идеи',
  },
  {
    title: 'Обновить зависимости',
    content: 'Проверить устаревшие npm пакеты и обновить до последних стабильных версий',
    category: 'Задачи',
  },
  {
    title: 'Заметки со старого проекта',
    content: 'Заметки с предыдущего проекта, могут пригодиться для справки',
    category: 'Архив',
  },
  {
    title: 'Ретроспектива команды',
    content: 'Что прошло хорошо: Хорошая коммуникация. Что улучшить: Лучше документировать.',
    category: 'Работа',
  },
];

async function seed() {
  try {
    console.log('Подключение к MongoDB...');
    const dataSource = await connectDB();

    console.log('Запуск процесса заполнения...');

    const userRepository = dataSource.getMongoRepository(User);
    const noteRepository = dataSource.getMongoRepository(Note);

    const existingUser = await userRepository.findOne({
      where: { email: 'test@example.com' },
    });

    if (existingUser) {
      console.log('Тестовые данные уже существуют. Пропускаем...');
      await closeDB();
      return;
    }

    console.log('Создание тестовых пользователей...');
    const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);

    const user1 = userRepository.create({
      email: 'test@example.com',
      password: hashedPassword,
    });

    const user2 = userRepository.create({
      email: 'demo@example.com',
      password: hashedPassword,
    });

    await userRepository.save([user1, user2]);
    console.log('Тестовые пользователи созданы');

    console.log('Создание примеров заметок...');
    const notes = sampleNotes.map(noteData =>
      noteRepository.create({
        ...noteData,
        userId: user1._id.toString(),
      })
    );

    await noteRepository.save(notes);
    console.log(`Создано ${notes.length} заметок`);

    console.log('Заполнение завершено!');
    console.log('\nТестовые учетные данные:');
    console.log('Email: test@example.com');
    console.log('Пароль: password123');
    console.log('\nEmail: demo@example.com');
    console.log('Пароль: password123');

    await closeDB();
  } catch (error) {
    console.error('Ошибка при заполнении:', error);
    process.exit(1);
  }
}

seed();
