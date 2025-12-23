FROM node:20-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая dev)
RUN npm install

# Копируем исходники
COPY . .

# Компилируем TypeScript
RUN npm run build

# Удаляем dev зависимости после сборки
RUN npm prune --production

# Открываем порт
EXPOSE 3000

# Запускаем
CMD ["node", "dist/index.js"]
