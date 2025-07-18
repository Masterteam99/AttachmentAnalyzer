# Sistema di Trigger Biomeccanici

## 📋 Come Funziona

Il sistema ora legge i trigger biomeccanici dal foglio di calcolo `regole_biomeccaniche.csv` che creerai tu.

## 🔧 Struttura del Foglio di Calcolo

Il file CSV deve avere queste colonne:

| Colonna | Descrizione | Esempio |
|---------|-------------|---------|
| `esercizio` | Nome dell'esercizio (squat, push_up, lunges, crunch, reverse_crunch) | squat |
| `articolazione` | Angolo/metrica da misurare | knee_valgus |
| `condizione` | Operatore di confronto (>, <, >=, =) | > |
| `limite` | Valore soglia in gradi o unità | 15 |
| `errore` | Codice identificativo dell'errore | knee_cave |
| `descrizioneErrore` | Descrizione dell'errore per l'utente | Ginocchia che cedono verso l'interno |
| `suggerimento` | Consiglio correttivo | Spingi le ginocchia verso l'esterno |
| `severita` | Gravità (low, medium, high, critical) | critical |

## 🎯 Sistema di Analisi Tripla

Quando analizzi un movimento, il sistema combina:

1. **Analisi GPT-4** (33%) - Valutazione intelligente
2. **Confronto PT** (33%) - Comparazione con video di riferimento  
3. **Trigger Biomeccanici** (34%) - I tuoi trigger dal foglio di calcolo

## 📊 Metriche Disponibili

Il sistema calcola automaticamente questi angoli dai keypoints:

- `knee_angle` - Angolo del ginocchio
- `hip_angle` - Angolo dell'anca
- `back_angle` - Inclinazione della schiena
- `ankle_angle` - Angolo della caviglia
- `knee_valgus` - Cedimento delle ginocchia
- `elbow_angle` - Angolo del gomito
- `hip_alignment` - Allineamento fianchi
- `shoulder_protraction` - Protrazione spalle
- `neck_alignment` - Allineamento collo
- `knee_tracking` - Tracking del ginocchio
- `neck_strain` - Tensione del collo
- `momentum` - Slancio del movimento
- `control` - Controllo del movimento
- E molti altri...

## 🚀 Come Usare

1. **Crea il file**: `server/assets/regole_biomeccaniche.csv`
2. **Definisci i trigger**: Usa il template fornito come base
3. **Personalizza le regole**: Aggiungi i tuoi trigger specifici
4. **Il sistema li leggerà automaticamente** durante l'analisi

## 💡 Esempio di Trigger

```csv
squat,knee_valgus,>,15,knee_cave,Ginocchia che cedono verso l'interno,Spingi le ginocchia verso l'esterno,critical
```

Questo trigger si attiva quando l'angolo di valgismo del ginocchio supera i 15°.

## 🔄 Feedback Finale

Il feedback finale combina tutti e 3 i sistemi e mostra:
- Score complessivo (0-100)
- Errori critici dai trigger
- Suggerimenti correttivi
- Punti di forza identificati
