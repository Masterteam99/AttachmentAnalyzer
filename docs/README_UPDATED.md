# AttachmentAnalyzer - Fitness Tracker Completo

## 🎯 Descrizione
Piattaforma fullstack avanzata per analisi fitness che combina analisi biomeccanica AI, gamification, integrazione wearable e gestione utenti completa. Il sistema utiliza React/TypeScript per il frontend e Node.js/Express per il backend.

## 🚀 Funzionalità Principali

### 🏋️ Analisi Movimento
- **Analisi biomeccanica** in tempo reale con MediaPipe
- **Feedback AI** personalizzato tramite OpenAI GPT-4
- **Correzione posturale** automatica per esercizi

### 👤 Gestione Utenti
- **Autenticazione sicura** con Replit Auth + JWT
- **Profili personalizzati** con livelli fitness
- **Conformità GDPR** completa

### 📊 Dashboard & Analytics
- **Statistiche avanzate** personalizzate
- **Grafici performance** interattivi
- **Tracking progressi** a lungo termine

### 🏆 Gamification
- **Sistema achievement** con badge
- **Streak tracking** per motivazione
- **Riconoscimenti** automatici

### 💳 Monetizzazione
- **Integrazione Stripe** per abbonamenti
- **Piani multipli** di sottoscrizione
- **Gestione pagamenti** sicura

### 📱 Integrazione Wearable
- **Sincronizzazione** dispositivi fitness
- **API multiple** (Fitbit, Apple Health)
- **Dati biometrici** unificati

## 📋 Requisiti di Sistema

### Software Necessario
- **Node.js** 18+
- **PostgreSQL** 13+ (o Neon Database)
- **Redis** (per caching, opzionale)

### Variabili d'Ambiente
```bash
# Copia il file di esempio
cp .env.example .env

# Configura le seguenti variabili:
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
```

## 🛠️ Installazione

### 1. Setup Iniziale
```bash
# Clona e installa dipendenze
git clone <repository-url>
cd AttachmentAnalyzer
npm install
```

### 2. Configurazione Database
```bash
# Setup database schema
npm run db:push

# Verifica configurazione
npm run check
```

### 3. Avvio Sviluppo
```bash
# Server di sviluppo (porta 5000)
npm run dev

# In parallelo, tests in watch mode
npm run test:ui
```

## 🧪 Testing

### Eseguire Tests
```bash
# Tests automatici
npm test

# Tests con UI interattiva
npm run test:ui
```

### Struttura Tests
- **Backend**: `/tests/**/*.test.ts`
- **Frontend**: `/client/src/components/__tests__/**/*.test.tsx`

## 🏗️ Architettura

### Stack Tecnologico
```
Frontend:  React 18 + TypeScript + Vite
Backend:   Node.js + Express + TypeScript  
Database:  PostgreSQL + Drizzle ORM
Auth:      Replit Auth + JWT
UI:        Radix UI + Tailwind CSS
Testing:   Vitest + Testing Library
```

## 🔒 Sicurezza

### Misure Implementate
- ✅ **HTTPS** obbligatorio
- ✅ **JWT** per sessioni
- ✅ **Rate limiting** API
- ✅ **Validazione input** con Zod
- ✅ **GDPR compliance**
- ✅ **Stripe PCI DSS**

---

**Stato Progetto**: ✅ **Pronto per Produzione**  
**Ultimo Update**: 08/07/2025  
**Versione**: 1.0.0
