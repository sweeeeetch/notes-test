import { Service, ServiceBroker, Context } from 'moleculer';
import ApiGateway from 'moleculer-web';
import { IncomingMessage, ServerResponse } from 'http';
import { verifyToken } from '../utils/jwt.util';

interface AuthMeta {
  userId?: string;
  email?: string;
}

export default class ApiService extends Service {
  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: 'api',
      mixins: [ApiGateway],

      settings: {
        port: process.env.PORT || 3000,

        cors: {
          origin: '*',
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          exposedHeaders: [],
          credentials: false,
          maxAge: 3600,
        },

        routes: [
          {
            path: '/api',
            whitelist: ['**'],
            use: [],
            mergeParams: true,
            authentication: true,
            authorization: true,
            autoAliases: true,
            aliases: {
              'GET /health': 'api.health',

              'POST /auth/register': 'auth.register',
              'POST /auth/login': 'auth.login',
              'GET /auth/me': 'auth.me',

              'GET /notes': 'notes.list',
              'GET /notes/:id': 'notes.get',
              'POST /notes': 'notes.create',
              'PATCH /notes/:id': 'notes.update',
              'DELETE /notes/:id': 'notes.delete',

              'GET /categories': 'notes.categories',
            },
            callingOptions: {},
            bodyParsers: {
              json: {
                strict: false,
                limit: '1MB',
              },
              urlencoded: {
                extended: true,
                limit: '1MB',
              },
            },
            mappingPolicy: 'all',
            logging: true,
          },
        ],

        log4XXResponses: false,
        logRequestParams: 'info',
        logResponseData: 'debug',

        assets: {
          folder: 'public',
          options: {},
        },

        onError(req: IncomingMessage, res: ServerResponse, err: Error) {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(err.name === 'UnauthorizedError' ? 401 : 500);
          res.end(
            JSON.stringify({
              success: false,
              error: {
                message: err.message,
                code: err.name,
              },
            })
          );
        },
      },

      actions: {
        health: {
          rest: 'GET /health',
          handler(): { status: string; timestamp: string } {
            return {
              status: 'ok',
              timestamp: new Date().toISOString(),
            };
          },
        },
      },

      methods: {
        async authenticate(
          ctx: Context,
          route: any,
          req: IncomingMessage
        ): Promise<AuthMeta | null> {
          const authHeader = req.headers.authorization;

          if (!authHeader) {
            return null;
          }

          const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

          try {
            const decoded = verifyToken(token);
            return {
              userId: decoded.userId,
              email: decoded.email,
            };
          } catch (err) {
            return null;
          }
        },

        async authorize(ctx: Context, route: any, req: IncomingMessage): Promise<void> {
          const meta = ctx.meta as AuthMeta;

          const protectedRoutes = ['/api/notes', '/api/auth/me', '/api/categories'];

          const isProtected = protectedRoutes.some(path => req.url?.startsWith(path));

          if (isProtected && !meta.userId) {
            throw new ApiGateway.Errors.UnAuthorizedError('NO_TOKEN', 'Требуется аутентификация');
          }
        },
      },

      started() {
        this.logger.info(`API Gateway started on port ${this.settings.port}`);
      },
    });
  }
}
