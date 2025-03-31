# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

# Use ARG to set NODE_ENV during build
ARG NODE_ENV=development
RUN if [ "$NODE_ENV" = "production" ]; then npm install --omit=dev; else npm install; fi

# Copy the entire source code
COPY . .

# Build only if in production
RUN sh -c 'if [ "$NODE_ENV" = "production" ]; then \
    npm run build && \
    [ -d /app/src/public ] && cp -r /app/src/public /app/dist/public || echo "No public folder"; \
    [ -d /app/src/templates ] && cp -r /app/src/templates /app/dist/templates || echo "No templates folder"; \
    rm -rf /app/src; \
    fi'

# Expose the port
EXPOSE 5000

# Dynamically set CMD based on NODE_ENV
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm start; else npm run start:dev; fi"]
