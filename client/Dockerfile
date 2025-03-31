# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG NODE_ENV=production
RUN if [ "$NODE_ENV" = "production" ]; then npm run build; fi

# Stage 2: Serve with Nginx in production, or start Vite in dev
FROM nginx:alpine AS production

# Copy the built app to Nginx's default public directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Development Stage
FROM node:20-alpine AS development

WORKDIR /app

COPY --from=builder /app .

EXPOSE 5173
CMD ["npm", "run", "dev"]
