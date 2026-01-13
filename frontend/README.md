# Resume Customizer Frontend

React-based frontend application for the Resume Customizer platform. Built with React 19, TypeScript, Vite, and Redux Toolkit.

## Features

- Modern React 19 with TypeScript
- Vite for fast development and builds
- Redux Toolkit for state management
- Tailwind CSS for styling
- Radix UI components for accessible UI
- Responsive design with dark mode support

## Prerequisites

- Node.js (v18 or higher)
- npm

## Environment Variables

Create a `.env` file in the `frontend` directory with the following variable:

```env
VITE_BACKEND_URL=http://localhost:8000
```

**Note**: Replace `http://localhost:8000` with your backend API URL if it's running on a different host or port.

## Setup

1. Install dependencies:
   ```bash
   npm i
   ```

2. Create a `.env` file with `VITE_BACKEND_URL` (see above)

3. Start the development server:
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client functions
│   ├── components/       # Reusable React components
│   ├── pages/            # Page components
│   ├── router/           # Routing configuration
│   ├── store/            # Redux store and slices
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── public/               # Static assets
├── package.json
└── vite.config.ts        # Vite configuration
```
