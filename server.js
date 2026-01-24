require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

// Проверка обязательных переменных окружения
const requiredEnvVars = ['STRIPE_SECRET_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please set these variables in Railway Dashboard → Variables');
  console.error('Example: STRIPE_SECRET_KEY=sk_test_...');
}

// Инициализируем Stripe только если ключ есть
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe initialized');
} else {
  console.warn('⚠️ Stripe not initialized - missing STRIPE_SECRET_KEY');
}

// КРИТИЧНО: Webhook ДОЛЖЕН быть ПЕРВЫМ (до всех других middleware)
// Stripe требует raw body для проверки подписи
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// Хранилище токенов доступа (в памяти)
// Для продакшна лучше использовать Railway PostgreSQL
const accessTokens = new Map();

// Генерация уникального токена
function generateAccessToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Health check для Railway
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'Stripe Payment API',
    activeTokens: accessTokens.size
  });
});

// 1. Создание Stripe Checkout сессии
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ 
        error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.' 
      });
    }

    const { email } = req.body; // Опционально

    // Генерируем токен заранее
    const accessToken = generateAccessToken();

    const session = await stripe.checkout.sessions.create({
      // Stripe автоматически показывает все включенные методы (Apple Pay, Google Pay, Link, etc)
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Hypnologue',
              description: 'Full introspection experience ',
            },
            unit_amount: 500, // $5 для теста продакшна (потом измени на нужную цену)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      
      // После успешной оплаты перенаправляем на главную с токеном
      success_url: `${process.env.FRONTEND_URL}?token=${accessToken}`,
      cancel_url: `${process.env.FRONTEND_URL}`,
      
      customer_email: email,
      
      // Сохраняем токен в metadata
      metadata: {
        accessToken: accessToken,
      },
    });

    // Временно резервируем токен (будет активирован при webhook)
    accessTokens.set(accessToken, {
      status: 'pending',
      sessionId: session.id,
      createdAt: new Date(),
    });

    res.json({ 
      sessionId: session.id, 
      url: session.url 
    });
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Webhook - активация токена после оплаты
app.post('/api/webhook', async (req, res) => {
  if (!stripe) {
    console.error('⚠️ Webhook called but Stripe is not configured');
    return res.status(500).json({ 
      error: 'Stripe is not configured' 
    });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('⚠️ STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ 
      error: 'Webhook secret is not configured' 
    });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Обработка успешной оплаты
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const accessToken = session.metadata.accessToken;
    
    console.log('✅ Payment successful! Activating token:', accessToken);
    
    // Активируем токен
    if (accessTokens.has(accessToken)) {
      accessTokens.set(accessToken, {
        status: 'active',
        sessionId: session.id,
        customerEmail: session.customer_email,
        amountPaid: session.amount_total / 100,
        activatedAt: new Date(),
        expiresAt: null, // Пожизненный доступ (или установи срок)
      });
      
      console.log(`Token ${accessToken} activated for ${session.customer_email}`);
    }
  }

  res.json({ received: true });
});

// 3. Проверка токена доступа (вызывается с frontend)
app.get('/api/verify-access/:token', (req, res) => {
  const token = req.params.token;
  const access = accessTokens.get(token);
  
  if (!access) {
    return res.status(404).json({ 
      valid: false, 
      error: 'Token not found' 
    });
  }
  
  if (access.status !== 'active') {
    return res.status(403).json({ 
      valid: false, 
      error: 'Token not activated yet' 
    });
  }
  
  // Проверка истечения срока (если установлен)
  if (access.expiresAt && new Date() > access.expiresAt) {
    return res.status(403).json({ 
      valid: false, 
      error: 'Token expired' 
    });
  }
  
  // Токен валидный
  res.json({
    valid: true,
    activatedAt: access.activatedAt,
    customerEmail: access.customerEmail,
  });
});

// 4. Получение защищенного контента
app.get('/api/protected-content/:token', (req, res) => {
  const token = req.params.token;
  const access = accessTokens.get(token);
  
  if (!access || access.status !== 'active') {
    return res.status(403).json({ 
      error: 'Access denied. Invalid or inactive token.' 
    });
  }
  
  // Возвращаем защищенный контент
  res.json({
    content: {
      message: 'Добро пожаловать в закрытый раздел!',
      videos: [
        'https://example.com/video1.mp4',
        'https://example.com/video2.mp4'
      ],
      documents: [
        'https://example.com/guide.pdf'
      ],
      specialFeatures: true
    },
    accessInfo: {
      activatedAt: access.activatedAt,
      email: access.customerEmail
    }
  });
});

// 5. Статистика (опционально, для проверки)
app.get('/api/stats', (req, res) => {
  const stats = {
    totalTokens: accessTokens.size,
    activeTokens: Array.from(accessTokens.values()).filter(t => t.status === 'active').length,
    pendingTokens: Array.from(accessTokens.values()).filter(t => t.status === 'pending').length,
  };
  
  res.json(stats);
});

// Очистка истекших токенов каждый час
setInterval(() => {
  const now = new Date();
  let cleaned = 0;
  
  for (const [token, data] of accessTokens.entries()) {
    // Удаляем pending токены старше 24 часов
    if (data.status === 'pending') {
      const age = now - new Date(data.createdAt);
      if (age > 24 * 60 * 60 * 1000) {
        accessTokens.delete(token);
        cleaned++;
      }
    }
    
    // Удаляем истекшие токены
    if (data.expiresAt && now > data.expiresAt) {
      accessTokens.delete(token);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} expired tokens`);
  }
}, 60 * 60 * 1000); // Каждый час

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Stripe API running on port ${PORT}`);
  console.log(`📝 Webhook: http://localhost:${PORT}/api/webhook`);
  console.log(`🔐 Active tokens: ${accessTokens.size}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
