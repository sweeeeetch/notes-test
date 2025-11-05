# Руководство по Docker

## env

### Дев

- `backend/.env` - Конфигурация бэкенда для разработки
- `frontend/.env` - Конфигурация фронтенда для разработки
- `docker-compose.override.yml` - Автоматически загружается для локальной разработки

### Прод

- `backend/.env.production` - Конфигурация бэкенда для продакшна (не в git)
- `frontend/.env.production` - Конфигурация фронтенда для продакшна (не в git)
- `docker-compose.prod.yml` - Переопределения для продакшна

## Использование

### Дев

```bash
# Использует .env файлы и docker-compose.override.yml автоматически
docker-compose up -d

# Просмотр логов
docker-compose logs -f
```

### Продакшн

```bash
# создайте env для прода
cp backend/.env.example backend/.env.production
cp frontend/.env frontend/.env.production

# Отредактируйте env

# Запуск с конфигом для прода
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Просмотр логов
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```
