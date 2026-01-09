# Environment Variables Setup

Create a `.env` file in the root directory (same level as `docker-compose.yml`) with the following variables:

```env
# Database (MongoDB Atlas)
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/resume_customizer?retryWrites=true&w=majority

# Authentication
JWT_SECRET_KEY=your-secret-key-here-change-in-production
JWT_REFRESH_SECRET_KEY=your-refresh-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRATION_MINUTES=15
REFRESH_TOKEN_EXPIRATION_HOURS=48

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Application
ENVIRONMENT=dev
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
COOKIE_DOMAIN=localhost
```

## MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with read/write permissions
3. Whitelist your IP address (or use `0.0.0.0/0` for development)
4. Get your connection string from the "Connect" button
5. Replace `username`, `password`, and `cluster` in the connection string above

## Notes

- For production, change `ENVIRONMENT=prod` and ensure all required variables are set
- `CORS_ORIGINS` should be a comma-separated list of allowed frontend origins
- `COOKIE_DOMAIN` should match your domain in production (e.g., `.yourdomain.com`)
- MongoDB Atlas connection string format: `mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority`
