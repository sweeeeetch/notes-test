import { Service, ServiceBroker, Context } from 'moleculer';
import { ObjectId } from 'mongodb';
import { getDB } from '../db';
import { User } from '../entities/User';
import { hashPassword, comparePassword } from '../utils/password.util';
import { signToken, verifyToken } from '../utils/jwt.util';
import { ValidationError, UnauthorizedError, NotFoundError } from '../utils/errors';

interface RegisterParams {
  email: string;
  password: string;
}

interface LoginParams {
  email: string;
  password: string;
}

interface VerifyParams {
  token: string;
}

interface AuthMeta {
  user: { userId?: string; email?: string };
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

interface UserInfo {
  id: string;
  email: string;
  createdAt: Date;
}

interface VerifyResponse {
  valid: boolean;
  userId?: string;
  email?: string;
}

export default class AuthService extends Service {
  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: 'auth',

      actions: {
        register: {
          params: {
            email: { type: 'email' },
            password: { type: 'string', min: 6 },
          },
          async handler(ctx: Context<RegisterParams>): Promise<AuthResponse> {
            const { email, password } = ctx.params;
            const dataSource = getDB();
            const userRepository = dataSource.getMongoRepository(User);

            const existingUser = await userRepository.findOne({ where: { email } });

            if (existingUser) {
              throw new ValidationError('Email уже зарегистрирован');
            }

            const hashedPassword = await hashPassword(password);

            const user = userRepository.create({
              email,
              password: hashedPassword,
            });

            await userRepository.save(user);

            const userId = user.id;
            const token = signToken({ userId, email });

            return {
              token,
              user: {
                id: userId,
                email: user.email,
              },
            };
          },
        },

        login: {
          params: {
            email: { type: 'email' },
            password: { type: 'string', min: 1 },
          },
          async handler(ctx: Context<LoginParams>): Promise<AuthResponse> {
            const { email, password } = ctx.params;
            const dataSource = getDB();
            const userRepository = dataSource.getMongoRepository(User);

            const user = await userRepository.findOne({ where: { email } });

            if (!user) {
              throw new UnauthorizedError('Неверный email или пароль');
            }

            const isPasswordValid = await comparePassword(password, user.password);

            if (!isPasswordValid) {
              throw new UnauthorizedError('Неверный email или пароль');
            }

            const userId = user.id;
            const token = signToken({ userId, email: user.email });

            return {
              token,
              user: {
                id: userId,
                email: user.email,
              },
            };
          },
        },

        verify: {
          params: {
            token: { type: 'string' },
          },
          async handler(ctx: Context<VerifyParams>): Promise<VerifyResponse> {
            const { token } = ctx.params;

            try {
              const decoded = verifyToken(token);
              return {
                valid: true,
                userId: decoded.userId,
                email: decoded.email,
              };
            } catch (error) {
              return {
                valid: false,
              };
            }
          },
        },

        me: {
          async handler(ctx: Context<{}, AuthMeta>): Promise<UserInfo> {
            if (!ctx.meta.user || !ctx.meta.user.userId) {
              throw new UnauthorizedError('Требуется аутентификация');
            }

            const { userId } = ctx.meta.user;

            const dataSource = getDB();
            const userRepository = dataSource.getMongoRepository(User);

            const user = await userRepository.findOne({
              where: { _id: new ObjectId(userId) },
            });

            if (!user) {
              throw new NotFoundError('Пользователь не найден');
            }

            return {
              id: user.id,
              email: user.email,
              createdAt: user.createdAt,
            };
          },
        },
      },

      started() {
        this.logger.info('Auth service started');
      },
    });
  }
}
