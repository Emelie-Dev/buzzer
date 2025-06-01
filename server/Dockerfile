# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Use ARG to conditionally run logic
ARG NODE_ENV=development

# 🛠️ Only install build tools in production
RUN if [ "$NODE_ENV" = "production" ]; then \
    apk add --no-cache libc6-compat make gcc g++ python3; \
    fi

# Copy package files
COPY package*.json ./

# Install sharp for musl first, then rest of the deps
RUN npm install sharp --platform=linux --libc=musl --legacy-peer-deps && \
    if [ "$NODE_ENV" = "production" ]; then \
    npm install --omit=optional --legacy-peer-deps; \
    else \
    npm install --legacy-peer-deps; \
    fi

# Copy the app source
COPY . .

# Build in production only
RUN sh -c 'if [ "$NODE_ENV" = "production" ]; then \
    npm run build && \
    mkdir -p /app/dist/public /app/dist/templates && \
    cp -r /app/src/public/* /app/dist/public/ && \
    cp -r /app/src/templates/* /app/dist/templates/ && \
    cp /app/src/worker.js /app/dist/ && \
    rm -rf /app/src; \
    fi'

EXPOSE 5000

CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm start; else npm run dev; fi"]
