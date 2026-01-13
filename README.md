# Resumaker

A full-stack web application for creating professional, customizable PDF resumes with AI-powered content generation and intelligent element selection. Build multiple resume versions tailored to different job applications.

## Features

- **User Authentication**: Secure JWT-based authentication with refresh tokens stored in httpOnly cookies
- **Comprehensive Resume Management**: CRUD operations for all resume sections:
  - Heading (Personal Information)
  - Education
  - Work Experience
  - Projects
  - Skills
  - Certifications
  - Awards
  - Volunteer Experience
- **Multiple Resume Versions**: Create and manage multiple resume versions with different selected elements
- **AI-Powered Features**:
  - Generate subpoints for experiences and projects
  - Rephrase titles and content
  - Intelligent element selection based on job descriptions
- **PDF Generation**: Compile LaTeX resumes to professional PDFs stored in Cloudinary
- **Resume Extraction**: Upload existing PDF resumes and extract data using AI
- **Payment Integration**: Razorpay integration for purchasing credits
- **Admin Dashboard**: Analytics and monitoring for user activity, AI usage, and PDF generation
- **Credit System**: Manage AI usage and PDF generation with a credit-based system

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Radix UI** components
- **Axios** for API calls

### Backend
- **FastAPI** (Python) for REST API
- **MongoDB Atlas** for database
- **JWT** for authentication
- **LaTeX** for PDF generation
- **OpenAI API** for AI features
- **Cloudinary** for PDF and image storage
- **Razorpay** for payment processing
- **SMTP (Gmail)** for email services

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) and npm
- **Docker** and Docker Compose
- **MongoDB Atlas** account (free tier available)
- **Cloudinary** account (for PDF storage)
- **OpenAI API** key (for AI features)
- **Razorpay** account (for payment integration)
- **Gmail** account with app password (for email services)

## Quick Start

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm i
   ```

3. Create a `.env` file in the `frontend` directory:
   ```env
   VITE_BACKEND_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

For more details, see [frontend/README.md](frontend/README.md)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file in the `backend` directory (see [backend/ENV_SETUP.md](backend/ENV_SETUP.md) for all required variables):
   ```env
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/resume_customizer?retryWrites=true&w=majority
   JWT_SECRET_KEY=your-secret-key-here
   JWT_REFRESH_SECRET_KEY=your-refresh-secret-key-here
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRATION_MINUTES=15
   REFRESH_TOKEN_EXPIRATION_HOURS=48
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   OPENAI_API_KEY=your-openai-api-key
   SMTP_EMAIL=your-email@gmail.com
   SMTP_APP_PASSWORD=your-gmail-app-password
   RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-key-secret
   ENVIRONMENT=dev
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   COOKIE_DOMAIN=localhost
   ```

3. Run with Docker Compose:
   ```bash
   docker-compose up
   ```

   The API will be available at `http://localhost:8000`

For more details, see [backend/README.md](backend/README.md) and [backend/ENV_SETUP.md](backend/ENV_SETUP.md)

## Project Structure

```
Resume_Customizer/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── api/             # API client functions
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── router/          # Routing configuration
│   │   ├── store/           # Redux store and slices
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── README.md
├── backend/                  # FastAPI backend application
│   ├── app/
│   │   ├── main.py          # FastAPI application entry point
│   │   ├── database.py      # MongoDB connection
│   │   ├── middleware/      # Authentication middleware
│   │   ├── models/          # Pydantic schemas
│   │   ├── routers/         # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── settings/        # Environment variables
│   │   ├── templates/       # LaTeX templates
│   │   └── utils/           # Utility functions
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── README.md
│   └── ENV_SETUP.md
└── README.md                 # This file
```

## Environment Variables

### Frontend
- `VITE_BACKEND_URL`: Backend API URL (default: `http://localhost:8000`)

See [frontend/README.md](frontend/README.md) for more details.

### Backend
The backend requires multiple environment variables for:
- Database (MongoDB Atlas)
- Authentication (JWT)
- Cloudinary (PDF storage)
- OpenAI (AI features)
- Email (SMTP/Gmail)
- Payment (Razorpay)
- Application settings

See [backend/ENV_SETUP.md](backend/ENV_SETUP.md) for complete list and setup instructions.

## Development

### Frontend Development
```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
```

### Backend Development
```bash
cd backend
docker-compose up --build    # Run with Docker
# OR
uvicorn app.main:app --reload    # Run locally (requires Python environment)
```

## API Documentation

When the backend is running, API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## License

MIT

---

Made with ❤️ by Debdip for the dev community
