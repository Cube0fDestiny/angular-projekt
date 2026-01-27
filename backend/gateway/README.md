# 📄 Dokumentacja API: API Gateway

Centralna brama wejściowa dla wszystkich mikroserwisów. Handleuje routing, autentykację, CORS i komunikację w czasie rzeczywistym.

**Base URL:** `http://localhost:3000`

---

## 📋 Opis

API Gateway pełni rolę Single Entry Point (SEP) dla całej aplikacji. Wszystkie żądania klientów przechodzą przez bramę, która:

- Weryfikuje tokeny JWT dla endpointów chronionych
- Maskuje wewnętrzną architekturę mikroserwisów
- Obsługuje błędy i niedostępne serwisy
- Wspiera komunikację w czasie rzeczywistym (WebSocket) dla czatów
- Obsługuje CORS dla bezpiecznych żądań cross-origin

---

## 🚀 Dostępne Serwisy

| Route | Serwis | Port | Opis |
|-------|--------|------|------|
| `/users` | User Service | 3001 | Autentykacja, rejestracja, profily |
| `/posts` | Post Service | 3002 | Posty, komentarze, reakcje |
| `/events` | Event Service | 3003 | Zarządzanie wydarzeniami |
| `/images` | Image Service | 3004 | Upload i serwowanie obrazów |
| `/groups` | Group Service | 3005 | Zarządzanie grupami |
| `/chats` | Chat Service | 3006 | Czaty i wiadomości (REST + WebSocket) |
| `/notifications` | Notification Service | 3007 | Powiadomienia push |

---

## 🔐 Autentykacja

Gateway automatycznie weryfikuje tokeny JWT dla każdego żądania. Token powinien być przesyłany w nagłówku:

```
Authorization: Bearer <token_jwt>
```

### Jak działa weryfikacja:

1. **Żądanie publiczne** (GET na listy, profilach itp.) - Token jest opcjonalny
2. **Żądanie chronione** (POST, PUT, DELETE) - Token jest wymagany
3. Gateway ekstrahuje user info z tokena i przekazuje je dalej do serwisu
4. Serwis może podjąć dodatkowe decyzje dotyczące autoryzacji

---

## 📤 Wysyłanie Żądań

### Przykład: GET wszystkich postów (publiczny)
```bash
curl http://localhost:3000/posts
```

### Przykład: POST nowego posta (chroniony)
```bash
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Mój nowy post!",
    "location_id": "uuid",
    "location_type": "group"
  }'
```

### Przykład: Upload obrazu (chroniony)
```bash
curl -X POST http://localhost:3000/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@path/to/image.jpg"
```

---

## 🔌 WebSocket (Chat Service)

Chat Service obsługuje komunikację w czasie rzeczywistym za pośrednictwem WebSocket.

### Połączenie WebSocket (Gateway → Chat Service)
```
ws://localhost:3000/chats/socket
```

### Handshake z autentykacją
```javascript
const socket = io('http://localhost:3000/chats/socket', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('newMessage', (message) => {
  console.log('Nowa wiadomość:', message);
});
```

---

## 🔔 WebSocket (Notification Service)

### Połączenie WebSocket (Gateway → Notification Service)
```
ws://localhost:3000/notifications/socket
```

### Handshake z autentykacją
```javascript
const notificationSocket = io('http://localhost:3000/notifications/socket', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

notificationSocket.on('notification', (payload) => {
  console.log('Powiadomienie:', payload);
});
```

---

## ⚠️ Obsługa Błędów

Gateway obsługuje błędy w następujący sposób:

### HTTP Status Codes

| Kod | Znaczenie |
|-----|-----------|
| 200 | OK - Żądanie powiodło się |
| 201 | Created - Zasób został utworzony |
| 204 | No Content - Operacja powiodła się, bez treści odpowiedzi |
| 400 | Bad Request - Błąd w żądaniu (sprawdź format danych) |
| 401 | Unauthorized - Brak lub nieprawidłowy token JWT |
| 403 | Forbidden - Brak uprawnień do wykonania akcji |
| 404 | Not Found - Zasób nie istnieje |
| 500 | Internal Server Error - Błąd serwera |
| 503 | Service Unavailable - Serwis jest tymczasowo niedostępny |

### Niedostępny Serwis

Gdy serwis docelowy jest niedostępny, Gateway zwraca:

```json
{
  "message": "Usługa jest tymczasowo niedostępna.",
  "service": "/events"
}
```

---

## 🏗️ Architektura

```
┌─────────────┐
│   Klient    │
└──────┬──────┘
       │
       │ HTTP/WebSocket
       ▼
┌──────────────────────────┐
│      API Gateway         │
│  (Port 3000)             │
│  - Auth Middleware       │
│  - CORS Handler          │
│  - Error Handler         │
│  - Proxy Middleware      │
└──────────┬───────────────┘
           │
     ┌─────┴──────────────────────────────────────┐
     │                                              │
     ▼                                              ▼
┌─────────────────┐                    ┌──────────────────────┐
│  User Service   │                    │   Chat Service       │
│  (3001)         │                    │   (3006)             │
└─────────────────┘                    │   + WebSocket        │
     │                                 │   Support            │
     └──────────────────────────────────┘
                    │
                    ▼
            ┌──────────────────┐
            │   PostgreSQL     │
            │   Database       │
            └──────────────────┘
```

---

## 🔧 Konfiguracja

Gateway jest konfigurowany za pomocą zmiennych środowiskowych:

```env
PORT=3000
LOG_LEVEL=info
NODE_ENV=development
JWT_SECRET=your-secret-key
```

---

## 🎭 Trasy Orkiestracji

Gateway obsługuje złożone operacje wymagające komunikacji z wieloma serwisami.

### 1. Aktualizacja profilu z obrazami
`PUT /users/:id/profile-with-image`

**Wymagana autoryzacja**

Aktualizuje profil użytkownika z możliwością przesłania zdjęć.

**Forma multipart:**
- `profile_picture` (file) - zdjęcie profilowe (opcjonalne)
- `header_picture` (file) - zdjęcie w tle (opcjonalne)
- Pozostałe pola profilu jako form fields

---

### 2. Tworzenie posta z obrazami
`POST /posts/with-images`

**Wymagana autoryzacja**

Tworzy post z możliwością przesłania wielu obrazów.

**Forma multipart:**
- `images` (files) - obrazy do posta
- Pozostałe pola posta jako form fields

---

### 3. Tworzenie wydarzenia z obrazami
`POST /events/with-image`

**Wymagana autoryzacja**

Tworzy wydarzenie z możliwością przesłania zdjęć.

**Forma multipart:**
- `profile_picture` (file) - zdjęcie profilowe wydarzenia (opcjonalne)
- `header_picture` (file) - zdjęcie w tle wydarzenia (opcjonalne)
- `name`, `bio`, `event_date` jako form fields

---

### 4. Aktualizacja wydarzenia z obrazami
`PUT /events/:id/with-image`

**Wymagana autoryzacja (Tylko twórca)**

Aktualizuje wydarzenie z możliwością przesłania nowych zdjęć.

**Forma multipart:**
- `profile_picture` (file) - nowe zdjęcie profilowe (opcjonalne)
- `header_picture` (file) - nowe zdjęcie w tle (opcjonalne)
- `name`, `bio`, `event_date` jako form fields (wszystkie opcjonalne)

---

### 5. Wysyłanie wiadomości z obrazami
`POST /chats/:chatId/messages/with-images`

**Wymagana autoryzacja**

Wysyła wiadomość na czacie z możliwością dołączenia obrazów.

**Forma multipart:**
- `images` (files) - obrazy do wiadomości (max 10)
- Pozostałe pola wiadomości jako form fields

---

## 📝 Uwagi

- Gateway automatycznie konwertuje ścieżkę `/chats` na `http://chat-service:3006/chats`
- WebSocket upgrady obsługiwane są automatycznie dla `/chats`
- Wszystkie serwisy komunikują się między sobą wewnętrznie bez przechodzenia przez Gateway
- Wewnętrzne adresy serwisów (np. `http://user-service:3001`) działają tylko wewnątrz sieci Docker
- Klienci zewnętrzni muszą używać Gateway (`http://localhost:3000`) do komunikacji

---

## 🚀 Przykłady Żądań

### 1. Rejestracja użytkownika
```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jan",
    "surname": "Kowalski",
    "email": "jan@example.com",
    "password": "SecurePassword123",
    "is_company": false
  }'
```

### 2. Logowanie
```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jan@example.com",
    "password": "SecurePassword123"
  }'
```

### 3. Tworzenie czatu
```bash
curl -X POST http://localhost:3000/chats \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mój Czat",
    "participantIds": ["uuid1", "uuid2"]
  }'
```

### 4. Pobieranie wszystkich wydarzeń
```bash
curl http://localhost:3000/events
```

### 5. Tworzenie posta
```bash
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Zawartość posta",
    "location_id": "uuid",
    "location_type": "group"
  }'
```
