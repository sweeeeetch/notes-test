import { Errors } from 'moleculer';

export class ValidationError extends Errors.MoleculerClientError {
  constructor(message: string, data?: any) {
    super(message, 400, 'VALIDATION_ERROR', data);
  }
}

export class UnauthorizedError extends Errors.MoleculerClientError {
  constructor(message: string = 'Unauthorized', data?: any) {
    super(message, 401, 'UNAUTHORIZED', data);
  }
}

export class ForbiddenError extends Errors.MoleculerClientError {
  constructor(message: string = 'Forbidden', data?: any) {
    super(message, 403, 'FORBIDDEN', data);
  }
}

export class NotFoundError extends Errors.MoleculerClientError {
  constructor(message: string = 'Resource not found', data?: any) {
    super(message, 404, 'NOT_FOUND', data);
  }
}
