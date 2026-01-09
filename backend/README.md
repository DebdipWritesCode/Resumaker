# Resume Customizer Backend

A FastAPI-based backend application for generating customizable PDF resumes using LaTeX. Features include user authentication, MongoDB Atlas storage, OpenAI integration for AI-powered content generation, and admin analytics.

## Features

- **User Authentication**: JWT-based authentication with refresh tokens (httpOnly cookies)
- **Resume Management**: CRUD operations for all resume sections (Education, Experience, Projects, Skills, etc.)
- **Resume Versions**: Create multiple resume versions with different selected entries
- **PDF Compilation**: Compile LaTeX resumes to PDF and store in Cloudinary
- **AI Integration**: OpenAI-powered content generation for subpoints, title rephrasing, and more
- **Admin Dashboard**: Analytics and monitoring for user activity, AI usage, and PDF generation

## Prerequisites

- Docker and Docker Compose installed on your system
- MongoDB Atlas account (free tier available)
- Cloudinary account (for PDF storage)
- OpenAI API key (for AI features)

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── database.py          # MongoDB connection
│   ├── middleware/          # Auth middleware
│   ├── settings/            # Environment variables
│   ├── models/              # Pydantic schemas
│   ├── routers/             # API route handlers
│   ├── services/            # Business logic
│   ├── utils/               # Utilities
│   └── templates/           # LaTeX templates
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .gitignore
├── .env (create this)
└── README.md
```

## Setup

1. **Clone the repository**

2. **Set up MongoDB Atlas**:
   - Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a database user and whitelist your IP
   - Get your connection string

3. **Create environment file**:
   Create a `.env` file in the root directory (see `ENV_SETUP.md` for details):
   ```env
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/resume_customizer?retryWrites=true&w=majority
   JWT_SECRET_KEY=your-secret-key
   JWT_REFRESH_SECRET_KEY=your-refresh-secret-key
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRATION_MINUTES=15
   REFRESH_TOKEN_EXPIRATION_HOURS=48
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   OPENAI_API_KEY=your-openai-api-key
   ENVIRONMENT=dev
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   COOKIE_DOMAIN=localhost
   ```

4. **Run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```

   The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns access token, sets refresh token cookie)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Resume Sections (Protected)
- `GET/POST/PUT/DELETE /api/heading` - Manage heading section
- Additional CRUD endpoints for Education, Experience, Projects, Skills, Certifications, Awards, Volunteer Experience

### Resume Versions
- `GET/POST/PUT/DELETE /api/resume-versions` - Manage resume versions

### PDF Compilation
- `POST /api/compile` - Compile resume to PDF

### AI Features (Protected)
- `POST /api/ai/generate-subpoints` - Generate subpoints using AI
- `POST /api/ai/rephrase-title` - Rephrase title using AI
- `POST /api/ai/rephrase-subpoints` - Rephrase subpoints using AI

### Admin (Admin Only)
- `GET /api/admin/users` - List all users with analytics
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/user/{user_id}` - User details
- `GET /api/admin/ai-usage` - AI usage statistics
- `GET /api/admin/pdf-stats` - PDF generation statistics

## Development

### Local Development (without Docker)

1. Create and activate virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Linux/Mac:
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up MongoDB Atlas (see setup instructions above)

4. Create `.env` file with your MongoDB Atlas connection string

5. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```

## Production Deployment

The Dockerfile is production-ready. You can:

1. **Build and push to a container registry:**
   ```bash
   docker build -t your-registry/resume-customizer:latest .
   docker push your-registry/resume-customizer:latest
   ```

2. **Deploy to cloud platforms:**
   - AWS ECS/Fargate
   - Google Cloud Run
   - Azure Container Instances
   - Kubernetes

## Notes

- The container includes TeX Live (LaTeX distribution) for Linux
- Refresh tokens are stored in httpOnly cookies for security
- Access tokens expire in 15 minutes, refresh tokens in 48 hours
- All PDFs are uploaded to Cloudinary for storage and retrieval
- AI usage is tracked for analytics and monitoring

## License

MIT

