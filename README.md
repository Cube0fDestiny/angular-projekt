
# 🍊 Orang Social Platform

## 🚀 What is Orang?

Orang is a modern, scalable social platform inspired by the best features of popular networks. It’s designed for real-time interaction, community building, and extensibility. Built with Angular and Node.js microservices, Orang is perfect for learning, hacking, or launching your own social app.

---

## 🎯 Features & Highlights

- Real-time chat and notifications
- Rich user profiles and friend system
- Groups, events, and posts with comments/reactions
- Secure JWT authentication
- Responsive Angular SPA (TailwindCSS)
- RESTful API + WebSocket (Socket.IO)
- Image upload and dynamic serving
- Microservices architecture (scalable, maintainable)
- Dockerized for easy deployment

---

## Overview

A full-featured social platform built with microservices architecture. The system includes:

- **User authentication & profiles**
- **Groups & memberships**
- **Posts, comments, reactions**
- **Events**
- **Chat (real-time messaging)**
- **Image upload & serving**
- **Notifications**
- **API Gateway for unified access**

---



## 🏗️ Tech Stack & Architecture

- **Frontend:** Angular 19, TypeScript, RxJS, TailwindCSS, Socket.IO
	- SPA with routing, state management, HTTP client, JWT auth, real-time chat, friend system, event/group management, image upload, notifications
	- Built with Angular CLI, styled with TailwindCSS
	- Communicates with backend via REST and WebSocket
	- Docker/nginx for production
	- Main app: `frontend/src/`
	- Environment config: see `src/environments/environment.ts`

- **Backend:** Node.js microservices (Express, PostgreSQL, RabbitMQ)
	- Each service is independent, documented, and dockerized
	- API Gateway for unified access, JWT auth, CORS, error handling

---

- **Frontend:** Angular 19 (TypeScript, RxJS, TailwindCSS, Socket.IO)
	- Modern SPA using Angular CLI
	- Features: routing, state management, HTTP client, JWT auth, real-time chat, friend system, event and group management, image upload, notifications
	- Uses TailwindCSS for styling
	- Communicates with backend via REST and WebSocket (Socket.IO)
	- Built and served via Docker/nginx
	- Main app: `frontend/src/`
	- Environment config: see `src/environments/environment.ts`

- **Backend:** Node.js microservices (Express, PostgreSQL, RabbitMQ)
- **API Gateway:** Central entry point, JWT auth, routing, CORS, error handling

---


## ⚙️ Environment Setup

**Important:** You must create a `.env` file in the main project directory with all required environment variables for backend and gateway services. Example variables:


```dotenv
JWT_SECRET=your_jwt_secret_here
DB_USER=your_db_user
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
DB_PORT=5432
PBKDF2_ITERATIONS=1000
PBKDF2_KEYLEN=64
PBKDF2_DIGEST=sha512
RABBITMQ_DEFAULT_USER=rabbitmq_user
RABBITMQ_DEFAULT_PASS=rabbitmq_password
RABBITMQ_URL=amqp://rabbitmq_user:rabbitmq_password@rabbitmq:5672
```


See each microservice’s README for additional .env variables and configuration details.

---

## 🖥️ Quick Start

1. Clone the repo: `git clone ...`
2. Add your `.env` file to the main directory (see above)
3. Build and run: `docker compose -f docker-compose.dev.yml up --build -d`
4. Access frontend at [http://localhost:4200](http://localhost:4200)
5. Access API at [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Tech Stack & Architecture

- **Frontend:** Angular 19, TypeScript, RxJS, TailwindCSS, Socket.IO
  - SPA with routing, state management, HTTP client, JWT auth, real-time chat, friend system, event/group management, image upload, notifications
  - Built with Angular CLI, styled with TailwindCSS
  - Communicates with backend via REST and WebSocket
  - Docker/nginx for production
  - Main app: `frontend/src/`
  - Environment config: see `src/environments/environment.ts`

- **Backend:** Node.js microservices (Express, PostgreSQL, RabbitMQ)
  - Each service is independent, documented, and dockerized
  - API Gateway for unified access, JWT auth, CORS, error handling

---
- Get event: `GET /:id`
- Create event: `POST /`
- Edit event: `PUT /:id`
- Delete event: `DELETE /:id`
- Join/leave event: `POST /:id/join`, `POST /:id/leave`

### 5. Chat Service (`/chats`)
- List chats: `GET /`
- Create chat: `POST /`
- Send message: `POST /:chatId/messages`
- Real-time messaging via WebSocket

### 6. Image Service (`/images`)
- Upload image: `POST /` (multipart/form-data)
- Get image: `GET /:id` (with optional scaling: `?w=WIDTH&h=HEIGHT`)
- Delete image: `DELETE /:id`

### 7. Notification Service (`/notifications`)
- List notifications: `GET /notifications?limit=20&offset=0`
- Unread count: `GET /notifications/unread-count`
- Mark as read: `PATCH /notifications/:id/read`
- Delete notification: `DELETE /notifications/:id`

### 8. API Gateway (`/`)
- Unified entry point: `http://localhost:3000`
- JWT authentication for protected endpoints
- Routes: `/users`, `/groups`, `/posts`, `/events`, `/images`, `/chats`, `/notifications`

---

## 🛡️ Authentication

- JWT tokens required for protected endpoints.
- Pass token in header: `Authorization: Bearer <token_jwt>`

---

## 🐇 RabbitMQ Events

- Group, post, event, notification, and chat services publish events for real-time updates and integrations.

---

## 📝 Example Requests

```bash
# Get all groups
curl http://localhost:3000/groups

# Get friends for a user
curl http://localhost:3000/groups/user/<user_id>/friends

# Create a post (requires JWT)
curl -X POST http://localhost:3000/posts -H "Authorization: Bearer <token>" -d '{...}'
```

---

## ⚠️ Error Handling

| Code | Message | Description |
|------|---------|-------------|
| 400  | Bad Request | Validation error or missing fields |
| 401  | Unauthorized | Invalid/expired JWT |
| 403  | Forbidden | No JWT or insufficient permissions |
| 404  | Not Found | Resource does not exist |
| 500  | Internal Server Error | Server/database error |

---

## 📦 Running Locally


To run Orang locally, follow these steps:

1. **Clone the repository:**
	```bash
	git clone <your-repo-url>
	cd angular-projekt
	```

2. **Create your `.env` file:**
	- Place it in the main project directory (see example above).

3. **Build and start all services with Docker Compose:**
	```bash
	docker compose -f docker-compose.dev.yml up --build -d
	```

4. **Access the application:**
	- Frontend: [http://localhost:4200](http://localhost:4200)
	- API Gateway: [http://localhost:3000](http://localhost:3000)

5. **Stopping services:**
	```bash
	docker compose -f docker-compose.dev.yml down
	```

6. **Rebuild after code changes:**
	```bash
	docker compose -f docker-compose.dev.yml up --build -d
	```

---