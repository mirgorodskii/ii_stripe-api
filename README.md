# 🚂 Stripe Payment API для Railway

Минимальный backend для приема платежей через Stripe с выдачей токенов доступа.

---

## 📦 Шаг 1: Деплой на Railway

### Вариант A: Через GitHub (рекомендуется)

1. **Создай GitHub репозиторий:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/username/stripe-railway.git
   git push -u origin main
   ```

2. **В Railway Dashboard:**
   - Открой свой пустой сервис
   - Нажми **"Connect to GitHub"**
   - Выбери свой репозиторий
   - Railway автоматически задеплоит

### Вариант B: Через Railway CLI

1. **Установи Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Залогинься:**
   ```bash
   railway login
   ```

3. **Подключись к своему сервису:**
   ```bash
   railway link
   ```
   Выбери свой проект и пустой сервис.

4. **Задеплой:**
   ```bash
   railway up
   ```

---

## ⚙️ Шаг 2: Настрой переменные окружения в Railway

В Railway Dashboard → твой сервис → **Variables**:

```env
STRIPE_SECRET_KEY=sk_test_ваш_секретный_ключ
STRIPE_WEBHOOK_SECRET=whsec_будет_позже
FRONTEND_URL=https://твой-codepen-url.com
```

**Где взять Stripe ключи:**
1. Зайди на [dashboard.stripe.com](https://dashboard.stripe.com/apikeys)
2. Скопируй **Secret key** (sk_test_...)
3. **Webhook secret** получим на следующем шаге

---

## 🔗 Шаг 3: Настрой Stripe Webhook

После деплоя Railway выдаст URL типа: `https://твой-сервис.railway.app`

1. **Иди в Stripe Dashboard** → [Webhooks](https://dashboard.stripe.com/webhooks)

2. **Нажми "Add endpoint":**
   - **Endpoint URL:** `https://твой-сервис.railway.app/api/webhook`
   - **Events to send:** выбери `checkout.session.completed`
   - Нажми **Add endpoint**

3. **Скопируй Signing secret:**
   - Кликни на созданный webhook
   - Скопируй **Signing secret** (whsec_...)
   - Добавь его в Railway Variables как `STRIPE_WEBHOOK_SECRET`

4. **Перезапусти сервис** (Railway → Deploy → Restart)

---

## 🎨 Шаг 4: Интеграция с Codepen

### HTML + JavaScript для твоего Codepen:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Эксклюзивный контент</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
    }
    
    .locked-content {
      background: #f0f0f0;
      padding: 40px;
      border-radius: 10px;
      text-align: center;
    }
    
    .premium-content {
      display: none;
      background: #e7f3ff;
      padding: 40px;
      border-radius: 10px;
    }
    
    .buy-button {
      background: #667eea;
      color: white;
      padding: 15px 40px;
      border: none;
      border-radius: 8px;
      font-size: 18px;
      cursor: pointer;
      margin-top: 20px;
    }
    
    .buy-button:hover {
      background: #5568d3;
    }
    
    .buy-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <!-- Заблокированный контент -->
  <div id="locked" class="locked-content">
    <h1>🔒 Эксклюзивный контент</h1>
    <p>Этот раздел доступен только после оплаты</p>
    <p><strong>Цена: $20</strong></p>
    
    <input 
      type="email" 
      id="userEmail" 
      placeholder="Ваш email (опционально)"
      style="padding: 10px; width: 300px; margin: 10px 0;"
    >
    
    <br>
    
    <button id="buyButton" class="buy-button">
      Купить доступ
    </button>
    
    <div id="status"></div>
  </div>

  <!-- Премиум контент (показывается после оплаты) -->
  <div id="premium" class="premium-content">
    <h1>✅ Добро пожаловать!</h1>
    <p>У вас есть доступ к эксклюзивному контенту!</p>
    
    <div id="content"></div>
  </div>

  <script>
    // ВАЖНО: Замени на URL своего Railway сервиса!
    const API_URL = 'https://твой-сервис.railway.app';
    
    const buyButton = document.getElementById('buyButton');
    const userEmailInput = document.getElementById('userEmail');
    const statusDiv = document.getElementById('status');
    
    // Проверяем токен в URL при загрузке страницы
    window.addEventListener('DOMContentLoaded', checkAccess);
    
    // Кнопка покупки
    buyButton.addEventListener('click', async () => {
      const email = userEmailInput.value;
      
      buyButton.disabled = true;
      buyButton.textContent = 'Создаем платеж...';
      
      try {
        const response = await fetch(`${API_URL}/api/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email || undefined })
        });
        
        const data = await response.json();
        
        if (data.url) {
          // Перенаправляем на Stripe Checkout
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL received');
        }
      } catch (error) {
        console.error('Error:', error);
        statusDiv.innerHTML = `<p style="color: red;">Ошибка: ${error.message}</p>`;
        buyButton.disabled = false;
        buyButton.textContent = 'Купить доступ';
      }
    });
    
    // Проверка токена доступа
    async function checkAccess() {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (!token) return; // Нет токена - ничего не делаем
      
      try {
        // Проверяем токен на сервере
        const response = await fetch(`${API_URL}/api/verify-access/${token}`);
        const data = await response.json();
        
        if (data.valid) {
          // Токен валидный - загружаем контент
          await loadPremiumContent(token);
        } else {
          statusDiv.innerHTML = `<p style="color: red;">Ошибка: ${data.error}</p>`;
        }
      } catch (error) {
        console.error('Error verifying access:', error);
        statusDiv.innerHTML = `<p style="color: red;">Не удалось проверить доступ</p>`;
      }
    }
    
    // Загрузка премиум контента
    async function loadPremiumContent(token) {
      try {
        const response = await fetch(`${API_URL}/api/protected-content/${token}`);
        const data = await response.json();
        
        if (response.ok) {
          // Показываем премиум контент
          document.getElementById('locked').style.display = 'none';
          document.getElementById('premium').style.display = 'block';
          
          // Отображаем контент
          const contentDiv = document.getElementById('content');
          contentDiv.innerHTML = `
            <h2>${data.content.message}</h2>
            
            <h3>Видео:</h3>
            <ul>
              ${data.content.videos.map(v => `<li><a href="${v}">${v}</a></li>`).join('')}
            </ul>
            
            <h3>Документы:</h3>
            <ul>
              ${data.content.documents.map(d => `<li><a href="${d}">${d}</a></li>`).join('')}
            </ul>
            
            <p><small>Доступ активирован: ${new Date(data.accessInfo.activatedAt).toLocaleString('ru-RU')}</small></p>
          `;
          
          // Сохраняем токен в localStorage для последующих визитов
          localStorage.setItem('accessToken', token);
        }
      } catch (error) {
        console.error('Error loading content:', error);
      }
    }
    
    // При следующих визитах автоматически проверяем сохраненный токен
    window.addEventListener('DOMContentLoaded', () => {
      const savedToken = localStorage.getItem('accessToken');
      if (savedToken && !new URLSearchParams(window.location.search).get('token')) {
        // Проверяем сохраненный токен
        window.location.search = `?token=${savedToken}`;
      }
    });
  </script>
</body>
</html>
```

**Важно:** Замени `https://твой-сервис.railway.app` на реальный URL твоего Railway сервиса!

---

## 🎯 Как это работает:

1. **Пользователь нажимает "Купить доступ"** на Codepen
2. **Frontend вызывает Railway API** → `/api/create-checkout-session`
3. **Backend генерирует токен** и создает Stripe Checkout сессию
4. **Пользователь оплачивает** на странице Stripe
5. **Stripe отправляет webhook** → Railway активирует токен
6. **Пользователь перенаправляется** на Codepen с `?token=abc123`
7. **Frontend проверяет токен** через `/api/verify-access/abc123`
8. **Если токен валидный** → показывается премиум контент

---

## 🧪 Тестирование

### Тестовые карты Stripe:

- **Успешная оплата:** `4242 4242 4242 4242`
- **Отклонена:** `4000 0000 0000 0002`
- **Дата:** любая будущая (например, 12/34)
- **CVC:** любые 3 цифры (123)
- **ZIP:** любой (12345)

### Тестирование локально с Railway:

```bash
# Форвардинг webhook на локальный Railway (для разработки)
stripe listen --forward-to https://твой-сервис.railway.app/api/webhook
```

---

## 📍 API Endpoints

### `POST /api/create-checkout-session`
Создает Stripe Checkout сессию и генерирует токен.

**Request:**
```json
{
  "email": "user@example.com"  // опционально
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### `POST /api/webhook`
Обрабатывает Stripe webhook события (активирует токены).

### `GET /api/verify-access/:token`
Проверяет валидность токена доступа.

**Response (валидный):**
```json
{
  "valid": true,
  "activatedAt": "2025-01-16T10:30:00.000Z",
  "customerEmail": "user@example.com"
}
```

**Response (невалидный):**
```json
{
  "valid": false,
  "error": "Token not found"
}
```

### `GET /api/protected-content/:token`
Возвращает защищенный контент (только для валидных токенов).

### `GET /api/stats`
Статистика активных токенов (для отладки).

---

## ⚠️ Важные моменты

### 1. Токены хранятся в памяти
- При рестарте Railway токены **потеряются**
- Для продакшна добавь Railway PostgreSQL (бесплатно 512MB)

### 2. CORS
- Обнови `FRONTEND_URL` на реальный URL Codepen
- Или установи `'*'` для разрешения всех доменов (небезопасно!)

### 3. Изменение цены
В `server.js` найди:
```javascript
unit_amount: 2000, // $20.00 (в центах)
```

### 4. Webhook в продакшне
- Webhook URL должен быть доступен публично
- Railway автоматически дает HTTPS
- Проверь статус webhook в Stripe Dashboard

---

## 🔒 Добавление Railway PostgreSQL (опционально)

Если хочешь надежное хранилище токенов:

1. **В Railway Dashboard:**
   - Нажми **"+ New"** → **"Database"** → **"Add PostgreSQL"**

2. **Railway автоматически создаст переменную** `DATABASE_URL`

3. **Установи зависимость:**
   ```bash
   npm install pg
   ```

4. **Замени Map() на PostgreSQL** (могу дать код если нужно)

---

## 📊 Мониторинг

Проверь статус API:
```
https://твой-сервис.railway.app/
```

Ответ:
```json
{
  "status": "ok",
  "service": "Stripe Payment API",
  "activeTokens": 5
}
```

---

## 🐛 Отладка

### Логи Railway:
Railway Dashboard → твой сервис → **Logs**

### Тестирование webhook:
```bash
curl -X POST https://твой-сервис.railway.app/api/webhook \
  -H "Content-Type: application/json"
```

### Проверка токена:
```bash
curl https://твой-сервис.railway.app/api/verify-access/TOKEN123
```

---

## 🚀 Готово!

Теперь у тебя есть:
- ✅ Backend на Railway
- ✅ Stripe интеграция
- ✅ Токены доступа
- ✅ Защищенный контент

Осталось только:
1. Задеплоить на Railway
2. Настроить webhook
3. Скопировать HTML код в Codepen
4. Заменить `API_URL` на свой Railway URL

**Нужна помощь с настройкой? Пиши!** 🎯
