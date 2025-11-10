# === Build stage ===
FROM node:20-alpine AS build
WORKDIR /app

# Nainstaluj všechny závislosti včetně devDependencies
COPY package*.json ./
RUN npm install

# Zkopíruj zdrojové soubory a vytvoř produkční build
COPY . .
RUN npm run build

# === Production stage ===
FROM node:20-alpine
WORKDIR /app

# Nainstaluj jednoduchý static server
RUN npm install -g serve

# Zkopíruj hotový build z předchozí fáze
COPY --from=build /app/dist ./dist

# Nastav port a spusť statický server
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
