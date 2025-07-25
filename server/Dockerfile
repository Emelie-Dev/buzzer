# Base image
FROM node:20-slim

# Install system dependencies (for ffmpeg and bcrypt build)
RUN apt-get update && apt-get install -y ffmpeg && apt-get clean

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

# Use ARG to set NODE_ENV during build
ARG NODE_ENV=development
RUN if [ "$NODE_ENV" = "production" ]; then \
    npm install --omit=optional --legacy-peer-deps; \
    else \
    npm install --legacy-peer-deps; \
    fi

    
    # Copy the entire source code
COPY . .

# Build only if in production
RUN if [ "$NODE_ENV" = "production" ]; then \
npm run build && \
    mkdir -p /app/dist/public /app/dist/templates && \
    cp -r /app/src/public/* /app/dist/public/ && \
    cp -r /app/src/templates/* /app/dist/templates/ && \
    cp /app/src/worker.js /app/dist/ && \
    rm -rf /app/src; \
    fi

RUN npm install --cpu=x64 --os=linux --libc=glibc sharp --legacy-peer-deps 

# Expose the port
EXPOSE 5000

# Dynamically set CMD based on NODE_ENV
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm start; else npm run dev; fi"]
