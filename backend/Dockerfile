FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]


#FROM ubuntu:latest
#LABEL authors="VEEF"
#
#ENTRYPOINT ["top", "-b"]