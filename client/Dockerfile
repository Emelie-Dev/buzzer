# Stage 1: Build React app
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build only in production mode
ARG NODE_ENV=development
RUN if [ "$NODE_ENV" = "production" ]; then npm run build; fi


# Stage 3: Development mode with Vite
FROM node:20-slim AS development
WORKDIR /app
COPY --from=builder /app .
EXPOSE 5173
CMD ["npm", "run", "dev"]


# Stage 2: Serve with Nginx in production
FROM nginx:alpine AS production
# Copy custom Nginx config
# Copy built React app to Nginx public directory
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom Nginx config
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
