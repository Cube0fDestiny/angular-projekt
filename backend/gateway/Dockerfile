FROM node:18-alpine AS dependencies

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install --only=production

FROM node:18-alpine

WORKDIR /usr/src/app

COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]