# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build only in production mode
ARG NODE_ENV=development
RUN if [ "$NODE_ENV" = "production" ]; then npm run build; fi


# Stage 3: Development mode with Vite
FROM node:20-alpine AS development
WORKDIR /app
COPY --from=builder /app .
EXPOSE 5173
CMD ["npm", "run", "dev"]


# Stage 2: Serve with Nginx in production
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off; access_log off; error_log /dev/null warn;"]
