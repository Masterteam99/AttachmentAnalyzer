#!/bin/bash

# 🗂️ BACKUP STRATEGICO FILE PYTHON - AttachmentAnalyzer
# Script per backup selettivo dei file Python utili per futuro ML

echo "📦 BACKUP STRATEGICO FILE PYTHON"
echo "================================="

# Crea directory backup
mkdir -p backup_python_ml/

# Files da preservare per futuro ML
echo "🔄 Backing up ML-relevant Python files..."

# Movement Analysis (ATTIVO - da preservare)
if [ -f "server/services/fitness_analyzer/movement_analysis.py" ]; then
    cp "server/services/fitness_analyzer/movement_analysis.py" backup_python_ml/
    echo "✅ movement_analysis.py → backup_python_ml/"
fi

# Workout Generator (logica ML utile)
if [ -f "attached_assets/workout_generator_1751212840301.py" ]; then
    cp "attached_assets/workout_generator_1751212840301.py" backup_python_ml/
    echo "✅ workout_generator.py → backup_python_ml/"
fi

# Gamification Service (algoritmi utili)
if [ -f "attached_assets/gamification_service_1751212840294.py" ]; then
    cp "attached_assets/gamification_service_1751212840294.py" backup_python_ml/
    echo "✅ gamification_service.py → backup_python_ml/"
fi

# Wearable Service (data processing)
if [ -f "attached_assets/wearable_service_1751212840300.py" ]; then
    cp "attached_assets/wearable_service_1751212840300.py" backup_python_ml/
    echo "✅ wearable_service.py → backup_python_ml/"
fi

# Database models (per reference)
if [ -f "attached_assets/database_1751212840292.py" ]; then
    cp "attached_assets/database_1751212840292.py" backup_python_ml/
    echo "✅ database_models.py → backup_python_ml/"
fi

# Settings (configurazione ML)
if [ -f "attached_assets/settings_1751212840298.py" ]; then
    cp "attached_assets/settings_1751212840298.py" backup_python_ml/
    echo "✅ settings.py → backup_python_ml/"
fi

# Crea documentazione backup
cat > backup_python_ml/README.md << 'EOF'
# 🐍 BACKUP PYTHON ML FILES

## Contenuto
File Python preservati per future implementazioni ML/AI:

- **movement_analysis.py** - Analisi movimento (ATTIVO)
- **workout_generator.py** - Logica generazione allenamenti
- **gamification_service.py** - Algoritmi gamification
- **wearable_service.py** - Processing dati wearable
- **database_models.py** - Modelli database Python
- **settings.py** - Configurazioni ML

## Utilizzo Futuro
Questi file contengono logica utile per:
- Algoritmi ML personalizzati
- Modelli di training
- Pipeline di data processing
- Analisi predittive

## Migrazione ML
I file possono essere utilizzati come base per:
1. Servizi ML dedicati
2. Modelli di training custom
3. Pipeline di elaborazione dati
4. Algoritmi di raccomandazione

Data Backup: $(date)
EOF

echo ""
echo "📊 BACKUP COMPLETATO"
echo "====================="
echo "Files preservati: $(ls -1 backup_python_ml/*.py | wc -l)"
echo "Dimensione backup: $(du -sh backup_python_ml/ | cut -f1)"
echo ""
echo "🎯 PROSSIMO PASSO: Rimuovere attached_assets/"
echo "Comando: rm -rf attached_assets/"
echo ""
echo "⚠️  ATTENZIONE: Mantenere cartelle funzionali:"
echo "   - server/assets/keypoints_pt/ (per caricamento keypoints)"
echo "   - server/assets/video_pt/ (per caricamento video PT)"
