# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY tsconfig.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходники
COPY src ./src

# Компилируем TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Устанавливаем только production зависимости
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Копируем скомпилированные файлы из builder
COPY --from=builder /app/dist ./dist

# Копируем шаблоны и assets
COPY templates ./templates

# Создаем non-root пользователя
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Меняем ownership
RUN chown -R nodejs:nodejs /app

# Переключаемся на non-root пользователя
USER nodejs

# Открываем порт
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Запускаем приложение
CMD ["node", "dist/index.js"]
