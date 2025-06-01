# Base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

# Use ARG to set NODE_ENV during build
ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV

# Install all other dependencies without optional ones
RUN npm install --omit=optional --legacy-peer-deps

# Then install sharp explicitly with optional dependencies
RUN if [ "$NODE_ENV" = "production" ]; then \
    npm install sharp --include=optional  --legacy-peer-deps; \
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

# Expose the port
EXPOSE 5000

# Run based on NODE_ENV
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm start; else npm run dev; fi"]
