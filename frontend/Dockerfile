FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build with production configuration
RUN npm run build -- --configuration=production

# Production stage - serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist/orangular/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]