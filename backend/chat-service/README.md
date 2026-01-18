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
    "created_at": "timestamp"
  }
]
```

---

### 2. Stworzenie nowego czatu
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

### 3. Pobranie wiadomości z czatu
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

### 4. Wysłanie wiadomości
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
  "created_at": "timestamp"
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
  //   created_at: "timestamp"
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
  "chatId": "uuid",
  "name": "string",
  "creatorId": "uuid",
  "participants": ["uuid", "uuid"],
  "timestamp": "ISO8601"
}
```

### Message Events

**`message.created`** - Published when a new message is sent in a chat
```json
{
  "messageId": "uuid",
  "chatId": "uuid",
  "creatorId": "uuid",
  "text": "string",
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
