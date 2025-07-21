# Base stage
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build stage (only used in production)
FROM base AS builder
ARG BUILD_ENV=production
RUN if [ "$BUILD_ENV" = "production" ]; then npm run build; fi

# Development stage
FROM base AS development
EXPOSE 5173
CMD ["npm", "run", "dev"]

# Production stage: serve with Nginx
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
