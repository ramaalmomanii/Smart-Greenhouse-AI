# Smart Irrigation System Frontend

This project contains the frontend for the Smart Irrigation System, a graduation project that demonstrates IoT-based intelligent water management.

## Project Structure

The frontend is organized into two main sections:

1. **Landing Page**: A modern, responsive landing page that introduces the project, its features, the supervising professor, and the team members.

2. **Dashboard**: A real-time monitoring and control interface for the Smart Irrigation System, displaying sensor data, water levels, and providing pump control functionality.

## Integration

The project uses React Router to seamlessly integrate both the landing page and dashboard:

- `/` - Landing page
- `/dashboard` - Interactive dashboard

## Features

### Landing Page
- Modern, responsive design with animations
- Project overview and features
- Team member profiles
- Dashboard status detection (online/offline)
- Navigation to the dashboard

### Dashboard
- Real-time sensor data monitoring
- Water level display in milliliters (ml)
- Pump control
- AI-powered irrigation decision support
- Historical data display

## Setup

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm run start
```

3. Build for production:
```
npm run build
```

## Technologies Used

- React
- React Router
- Axios for API requests
- TailwindCSS for styling
- Chart.js for data visualization
- Gemini AI for irrigation decisions

## Team Members

- Feras Al-Momani (Team Leader) - Backend Development & IoT Integration
- Rama Al-Momani - Frontend Development & UI/UX Design
- Tasneem Al-Omari - Hardware Design & Sensor Integration
- Raghad Al-Lahham - AI Integration & Data Analysis

## Supervising Professor

Dr. Raad Al-Khatib - Associate Professor, Faculty of Engineering 