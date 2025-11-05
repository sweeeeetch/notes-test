import { Service, ServiceBroker, Context } from 'moleculer';
import { ObjectId } from 'mongodb';
import { getDB } from '../db';
import { Note } from '../entities/Note';
import { ValidationError, UnauthorizedError, NotFoundError, ForbiddenError } from '../utils/errors';

interface AuthMeta {
  user: {
    userId?: string;
    email?: string;
  };
}

interface CreateNoteParams {
  title: string;
  content: string;
  category?: string | null;
}

interface UpdateNoteParams {
  id: string;
  title?: string;
  content?: string;
  category?: string | null;
}

interface GetNoteParams {
  id: string;
}

interface DeleteNoteParams {
  id: string;
}

interface ListNotesParams {
  category?: string;
  search?: string;
}

interface NoteResponse {
  id: string;
  title: string;
  content: string;
  category: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export default class NotesService extends Service {
  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: 'notes',

      actions: {
        list: {
          params: {
            category: { type: 'string', optional: true },
            search: { type: 'string', optional: true },
          },
          async handler(ctx: Context<ListNotesParams, AuthMeta>): Promise<NoteResponse[]> {
            if (!ctx.meta.user || !ctx.meta.user.userId) {
              throw new UnauthorizedError('Требуется авторизация');
            }

            const { userId } = ctx.meta.user;

            const { category, search } = ctx.params;
            const dataSource = getDB();
            const noteRepository = dataSource.getMongoRepository(Note);

            const query: any = { userId };

            if (category) {
              query.category = category;
            }

            if (search) {
              const searchRegex = new RegExp(search, 'i');
              query.$or = [{ title: searchRegex }, { content: searchRegex }];
            }

            let notes = await noteRepository.find({
              where: query,
              order: { createdAt: 'DESC' },
            });

            if (search) {
              const searchLower = search.toLowerCase();
              notes = notes.sort((a, b) => {
                const aTitleMatch = a.title.toLowerCase().includes(searchLower);
                const bTitleMatch = b.title.toLowerCase().includes(searchLower);

                if (aTitleMatch && !bTitleMatch) return -1;
                if (!aTitleMatch && bTitleMatch) return 1;

                return b.createdAt.getTime() - a.createdAt.getTime();
              });
            }

            return notes.map(note => ({
              id: note.id,
              title: note.title,
              content: note.content,
              category: note.category,
              userId: note.userId,
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
            }));
          },
        },

        get: {
          params: {
            id: { type: 'string' },
          },
          async handler(ctx: Context<GetNoteParams, AuthMeta>): Promise<NoteResponse> {
            if (!ctx.meta.user || !ctx.meta.user.userId) {
              throw new UnauthorizedError('Требуется аутентификация');
            }

            const { userId } = ctx.meta.user;
            const { id } = ctx.params;
            const dataSource = getDB();
            const noteRepository = dataSource.getMongoRepository(Note);

            let noteId: ObjectId;
            try {
              noteId = new ObjectId(id);
            } catch (error) {
              throw new NotFoundError('Заметка не найдена');
            }

            const note = await noteRepository.findOne({ where: { _id: noteId } });

            if (!note) {
              throw new NotFoundError('Заметка не найдена');
            }

            if (note.userId !== userId) {
              throw new ForbiddenError('У вас нет доступа к этой заметке');
            }

            return {
              id: note.id,
              title: note.title,
              content: note.content,
              category: note.category,
              userId: note.userId,
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
            };
          },
        },

        create: {
          params: {
            title: { type: 'string', min: 1, max: 200 },
            content: { type: 'string', max: 10000 },
            category: { type: 'string', max: 50, optional: true },
          },
          async handler(ctx: Context<CreateNoteParams, AuthMeta>): Promise<NoteResponse> {
            if (!ctx.meta.user || !ctx.meta.user.userId) {
              throw new UnauthorizedError('Требуется аутентификация');
            }

            const { userId } = ctx.meta.user;
            const { title, content, category } = ctx.params;

            if (!title || title.trim().length === 0) {
              throw new ValidationError('Заголовок обязателен');
            }

            if (title.length > 200) {
              throw new ValidationError('Заголовок не должен превышать 200 символов');
            }

            if (content && content.length > 10000) {
              throw new ValidationError('Содержимое не должно превышать 10000 символов');
            }

            if (category && category.length > 50) {
              throw new ValidationError('Категория не должна превышать 50 символов');
            }

            const dataSource = getDB();
            const noteRepository = dataSource.getMongoRepository(Note);

            const note = noteRepository.create({
              title: title.trim(),
              content: content || '',
              category: category || null,
              userId: userId,
            });

            await noteRepository.save(note);

            return {
              id: note.id,
              title: note.title,
              content: note.content,
              category: note.category,
              userId: userId,
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
            };
          },
        },

        update: {
          params: {
            id: { type: 'string' },
            title: { type: 'string', min: 1, max: 200, optional: true },
            content: { type: 'string', max: 10000, optional: true },
            category: { type: 'string', max: 50, optional: true },
          },
          async handler(ctx: Context<UpdateNoteParams, AuthMeta>): Promise<NoteResponse> {
            if (!ctx.meta.user || !ctx.meta.user.userId) {
              throw new UnauthorizedError('Требуется аутентификация');
            }

            const { userId } = ctx.meta.user;
            const { id, title, content, category } = ctx.params;
            const dataSource = getDB();
            const noteRepository = dataSource.getMongoRepository(Note);

            let noteId: ObjectId;
            try {
              noteId = new ObjectId(id);
            } catch (error) {
              throw new NotFoundError('Заметка не найдена');
            }

            const note = await noteRepository.findOne({ where: { _id: noteId } });

            if (!note) {
              throw new NotFoundError('Заметка не найдена');
            }

            if (note.userId !== userId) {
              throw new ForbiddenError('У вас нет прав на изменение этой заметки');
            }

            if (title !== undefined) {
              if (!title || title.trim().length === 0) {
                throw new ValidationError('Заголовок обязателен');
              }

              if (title.length > 200) {
                throw new ValidationError('Заголовок не должен превышать 200 символов');
              }
              note.title = title.trim();
            }

            if (content !== undefined) {
              if (content && content.length > 10000) {
                throw new ValidationError('Содержимое не должно превышать 10000 символов');
              }

              note.content = content;
            }

            if (category !== undefined) {
              if (category && category.length > 50) {
                throw new ValidationError('Категория не должна превышать 50 символов');
              }
              note.category = category || null;
            }

            await noteRepository.save(note);

            return {
              id: note.id,
              title: note.title,
              content: note.content,
              category: note.category,
              userId: note.userId,
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
            };
          },
        },

        delete: {
          params: {
            id: { type: 'string' },
          },
          async handler(ctx: Context<DeleteNoteParams, AuthMeta>): Promise<{ success: boolean }> {
            if (!ctx.meta.user || !ctx.meta.user.userId) {
              throw new UnauthorizedError('Требуется аутентификация');
            }

            const { userId } = ctx.meta.user;
            const { id } = ctx.params;
            const dataSource = getDB();
            const noteRepository = dataSource.getMongoRepository(Note);

            let noteId: ObjectId;
            try {
              noteId = new ObjectId(id);
            } catch (error) {
              throw new NotFoundError('Заметка не найдена');
            }

            const note = await noteRepository.findOne({ where: { _id: noteId } });

            if (!note) {
              throw new NotFoundError('Заметка не найдена');
            }

            if (note.userId !== userId) {
              throw new ForbiddenError('У вас нет прав на удаление этой заметки');
            }

            await noteRepository.delete({ _id: noteId });

            return { success: true };
          },
        },

        categories: {
          async handler(ctx: Context<{}, AuthMeta>): Promise<string[]> {
            if (!ctx.meta.user || !ctx.meta.user.userId) {
              throw new UnauthorizedError('Требуется аутентификация');
            }

            const { userId } = ctx.meta.user;

            const dataSource = getDB();
            const noteRepository = dataSource.getMongoRepository(Note);

            const notes = await noteRepository.find({
              where: {
                userId: userId,
                category: { $ne: null } as any,
              },
            });

            const categories = [...new Set(notes.map(note => note.category).filter(Boolean))];

            return categories as string[];
          },
        },
      },

      started() {
        this.logger.info('Notes service started');
      },
    });
  }
}
