# ML Services - Python Bridge

## Overview
This directory contains Python-based ML services that complement the main Node.js/TypeScript application.

## Architecture
- **Python Services**: Advanced ML/AI processing
- **FastAPI Bridge**: Micro-service for ML endpoints
- **Node.js Client**: Integration with main app

## Future ML Features
- Custom pose detection models
- Form analysis using Computer Vision
- Injury prediction algorithms
- Personalized workout recommendations
- Movement pattern analysis

## Setup
```bash
cd server/ml_services
pip install -r requirements.txt
python ml_api.py
```

## Integration
The Node.js app communicates with Python services via HTTP API calls to the FastAPI bridge.
