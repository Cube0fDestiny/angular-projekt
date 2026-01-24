# 📄 Dokumentacja API: Post-Service

Serwis obsługujący zarządzanie postami, komentarzami i reakcjami.

**Base URL:** `http://localhost:3002/posts`

---
## 🔐 Autentykacja

Wymagane dla endpointów chronionych:

-   Nagłówek: `Authorization: Bearer <token_jwt>`

---
## 🚀 Endpointy: Posty

### 1\. Pobranie wszystkich postów

`GET /`

**Endpoint publiczny**

**Odpowiedź (200 OK):**

```
[
  {
    "id": "uuid",
    "creator_id": "uuid",
    "Text": "string",
    "location_id": "uuid",
    "location_type": "string",
    "created_at": "timestamp",
    "images": [
      {
        "image_id": "uuid",
        "image_order": 0
      }
    ],
    "reactions": {
      "totalCount": 10,
      "counts": [
        {
          "type": "like",
          "count": 5
        },
        {
          "type": "love",
          "count": 5
        }
      ]
    },
    "comment_count": 3
  }
]
```

### 2\. Pobranie postów dla lokalizacji

`GET /location/:locationId`

**Endpoint publiczny**

**Odpowiedź (200 OK):**

```
[
  {
    "id": "uuid",
    "creator_id": "uuid",
    "Text": "string",
    "location_id": "uuid",
    "location_type": "string",
    "created_at": "timestamp",
    "images": [
      {
        "image_id": "uuid",
        "image_order": 0
      }
    ],
    "reactions": {
      "totalCount": 10,
      "counts": [
        {
          "type": "like",
          "count": 5
        },
        {
          "type": "love",
          "count": 5
        }
      ]
    },
    "comment_count": 3
  }
]
```

### 3\. Pobranie konkretnego posta

`GET /:id`

**Endpoint publiczny**

**Odpowiedź (200 OK):**

```
{
  "id": "uuid",
  "creator_id": "uuid",
  "Text": "string",
  "location_id": "uuid",
  "location_type": "string",
  "created_at": "timestamp",
  "images": [
    {
      "image_id": "uuid",
      "image_order": 0
    }
  ],
  "reactions": {
    "totalCount": 10,
    "counts": [
      {
        "type": "like",
        "count": 5
      },
      {
        "type": "love",
        "count": 5
      }
    ]
  },
  "comment_count": 3
}
```

### 4\. Stworzenie nowego posta

`POST /`

**Wymagana autoryzacja**

**Body:**

```
{
  "content": "string",
  "location_id": "uuid",
  "location_type": "string"
}
```

**Odpowiedź (201 Created):**

```
{
  "id": "uuid",
  "creator_id": "uuid",
  "Text": "string",
  "location_id": "uuid",
  "location_type": "string",
  "created_at": "timestamp",
  "deleted": false
}
```

### 5\. Aktualizacja posta

`PUT /:id`

**Wymagana autoryzacja (Właściciel lub Admin)**

**Body:**

```
{
  "content": "string"
}
```

**Odpowiedź (200 OK):** Pełny, zaktualizowany obiekt posta.

### 6\. Usunięcie posta (Soft Delete)

`DELETE /:id`

**Wymagana autoryzacja (Właściciel lub Admin)**

**Odpowiedź (200 OK):**

```
{
  "message": "Post został usunięty"
}
```

### 7\. Stworzenie posta z obrazami (Gateway)

`POST /posts/with-images`

**Gateway Route:** `POST /posts/with-images`

**Wymagana autoryzacja**

**Forma multipart:**
- `content` (form field) - tekst posta
- `location_id` (form field, opcjonalne)
- `location_type` (form field, opcjonalne)
- `images` (file array) - pliki obrazów

**Odpowiedź (201 Created):**

```
{
  "id": "uuid",
  "creator_id": "uuid",
  "Text": "string",
  "location_id": "uuid",
  "location_type": "string",
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
## 🚀 Endpointy: Komentarze i Reakcje

### 8\. Pobranie komentarzy do posta

`GET /:postId/comments`

**Endpoint publiczny**

**Odpowiedź (200 OK):**

```
[
  {
    "id": "uuid",
    "created_at": "timestamp",
    "in_reply_to": "uuid",
    "text": "string",
    "image_ids": ["uuid"],
    "creator_id": "uuid",
    "post_id": "uuid"
  }
]
```

### 9\. Dodanie komentarza do posta

`POST /:postId/comments`

**Wymagana autoryzacja**

**Body:**

```
{
  "text": "string",
  "in_reply_to": "uuid",
  "image_ids": ["uuid"]
}
```

**Odpowiedź (201 Created):** Pełny obiekt nowego komentarza.

### 10\. Aktualizacja komentarza

`PUT /comments/:commentId`

**Wymagana autoryzacja (Właściciel lub Admin)**

**Body:**

```
{
  "text": "string"
}
```

**Odpowiedź (200 OK):** Pełny, zaktualizowany obiekt komentarza.

### 11\. Usunięcie komentarza (Soft Delete)

`DELETE /comments/:commentId`

**Wymagana autoryzacja (Właściciel lub Admin)**

**Odpowiedź (200 OK):**

```
{
  "message": "Komentarz został usunięty"
}
```

### 12\. Przełączanie reakcji na poście

`POST /:id/reactions`

**Wymagana autoryzacja**

Ten endpoint obsługuje dodawanie, usuwanie i aktualizację reakcji.

**Body:**

```
{
  "reaction": "string"
}
```

**Odpowiedzi (200 OK / 201 Created):**

-   **201:** `{ "message": "Reakcja została stworzona" }` (gdy użytkownik reaguje po raz pierwszy)
-   **200:** `{ "message": "Reakcja została usunięta" }` (gdy użytkownik klika tę samą reakcję ponownie)
-   **200:** `{ "message": "Reakcja została zaktualizowana" }` (gdy użytkownik zmienia typ reakcji)

### 13\. Pobranie mojej reakcji na poście

`GET /:id/reactions`

**Wymagana autoryzacja**

**Odpowiedź (200 OK):**

```
{
  "reaction": "string" lub null
}
```

---
## ⚠️ Obsługa Błędów
| Kod | Komunikat | Opis |
|---|---|---|
| 400 | Bad Request | Błąd walidacji, np. brak wymaganych pól w body. |
| 401 | Unauthorized | Nieprawidłowy lub wygasły token JWT. |
| 403 | Forbidden | Brak tokena lub próba modyfikacji zasobu bez uprawnień (np. edycja cudzego posta). |
| 404 | Not Found | Nie znaleziono posta lub komentarza o podanym ID. |
| 500 | Server Error | Wewnętrzny błąd serwera, najczęściej związany z bazą danych. |
---

## 📋 Proponowane Endpointy

Endpointy planowane do implementacji:

### P1. Pobranie postów z filtrem
`GET /?location_type=string&limit=10&offset=0`
- *Endpoint publiczny*
- **Parametry:** location_type (opcjonalnie), limit, offset dla paginacji
- Filtrowanie postów po typie lokalizacji z obsługą paginacji

### P2. Liczba komentarzy na poście
`GET /:id/comments/count`
- *Endpoint publiczny*
- **Odpowiedź:** `{ "count": number }`
- Szybkie pobranie liczby komentarzy bez pełnych danych
---

## 📡 RabbitMQ Events

Post-Service publishes events to RabbitMQ on the `app_events` topic exchange. Subscribe to the following routing keys to handle post-related events:

### Post Events

**`post.created`** - Published when a new post is created
```json
{
  "postId": "uuid",
  "creatorId": "uuid",
  "timestamp": "ISO8601"
}
```

**`post.updated`** - Published when a post is updated
```json
{
  "postId": "uuid",
  "text": "string",
  "timestamp": "ISO8601"
}
```

**`post.deleted`** - Published when a post is deleted
```json
{
  "postId": "uuid",
  "timestamp": "ISO8601"
}
```

### Comment Events

**`comment.created`** - Published when a comment is created on a post
```json
{
  "commentId": "uuid",
  "postId": "uuid",
  "creatorId": "uuid",
  "timestamp": "ISO8601"
}
```

### Reaction Events

**`reaction.created`** - Published when a reaction is added to a post
```json
{
  "postId": "uuid",
  "userId": "uuid",
  "reactionType": "string",
  "timestamp": "ISO8601"
}
```
---

**Uwagi:**

-   Endpointy usuwania wykonują operację "soft delete" (ustawiają flagę `deleted` na `true`), nie usuwając danych z bazy.