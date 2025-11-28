FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Nastav port
EXPOSE 3000

# Spusť aplikaci
CMD ["npm", "run", "start"]