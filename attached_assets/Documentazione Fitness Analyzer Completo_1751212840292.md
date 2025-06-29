# Documentazione Fitness Analyzer Completo

## Introduzione

Fitness Analyzer Completo è una piattaforma integrata per l'analisi del movimento e il fitness tracking, che combina analisi biomeccanica avanzata con funzionalità moderne come gamification, dashboard personalizzate, piani di allenamento e integrazione con dispositivi wearable.

Questa versione rappresenta l'evoluzione del software originale, con l'integrazione di tutte le funzionalità mancanti per renderlo una piattaforma fitness completa e competitiva.

## Funzionalità Principali

### Analisi del Movimento
- Rilevamento keypoints 3D tramite MediaPipe
- Analisi biomeccanica con ChatGPT
- Feedback personalizzato in tempo reale
- Supporto per diversi esercizi (squat, push-up, lunge)

### Autenticazione e Gestione Utenti
- Registrazione e login utenti
- Profili personalizzati
- Autenticazione sicura con JWT
- Gestione livelli di fitness e obiettivi

### Dashboard e Analytics
- Statistiche personalizzate
- Visualizzazione progressi
- Storico allenamenti
- Grafici di performance

### Gamification
- Sistema di achievement e badge
- Tracking streak per giorni consecutivi
- Riconoscimenti per precisione e costanza

### Piani di Allenamento
- Generazione piani personalizzati
- Adattamento in base al livello utente
- Organizzazione per giorni e tipi di esercizio
- Modifica e gestione piani

### Integrazione Wearable
- Connessione con Fitbit
- Sincronizzazione dati biometrici
- Analisi dati salute
- Visualizzazione integrata nella dashboard

### Monetizzazione
- Sistema di abbonamenti
- Integrazione con Stripe
- Diversi piani di sottoscrizione
- Gestione pagamenti

### Conformità GDPR
- Esportazione dati utente
- Diritto all'oblio
- Gestione consensi
- Protezione dati sensibili

## Architettura del Sistema

### Backend
- FastAPI per API REST e WebSocket
- SQLite per sviluppo (PostgreSQL consigliato per produzione)
- Redis per caching e sessioni
- JWT per autenticazione
- MediaPipe per analisi movimento
- OpenAI API per analisi biomeccanica

### Frontend
- Vue.js 3 con Pinia per gestione stato
- Componenti modulari
- Routing protetto
- Visualizzazione dati con Chart.js
- Interfaccia responsive

## Requisiti di Sistema

### Software
- Python 3.11+
- Node.js 14+
- Redis
- Browser moderno (Chrome, Firefox, Edge)

### Hardware
- CPU: 4+ core
- RAM: 8+ GB
- Spazio su disco: 1+ GB
- Webcam con risoluzione 720p o superiore

## Installazione

### 1. Preparazione Ambiente
```bash
# Clona il repository
git clone https://github.com/example/fitness-analyzer-complete.git
cd fitness-analyzer-complete

# Crea ambiente virtuale Python
python -m venv venv
source venv/bin/activate  # Linux/Mac
# oppure
venv\Scripts\activate  # Windows
```

### 2. Installazione Backend
```bash
cd backend
pip install -r requirements.txt

# Configura variabili ambiente
cp .env.example .env
# Modifica .env con le tue configurazioni

# Inizializza database
python -m src.models.database
```

### 3. Installazione Frontend
```bash
cd ../frontend
npm install
```

### 4. Avvio del Sistema
```bash
# Avvia backend
cd ../backend
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

# In un altro terminale, avvia frontend
cd ../frontend
npm run dev
```

## Configurazione

### Configurazione Backend (.env)
```
# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=True

# Database
DATABASE_URL=sqlite:///./fitness.db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
SECRET_KEY=your-256-bit-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# OpenAI
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4

# Stripe
STRIPE_API_KEY=your-stripe-key

# Fitbit
FITBIT_CLIENT_ID=your-fitbit-client-id
FITBIT_CLIENT_SECRET=your-fitbit-client-secret
```

### Configurazione Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api/v1
```

## Utilizzo

### Accesso all'Applicazione
1. Apri il browser e naviga a: `http://localhost:5173`
2. Registra un nuovo account o accedi con credenziali esistenti
3. Esplora la dashboard e le funzionalità disponibili

### Analisi del Movimento
1. Vai alla sezione "Analisi Movimento"
2. Clicca su "Inizia Analisi" per avviare la webcam
3. Posizionati in modo che il corpo sia completamente visibile
4. Esegui uno degli esercizi supportati
5. Clicca su "Analizza" per ricevere feedback
6. Visualizza il feedback dettagliato e i suggerimenti

### Dashboard
1. Visualizza le statistiche principali nella dashboard
2. Controlla il tuo streak attuale
3. Esplora i grafici di performance
4. Visualizza le sessioni recenti e gli achievement

### Piani di Allenamento
1. Vai alla sezione "Piani di Allenamento"
2. Genera un nuovo piano personalizzato
3. Visualizza gli esercizi per ogni giorno
4. Segui il piano e traccia i progressi

### Integrazione Wearable
1. Vai alla sezione "Impostazioni"
2. Seleziona "Integrazioni"
3. Connetti il tuo account Fitbit
4. Sincronizza i dati di salute
5. Visualizza i dati biometrici nella dashboard

### Abbonamenti
1. Vai alla sezione "Abbonamenti"
2. Visualizza i piani disponibili
3. Seleziona un piano e procedi al pagamento
4. Gestisci il tuo abbonamento attivo

## Struttura del Progetto

```
fitness_analyzer_complete/
├── backend/
│   ├── requirements.txt
│   ├── src/
│   │   ├── api/
│   │   │   ├── main.py
│   │   │   ├── auth/
│   │   │   ├── dashboard.py
│   │   │   ├── gamification.py
│   │   │   ├── plans.py
│   │   │   ├── payments.py
│   │   │   ├── wearable.py
│   │   │   └── gdpr.py
│   │   ├── config/
│   │   │   └── settings.py
│   │   ├── models/
│   │   │   ├── database.py
│   │   │   ├── user.py
│   │   │   └── achievement.py
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── gamification/
│   │   │   ├── workout/
│   │   │   ├── wearable/
│   │   │   ├── payment/
│   │   │   ├── gdpr/
│   │   │   ├── video_processor.py
│   │   │   ├── chatgpt_analyzer.py
│   │   │   └── movement_analysis_service.py
│   │   ├── data/
│   │   ├── uploads/
│   │   └── logs/
│   └── tests/
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── MovementAnalysis/
│       │   ├── Dashboard/
│       │   ├── Auth/
│       │   ├── Gamification/
│       │   ├── WorkoutPlans/
│       │   └── Settings/
│       ├── views/
│       │   ├── Home.vue
│       │   ├── Login.vue
│       │   ├── Register.vue
│       │   ├── Dashboard.vue
│       │   ├── Profile.vue
│       │   ├── WorkoutPlans.vue
│       │   └── Subscription.vue
│       ├── store/
│       │   ├── auth.js
│       │   ├── movement.js
│       │   └── gamification.js
│       ├── router/
│       │   └── index.js
│       └── services/
│           ├── api.js
│           ├── auth.js
│           └── dashboard.js
├── scripts/
│   └── start.sh
└── docs/
    ├── documentazione.md
    └── guida_utente.md
```

## API Reference

### Autenticazione
- `POST /api/v1/register` - Registrazione nuovo utente
- `POST /api/v1/token` - Login e ottenimento token JWT
- `GET /api/v1/users/me` - Profilo utente corrente

### Dashboard
- `GET /api/v1/dashboard/stats` - Statistiche utente
- `GET /api/v1/dashboard/performance` - Dati performance
- `GET /api/v1/dashboard/recent-sessions` - Sessioni recenti

### Gamification
- `GET /api/v1/gamification/achievements` - Achievement utente
- `GET /api/v1/gamification/streak` - Streak attuale
- `POST /api/v1/gamification/check-session` - Verifica achievement per sessione

### Piani di Allenamento
- `GET /api/v1/workout-plans/` - Piani utente
- `POST /api/v1/workout-plans/generate` - Genera nuovo piano
- `GET /api/v1/workout-plans/{plan_id}` - Dettagli piano
- `PUT /api/v1/workout-plans/{plan_id}` - Aggiorna piano
- `DELETE /api/v1/workout-plans/{plan_id}` - Elimina piano

### Wearable
- `GET /api/v1/wearable/integrations` - Integrazioni wearable
- `POST /api/v1/wearable/connect/fitbit` - Connetti Fitbit
- `POST /api/v1/wearable/sync` - Sincronizza dati
- `GET /api/v1/wearable/health-data` - Dati salute
- `DELETE /api/v1/wearable/disconnect/{provider}` - Disconnetti provider

### Pagamenti
- `GET /api/v1/payments/subscriptions` - Abbonamenti utente
- `POST /api/v1/payments/create-subscription` - Crea abbonamento
- `GET /api/v1/payments/plans` - Piani disponibili
- `POST /api/v1/payments/cancel-subscription/{subscription_id}` - Cancella abbonamento

### GDPR
- `GET /api/v1/gdpr/data` - Dati personali utente
- `POST /api/v1/gdpr/data/export` - Esporta dati
- `DELETE /api/v1/gdpr/data` - Elimina dati (diritto all'oblio)
- `PUT /api/v1/gdpr/consent` - Aggiorna consensi
- `GET /api/v1/gdpr/consent` - Consensi attuali

### Analisi Movimento
- `POST /api/v1/movement/sessions/` - Avvia sessione
- `POST /api/v1/movement/sessions/{session_id}/frames/` - Processa frame
- `POST /api/v1/movement/sessions/{session_id}/complete/` - Completa sessione
- `WebSocket /ws/movement/{user_id}` - Analisi in tempo reale

## Limitazioni Note

1. **Simulazione Servizi Esterni**
   - L'integrazione con Fitbit utilizza dati simulati
   - L'integrazione con Stripe è simulata per scopi dimostrativi

2. **Database**
   - Utilizzo di SQLite per sviluppo, necessaria migrazione a PostgreSQL per produzione

3. **Ottimizzazione Performance**
   - Necessario implementare caching più avanzato per gestire molti utenti simultanei

## Sviluppi Futuri

1. **App Mobile**
   - Sviluppo app nativa per iOS e Android
   - Sincronizzazione con piattaforma web

2. **Analisi Avanzata**
   - Supporto per più esercizi e varianti
   - Analisi sequenze complete di allenamento
   - Modelli AI locali per funzionamento offline

3. **Comunità e Social**
   - Funzionalità social e condivisione
   - Allenamenti di gruppo virtuali
   - Sistema di coaching e mentoring

4. **Integrazione IoT**
   - Supporto per più dispositivi wearable
   - Integrazione con attrezzature smart gym

## Supporto e Contatti

Per assistenza tecnica o segnalazione bug, contattare il team di sviluppo.

---

© 2025 Fitness Analyzer Team
