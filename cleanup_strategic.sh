#!/bin/bash

# 🧹 PULIZIA STRATEGICA - AttachmentAnalyzer
# Script per rimuovere solo i file obsoleti mantenendo le cartelle funzionali

echo "🧹 PULIZIA STRATEGICA REPOSITORY"
echo "================================"

# Verifica esistenza backup
if [ ! -d "backup_python_ml" ]; then
    echo "❌ Backup non trovato! Esegui prima ./backup_python_ml.sh"
    exit 1
fi

echo "📊 STATO ATTUALE:"
echo "- Repository size: $(du -sh . | cut -f1)"
echo "- attached_assets: $(du -sh attached_assets/ 2>/dev/null | cut -f1 || echo 'Non trovata')"
echo ""

# Rimuovi cartella attached_assets
echo "🗑️  Rimuovo attached_assets/..."
if [ -d "attached_assets" ]; then
    rm -rf attached_assets/
    echo "✅ attached_assets/ rimossa"
else
    echo "⚠️  attached_assets/ non presente"
fi

# Rimuovi file temporanei
echo "🗑️  Rimuovo file temporanei..."
files_to_remove=(
    "typescript-fix.md"
    "save-project.sh"
    "verify-system.sh"
)

for file in "${files_to_remove[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo "✅ $file rimosso"
    else
        echo "⚠️  $file non presente"
    fi
done

# Verifica cartelle funzionali
echo ""
echo "📁 VERIFICA CARTELLE FUNZIONALI:"
if [ -d "server/assets/keypoints_pt" ]; then
    echo "✅ server/assets/keypoints_pt/ mantenuta"
else
    echo "❌ server/assets/keypoints_pt/ mancante"
fi

if [ -d "server/assets/video_pt" ]; then
    echo "✅ server/assets/video_pt/ mantenuta"
else
    echo "❌ server/assets/video_pt/ mancante"
fi

echo ""
echo "📊 RISULTATO PULIZIA:"
echo "- Repository size: $(du -sh . | cut -f1)"
echo "- Files rimossi: $(echo "${files_to_remove[@]}" | wc -w) + attached_assets/"
echo "- Backup preservato: backup_python_ml/"
echo "- Cartelle funzionali: mantenute"
echo ""
echo "🎉 PULIZIA COMPLETATA CON SUCCESSO!"
echo "Repository più snello e organizzato 🚀"
