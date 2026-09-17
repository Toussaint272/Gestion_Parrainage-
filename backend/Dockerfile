FROM node:20-bookworm-slim

# Installer Chromium et ses dépendances système
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances Node.js (sans les devDependencies)
RUN npm install --omit=dev

# Copier le reste du code
COPY . .

# Variables pour que Puppeteer utilise le Chromium système
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Render utilise le port 10000 par défaut
EXPOSE 10000

CMD ["node", "src/server.js"]