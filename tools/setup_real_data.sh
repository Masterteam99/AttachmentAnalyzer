#!/bin/bash
# Script per installare dipendenze e processare video PT

echo "🔧 Installazione dipendenze MediaPipe..."

# Installa MediaPipe e OpenCV
pip install mediapipe opencv-python

echo "📁 Verifica cartelle..."

# Crea cartelle se non esistono
mkdir -p /workspaces/AttachmentAnalyzer/server/assets/video_pt
mkdir -p /workspaces/AttachmentAnalyzer/server/assets/keypoints_pt

echo "✅ Setup completato!"
echo ""
echo "🎯 COME USARE:"
echo "1. Copia i tuoi video nella cartella: server/assets/video_pt/"
echo "2. Esegui: python tools/extract_keypoints.py server/assets/video_pt/squat.mp4"
echo "3. I keypoints saranno salvati automaticamente in: server/assets/keypoints_pt/"
echo ""
echo "📋 FORMATI SUPPORTATI:"
echo "- Video: .mp4, .webm, .mov"
echo "- Naming: squat.mp4, pushup.mp4, lunge.mp4, plank.mp4, burpee.mp4"
echo ""
echo "📊 OUTPUT:"
echo "- squat_keypoints.json con tutti i dati MediaPipe"
echo "- Metadata completi (fps, durata, timestamp)"
