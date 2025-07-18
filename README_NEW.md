# 🏋️ AttachmentAnalyzer - AI Fitness Platform

**Piattaforma completa per analisi fitness con intelligenza artificiale, gamification e integrazione wearable.**

## ✨ **Funzionalità Principali**

### 🎯 **Analisi Movimento AI**
- Analisi biomeccanica in tempo reale
- Feedback correttivo personalizzato
- Punteggi forma fisica (0-100)
- Suggerimenti miglioramento specifici

### 📊 **Dashboard Personalizzata**
- Statistiche workout personalizzate
- Grafici progressi fitness
- Tracking streak giornalieri
- Analytics avanzati

### 🎮 **Sistema Gamification**
- Achievement e badge system
- Punti esperienza (XP)
- Classifiche competitive
- Sfide personali

### 🏋️ **Workout Plans AI**
- Piani generati con OpenAI
- Adattamento automatico difficoltà
- Progressioni personalizzate
- Integrazione esercizi

### 📱 **Integrazione Wearable**
- Supporto Fitbit
- Sync automatico dati
- Monitoraggio continuo
- API estendibile

## 🚀 **Quick Start**

### **Sviluppo Locale**
```bash
# 1. Installa dipendenze
npm install

# 2. Avvia in sviluppo
npm run dev

# 3. Apri browser
# http://localhost:5000
```

### **Deploy Produzione**
```bash
# 1. Build
npm run build

# 2. Avvia server
npm start
```

## ⚙️ **Configurazione API**

### **OpenAI (Richiesto)**
1. Vai su [platform.openai.com](https://platform.openai.com)
2. Crea API key
3. Aggiungi al `.env`: `OPENAI_API_KEY=sk-...`

### **Stripe (Opzionale)**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### **Database**
```env
# Sviluppo (SQLite - già configurato)
DATABASE_URL=file:./dev.db

# Produzione (PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:port/db
```

## 🌐 **Deployment**

### **Fly.io (Raccomandato)**
```bash
# 1. Installa Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
flyctl auth login

# 3. Deploy
flyctl deploy
```

### **Docker**
```bash
# Build image
docker build -t attachment-analyzer .

# Run container
docker run -p 5000:5000 attachment-analyzer
```

## 🏗️ **Architettura**

### **Stack Tecnologico**
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **AI**: OpenAI GPT-4 + Biomechanical Engine
- **UI**: Tailwind CSS + Radix UI + Shadcn
- **Auth**: JWT + Session management

### **Struttura Progetto**
```
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Schema condivisi
├── docs/           # Documentazione
├── fly.toml        # Configurazione Fly.io
├── Dockerfile      # Container config
└── package.json    # Dipendenze
```

## 🧪 **Testing**

```bash
# Test unitari
npm test

# Test UI interattivi  
npm run test:ui

# Type checking
npm run check
```

## 📖 **Funzionalità Dettagliate**

### **Analisi Movimento**
- Upload video esercizi
- Estrazione keypoints MediaPipe
- Analisi GPT-4 biomeccanica
- Engine regole biomeccaniche
- Comparazione personal trainer virtuali

### **Sistema Workout**
- Generazione AI piani personalizzati
- Adattamento difficoltà dinamico
- Timer esercizi integrato
- Tracking sessioni complete

### **Gamification**
- 20+ achievement types
- Sistema XP e livelli
- Streak tracking
- Badge personalizzati

### **Integrazione Wearable**
- API Fitbit nativa
- Sync dati automatico
- Estendibile per altri device
- Monitoraggio continuo

## 🔒 **Sicurezza & Privacy**

- ✅ **GDPR Compliant**
- ✅ **Data encryption**
- ✅ **JWT authentication**
- ✅ **Input validation**
- ✅ **Rate limiting**

## 📊 **Performance**

- ⚡ **Sub-second response times**
- 📱 **Mobile-first responsive**
- 🔄 **Real-time updates**
- 📈 **Optimized bundle size**

## 🛠️ **Sviluppo**

### **Requisiti**
- Node.js 18+
- npm o yarn
- Git

### **Setup Completo**
```bash
# Clone repository
git clone https://github.com/yourusername/AttachmentAnalyzer.git
cd AttachmentAnalyzer

# Installa dipendenze
npm install

# Configura environment
cp .env.example .env
# Modifica .env con le tue API keys

# Setup database
npm run db:push

# Avvia sviluppo
npm run dev
```

## 📞 **Supporto**

- 📚 **Documentazione**: `/docs`
- 🐛 **Bug Report**: GitHub Issues
- 💡 **Feature Request**: GitHub Discussions
- 📧 **Contatto**: [email]

---

**Stato**: ✅ **Pronto per produzione**  
**Versione**: 1.0.0  
**Ultimo aggiornamento**: Gennaio 2025

---

*Sviluppato con ❤️ usando tecnologie moderne e AI avanzata.*
