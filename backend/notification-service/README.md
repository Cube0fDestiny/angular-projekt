# Serwis Powiadomień

Serwis powiadomień w czasie rzeczywistym zbudowany na Express.js, Socket.IO i RabbitMQ. Ten serwis odbiera powiadomienia z kolejki komunikatów i dostarcza je do podłączonych użytkowników przez WebSocket.

## Funkcjonalności

- **Powiadomienia w czasie rzeczywistym**: Wykorzystuje Socket.IO do komunikacji WebSocket
- **Integracja z kolejką komunikatów**: Konsumuje powiadomienia z RabbitMQ (11 typów zdarzeń)
- **Trwałość w bazie danych**: Przechowuje powiadomienia w PostgreSQL do późniejszego odczytu
- **Autentykacja użytkownika**: Autentykacja oparta na JWT dla bezpiecznych połączeń
- **Zarządzanie powiadomieniami**: Oznaczanie jako przeczytane, usuwanie i pobieranie powiadomień
- **Licznik nieprzeczytanych**: Śledzenie nieprzeczytanych powiadomień
- **Inteligentne routowanie**: Automatyczne określanie odbiorcy na podstawie typu zdarzenia
- **Integracja wielousługowa**: Zintegrowane ze wszystkimi 5 głównymi serwisami

## Instalacja

```bash
npm install
```

## Konfiguracja

Utwórz plik `.env` w głównym katalogu z następującymi zmiennymi:

```env
PORT=3007
JWT_SECRET=twoj-sekretny-klucz
NODE_ENV=development

# Konfiguracja bazy danych
DB_USER=admin
DB_PASSWORD=admin123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=angular_projekt

# Konfiguracja RabbitMQ
RABBITMQ_URL=amqp://rabbitmq:5672
```

## Połączenie Frontend

Frontend połącza się z serwisem powiadomień poprzez **Gateway** (nie bezpośrednio do portu 3007):

```typescript
import { io } from 'socket.io-client';

export class NotificationService {
  private socket = io('http://localhost:3000', {
    path: '/notifications',  // Gateway proxy do notification-service
    auth: {
      token: localStorage.getItem('token')  // ⚠️ WYMAGANE: Ważny JWT token!
    }
  });

  constructor() {
    this.socket.on('connect', () => {
      console.log('Connected to notifications via gateway');
    });

    this.socket.on('notification', (notification) => {
      // Obsługa nowego powiadomienia w czasie rzeczywistym
      console.log('New notification:', notification);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notifications');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }
}
```

### Wymagania autentykacji ⚠️

- **Token JWT jest WYMAGANY** do nawiązania połączenia WebSocket
- Token musi być ważny i podpisany tym samym `JWT_SECRET` co serwis
- Bez tokenu połączenie zostanie odrzucone z błędem: `"Authentication error: Token not provided"`
- Token powinien zawierać pole `id` (UUID użytkownika)
- Przykład payload tokenu:
  ```json
  {
    "id": "uuid-of-user",
    "name": "User Name",
    "email": "user@example.com"
  }
  ```

**Uwaga**: Połączenie WebSocket jest zwalniane z autentykacji **na poziomie Gateway'a** (dla kompatybilności), ale **serwis notification-service** wymaga ważnego JWT w handshake'u Socket.IO. Token pobierany z `localStorage` powinien być tokenom otrzymanym podczas logowania użytkownika.

## Schemat bazy danych

Serwis wymaga następującej tabeli w PostgreSQL:

```sql
CREATE TABLE "Notifications" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES "Users"(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON "Notifications"(user_id);
CREATE INDEX idx_notifications_user_id_is_read ON "Notifications"(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON "Notifications"(created_at DESC);
```

## Uruchamianie serwisu

```bash
node server.js
```

## Endpointy API

### Pobierz powiadomienia

```http
GET /notifications?limit=20&offset=0
```

Nagłówki:
```
x-user-data: {"id": "74ewr670-2d43-4244-9c3c-50dweqcbc6859", "name": "Jan Kowalski"}
```

### Pobierz liczbę nieprzeczytanych

```http
GET /notifications/unread-count
```

### Oznacz jako przeczytane

```http
PATCH /notifications/:id/read
```

### Oznacz wszystkie jako przeczytane

```http
PATCH /notifications/read-all
```

### Usuń powiadomienie

```http
DELETE /notifications/:id
```

### Usuń wszystkie powiadomienia

```http
DELETE /notifications/
```

### Utwórz powiadomienie (testowanie)

```http
POST /notifications/
Content-Type: application/json

{
  "userId": "74be1670-2d43-4244-9c3c-5062ccbc6859",
  "type": "post.liked",
  "title": "Twój post został polubiony",
  "message": "Jan Kowalski polubił twój post",
  "data": {
    "postId": 123,
    "likedBy": "Jan Kowalski"
  }
}
```

## Zdarzenia WebSocket

### Serwer → Klient

- **`newNotification`**: Wysyłane gdy otrzymano nowe powiadomienie
  ```javascript
  socket.on('newNotification', (notification) => {
    console.log(notification);
  });
  ```

- **`notificationDeleted`**: Wysyłane gdy powiadomienie zostało usunięte
  ```javascript
  socket.on('notificationDeleted', (data) => {
    console.log(data.notificationId);
  });
  ```

- **`error`**: Wysyłane gdy wystąpił błąd
  ```javascript
  socket.on('error', (message) => {
    console.error(message);
  });
  ```

### Klient → Serwer

- **`markAsRead`**: Oznacz powiadomienie jako przeczytane
  ```javascript
  socket.emit('markAsRead', notificationId);
  ```

- **`deleteNotification`**: Usuń powiadomienie
  ```javascript
  socket.emit('deleteNotification', notificationId);
  ```

## Zdarzenia RabbitMQ

Serwis konsumuje powiadomienia z RabbitMQ z następującymi kluczami routingu (11 typów):

### Powiadomienia ogólne
- `notification.created`: Utworzono ogólne powiadomienie
- `notification.*`: Wszystkie powiadomienia (wildcard)

### Interakcje społecznościowe (user-service)
- `user.friendRequested`: Otrzymano zaproszenie do znajomych
- `user.mentioned`: Użytkownik został wspomniany w poście/komentarzu

### Interakcje z postami (post-service)
- `post.liked`: Post został polubiony
- `post.commented`: Post otrzymał komentarz

### Grupy (group-service)
- `group.invited`: Użytkownik został zaproszony do grupy
- `group.created`: Utworzono nową grupę
- `group.memberAccepted`: Użytkownik został zaakceptowany do grupy

### Czaty (chat-service)
- `chat.created`: Utworzono nowy czat
- `message.created`: Otrzymano nową wiadomość w czacie

## Integracja z serwisami

### user-service
Publikuje zdarzenia dotyczące interakcji między użytkownikami:
- `user.friendRequested` - Powiadomienie dla otrzymującego zaproszenie (nie dla wysyłającego)
- `user.friendAccepted` - Powiadomienie po zaakceptowaniu zaproszenia
- `user.friendRemoved` - Powiadomienie po usunięciu ze znajomych
- `user.followed` / `user.unfollowed` - Powiadomienia o obserwowaniu

### post-service
Publikuje zdarzenia dotyczące postów i komentarzy:
- `post.created` - Nowy post utworzony
- `comment.created` - Nowy komentarz dodany
- `reaction.created` - Post został polubiony/zareagowano

### event-service
Publikuje zdarzenia dotyczące wydarzeń:
- `event.created` / `event.updated` / `event.deleted` - Zarządzanie wydarzeniami
- `event.followed` / `event.unfollowed` - Obserwowanie wydarzeń

### chat-service
Publikuje zdarzenia dotyczące czatów:
- `chat.created` - Powiadamia wszystkich uczestników czatu (oprócz twórcy)
- `message.created` - Powiadamia wszystkich uczestników (oprócz nadawcy)

### group-service
Publikuje zdarzenia dotyczące grup:
- `group.created` - Nowa grupa utworzona
- `group.memberAccepted` - Użytkownik zaakceptowany do grupy

## Przykładowe struktury wiadomości

### Zaproszenie do znajomych
```json
{
  "requesterId": "74be1670-2d43-4244-9c3c-5062ccbc6859",
  "requesteeId": "18f07541-d674-4d56-8371-0dda9cdcabfb",
  "timestamp": "2026-01-22T18:49:54.747Z"
}
```

### Nowa wiadomość w czacie
```json
{
  "messageId": "uuid-v4",
  "chatId": "chat-uuid",
  "creatorId": "sender-uuid",
  "text": "Witaj świecie!",
  "timestamp": "2026-01-22T18:49:54.747Z"
}
```

### Utworzenie czatu
```json
{
  "chatId": "chat-uuid",
  "name": "Nazwa czatu",
  "creatorId": "creator-uuid",
  "participants": ["user1-uuid", "user2-uuid", "user3-uuid"],
  "timestamp": "2026-01-22T18:49:54.747Z"
}
```

### Zaakceptowanie członka grupy
```json
{
  "groupId": "group-uuid",
  "userId": "accepted-user-uuid",
  "acceptedBy": "admin-uuid",
  "timestamp": "2026-01-22T18:49:54.747Z"
}
```

## Architektura

Serwis wykorzystuje modułową architekturę:

- **server.js**: Główny punkt wejścia aplikacji i konfiguracja Socket.IO
- **controllers/notificationController.js**: Logika biznesowa powiadomień
- **routes/notificationRoutes.js**: Definicje tras REST API
- **utils/rabbitmq-client.js**: Połączenie z RabbitMQ i inteligentna konsumpcja wiadomości
- **middleware/**: Autentykacja i obsługa błędów
- **db/index.js**: Pula połączeń z bazą danych

### Przepływ powiadomień

```
[Serwis] → Publikuje zdarzenie → [RabbitMQ] → [Notification Service]
                                                        ↓
                                                  [PostgreSQL]
                                                        ↓
                                                  [Socket.IO]
                                                        ↓
                                              [Podłączeni użytkownicy]
```

### Logika routingu

Serwis automatycznie określa odbiorcę powiadomienia na podstawie pól w zdarzeniu:
- `requesteeId` → powiadomienie dla otrzymującego zaproszenie do znajomych
- `userId` → ogólne powiadomienie
- `mentionedUserId` → powiadomienie o wzmiance
- `likedUserId` → powiadomienie o polubieniu
- `invitedUserId` → powiadomienie o zaproszeniu do grupy
- `participants[]` → powiadomienia dla uczestników czatu (oprócz twórcy)
- Dla `message.created`: pobiera uczestników z tabeli `Chat_Participants`

## Status integracji

✅ **Wszystkie serwisy zintegrowane**

| Serwis | Zdarzenia | Status |
|--------|-----------|--------|
| user-service | 5 typów | ✅ Aktywny |
| post-service | 3 typy | ✅ Aktywny |
| event-service | 5 typów | ✅ Aktywny |
| chat-service | 2 typy | ✅ Aktywny |
| group-service | 2 typy | ✅ Aktywny |

**Łącznie: 17 różnych typów zdarzeń z 5 serwisów**

## Docker

Budowanie i uruchamianie z Docker:

```bash
docker build -t notification-service .
docker run -p 3007:3007 --env-file .env notification-service
```

Lub za pomocą docker-compose:

```bash
docker compose -f docker-compose.dev.yml up -d notification-service
```

## Testowanie

### Sprawdzanie połączenia z RabbitMQ

```bash
docker logs notification-service | grep "RabbitMQ"
# Powinno pokazać: "RabbitMQ connected" i "Notification consumer started"
```

### Sprawdzanie bound routing keys

```bash
docker logs notification-service | grep "Queue bound"
# Powinno pokazać 11 kluczy routingu
```

### Test end-to-end

1. Wyślij zaproszenie do znajomych (user-service)
2. Sprawdź powiadomienia odbiorcy przez REST API lub Socket.IO
3. Powiadomienie powinno pojawić się w czasie rzeczywistym

Zobacz `/tmp/test_friend_full.sh` dla pełnego przykładu testowego.

## Licencja

ISC
