# PDF Generation API Documentation

## Аутентификация

Все запросы требуют Bearer токен авторизации.

```http
Authorization: Bearer your_api_token_here
```

Токен настраивается в `.env` файле как `API_TOKEN`.

---

## Endpoints

### 1. Bon de livraison (Avis de livraison)

Генерация документа "Bon de livraison" для заказа.

**Endpoint:**
```http
POST /api/pdf/avis
Content-Type: application/json
Authorization: Bearer your_api_token_here
```

**Request Body:**
```json
{
  "company": {
    "name": "SARL L'AMI DU PAIN",
    "address": "6 RUE DE LA ROCHELLE\n17220 SAINT-ROGATIEN",
    "siret": "517 503 298 00047",
    "phone": "+33 5 46 00 00 00",
    "email": "contact@ladp.fr"
  },
  "order": {
    "id": 123,
    "numero": "CMD-2025-001",
    "date_created": "2025-10-31T08:30:00Z",
    "date_livraison": "2025-11-01",
    "besoin_de_cheque": true,
    "commentaire_client": "Livraison par l'entrée arrière",
    "demandes_speciales": "Pains bien cuits",
    "type": {
      "nom": "Tour Matin",
      "description": "Livraison matinale 6h-8h"
    },
    "client": {
      "nom": "Boulangerie Martin",
      "telephone": "+33 5 46 11 22 33",
      "site": "www.boulangerie-martin.fr"
    },
    "client_adresse": {
      "numero_et_nom_de_la_rue": "15 rue du Commerce",
      "complement_d_adresse": "Bâtiment B",
      "code_postal": "17000",
      "ville": "La Rochelle",
      "pays": "France"
    },
    "juridique": {
      "raison_sociale": "SARL Boulangerie Martin",
      "forme_juridique": "SARL",
      "siren": "123456789",
      "siret": "12345678900012",
      "code_naf": "1071C",
      "tva_intracom": "FR12345678900"
    }
  },
  "lignes": [
    {
      "num": 1,
      "produit_nom": "Pain de campagne 400g",
      "quantite": 20,
      "tranche": false
    },
    {
      "num": 2,
      "produit_nom": "Baguette tradition",
      "quantite": 50,
      "tranche": false
    },
    {
      "num": 3,
      "produit_nom": "Pain de mie complet",
      "quantite": 10,
      "tranche": true
    }
  ]
}
```

**Поля (обязательные помечены ⚠️):**

| Поле | Тип | Описание |
|------|-----|----------|
| `company.name` ⚠️ | string | Название компании |
| `company.address` ⚠️ | string | Адрес компании (с \n для переносов) |
| `company.siret` ⚠️ | string | SIRET компании |
| `company.phone` | string | Телефон компании |
| `company.email` | string | Email компании |
| `order.numero` ⚠️ | string | Номер заказа |
| `order.date_created` ⚠️ | string (ISO 8601) | Дата создания заказа |
| `order.date_livraison` ⚠️ | string (YYYY-MM-DD) | Дата желаемой доставки |
| `order.type.nom` ⚠️ | string | Тип доставки |
| `order.type.description` | string | Описание типа доставки |
| `order.besoin_de_cheque` | boolean | Требуется ли чек |
| `order.commentaire_client` | string | Комментарий клиента |
| `order.demandes_speciales` | string | Специальные запросы |
| `order.client.nom` ⚠️ | string | Название клиента |
| `order.client.telephone` | string | Телефон клиента |
| `order.client.site` | string | Сайт клиента |
| `order.client_adresse.*` | object | Адрес клиента |
| `order.juridique.*` | object | Юридические данные клиента |
| `lignes` ⚠️ | array | Массив строк заказа |
| `lignes[].num` ⚠️ | number | Номер строки |
| `lignes[].produit_nom` ⚠️ | string | Название продукта |
| `lignes[].quantite` ⚠️ | number | Количество |
| `lignes[].tranche` ⚠️ | boolean | Нарезан ли продукт |

**Response:**
- Status: `200 OK`
- Content-Type: `application/pdf`
- Body: Binary PDF stream

**Примечания:**
- Автоматическая пагинация: 12 строк на первую страницу (если нет `demandes_speciales`), иначе меньше
- Даты форматируются в таймзоне `Europe/Paris`
- Если `lignes` больше 12 элементов, документ будет многостраничным

---

### 2. Feuille de synthèse (Tour Summary)

Генерация сводки заказов для тура.

**Endpoint:**
```http
POST /api/pdf/summary
Content-Type: application/json
Authorization: Bearer your_api_token_here
```

**Request Body:**
```json
{
  "meta": {
    "date": "2025-11-01",
    "date_formatted": "vendredi 1 novembre 2025"
  },
  "tour": {
    "type": {
      "nom": "Tour Matin",
      "description": "Livraison matinale 6h-8h"
    }
  },
  "orders": [
    {
      "client_nom": "Boulangerie Martin",
      "numero": "CMD-2025-001",
      "besoin_de_cheque": true,
      "demandes_speciales": "Pains bien cuits",
      "lignes": [
        {
          "produit_nom": "Pain de campagne 400g",
          "quantite": 20,
          "tranche": false
        },
        {
          "produit_nom": "Baguette tradition",
          "quantite": 50,
          "tranche": false
        }
      ]
    },
    {
      "client_nom": "Restaurant Le Gourmet",
      "numero": "CMD-2025-002",
      "besoin_de_cheque": false,
      "demandes_speciales": null,
      "lignes": [
        {
          "produit_nom": "Pain de mie complet",
          "quantite": 10,
          "tranche": true
        }
      ]
    }
  ],
  "sort_mode": "alpha"
}
```

**Поля (обязательные помечены ⚠️):**

| Поле | Тип | Описание |
|------|-----|----------|
| `meta.date` ⚠️ | string (YYYY-MM-DD) | Дата тура |
| `meta.date_formatted` | string | Дата в читаемом формате (автоформат если не указано) |
| `tour.type.nom` ⚠️ | string | Название тура |
| `tour.type.description` | string | Описание тура |
| `orders` ⚠️ | array | Массив заказов |
| `orders[].client_nom` ⚠️ | string | Название клиента |
| `orders[].numero` ⚠️ | string | Номер заказа |
| `orders[].besoin_de_cheque` | boolean | Требуется ли чек |
| `orders[].demandes_speciales` | string | Специальные запросы |
| `orders[].lignes` ⚠️ | array | Строки заказа |
| `orders[].lignes[].produit_nom` ⚠️ | string | Название продукта |
| `orders[].lignes[].quantite` ⚠️ | number | Количество |
| `orders[].lignes[].tranche` ⚠️ | boolean | Нарезан ли |
| `sort_mode` | string | Режим сортировки: `alpha`, `numero`, `time` |

**Response:**
- Status: `200 OK`
- Content-Type: `application/pdf`
- Body: Binary PDF stream

**Примечания:**
- Сортировка заказов согласно `sort_mode`
- Карточный вид: каждый заказ в отдельной карточке

---

### 3. Health Check

Проверка состояния сервиса.

**Endpoint:**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-01T16:50:00.000Z",
  "services": {
    "gotenberg": "ok"
  }
}
```

---

## Коды ошибок

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API token"
}
```

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Missing required field: order.numero",
  "details": {
    "field": "order.numero",
    "expected": "string"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "PDF generation failed",
  "details": "Gotenberg service unavailable"
}
```

### 503 Service Unavailable
```json
{
  "error": "Service Unavailable",
  "message": "Gotenberg service is not responding"
}
```

---

## Примеры использования

### cURL

**Bon de livraison:**
```bash
curl -X POST "http://localhost:3001/api/pdf/avis" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_token_here" \
  -d @avis-payload.json \
  --output bon-livraison.pdf
```

**Feuille de synthèse:**
```bash
curl -X POST "http://localhost:3001/api/pdf/summary" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_token_here" \
  -d @summary-payload.json \
  --output summary.pdf
```

### JavaScript / Fetch

```javascript
const generateAvisPDF = async (orderData) => {
  const response = await fetch('http://localhost:3001/api/pdf/avis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PDF_API_TOKEN}`
    },
    body: JSON.stringify(orderData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.blob();
};
```

### Node.js / Axios

```javascript
import axios from 'axios';
import fs from 'fs';

const generateSummaryPDF = async (tourData) => {
  const response = await axios.post(
    'http://localhost:3001/api/pdf/summary',
    tourData,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PDF_API_TOKEN}`
      },
      responseType: 'stream'
    }
  );
  
  // Сохранить в файл
  response.data.pipe(fs.createWriteStream('summary.pdf'));
};
```

### Python

```python
import requests

def generate_avis_pdf(order_data, api_token):
    response = requests.post(
        'http://localhost:3001/api/pdf/avis',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_token}'
        },
        json=order_data
    )
    
    response.raise_for_status()
    
    with open('bon-livraison.pdf', 'wb') as f:
        f.write(response.content)
```

---

## Производительность

- **Время генерации**: 1-2 секунды на PDF
- **Параллельная обработка**: До 5 запросов одновременно
- **Максимальный размер payload**: 10 MB
- **Timeout**: 30 секунд на генерацию

---

## Безопасность

1. **Всегда используйте HTTPS** в продакшене
2. **API Token должен быть криптостойким**: минимум 32 байта случайных данных
3. **Ротация токенов**: Меняйте API_TOKEN регулярно
4. **Rate Limiting**: Максимум 30 запросов в минуту на IP
5. **CORS**: Настройте только доверенные origins в `.env`

---

## Генерация API Token

```bash
# Linux/macOS
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```
