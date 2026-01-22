FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build with production configuration by default
RUN npm run build -- --configuration=production

# Production stage - serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist/orangular /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]