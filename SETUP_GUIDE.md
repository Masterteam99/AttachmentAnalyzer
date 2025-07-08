# 🔧 Guida Setup API e Servizi Esterni

Questa guida ti aiuta a configurare tutti i servizi esterni necessari per far funzionare AttachmentAnalyzer.

## 🗄️ Database (PostgreSQL)

### Opzione 1: Neon Database (Raccomandato)
1. Vai su [neon.tech](https://neon.tech)
2. Crea account gratuito
3. Crea nuovo progetto
4. Copia la connection string
5. Aggiungi al `.env`: `DATABASE_URL=postgresql://...`

### Opzione 2: PostgreSQL Locale
```bash
# Installa PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Crea database
sudo -u postgres createdb fitness_analyzer

# Crea utente
sudo -u postgres createuser --interactive
```

## 🤖 OpenAI API

### Setup
1. Vai su [platform.openai.com](https://platform.openai.com)
2. Crea account e aggiungi metodo di pagamento
3. Vai in API Keys → Create new secret key
4. Aggiungi al `.env`: `OPENAI_API_KEY=sk-...`

### Costi Stimati
- **GPT-4**: ~$0.03 per analisi movimento
- **Budget mensile**: $20-50 per uso medio

## 💳 Stripe Payments

### Setup Account
1. Vai su [stripe.com](https://stripe.com)
2. Crea account business
3. Completa verifica identità
4. Attiva modalità live quando pronto

### Configurazione
```bash
# Test Keys (per sviluppo)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Crea prodotto e prezzo
# Dashboard → Products → Add Product
# Copia Price ID
STRIPE_PRICE_ID=price_...
```

### Webhook Setup
1. Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Events: `customer.subscription.*`, `invoice.*`
4. Copia webhook secret: `STRIPE_WEBHOOK_SECRET=whsec_...`

## 📱 Fitbit Integration

### Developer Account
1. Vai su [dev.fitbit.com](https://dev.fitbit.com)
2. Registra applicazione
3. Configura OAuth callback: `https://yourdomain.com/api/wearables/fitbit/callback`

### Configurazione
```bash
FITBIT_CLIENT_ID=your_client_id
FITBIT_CLIENT_SECRET=your_client_secret
```

## 🔐 Replit Auth (Se su Replit)

### Automatico su Replit
- Auth è automaticamente configurato
- Usa le variabili ambiente di Replit

### Self-Hosted
```bash
# Genera chiavi segrete sicure
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
```

## 📧 Email Service (Opzionale)

### Gmail Setup
1. Abilita 2FA su Gmail
2. Genera App Password
3. Configura variabili:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🗂️ Redis (Caching - Opzionale)

### Locale
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# Start service
sudo systemctl start redis-server
```

### Cloud (Upstash)
1. Vai su [upstash.com](https://upstash.com)
2. Crea database Redis
3. Copia URL: `REDIS_URL=redis://...`

## ✅ Checklist Configurazione

### Obbligatori per Funzionamento Base
- [ ] **DATABASE_URL** - Database PostgreSQL
- [ ] **JWT_SECRET** - Chiave JWT (genera casuale)
- [ ] **SESSION_SECRET** - Chiave sessioni

### Per Analisi AI
- [ ] **OPENAI_API_KEY** - Analisi movimento

### Per Pagamenti
- [ ] **STRIPE_SECRET_KEY** - Pagamenti
- [ ] **STRIPE_PRICE_ID** - Prezzo abbonamento
- [ ] **STRIPE_WEBHOOK_SECRET** - Webhook events

### Per Wearables
- [ ] **FITBIT_CLIENT_ID** - Integrazione Fitbit
- [ ] **FITBIT_CLIENT_SECRET** - Fitbit secret

### Opzionali
- [ ] **REDIS_URL** - Performance caching
- [ ] **EMAIL_HOST** - Notifiche email

## 🧪 Verifica Configurazione

```bash
# Test database connection
npm run db:push

# Test server startup
npm run dev

# Verifica API endpoints
curl http://localhost:5000/api/health
```

## 🔧 Troubleshooting

### Database Issues
```bash
# Reset database
npm run db:reset

# Check connection
npm run db:status
```

### API Issues
```bash
# Test OpenAI
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Test Stripe
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

## 🚀 Deploy Checklist

### Ambiente Produzione
- [ ] Sostituisci tutte le chiavi test con quelle live
- [ ] Configura HTTPS
- [ ] Setup monitoring (Sentry, DataDog)
- [ ] Configura backup database
- [ ] Test load testing

### Sicurezza
- [ ] Variabili ambiente non in git
- [ ] CORS configurato correttamente  
- [ ] Rate limiting attivo
- [ ] SSL/TLS certificati validi

---

**Hai bisogno di aiuto?** Apri un issue o consulta la documentazione ufficiale di ogni servizio.
