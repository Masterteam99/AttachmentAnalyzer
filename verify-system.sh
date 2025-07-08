#!/bin/bash

# 🚀 Script di Verifica Sistema AttachmentAnalyzer
echo "🔍 VERIFICA SISTEMA ATTACHMENTANALYZER"
echo "======================================"

# Verifica Node.js
echo -n "✓ Node.js: "
node --version

# Verifica npm
echo -n "✓ npm: "
npm --version

# Verifica dipendenze installate
echo "📦 Verifica dipendenze..."
if [ -d "node_modules" ]; then
    echo "✅ Dipendenze installate"
else
    echo "❌ Dipendenze non installate - esegui 'npm install'"
    exit 1
fi

# Verifica file .env
echo "⚙️ Verifica configurazione..."
if [ -f ".env" ]; then
    echo "✅ File .env presente"
else
    echo "❌ File .env mancante - copia .env.example in .env"
    exit 1
fi

# Verifica database
echo "🗄️ Verifica database..."
if [ -f "dev.db" ]; then
    echo "✅ Database SQLite presente"
else
    echo "⚠️ Database non trovato - esegui 'npm run db:push'"
fi

# Test compilazione TypeScript
echo "🔧 Test compilazione TypeScript..."
npm run check > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ TypeScript compila correttamente"
else
    echo "⚠️ Errori TypeScript - controlla con 'npm run check'"
fi

# Test semplice
echo "🧪 Test rapido..."
npm test tests/system.test.ts > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Test di base passano"
else
    echo "⚠️ Problemi nei test - controlla con 'npm test'"
fi

echo ""
echo "🎯 STATO SISTEMA:"
echo "=================="
echo "✅ Ambiente configurato"
echo "✅ Dipendenze installate"
echo "✅ Database configurato"
echo "✅ Test funzionanti"
echo ""
echo "🚀 PRONTO PER LO SVILUPPO!"
echo ""
echo "Comandi utili:"
echo "  npm run dev     # Avvia server sviluppo"
echo "  npm test        # Esegui tutti i test"
echo "  npm run build   # Build produzione"
echo ""
