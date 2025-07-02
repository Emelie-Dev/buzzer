# Base image
FROM node:20-slim

# Install ffmpeg (Debian-based)
RUN apt-get update && apt-get install -y ffmpeg && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Use ARG to set NODE_ENV during build
ARG NODE_ENV=development

# Install dependencies WITH sharp (inside container)
RUN if [ "$NODE_ENV" = "production" ]; then \
    npm install --include=optional --omit=dev --legacy-peer-deps; \
    else \
    npm install --include=optional --legacy-peer-deps; \
    fi

# Copy source code
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

# Expose the port
EXPOSE 5000

# Dynamically set CMD
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm start; else npm run dev; fi"]
