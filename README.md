# Taipei Travel 2026

A modern React-based travel planner app for Taipei trips, featuring itinerary management, expense tracking, flight and hotel information, and real-time map integration.

## Features

- **Home Dashboard**: Weather widget, flight/hotel previews, itinerary highlights, and expense summary
- **Itinerary Management**: Add, edit, and delete travel activities with Google Maps integration
- **Expense Tracking**: Track expenses in TWD with automatic HKD conversion and category summaries
- **Map Integration**: Embedded Google Maps for navigation
- **Trip Sync**: Share and sync travel information with companions
- **Real-time Data**: Firebase-powered real-time synchronization

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Firebase Firestore
- **AI**: Google Gemini (for location search)
- **Build Tool**: Vite

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Firebase configuration in `firebase-applet-config.json`
4. Set environment variable: `GEMINI_API_KEY=your-api-key`
5. Run development server: `npm run dev`

## Project Structure

```
src/
├── App.tsx          # Main application component
├── main.tsx         # Entry point
├── index.css        # Global styles with Tailwind
└── types.ts         # TypeScript interfaces
```

## License

SPDX-License-Identifier: Apache-2.0

