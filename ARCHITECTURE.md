# PDF Микросервис - Техническое Задание

## 1. Цель проекта

Создать отдельный микросервис для генерации PDF документов (Bon de livraison, Feuille de synthèse) на основе HTML-шаблонов с использованием Gotenberg.

## 2. Архитектура решения

### 2.1 Схема компонентов

```
┌──────────────┐         ┌───────────────┐         ┌──────────────┐
│   Frontend   │────────►│  PDF API      │────────►│  Gotenberg   │
│   (Nuxt)     │         │  (Node.js)    │         │  (Chromium)  │
└──────────────┘         └───────────────┘         └──────────────┘
        │                        │
        │                        ▼
        │                ┌───────────────┐
        └───────────────►│   Directus    │
                         │   (Данные)    │
                         └───────────────┘
```

### 2.2 Поток данных

1. **Frontend** делает запрос: `GET /api/pdf/avis?order_id=123`
2. **PDF API** получает запрос и:
   - Запрашивает данные заказа из Directus API
   - Форматирует данные (даты в Europe/Paris, пагинация)
   - Рендерит Mustache шаблон `avis.html`
   - Отправляет HTML в Gotenberg
3. **Gotenberg** конвертирует HTML → PDF через Chromium
4. **PDF API** возвращает PDF клиенту (stream)

### 2.3 Преимущества такого подхода

✅ **Не нагружает основной контейнер Directus**
✅ **PDF генерируются по требованию** - не занимают место в БД
✅ **Изолированный процесс** - падение PDF сервиса не влияет на Directus
✅ **Быстрая генерация** - Gotenberg ~1-2 сек на документ
✅ **Масштабируемость** - можно запустить несколько инстансов

## 3. API Endpoints

### 3.1 Bon de livraison (avis.html)

```http
GET /api/pdf/avis?order_id={id}
```

**Параметры:**
- `order_id` (required) - ID заказа в Directus

**Ответ:**
- Content-Type: `application/pdf`
- Бинарный поток PDF

**Пример использования с фронтенда:**
```javascript
const downloadPDF = async (orderId) => {
  const response = await fetch(`${PDF_API_URL}/api/pdf/avis?order_id=${orderId}`);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bon-livraison-${orderId}.pdf`;
  a.click();
};
```

### 3.2 Feuille de synthèse (summary.html)

```http
GET /api/pdf/summary?date={YYYY-MM-DD}&type_id={id}&sort={mode}
```

**Параметры:**
- `date` (required) - Дата тура (YYYY-MM-DD)
- `type_id` (required) - ID типа доставки
- `sort` (optional) - Режим сортировки: `alpha`, `numero`, `time` (default: `numero`)

**Ответ:**
- Content-Type: `application/pdf`
- Бинарный поток PDF

### 3.3 Health check

```http
GET /health
```

**Ответ:**
```json
{
  "status": "ok",
  "services": {
    "gotenberg": "ok",
    "directus": "ok"
  }
}
```

## 4. Стек технологий

### Backend (PDF API)
- **Node.js** 20+
- **TypeScript** 5+
- **Express** - HTTP сервер
- **Mustache** - Рендер шаблонов
- **Axios** - HTTP клиент для Directus/Gotenberg
- **date-fns-tz** - Работа с таймзонами (Europe/Paris)

### PDF Engine
- **Gotenberg** 8+ - Конвертация HTML → PDF через Chromium

### Инфраструктура
- **Docker** - Контейнеризация
- **Docker Compose** - Оркестрация сервисов

## 5. Переменные окружения

См. `.env.example` для полного списка.

Основные переменные:
- `DIRECTUS_URL` - URL Directus API (http://directus:8055)
- `DIRECTUS_TOKEN` - Static token из основного .env
- `GOTENBERG_URL` - URL Gotenberg (http://gotenberg:3000)
- `CORS_ORIGIN` - Разрешенные origins для CORS

## 6. Производительность

### 6.1 Одиночная генерация
- **Время генерации**: 1-2 сек на документ
- **Размер PDF**: ~50-200 KB

### 6.2 Массовая генерация (50-60 заказов)

**Без оптимизации:**
- 50 заказов × 2 сек = 100 сек ❌

**С параллельной обработкой:**
```typescript
// Генерация по 5 PDF параллельно
const CONCURRENCY = 5;
const queue = new PQueue({ concurrency: CONCURRENCY });

// 50 заказов / 5 параллельных = 10 батчей
// 10 батчей × 2 сек = 20-30 секунд ✅
```

**Рекомендация:** 
- Для фронтенда: генерировать по требованию (1 PDF)
- Для массовой печати: создать endpoint `/api/pdf/batch` с очередью

## 7. Деплой

### 7.1 Docker Compose

```yaml
services:
  pdf-api:
    build: ./pdf-templates
    ports:
      - "3001:3001"
    environment:
      - DIRECTUS_URL=http://directus:8055
      - GOTENBERG_URL=http://gotenberg:3000
    depends_on:
      - gotenberg
    networks:
      - ladp-network

  gotenberg:
    image: gotenberg/gotenberg:8
    networks:
      - ladp-network

networks:
  ladp-network:
    external: true
```

### 7.2 Интеграция с основным docker-compose.yml

**Вариант 1: Отдельный docker-compose в pdf-templates/**
```bash
cd pdf-templates
docker-compose up -d
```

**Вариант 2: Добавить в основной docker-compose.yml**
```yaml
# В l-ami-du-pain-directus/docker-compose.yml
# Добавить pdf-api и gotenberg к существующим сервисам
```

## 8. Примеры использования

### 8.1 С фронтенда (Nuxt)

```vue
<script setup>
const downloadAvis = async (orderId) => {
  try {
    const response = await $fetch(`${PDF_API_URL}/api/pdf/avis`, {
      params: { order_id: orderId },
      responseType: 'blob'
    });
    
    // Скачать файл
    const url = URL.createObjectURL(response);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bon-livraison-${orderId}.pdf`;
    a.click();
  } catch (error) {
    console.error('PDF generation failed:', error);
  }
};
</script>
```

### 8.2 Из Directus hook

```typescript
// В l-ami-du-pain-bundle/src/
import axios from 'axios';

const generateAvisPDF = async (orderId: number) => {
  const response = await axios.get(
    `${process.env.PDF_API_URL}/api/pdf/avis`,
    {
      params: { order_id: orderId },
      responseType: 'stream'
    }
  );
  
  return response.data; // PDF stream
};
```

## 9. Безопасность

### 9.1 Валидация запросов
- ✅ Проверка наличия обязательных параметров
- ✅ Валидация формата данных (order_id - число, date - YYYY-MM-DD)
- ✅ Лимит на количество одновременных запросов

### 9.2 CORS
```typescript
// Разрешить запросы только с фронтенда
app.use(cors({
  origin: process.env.CORS_ORIGIN.split(','),
  credentials: true
}));
```

### 9.3 Rate limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: 30 // 30 запросов на генерацию PDF
});

app.use('/api/pdf', limiter);
```

## 10. Тестирование

### 10.1 Unit тесты
- Рендер Mustache шаблонов
- Форматирование дат
- Пагинация строк заказа

### 10.2 Integration тесты
- Запрос к Directus API
- Отправка HTML в Gotenberg
- Получение PDF

### 10.3 E2E тест
```bash
curl -X GET "http://localhost:3001/api/pdf/avis?order_id=1" \
  -H "Accept: application/pdf" \
  --output test.pdf
```

## 11. Мониторинг

### 11.1 Логирование
```typescript
import winston from 'winston';

logger.info('PDF generation started', { orderId, duration });
logger.error('Directus API error', { error, orderId });
```

### 11.2 Метрики
- Количество сгенерированных PDF
- Время генерации
- Ошибки генерации
- Доступность Gotenberg/Directus

## 12. Roadmap

### Phase 1: MVP ✅
- [x] Генерация Bon de livraison (avis.html)
- [x] Интеграция с Directus
- [x] Интеграция с Gotenberg
- [x] Docker контейнеры

### Phase 2: Расширение
- [ ] Генерация Feuille de synthèse (summary.html)
- [ ] Batch endpoint для массовой генерации
- [ ] Кэширование PDF (опционально)

### Phase 3: Оптимизация
- [ ] Очередь задач (Bull/BullMQ)
- [ ] Мониторинг и алерты
- [ ] Автоматическое масштабирование
