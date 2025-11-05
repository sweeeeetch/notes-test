import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ServiceBroker } from 'moleculer';
import { DataSource } from 'typeorm';
import AuthService from '../auth.service';
import { hashPassword } from '../../utils/password.util';
import { verifyToken } from '../../utils/jwt.util';
import { connectTestDB, closeTestDB, resetDatabase, createTestUser } from './utils/test-helpers';

describe('Сервис аутентификации', () => {
  let broker: ServiceBroker;
  let authService: AuthService;
  let db: DataSource;

  beforeAll(async () => {
    db = await connectTestDB();

    broker = new ServiceBroker({ logger: false });
    authService = new AuthService(broker);
    broker.createService(authService.schema);

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

  describe('auth.register', () => {
    it('должен зарегистрировать нового пользователя с валидными данными', async () => {
      const result: any = await broker.call('auth.register', {
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user).toHaveProperty('id');

      const { User } = await import('../../entities/User');
      const userRepository = db.getMongoRepository(User);
      const user = await userRepository.findOne({
        where: { email: 'test@example.com' },
      });
      expect(user).toBeTruthy();
      expect(user?.password).not.toBe('password123');
    });

    it('должен вернуть валидный JWT токен при регистрации', async () => {
      const result: any = await broker.call('auth.register', {
        email: 'test@example.com',
        password: 'password123',
      });

      const decoded: any = verifyToken(result.token);
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.userId).toBe(result.user.id);
    });

    it('должен выбросить ошибку при регистрации с дублирующимся email', async () => {
      await broker.call('auth.register', {
        email: 'test@example.com',
        password: 'password123',
      });

      await expect(
        broker.call('auth.register', {
          email: 'test@example.com',
          password: 'different123',
        })
      ).rejects.toThrow('Email уже зарегистрирован');
    });

    it('должен выбросить ошибку валидации для невалидного email', async () => {
      await expect(
        broker.call('auth.register', {
          email: 'invalid-email',
          password: 'password123',
        })
      ).rejects.toThrow();
    });

    it('должен выбросить ошибку валидации для короткого пароля', async () => {
      await expect(
        broker.call('auth.register', {
          email: 'test@example.com',
          password: '12345',
        })
      ).rejects.toThrow();
    });
  });

  describe('auth.login', () => {
    beforeEach(async () => {
      await createTestUser(db, 'test@example.com', 'password123');
    });

    it('должен войти с валидными данными', async () => {
      const result: any = await broker.call('auth.login', {
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
    });

    it('должен вернуть валидный JWT токен при входе', async () => {
      const result: any = await broker.call('auth.login', {
        email: 'test@example.com',
        password: 'password123',
      });

      const decoded: any = verifyToken(result.token);
      expect(decoded.email).toBe('test@example.com');
      expect(decoded).toHaveProperty('userId');
    });

    it('должен выбросить ошибку с невалидным email', async () => {
      await expect(
        broker.call('auth.login', {
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Неверный email или пароль');
    });

    it('должен выбросить ошибку с невалидным паролем', async () => {
      await expect(
        broker.call('auth.login', {
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Неверный email или пароль');
    });
  });

  describe('auth.verify', () => {
    it('должен проверить валидный JWT токен', async () => {
      const registerResult: any = await broker.call('auth.register', {
        email: 'test@example.com',
        password: 'password123',
      });

      const result: any = await broker.call('auth.verify', {
        token: registerResult.token,
      });

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(registerResult.user.id);
      expect(result.email).toBe('test@example.com');
    });

    it('должен вернуть invalid для неправильного токена', async () => {
      const result: any = await broker.call('auth.verify', {
        token: 'invalid-token',
      });

      expect(result.valid).toBe(false);
      expect(result.userId).toBeUndefined();
    });

    it('должен вернуть invalid для истекшего токена', async () => {
      const result: any = await broker.call('auth.verify', {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('auth.me', () => {
    it('должен вернуть информацию о текущем пользователе с валидным userId в meta', async () => {
      const user = await createTestUser(db, 'test@example.com', 'password123');

      const result: any = await broker.call(
        'auth.me',
        {},
        { meta: { user: { userId: user._id.toString() } } }
      );

      expect(result.id).toBe(user._id.toString());
      expect(result.email).toBe('test@example.com');
      expect(result).toHaveProperty('createdAt');
    });

    it('должен выбросить ошибку когда userId нет в meta', async () => {
      await expect(broker.call('auth.me', {}, { meta: {} })).rejects.toThrow(
        'Требуется аутентификация'
      );
    });

    it('должен выбросить ошибку когда пользователь не существует', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await expect(
        broker.call('auth.me', {}, { meta: { user: { userId: fakeId } } })
      ).rejects.toThrow('Пользователь не найден');
    });
  });
});
