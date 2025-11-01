# Деплой PDF Microservice в Coolify

## 📋 Шаг 1: Создание сервисов в Coolify

### 1.1 Gotenberg Service

1. **Создать новый сервис**: Docker Image
2. **Image**: `gotenberg/gotenberg:8`
3. **Порт**: `3000`
4. **Domain**: `gotenberg.lamidupain17.com`
5. **Health Check**: `/health`

**Дополнительные параметры:**
- Restart Policy: Always
- Memory Limit: 512MB

---

### 1.2 PDF API Service

1. **Создать новый сервис**: GitHub Repository
2. **Repository**: `https://github.com/Tsumibito/l-ami-du-pain-Gotenberg`
3. **Branch**: `main`
4. **Build Pack**: Dockerfile
5. **Порт**: `3001`
6. **Domain**: `pdf-api.lamidupain17.com` (или другой по желанию)

**Дополнительные параметры:**
- Restart Policy: Always
- Memory Limit: 256MB

---

## ⚙️ Шаг 2: Переменные окружения для PDF API

В настройках **PDF API Service** → **Environment Variables** добавьте:

```env
PORT=3001
NODE_ENV=production
API_TOKEN=your_secure_production_token_here
GOTENBERG_URL=https://gotenberg.lamidupain17.com
CORS_ORIGIN=https://directus.lamidupain17.com,https://pro.lamidupain17.com
MAX_CONCURRENT_GENERATIONS=5
PDF_GENERATION_TIMEOUT=30000
LOG_LEVEL=info
LOG_FORMAT=json
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

### 📝 Описание переменных:

| Переменная | Значение | Описание |
|-----------|----------|----------|
| `PORT` | `3001` | Порт API сервера |
| `NODE_ENV` | `production` | Режим работы |
| `API_TOKEN` | `your_secure_production_token_here` | **ВАЖНО**: Генерируйте новый токен |
| `GOTENBERG_URL` | `https://gotenberg.lamidupain17.com` | URL Gotenberg сервиса |
| `CORS_ORIGIN` | `https://directus.lamidupain17.com,https://pro.lamidupain17.com` | Разрешенные домены |
| `MAX_CONCURRENT_GENERATIONS` | `5` | Макс. одновременных генераций |
| `PDF_GENERATION_TIMEOUT` | `30000` | Таймаут генерации (мс) |
| `LOG_LEVEL` | `info` | Уровень логирования |
| `LOG_FORMAT` | `json` | Формат логов |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Окно rate limiting (мс) |
| `RATE_LIMIT_MAX_REQUESTS` | `30` | Макс. запросов в минуту |

---

## 🔐 Шаг 3: Настройка SSL/HTTPS

Coolify автоматически настроит SSL сертификаты для:
- `gotenberg.lamidupain17.com`
- `pdf-api.lamidupain17.com`

Убедитесь что DNS записи указывают на IP сервера Coolify.

---

## 🚀 Шаг 4: Деплой

1. **Gotenberg**: Deploy → Start
2. **PDF API**: Deploy → Build & Start

### Проверка деплоя:

```bash
# Health check Gotenberg
curl https://gotenberg.lamidupain17.com/health

# Health check PDF API
curl https://pdf-api.lamidupain17.com/health
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "timestamp": "2025-11-01T17:00:00.000Z",
  "services": {
    "gotenberg": "ok"
  }
}
```

---

## 🧪 Шаг 5: Тестирование

### Генерация тестового PDF:

```bash
curl -X POST https://pdf-api.lamidupain17.com/api/pdf/avis \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": {
      "name": "SARL L'\''AMI DU PAIN",
      "address": "6 RUE DE LA ROCHELLE\n17220 SAINT-ROGATIEN",
      "siret": "517 503 298 00047"
    },
    "order": {
      "numero": "TEST-001",
      "date_created": "2025-11-01T10:00:00Z",
      "date_livraison": "2025-11-02",
      "type": { "nom": "Tour Matin" },
      "client": { "nom": "Test Client" },
      "client_adresse": {
        "numero_et_nom_de_la_rue": "1 rue Test",
        "code_postal": "17000",
        "ville": "La Rochelle"
      }
    },
    "lignes": [
      {
        "num": 1,
        "produit_nom": "Pain test",
        "quantite": 10,
        "tranche": false
      }
    ]
  }' \
  --output test.pdf

# Проверить размер
ls -lh test.pdf
```

---

## 🔗 Шаг 6: Интеграция с Directus

В основном Directus добавьте переменные окружения:

```env
PDF_API_URL=https://pdf-api.lamidupain17.com
PDF_API_TOKEN=your_secure_production_token_here
```

### Пример использования в хуке Directus:

```typescript
import axios from 'axios';

async function generatePDF(orderData: any) {
  const response = await axios.post(
    `${process.env.PDF_API_URL}/api/pdf/avis`,
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

---

## 📊 Мониторинг

### Логи в Coolify:

1. **PDF API**: Logs → Real-time
2. **Gotenberg**: Logs → Real-time

### Метрики:

- **CPU/Memory**: Dashboard → Metrics
- **Response Time**: Проверяйте логи PDF API
- **Error Rate**: Фильтруйте логи по `"level":"error"`

---

## 🔄 Обновление

### При изменении кода:

```bash
# Локально
git add .
git commit -m "Update: описание изменений"
git push origin main
```

В Coolify:
1. PDF API → Deploy → Pull & Rebuild

### При изменении переменных окружения:

1. Environment Variables → Edit
2. Deploy → Restart

---

## ⚠️ Важные замечания

1. **API_TOKEN** - храните в секрете, меняйте регулярно
2. **CORS_ORIGIN** - добавляйте только доверенные домены
3. **HTTPS** - всегда используйте в продакшене
4. **Rate Limiting** - настроен на 30 запросов/минуту на IP
5. **Backup**: Периодически делайте backup репозитория

---

## 🆘 Troubleshooting

### PDF API не стартует:
```bash
# Проверьте логи
# Убедитесь что все переменные окружения заданы
# Проверьте доступность Gotenberg
```

### Gotenberg недоступен:
```bash
# Проверьте что сервис запущен
# Проверьте health check: curl https://gotenberg.lamidupain17.com/health
```

### CORS ошибки:
```bash
# Проверьте CORS_ORIGIN содержит нужный домен
# Убедитесь что запрос идет с https://
```

### Slow PDF generation:
```bash
# Увеличьте PDF_GENERATION_TIMEOUT
# Увеличьте Memory Limit в Coolify
# Проверьте нагрузку на сервер
```
