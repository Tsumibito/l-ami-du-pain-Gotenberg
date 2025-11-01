# PDF Микросервис для L'ami du Pain

Stateless микросервис для генерации PDF документов (Bon de livraison, Feuille de synthèse) на основе HTML-шаблонов с использованием Gotenberg.

## ✨ Особенности

- ✅ **Stateless** - не хранит данные, не подключается к БД
- ✅ **Простая авторизация** - Bearer token
- ✅ **Быстрая генерация** - Gotenberg ~1-2 сек на PDF
- ✅ **REST API** - POST JSON → получить PDF
- ✅ **Изолированный процесс** - не влияет на основной Directus

## 📋 Документация

- **[API_DOCS.md](./API_DOCS.md)** - Полная документация API с примерами
- **[instructions.md](./instructions.md)** - Документация по HTML шаблонам
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Техническая архитектура (старая версия)

## 🚀 Быстрый старт

### 1. Настройка окружения

```bash
cd pdf-templates

# Скопируйте .env.example в .env
cp .env.example .env

# Сгенерируйте API токен
openssl rand -hex 32

# Отредактируйте .env:
# - API_TOKEN=<ваш_токен>
# - CORS_ORIGIN=<url_вашего_фронтенда>
```

### 2. Запуск с Docker Compose

```bash
# Запустите PDF сервис
docker-compose up -d

# Проверьте статус
docker-compose ps
docker-compose logs -f pdf-api
```

### 3. Тестирование API

```bash
# Health check (без авторизации)
curl http://localhost:3001/health

# Запустите тестовый скрипт
./test-api.sh

# Или вручную с примерами:
export API_TOKEN="ваш_токен_из_env"

curl -X POST http://localhost:3001/api/pdf/avis \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @examples/avis-example.json \
  --output test-avis.pdf

open test-avis.pdf
```

## 📡 API Endpoints

### Bon de livraison (Avis)
```http
POST /api/pdf/avis
Authorization: Bearer <token>
Content-Type: application/json

{ "company": {...}, "order": {...}, "lignes": [...] }
```

### Feuille de synthèse (Summary)
```http
POST /api/pdf/summary
Authorization: Bearer <token>
Content-Type: application/json

{ "meta": {...}, "tour": {...}, "orders": [...] }
```

### Health Check
```http
GET /health
```

См. **[API_DOCS.md](./API_DOCS.md)** для полного описания полей и примеров.

## 🔗 Интеграция

### Из Directus (Node.js)

```javascript
import axios from 'axios';

async function generateAvisPDF(orderData) {
  const response = await axios.post(
    'http://pdf-api:3001/api/pdf/avis',
    orderData,
    {
      headers: {
        'Authorization': `Bearer ${process.env.PDF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    }
  );
  
  return Buffer.from(response.data);
}
```

### Из фронтенда (Nuxt/Vue)

```javascript
async function downloadPDF(orderData) {
  const response = await $fetch('/api/pdf/avis', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.pdfApiToken}`
    },
    body: orderData,
    responseType: 'blob'
  });
  
  // Скачать файл
  const url = URL.createObjectURL(response);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bon-livraison.pdf`;
  a.click();
}
```

## 📁 Структура проекта

```
pdf-templates/
├── API_DOCS.md           # 📖 Документация API
├── README.md             # 📄 Этот файл
├── docker-compose.yml    # 🐳 Gotenberg + PDF API
├── Dockerfile            # 🐳 Образ PDF API
├── package.json          # 📦 Зависимости
├── .env.example          # ⚙️ Пример конфигурации
├── templates/            # 🎨 HTML шаблоны
│   ├── avis.html
│   ├── summary.html
│   └── assets/
│       └── ladp_logo.svg
├── examples/             # 📝 Примеры payload
│   ├── avis-example.json
│   └── summary-example.json
├── test-api.sh           # 🧪 Тестовый скрипт
└── src/                  # 💻 Исходный код
    ├── index.ts
    ├── middleware/
    ├── routes/
    ├── services/
    └── utils/
```

## 🔐 Безопасность

1. **Генерируйте криптостойкий токен** (минимум 32 байта)
2. **Используйте HTTPS** в продакшене
3. **Ротация токенов** - меняйте API_TOKEN регулярно
4. **CORS** - настройте только доверенные origins
5. **Rate Limiting** - встроен (30 запросов/минуту)

## 🐛 Отладка

```bash
# Логи PDF API
docker-compose logs -f pdf-api

# Логи Gotenberg
docker-compose logs -f gotenberg

# Перезапуск сервиса
docker-compose restart pdf-api

# Пересборка после изменений
docker-compose up -d --build
```

## 📊 Производительность

- **Время генерации**: 1-2 секунды на PDF
- **Размер PDF**: ~50-200 KB
- **Параллельная обработка**: до 5 запросов одновременно
- **Timeout**: 30 секунд на генерацию

## 🚢 Деплой в продакшен

1. Сгенерируйте **криптостойкий API_TOKEN**
2. Настройте **CORS_ORIGIN** с реальными URLs
3. Убедитесь что **NODE_ENV=production**
4. Запустите: `docker-compose up -d`
5. Добавьте **PDF_API_TOKEN** в основной Directus .env

```bash
# В основном .env Directus
PDF_API_URL=http://pdf-api:3001
PDF_API_TOKEN=ваш_сгенерированный_токен
```
