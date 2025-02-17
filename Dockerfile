FROM node:18-slim

# Устанавливаем зависимости для Puppeteer
RUN apt-get update && apt-get install -y wget unzip fonts-liberation \
    libasound2 libatk1.0-0 libcups2 libdbus-1-3 \
    libdrm2 libx11-xcb1 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libgtk-3-0 libnss3 lsb-release \
    libappindicator3-1 libxshmfence1 libpangocairo-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Копируем весь проект
COPY . .

# Открываем порт
EXPOSE 3000

# Запуск сервера
CMD ["node", "app.js"]
