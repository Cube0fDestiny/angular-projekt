FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 80

# Komenda uruchamiająca serwer deweloperski Angulara
CMD [ "npm", "run", "start", "--", "--host", "0.0.0.0" ]
