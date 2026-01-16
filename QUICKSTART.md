# 🚀 Быстрый старт

## 1️⃣ Деплой на Railway (3 минуты)

### Вариант A: Через GitHub

```bash
# Создай репозиторий
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ваш-username/stripe-railway.git
git push -u origin main
```

**В Railway:**
1. Открой свой пустой сервис
2. **Settings** → **Connect Repo**
3. Выбери свой репозиторий
4. Готово! Railway задеплоит автоматически

### Вариант B: Через Railway CLI

```bash
# Установи CLI
npm install -g @railway/cli

# Залогинься
railway login

# Линкни проект
railway link

# Задеплой
railway up
```

---

## 2️⃣ Настрой переменные (2 минуты)

**Railway Dashboard → Variables:**

```
STRIPE_SECRET_KEY=sk_test_ваш_ключ
FRONTEND_URL=https://ваш-codepen.io
```

Получи ключ: https://dashboard.stripe.com/apikeys

---

## 3️⃣ Настрой Webhook (2 минуты)

1. **Скопируй URL Railway:** `https://ваш-сервис.railway.app`

2. **Stripe Dashboard:** https://dashboard.stripe.com/webhooks
   - Add endpoint
   - URL: `https://ваш-сервис.railway.app/api/webhook`
   - Events: `checkout.session.completed`
   - Add endpoint

3. **Скопируй Signing secret** (whsec_...)

4. **Добавь в Railway Variables:**
   ```
   STRIPE_WEBHOOK_SECRET=whsec_ваш_секрет
   ```

5. **Перезапусти сервис** в Railway

---

## 4️⃣ Codepen интеграция (1 минута)

**Замени в HTML коде:**

```javascript
const API_URL = 'https://ваш-сервис.railway.app';
```

**Готово!** 🎉

---

## 🧪 Тестирование

1. Открой Codepen
2. Нажми "Купить доступ"
3. Используй карту: `4242 4242 4242 4242`
4. После оплаты получишь доступ!

---

## 📞 Проблемы?

### Ошибка CORS?
Проверь `FRONTEND_URL` в Railway Variables

### Webhook не работает?
1. Проверь URL webhook в Stripe
2. Проверь `STRIPE_WEBHOOK_SECRET`
3. Посмотри логи в Railway

### Токен не валидный?
1. Подожди 5-10 секунд после оплаты
2. Проверь логи Railway
3. Проверь что webhook активирован в Stripe

---

## 📝 Полная документация

Смотри [README.md](README.md)
