# ✅ Чеклист настройки Stripe на Railway

Пройди по шагам последовательно и отмечай галочки.

---

## Подготовка (5 минут)

- [ ] Зарегистрирован на [stripe.com](https://stripe.com)
- [ ] Зарегистрирован на [railway.app](https://railway.app)
- [ ] Создан пустой сервис на Railway
- [ ] Есть аккаунт на GitHub (если деплой через GitHub)

---

## Шаг 1: Получи Stripe ключи (2 минуты)

- [ ] Зайди на [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
- [ ] Скопируй **Secret key** (sk_test_...)
- [ ] Сохрани его где-то (понадобится дальше)

> **Не копируй Publishable key** - он не нужен для backend!

---

## Шаг 2: Загрузи код на Railway (3 минуты)

### Вариант A: Через GitHub (рекомендуется)

- [ ] Создай репозиторий на GitHub
- [ ] Загрузи туда все файлы из этой папки
- [ ] В Railway: **Connect to GitHub** → выбери репозиторий
- [ ] Дождись автоматического деплоя

### Вариант B: Через Railway CLI

- [ ] Установи Railway CLI: `npm install -g @railway/cli`
- [ ] Залогинься: `railway login`
- [ ] Подключись к сервису: `railway link`
- [ ] Задеплой: `railway up`

---

## Шаг 3: Настрой переменные окружения (2 минуты)

- [ ] Открой Railway Dashboard → твой сервис → **Variables**
- [ ] Добавь переменную `STRIPE_SECRET_KEY` = твой secret key
- [ ] Добавь переменную `FRONTEND_URL` = URL твоего Codepen
- [ ] (Опционально) Добавь `PORT` = 3000

> **Не добавляй `STRIPE_WEBHOOK_SECRET`** - это будет на следующем шаге!

---

## Шаг 4: Получи URL Railway сервиса (1 минута)

- [ ] В Railway Dashboard найди **Public Domain**
- [ ] Скопируй URL (например: `https://твой-сервис.railway.app`)
- [ ] Проверь, что сервис работает: открой URL в браузере
- [ ] Должен показать: `{"status":"ok","service":"Stripe Payment API"}`

---

## Шаг 5: Настрой Stripe Webhook (3 минуты)

- [ ] Зайди на [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
- [ ] Нажми **"Add endpoint"**
- [ ] Вставь URL: `https://твой-сервис.railway.app/api/webhook`
- [ ] Выбери событие: **checkout.session.completed**
- [ ] Нажми **"Add endpoint"**
- [ ] Кликни на созданный webhook
- [ ] Скопируй **Signing secret** (whsec_...)
- [ ] Добавь его в Railway Variables как `STRIPE_WEBHOOK_SECRET`
- [ ] Перезапусти Railway сервис: **Deploy** → **Restart**

---

## Шаг 6: Настрой Codepen (3 минуты)

- [ ] Открой файл `codepen-example.html`
- [ ] Найди строку: `const API_URL = 'https://your-service.railway.app';`
- [ ] Замени на свой Railway URL
- [ ] Скопируй весь код в Codepen
- [ ] Сохрани Codepen проект

---

## Шаг 7: Тестирование (2 минуты)

- [ ] Открой свой Codepen
- [ ] Нажми **"Купить сейчас"**
- [ ] Введи тестовую карту: `4242 4242 4242 4242`
- [ ] Дата: `12/34`, CVC: `123`
- [ ] Нажми **"Оплатить"**
- [ ] Проверь, что перенаправило обратно на Codepen
- [ ] Проверь, что показался премиум контент

---

## Шаг 8: Проверка webhook (1 минута)

- [ ] Зайди в Stripe Dashboard → **Webhooks**
- [ ] Кликни на свой webhook
- [ ] Перейди на вкладку **"Events"**
- [ ] Должен быть event `checkout.session.completed` со статусом **✓ Succeeded**

> Если статус **✗ Failed** - проверь логи в Railway!

---

## Готово! 🎉

Если все галочки отмечены - интеграция работает!

---

## Проблемы?

### Webhook возвращает ошибку 400
- [ ] Проверь `STRIPE_WEBHOOK_SECRET` в Railway Variables
- [ ] Перезапусти Railway сервис
- [ ] Webhook secret должен начинаться с `whsec_`

### CORS ошибка в консоли браузера
- [ ] Проверь `FRONTEND_URL` в Railway Variables
- [ ] Убедись что URL Codepen правильный
- [ ] Перезапусти Railway сервис

### Токен не валидный после оплаты
- [ ] Подожди 5-10 секунд и обнови страницу
- [ ] Проверь логи Railway
- [ ] Проверь что webhook получил событие в Stripe Dashboard

### API возвращает 500 ошибку
- [ ] Проверь логи Railway
- [ ] Убедись что все зависимости установлены
- [ ] Проверь что `STRIPE_SECRET_KEY` правильный

---

## Где посмотреть логи?

**Railway:** Dashboard → твой сервис → **Logs**  
**Stripe:** Dashboard → **Webhooks** → твой webhook → **Events**  
**Браузер:** F12 → **Console**

---

## Дополнительно

### Изменить цену
- [ ] Открой `server.js`
- [ ] Найди `unit_amount: 2000`
- [ ] Измени на нужную сумму (в центах: $1 = 100)
- [ ] Коммит → пуш → Railway автоматически передеплоит

### Добавить базу данных
- [ ] Railway → **+ New** → **Database** → **PostgreSQL**
- [ ] Railway автоматически создаст `DATABASE_URL`
- [ ] Установи зависимость: `npm install pg`
- [ ] Замени `Map()` на PostgreSQL (спроси меня за кодом!)

### Перейти в продакшн
- [ ] Смени тестовые ключи на **продакшн ключи** в Stripe
- [ ] Пересоздай webhook с новым signing secret
- [ ] Обнови переменные в Railway
- [ ] Готово!

---

**Нужна помощь?** Пиши вопросы! 🚀
