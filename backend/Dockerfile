# ── Build Stage ───────────────────────────────────────────────────────────────
FROM node:22 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Production Stage ──────────────────────────────────────────────────────────
FROM node:22-slim

# Prevent Puppeteer from downloading its own browser during npm install
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install Chromium, unzip (required by npm/puppeteer), and other deps
RUN apt-get update && apt-get install -y \
    chromium \
    unzip \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libgbm1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copy built app and any static assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/uploads ./uploads

ENV NODE_ENV=production \
    PORT=4000

EXPOSE 4000

CMD ["node", "dist/index.js"]
