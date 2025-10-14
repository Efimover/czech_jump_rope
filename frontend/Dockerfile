# === Frontend Dockerfile ===
FROM node:20-alpine AS build

WORKDIR /app

# závislosti a sestav React app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# === Production stage ===
FROM node:20-alpine
WORKDIR /app

# Zkopíruj build z předchozího stage
COPY --from=build /app/dist ./dist
COPY package*.json ./


RUN npm install --omit=dev

EXPOSE 5173

# Spusť produkční server (vite preview)
CMD ["npm", "run", "preview"]