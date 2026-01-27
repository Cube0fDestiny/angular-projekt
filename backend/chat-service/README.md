# 📄 Dokumentacja API: Chat-Service

Serwis obsługujący zarządzanie czatami, tworzenie konwersacji i wysyłanie wiadomości w czasie rzeczywistym.

**Base URL:** `http://localhost:3006`

---

## 🔐 Autentykacja
Wymagane dla endpointów chronionych:
- Nagłówek: `Authorization: Bearer <token_jwt>`

---

## 🚀 Istniejące Endpointy

### 1. Pobranie wszystkich czatów użytkownika
`GET /`

**Wymagana autoryzacja**

Pobiera listę wszystkich czatów, w których użytkownik jest uczestnikiem.

**Odpowiedź (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "creator_id": "uuid",
    "created_at": "timestamp",
    "participantsIds": ["uuid", "uuid", "..."]
  }
]
```

---

### 2. Usunięcie czatu
`DELETE /:chatId`

**Wymagana autoryzacja (Uczestnik czatu)**

Usuwa czat wraz ze wszystkimi wiadomościami i powiązanymi danymi. Każdy uczestnik czatu może go usunąć.

**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :chatId | uuid | ID czatu do usunięcia |

**Odpowiedź (200 OK):**
```json
{
  "message": "Czat został usunięty"
}
```

**Odpowiedź (403 Forbidden):**
```json
{
  "error": "Tylko uczestnicy mogą usunąć czat"
}
```

**Odpowiedź (404 Not Found):**
```json
{
  "error": "Czat nie został znaleziony"
}
```

---

### 3. Stworzenie nowego czatu
`POST /`

**Wymagana autoryzacja**

Tworzy nowy czat (prywatny lub grupowy) z podanymi uczestnikami. Twórca czatu jest automatycznie dodawany do listy uczestników.

**Body:**
```json
{
  "name": "string",
  "participantIds": ["uuid", "uuid", "..."]
}
```

**Odpowiedź (201 Created):**
```json
{
  "id": "uuid",
  "name": "string",
  "creator_id": "uuid",
  "created_at": "timestamp"
}
```

---

### 4. Pobranie wiadomości z czatu
`GET /:chatId/messages`

**Wymagana autoryzacja (Uczestnik czatu)**

Pobiera historię wiadomości z konkretnego czatu, posortowanych od najnowszych.

**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :chatId | uuid | ID czatu |

**Odpowiedź (200 OK):**
```json
[
  {
    "id": "uuid",
    "chat_id": "uuid",
    "creator_id": "uuid",
    "text": "string",
    "created_at": "timestamp"
  }
]
```

---

### 5. Wysłanie wiadomości
`POST /:chatId/messages`

**Wymagana autoryzacja (Uczestnik czatu)**

Wysyła nową wiadomość do czatu. Wiadomość jest emitowana w czasie rzeczywistym do wszystkich uczestników czatu.

**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :chatId | uuid | ID czatu |

**Body:**
```json
{
  "text": "string"
}
```

**Odpowiedź (201 Created):**
```json
{
  "id": "uuid",
  "chat_id": "uuid",
  "creator_id": "uuid",
  "text": "string",
  "created_at": "timestamp",
  "images": [
    {
      "image_id": "uuid",
      "image_order": 0
    }
  ]
}
```

---

### 6. Wysłanie wiadomości z obrazami (Gateway)

`POST /chats/:chatId/messages/with-images`

**Gateway Route:** `POST /chats/:chatId/messages/with-images`

**Wymagana autoryzacja (Uczestnik czatu)**

Wysyła nową wiadomość z obrazami do czatu. Wiadomość jest emitowana w czasie rzeczywistym do wszystkich uczestników czatu.

**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :chatId | uuid | ID czatu |

**Forma multipart:**
- `text` (form field) - tekst wiadomości
- `images` (file array) - pliki obrazów (opcjonalne, max 10 plików)
- `images` (JSON field, opcjonalne) - tablica istniejących ID obrazów z kolejnością

**Odpowiedź (201 Created):**
```json
{
  "id": "uuid",
  "chat_id": "uuid",
  "creator_id": "uuid",
  "text": "string",
  "created_at": "timestamp",
  "images": [
    {
      "image_id": "uuid",
      "image_order": 0
    }
  ]
}
```

---

## 🔌 WebSocket Wydarzenia

Chat-Service obsługuje komunikację w czasie rzeczywistym poprzez Socket.io.

### Połączenie WebSocket
```
ws://localhost:3006
```

### Emitowane Wydarzenia (Server → Client)

**newMessage**
Wysyłane do wszystkich uczestników czatu gdy pojawi się nowa wiadomość.

```javascript
socket.on('newMessage', (message) => {
  console.log(message);
  // {
  //   id: "uuid",
  //   chat_id: "uuid",
  //   creator_id: "uuid",
  //   text: "string",
  //   created_at: "timestamp",
  //   images: [
  //     {
  //       image_id: "uuid",
  //       image_order: 0
  //     }
  //   ]
  // }
});
```

---

## 📡 RabbitMQ Events

Chat-Service publishes events to RabbitMQ on the `app_events` topic exchange. Subscribe to the following routing keys to handle chat-related events:

### Chat Management Events

**`chat.created`** - Published when a new chat is created
```json
{
  "type": "chat.created",
  "chatId": "uuid",
  "name": "string",
  "creatorId": "uuid",
  "creatorName": "string",
  "creatorSurname": "string",
  "creatorProfilePicture": "uuid",
  "participants": ["uuid", "uuid"],
  "timestamp": "ISO8601"
}
```

**`chat.deleted`** - Published when a chat is deleted
```json
{
  "type": "chat.deleted",
  "chatId": "uuid",
  "deletedBy": "uuid",
  "timestamp": "ISO8601"
}
```

### Message Events

**`message.created`** - Published when a new message is sent in a chat
```json
{
  "type": "message.created",
  "messageId": "uuid",
  "chatId": "uuid",
  "creatorId": "uuid",
  "senderName": "string",
  "senderSurname": "string",
  "senderProfilePicture": "uuid",
  "text": "string",
  "images": [
    {
      "image_id": "uuid",
      "image_order": 0
    }
  ],
  "timestamp": "ISO8601"
}
```

---

## ⚠️ Obsługa Błędów

| Kod | Komunikat | Opis |
|---|---|---|
| 400 | Bad Request | Błąd walidacji, np. brakujące pole `participantIds` lub nieprawidłowy format. |
| 401 | Unauthorized | Token JWT jest nieprawidłowy lub wygasł. |
| 403 | Forbidden | Brak tokena JWT lub użytkownik nie jest uczestnikiem czatu. |
| 404 | Not Found | Czat nie istnieje. |
| 500 | Internal Server Error | Wewnętrzny błąd serwera lub baza danych. |

---

## 💡 Proponowane Endpointy

Poniższe endpointy mogą być dodane w przyszłości, aby rozszerzyć funkcjonalność:

### P1. Pobranie szczegółów czatu
`GET /:chatId`

**Wymagana autoryzacja (Uczestnik czatu)**

Pobiera szczegółowe informacje o konkretnym czacie oraz listę uczestników.

**Odpowiedź (200 OK):**
```json
{
  "id": "uuid",
  "name": "string",
  "creator_id": "uuid",
  "participants": [
    {
      "user_id": "uuid",
      "name": "string",
      "surname": "string"
    }
  ],
  "created_at": "timestamp"
}
```

---

### P2. Dodanie uczestnika do czatu
`POST /:chatId/participants`

**Wymagana autoryzacja (Twórca czatu)**

Dodaje nowego uczestnika do istniejącego czatu.

**Body:**
```json
{
  "user_id": "uuid"
}
```

**Odpowiedź (201 Created):**
```json
{
  "message": "Uczestnik dodany do czatu",
  "user_id": "uuid",
  "chat_id": "uuid"
}
```

---

### P3. Usunięcie uczestnika z czatu
`DELETE /:chatId/participants/:userId`

**Wymagana autoryzacja (Twórca czatu lub sam uczestnik)**

Usuwa uczestnika z czatu.

**Odpowiedź (204 No Content)**

---

### P4. Edycja wiadomości
`PUT /:chatId/messages/:messageId`

**Wymagana autoryzacja (Autor wiadomości)**

Edytuje tekst wysłanej wiadomości.

**Body:**
```json
{
  "text": "string"
}
```

**Odpowiedź (200 OK):**
```json
{
  "id": "uuid",
  "chat_id": "uuid",
  "creator_id": "uuid",
  "text": "string (zaktualizowany)",
  "updated_at": "timestamp"
}
```

---

## WebSocket (przez Gateway)

- Endpoint Socket.IO: `ws://localhost:3000/chats/socket`
- Handshake:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/chats/socket', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => console.log('Połączono z czatem'));
socket.on('newMessage', (msg) => console.log('Nowa wiadomość', msg));
```

---

### P5. Usunięcie wiadomości
`DELETE /:chatId/messages/:messageId`

**Wymagana autoryzacja (Autor wiadomości)**

Usuwa wiadomość z czatu.

**Odpowiedź (204 No Content)**

---

## 📝 Uwagi

- Wiadomości są wysyłane w czasie rzeczywistym za pośrednictwem WebSocket.
- Tylko uczestnicy czatu mogą przeglądać wiadomości i wysyłać nowe wiadomości.
- Lista `participantIds` przy tworzeniu czatu nie powinna zawierać ID twórcy - jest on dodawany automatycznie.
- Czaty grupowe mogą mieć wielu uczestników.
- Wiadomości mogą być historycznie przeglądane za pośrednictwem REST API.
