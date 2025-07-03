# Use Node.js 20 with full Debian (not slim) for better compatibility
FROM node:20

# Install sharp system dependencies + ffmpeg
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    libvips-dev \
    # Required for some native modules:
    python3 \
    make \
    g++ && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# First install ONLY sharp with explicit platform flags
RUN npm install --os=linux --cpu=x64 sharp --legacy-peer-deps

# Then copy package.json and install other deps
COPY package*.json ./
RUN npm install --omit=optional --legacy-peer-deps

# Copy app files
COPY . .

# Build if needed (e.g., for TypeScript/Next.js)
RUN if [ "$NODE_ENV" = "production" ]; then npm run build; fi

EXPOSE 5000
CMD ["npm", "start"]