# Сервис заметок

Тестовое веб-приложение для создания и управления заметками

## Технологии

**Backend:**

- Node.js + TypeScript
- Moleculer (микросервисы)
- MongoDB
- JWT для авторизации

**Frontend:**

- Nuxt 4 (Vue 3)
- Tailwind CSS
- TypeScript

## Как запустить

### Локально

1. Поднять MongoDB:

```bash
docker run -d -p 27017:27017 mongo:7
```

2. Запустить backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

3. Запустить frontend:

```bash
cd frontend
npm install
npm run dev
```

Открыть http://localhost:3000

### Через Docker

```bash
docker-compose up -d
```

Всё поднимется автоматически на http://localhost:3000

## API

Основные эндпоинты:

```
POST /api/auth/register - регистрация
POST /api/auth/login - вход
GET /api/notes - список заметок
POST /api/notes - создать заметку
PATCH /api/notes/:id - обновить
DELETE /api/notes/:id - удалить
```

## Тесты

```bash
cd backend
npm test
```
