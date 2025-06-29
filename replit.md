# FitTracker Pro - Fitness Analytics Platform

## Overview

FitTracker Pro is a comprehensive AI-powered fitness analytics platform that combines real-time movement analysis, personalized workout planning, gamification, and wearable device integration. The application provides users with intelligent feedback on their exercise form, creates custom workout plans, tracks progress through achievements, and integrates with popular fitness wearables.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state, React hooks for local state
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Authentication**: Replit Auth integration
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with session management
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Store**: PostgreSQL-backed sessions using connect-pg-simple

### Payment Integration
- **Provider**: Stripe for subscription management
- **Features**: Multiple subscription tiers, webhook handling, customer management

## Key Components

### Movement Analysis System
- **AI Integration**: OpenAI GPT-4o for movement form analysis
- **Video Processing**: Webcam capture with simulated pose detection (MediaPipe integration ready)
- **Real-time Feedback**: Form scoring, corrections, and strengths identification
- **Exercise Support**: Multiple exercise types (squats, push-ups, lunges, etc.)

### Workout Management
- **AI-Generated Plans**: Personalized workout creation using OpenAI
- **Plan Customization**: Based on fitness level, goals, available time, and equipment
- **Exercise Library**: Comprehensive exercise database with difficulty levels
- **Progress Tracking**: Session recording and performance analytics

### Gamification System
- **Achievement Engine**: Multiple achievement types (streak, perfectionist, explorer)
- **Progress Tracking**: User statistics and milestone recognition
- **Motivation Features**: Badges, titles, and progress visualization

### Wearable Integration
- **Supported Devices**: Fitbit integration with extensible architecture
- **Data Synchronization**: Health metrics, heart rate, steps, sleep data
- **Health Analytics**: Integrated fitness and health data visualization

### User Management
- **Authentication**: Secure Replit Auth integration
- **Profile Management**: Fitness levels, goals, preferences
- **GDPR Compliance**: Data export and deletion capabilities
- **Subscription Management**: Tiered access control

## Data Flow

### Authentication Flow
1. User authentication handled by Replit Auth
2. Session management via PostgreSQL-backed storage
3. JWT-like token validation for API requests
4. Automatic session refresh and logout handling

### Workout Analysis Flow
1. User selects exercise type and starts webcam capture
2. Video data processed for pose keypoints (simulated currently)
3. Movement data sent to OpenAI for form analysis
4. AI provides form score, feedback, and recommendations
5. Results stored in database and displayed to user

### Data Synchronization Flow
1. Wearable devices connected via OAuth flow
2. Periodic synchronization of health data
3. Integration with workout sessions and analytics
4. Combined fitness and health insights generation

## External Dependencies

### AI Services
- **OpenAI GPT-4o**: Movement analysis and workout plan generation
- **MediaPipe** (planned): Real-time pose detection and keypoint extraction

### Third-Party Services
- **Stripe**: Payment processing and subscription management
- **Neon Database**: Serverless PostgreSQL hosting
- **Fitbit API**: Wearable device data synchronization

### Development Tools
- **Replit**: Development environment and authentication
- **Vite**: Build tool and development server
- **Drizzle Kit**: Database migrations and schema management

## Deployment Strategy

### Development Environment
- Replit-hosted development with hot reloading
- Vite development server with custom middleware
- PostgreSQL database provisioned automatically
- Environment variable management through Replit

### Production Build
- Vite builds client-side React application
- esbuild bundles server-side Express application
- Static assets served from dist/public directory
- Single Node.js process serves both API and static files

### Database Management
- Drizzle ORM handles database operations
- Schema migrations managed via drizzle-kit
- Connection pooling with Neon serverless PostgreSQL
- Session storage integrated with authentication system

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 29, 2025. Initial setup