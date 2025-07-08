# AttachmentAnalyzer

## Descrizione
Progetto fullstack per analisi fitness, gamification, wearable e gestione utenti, con frontend React/TypeScript e backend Node.js/Express.

## Come avviare il progetto

1. Installa le dipendenze:
   ```bash
   npm install
   ```
2. Avvia il backend in modalità sviluppo:
   ```bash
   npm run dev
   ```
3. Avvia il frontend (se separato):
   ```bash
   cd client && npm install && npm run dev
   ```

## Come eseguire i test

- Per eseguire tutti i test automatici:
  ```bash
  npm test
  ```
- Per usare l’interfaccia grafica dei test:
  ```bash
  npm run test:ui
  ```

## Struttura dei test
- I test backend sono in `/tests`
- I test frontend sono in `client/src/components/__tests__`

## Suggerimenti per sviluppatori
- Aggiungi test per ogni nuova funzione o componente.
- Aggiorna le dipendenze regolarmente e verifica le vulnerabilità con `npm audit`.
- Consulta la documentazione dei servizi in `/server` e `/client/src/services`.

---
Aggiornato automaticamente da GitHub Copilot il 08/07/2025.
