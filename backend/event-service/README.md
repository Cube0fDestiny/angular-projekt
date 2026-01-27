# 📄 Dokumentacja API: Event-Service

Serwis obsługujący zarządzanie wydarzeniami, śledzenie obserwujących i relacje użytkowników z wydarzeniami.

**Base URL:** `http://localhost:3003/events`

---

## 🔐 Autentykacja
Wymagane dla endpointów chronionych:
- Nagłówek: `Authorization: Bearer <token_jwt>`

---

## 🚀 Istniejące Endpointy

### 1. Pobranie wszystkich wydarzeń
`GET /`

**Endpoint publiczny**

Pobiera listę wszystkich aktywnych wydarzeń, posortowanych po dacie (od najnowszych).

**Odpowiedź (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "bio": "string",
    "event_date": "timestamp",
    "creator_id": "uuid"
  }
]
```

---

### 2. Pobranie wydarzenia po ID
`GET /:id`

**Endpoint publiczny**

Pobiera szczegółowe informacje o konkretnym wydarzeniu.

**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :id | uuid | ID wydarzenia |

**Odpowiedź (200 OK):**
```json
{
  "id": "uuid",
  "name": "string",
  "bio": "string",
  "event_date": "timestamp",
  "creator_id": "uuid",
  "header_picture_id": "uuid",
  "profile_picture_id": "uuid",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "deleted": false
}
```

---

### 3. Pobranie wydarzeń użytkownika
`GET /user-events`

**Wymagana autoryzacja**

Pobiera wydarzenia stworzone przez użytkownika oraz te, które obserwuje.

**Odpowiedź (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "bio": "string",
    "event_date": "timestamp",
    "creator_id": "uuid",
    "user_relation": "created" | "followed"
  }
]
```

---

### 4. Stworzenie nowego wydarzenia
`POST /`

**Wymagana autoryzacja**

Tworzy nowe wydarzenie. Zalogowany użytkownik staje się twórcą.

**Body:**
```json
{
  "name": "string",
  "bio": "string",
  "event_date": "ISO 8601 timestamp",
  "header_picture_id": "uuid",
  "profile_picture_id": "uuid"
}
```

**Odpowiedź (201 Created):**
```json
{
  "message": "Event stworzony!",
  "data": {
    "id": "uuid",
    "name": "string",
    "bio": "string",
    "event_date": "timestamp",
    "creator_id": "uuid",
    "header_picture_id": "uuid",
    "profile_picture_id": "uuid"
  }
}
```

---

### 5. Aktualizacja wydarzenia
`PUT /:id`

**Wymagana autoryzacja (Tylko twórca)**

Aktualizuje szczegóły wydarzenia. Tylko twórca może edytować.

**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :id | uuid | ID wydarzenia |

**Body:**
```json
{
  "name": "string",
  "bio": "string",
  "event_date": "ISO 8601 timestamp",
  "header_picture_id": "uuid",
  "profile_picture_id": "uuid"
}
```

**Odpowiedź (200 OK):**
```json
{
  "id": "uuid",
  "name": "string",
  "bio": "string",
  "event_date": "timestamp",
  "creator_id": "uuid",
  "header_picture_id": "uuid",
  "profile_picture_id": "uuid",
  "created_at": "timestamp"
}
```

---

### 6. Aktualizacja wydarzenia z obrazami (Gateway)

`PUT /events/:id/with-image`

**Gateway Route:** `PUT /events/:id/with-image`

**Wymagana autoryzacja (Tylko twórca)**

Aktualizuje wydarzenie z możliwością przesłania nowych zdjęć profilowego i w tle.

**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :id | uuid | ID wydarzenia |

**Forma multipart:**
- `name` (form field) - nazwa wydarzenia (opcjonalne)
- `bio` (form field) - opis (opcjonalne)
- `event_date` (form field) - data ISO 8601 (opcjonalne)
- `profile_picture` (file) - zdjęcie profilowe (opcjonalne)
- `header_picture` (file) - zdjęcie w tle (opcjonalne)

**Odpowiedź (200 OK):**
```json
{
  "id": "uuid",
  "name": "string",
  "bio": "string",
  "event_date": "timestamp",
  "creator_id": "uuid",
  "header_picture_id": "uuid",
  "profile_picture_id": "uuid",
  "created_at": "timestamp"
}
```

---

### 7. Stworzenie wydarzenia z obrazami (Gateway)

`POST /events/with-image`

**Gateway Route:** `POST /events/with-image`

**Wymagana autoryzacja**

Tworzy nowe wydarzenie z możliwością przesłania zdjęć profilowego i w tle.

**Forma multipart:**
- `name` (form field) - nazwa wydarzenia
- `bio` (form field) - opis
- `event_date` (form field) - data ISO 8601
- `profile_picture` (file) - zdjęcie profilowe (opcjonalne)
- `header_picture` (file) - zdjęcie w tle (opcjonalne)

**Odpowiedź (201 Created):**
```json
{
  "message": "Event stworzony!",
  "data": {
    "id": "uuid",
    "name": "string",
    "bio": "string",
    "event_date": "timestamp",
    "creator_id": "uuid",
    "header_picture_id": "uuid",
    "profile_picture_id": "uuid"
  }
}
```

---

### 8. Usunięcie wydarzenia (Soft Delete)
`DELETE /:id`

**Wymagana autoryzacja (Tylko twórca)**

Miękkie usunięcie wydarzenia (oznaczenie jako usunięte, bez usuwania z bazy).

**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :id | uuid | ID wydarzenia |

**Odpowiedź (200 OK):**
```json
{
  "message": "Event został usunięty"
}
```

---

### 9. Toggle obserwowania wydarzenia
`POST /:id/follow`

**Wymagana autoryzacja**

Dodaje lub usuwa obserwowanie wydarzenia przez zalogowanego użytkownika.

**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :id | uuid | ID wydarzenia |

**Odpowiedź (201 Created) - nowe obserwowanie:**
```json
{
  "message": "Follow został dodany"
}
```

**Odpowiedź (200 OK) - usunięte obserwowanie:**
```json
{
  "message": "Follow został usunięty"
}
```

---

### 10. Pobranie obserwujących wydarzenia
`GET /:id/followers`

**Endpoint publiczny**

Pobiera listę użytkowników obserwujących dane wydarzenie.

**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :id | uuid | ID wydarzenia |

**Odpowiedź (200 OK):**
```json
[
  {
    "user_id": "uuid",
    "name": "string",
    "surname": "string",
    "profile_picture_id": "uuid",
    "is_company": boolean
  }
]
```

---

## 📡 RabbitMQ Events

Event-Service publishes events to RabbitMQ on the `app_events` topic exchange. Subscribe to the following routing keys to handle event-related events:

### Event Management Events

**`event.created`** - Published when a new event is created
```json
{
  "eventId": "uuid",
  "name": "string",
  "creatorId": "uuid",
  "eventDate": "ISO8601",
  "timestamp": "ISO8601"
}
```

**`event.updated`** - Published when an event is updated
```json
{
  "eventId": "uuid",
  "name": "string",
  "bio": "string",
  "eventDate": "ISO8601",
  "timestamp": "ISO8601"
}
```

**`event.deleted`** - Published when an event is deleted
```json
{
  "eventId": "uuid",
  "timestamp": "ISO8601"
}
```

### Event Follow Events

**`event.followed`** - Published when a user follows an event
```json
{
  "eventId": "uuid",
  "userId": "uuid",
  "timestamp": "ISO8601"
}
```

**`event.unfollowed`** - Published when a user unfollows an event
```json
{
  "type": "event.unfollowed",
  "eventId": "uuid",
  "userId": "uuid",
  "timestamp": "ISO8601"
}
```

---

## ⚠️ Obsługa Błędów

| Kod | Komunikat | Opis |
|---|---|---|
| 400 | Bad Request | Błąd walidacji lub brakujące wymagane pola. |
| 401 | Unauthorized | Token JWT jest nieprawidłowy lub wygasł. |
| 403 | Forbidden | Brak tokena JWT lub brak uprawnień (nie jesteś twórcą). |
| 404 | Not Found | Wydarzenie nie istnieje. |
| 500 | Internal Server Error | Wewnętrzny błąd serwera lub baza danych. |

---

## 💡 Proponowane Endpointy

Poniższe endpointy mogą być dodane w przyszłości, aby rozszerzyć funkcjonalność:

### P1. Rejestracja użytkownika na uczestnictwo w wydarzeniu
`POST /:id/attend`

**Wymagana autoryzacja**

Rejestruje zalogowanego użytkownika jako uczestnika wydarzenia.

**Body:**
```json
{}
```

**Odpowiedź (201 Created):**
```json
{
  "event_id": "uuid",
  "user_id": "uuid",
  "registered_at": "timestamp"
}
```

---

### P2. Pobranie listy uczestników
`GET /:id/attendees`

**Endpoint publiczny**

Pobiera listę użytkowników zarejestrowanych jako uczestnicy wydarzenia.

**Odpowiedź (200 OK):**
```json
[
  {
    "user_id": "uuid",
    "name": "string",
    "surname": "string",
    "profile_picture_id": "uuid",
    "registered_at": "timestamp"
  }
]
```

---

### P3. Usunięcie uczestnika z wydarzenia
`DELETE /:id/attendees/:user_id`

**Wymagana autoryzacja (Tylko twórca lub uczestnik)**

Usuwa uczestnika z wydarzenia.

**Odpowiedź (204 No Content)**

---

### P4. Pobranie statystyk wydarzenia
`GET /:id/stats`

**Endpoint publiczny**

Pobiera statystyki wydarzenia (liczba obserwujących, uczestników, itp.).

**Odpowiedź (200 OK):**
```json
{
  "event_id": "uuid",
  "followers_count": 42,
  "attendees_count": 15,
  "days_until_event": 7
}
```

---

## 📝 Uwagi

- Data wydarzenia powinna być w formacie ISO 8601 (np. "2026-06-15T14:30:00Z").
- Obraz nagłówkowy (header_picture_id) i profilowy (profile_picture_id) są opcjonalne.
- Tylko twórcy mogą edytować lub usuwać swoje wydarzenia.
- System obserwowania (follow) pozwala użytkownikom na śledzenie interesujących ich wydarzeń.
- Wydarzenia są miękko usuwane (oznaczane jako usunięte, ale pozostają w bazie).
