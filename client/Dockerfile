FROM node:20-alpine

# RUN addgroup app && adduser -S -G app app

# USER app

WORKDIR /app

COPY package*.json ./

# USER root

# RUN chown -R app:app .

# USER app

RUN npm install

COPY . .

EXPOSE 5173

# Dynamically set CMD based on NODE_ENV
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm run build; else npm run dev; fi"]