# Typing Tutor Application

## Overview

This is a modern web-based typing tutor application built with Flask that helps users learn touch typing through 21 progressive lessons. The application features user authentication, progress tracking, achievement systems, and real-time typing feedback with virtual keyboard visualization. Users must achieve 95% accuracy to advance through lessons, ensuring proper skill development before progression.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Web Framework Architecture
- **Flask-based MVC pattern**: Uses Flask as the core web framework with clear separation between models, views (templates), and controllers (routes)
- **SQLAlchemy ORM**: Database operations handled through SQLAlchemy with declarative models for clean data abstraction
- **Flask-Login integration**: User session management and authentication handled through Flask-Login extension
- **Jinja2 templating**: Server-side rendering with template inheritance for consistent UI structure

### Database Design
- **SQLite default with PostgreSQL support**: Uses SQLite for development with configurable database URI for production PostgreSQL deployment
- **User management**: User model with secure password hashing using Werkzeug security utilities
- **Progress tracking**: Dedicated Progress model linking users to lessons with performance metrics (WPM, accuracy, completion time)
- **Achievement system**: Achievement model for gamification and user engagement
- **Lesson management**: Static lesson content stored in text files with database metadata

### Frontend Architecture
- **Progressive enhancement**: Core functionality works without JavaScript, enhanced with interactive features
- **Virtual keyboard visualization**: Real-time finger position guidance with color-coded key highlighting
- **Responsive design**: CSS Grid and Flexbox layout with mobile-first responsive design
- **Real-time feedback**: Live WPM, accuracy, and error tracking during typing practice

### Authentication & Security
- **Session-based authentication**: Flask-Login manages user sessions with secure session cookies
- **Password security**: Werkzeug password hashing with salt for secure credential storage
- **Environment-based configuration**: Sensitive data (session secrets, database URLs) managed through environment variables

### Lesson Progression System
- **Accuracy gates**: 95% accuracy requirement enforced before lesson advancement
- **Progressive difficulty**: 21 lessons starting with basic finger positioning, advancing to full sentences
- **Performance analytics**: Detailed statistics tracking with grade calculations based on WPM and accuracy

## External Dependencies

### Core Dependencies
- **Flask**: Web framework for routing, templating, and request handling
- **Flask-SQLAlchemy**: Database ORM for model management and queries
- **Flask-Login**: User authentication and session management
- **Werkzeug**: WSGI utilities including password hashing and proxy handling

### Frontend Assets
- **Google Fonts**: Inter font family for UI text and Fira Code for monospace typing areas
- **Font Awesome**: Icon library for consistent iconography throughout the application
- **Custom CSS**: No external CSS frameworks, using custom CSS with CSS custom properties for theming

### Infrastructure
- **SQLite/PostgreSQL**: Database storage with SQLite for development and PostgreSQL support for production
- **Static file serving**: Flask's built-in static file serving for CSS, JavaScript, and assets
- **Environment configuration**: Support for DATABASE_URL and SESSION_SECRET environment variables for deployment flexibility