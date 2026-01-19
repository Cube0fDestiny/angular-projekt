# 📄 Dokumentacja API: User-Service

Serwis obsługujący zarządzanie użytkownikami, rejestrację oraz autentykację (JWT + PBKDF2).

**Base URL:** `http://localhost:3001/users`

---

## 🔐 Autentykacja
Wymagane dla endpointów chronionych:
- Nagłówek: `Authorization: Bearer <token_jwt>`
- Token wygasa po: **12h**

---

## 🚀 Endpointy

### 1. Rejestracja użytkownika
`POST /register`

**Body:**
{
  "name": "string",
  "surname": "string",
  "email": "string",
  "password": "string",
  "is_company": boolean
}

**Odpowiedź (201 Created):**
{
  "user": {
    "id": "uuid",
    "name": "string",
    "surname": "string",
    "email": "string",
    "is_company": boolean,
    "avatar": "url"
  },
  "token": "string"
}

---

### 2. Logowanie
`POST /login`

**Body:**
{
  "email": "string",
  "password": "string"
}

**Odpowiedź (200 OK):**
{
  "user": {
    "id": "uuid",
    "name": "string",
    "surname": "string",
    "email": "string",
    "is_company": boolean,
    "avatar": "url"
  },
  "token": "string"
}

---

### 3. Pobranie wszystkich użytkowników
`GET /`
- *Endpoint publiczny*

**Odpowiedź (200 OK):**
[
  {
    "id": "uuid",
    "name": "string",
    "surname": "string",
    "email": "string",
    "bio": "string",
    "is_company": boolean,
    "created_at": "date",
    "avatar": "url"
  }
]

---

### 4. Profil użytkownika
`GET /:id`
- *Endpoint publiczny*

**Odpowiedź (200 OK):**
{
  "id": "uuid",
  "name": "string",
  "surname": "string",
  "email": "string",
  "bio": "string",
  "is_company": boolean,
  "created_at": "date",
  "avatar": "url"
}

---

### 5. Aktualizacja profilu
`PUT /:id`
- *Wymagana autoryzacja (Właściciel lub Admin)*

**Body (wszystkie pola opcjonalne):**
{
  "name": "string",
  "bio": "string",
  "is_company": boolean
}

**Odpowiedź (200 OK):**
{
  "message": "Profil został zaktualizowany",
  "user_id": "uuid"
}

---

### 6. Aktualizacja profilu z obrazami (Gateway)

`PUT /users/:id/profile-with-image`

**Gateway Route:** `PUT /users/:id/profile-with-image`

**Wymagana autoryzacja (Właściciel lub Admin)**

Aktualizuje profil użytkownika z możliwością przesłania zdjęcia profilowego i w tle.

**Forma multipart:**
- `name` (form field, opcjonalne) - imię
- `bio` (form field, opcjonalne) - biografia
- `is_company` (form field, opcjonalne) - czy to konto firmowe
- `profile_picture` (file) - zdjęcie profilowe (opcjonalne)
- `header_picture` (file) - zdjęcie w tle (opcjonalne)

**Odpowiedź (200 OK):**
```json
{
  "message": "Profil został zaktualizowany",
  "user_id": "uuid",
  "profile_picture_id": "uuid",
  "header_picture_id": "uuid"
}
```

---

### 7. Usunięcie konta (Soft Delete)
`DELETE /:id`
- *Wymagana autoryzacja (Właściciel lub Admin)*

**Odpowiedź (200 OK):**
{
  "message": "Profil został usunięty",
  "user_id": "uuid"
}

---

## � Endpointy: Śledzenie (Follow)

### 8. Przełączanie śledzenia użytkownika
`POST /:id/follow`
- *Wymagana autoryzacja*

**Odpowiedź (201 Created / 200 OK):**
```
{
  "message": "Successfully followed." | "Successfully unfollowed."
}
```

---

### 9. Pobranie obserwujących użytkownika
`GET /:id/followers`
- *Endpoint publiczny*

**Odpowiedź (200 OK):**
```
[
  {
    "follower": "uuid",
    "username": "string",
    "avatar": "url"
  }
]
```

---

### 10. Pobranie użytkowników śledzonych przez użytkownika
`GET /:id/following`
- *Endpoint publiczny*

**Odpowiedź (200 OK):**
```
[
  {
    "followee": "uuid",
    "username": "string",
    "avatar": "url"
  }
]
```

---

## 👥 Endpointy: Zaproszenia Przyjaźni

### 11. Wysłanie zaproszenia przyjaźni
`POST /:id/friend-request`
- *Wymagana autoryzacja*

**Odpowiedź (201 Created):**
```
{
  "message": "Friend request sent successfully."
}
```

---

### 12. Zaakceptowanie zaproszenia przyjaźni
`POST /friend-requests/:id/accept`
- *Wymagana autoryzacja*

**Odpowiedź (200 OK):**
```
{
  "message": "Friend request accepted."
}
```

---

### 13. Odrzucenie/Anulowanie zaproszenia przyjaźni
`DELETE /friend-requests/:id`
- *Wymagana autoryzacja*

**Odpowiedź (200 OK):**
```
{
  "message": "Friend request cancelled successfully." | "Friend request rejected successfully."
}
```

---

## 👫 Endpointy: Zarządzanie Przyjaciółmi

### 14. Lista przyjaciół użytkownika
`GET /friends/list`
- *Wymagana autoryzacja*

**Odpowiedź (200 OK):**
```
[
  {
    "friend_id": "uuid"
  }
]
```

---

### 15. Usunięcie przyjaciela
`DELETE /friends/:id`
- *Wymagana autoryzacja*

**Odpowiedź (200 OK):**
```
{
  "message": "Friend removed successfully."
}
```

---

### 16. Pobranie przychodzących zaproszeń przyjaźni
`GET /friend-requests/incoming`
- *Wymagana autoryzacja*

**Odpowiedź (200 OK):**
```
[
  {
    "from_user_id": "uuid",
    "created_at": "timestamp"
  }
]
```

---

### 17. Pobranie wysłanych zaproszeń przyjaźni
`GET /friend-requests/outgoing`
- *Wymagana autoryzacja*

**Odpowiedź (200 OK):**
```
[
  {
    "to_user_id": "uuid",
    "created_at": "timestamp"
  }
]
```

---

### 18. Pobranie zaproszeni do rozpatrzenia (oczekujące)
`GET /friend-requests/pending`
- *Wymagana autoryzacja*

**Odpowiedź (200 OK):**
```
[
  {
    "id": "uuid",
    "requester": "uuid",
    "requestee": "uuid",
    "active": false,
    "created_at": "timestamp"
  }
]
```

---

## �📋 Proponowane Endpointy

Endpointy planowane do implementacji:

### P1. Wyszukiwanie użytkowników
`GET /search?query=string&limit=10`
- *Endpoint publiczny*
- **Parametry:** query (string), limit (liczba wyników)
- Wyszukiwanie po imieniu, nazwisku lub email

### P2. Użytkownicy rekomendowani
`GET /recommended`
- *Endpoint publiczny*
- Zwracanie sugestii użytkowników do obsłużenia (np. pracownicy branży)

### P3. Status przyjaźni/śledzenia
`GET /:id/friendship-status`
- *Wymagana autoryzacja*
- Sprawdzenie statusu relacji między zalogowanym użytkownikiem a danym użytkownikiem
- **Odpowiedź:** `{ "status": "friend" | "following" | "pending" | "blocked" | "none" }`

### P4. Zablokowanie użytkownika
`POST /:id/block`
- *Wymagana autoryzacja*
- **Odpowiedź:** `{ "message": "User blocked successfully." }`

### P5. Weryfikacja email
`POST /verify-email`
- **Body:** `{ "email": "string", "code": "string" }`
- Endpoint do potwierdzenia adresu email z użyciem kodu weryfikacyjnego

---

## 📡 RabbitMQ Events

User-Service publishes events to RabbitMQ on the `app_events` topic exchange. Subscribe to the following routing keys to handle user-related events:

### User Account Events

**`user.registered`** - Published when a new user registers
```json
{
  "userId": "uuid",
  "email": "string",
  "name": "string",
  "surname": "string",
  "is_company": boolean,
  "timestamp": "ISO8601"
}
```

**`user.updated`** - Published when a user's profile is updated
```json
{
  "userId": "uuid",
  "name": "string",
  "surname": "string",
  "email": "string",
  "bio": "string",
  "is_company": boolean,
  "timestamp": "ISO8601"
}
```

**`user.deleted`** - Published when a user account is deleted
```json
{
  "userId": "uuid",
  "timestamp": "ISO8601"
}
```

### Follow Events

**`user.followed`** - Published when a user follows another user
```json
{
  "followerId": "uuid",
  "followeeId": "uuid",
  "timestamp": "ISO8601"
}
```

**`user.unfollowed`** - Published when a user unfollows another user
```json
{
  "followerId": "uuid",
  "followeeId": "uuid",
  "timestamp": "ISO8601"
}
```

### Friendship Request Events

**`user.friendRequested`** - Published when a friend request is sent
```json
{
  "requesterId": "uuid",
  "requesteeId": "uuid",
  "timestamp": "ISO8601"
}
```

**`user.friendAccepted`** - Published when a friend request is accepted
```json
{
  "userId": "uuid",
  "friendId": "uuid",
  "timestamp": "ISO8601"
}
```

**`user.friendRequestCancelled`** - Published when a friend request is cancelled by the requester
```json
{
  "userId": "uuid",
  "otherUserId": "uuid",
  "timestamp": "ISO8601"
}
```

**`user.friendRequestRejected`** - Published when a friend request is rejected by the requestee
```json
{
  "userId": "uuid",
  "otherUserId": "uuid",
  "timestamp": "ISO8601"
}
```

**`user.friendRemoved`** - Published when a friendship is removed
```json
{
  "userId": "uuid",
  "friendId": "uuid",
  "timestamp": "ISO8601"
}
```

---

## ⚠️ Obsługa Błędów

| Kod | Komunikat | Opis |
|:--- |:--- |:--- |
| 400 | Bad Request | Błąd walidacji danych lub email zajęty. |
| 401 | Unauthorized | Błędne hasło lub token wygasł (jwt expired). |
| 403 | Forbidden | Brak tokena lub brak uprawnień do edycji innego profilu. |
| 404 | Not Found | Nie znaleziono użytkownika o podanym ID. |
| 500 | Server Error | Błąd bazy danych lub konfiguracji serwera. |

---

**Uwagi:**
- Avatary są generowane automatycznie przez pravatar.cc na podstawie adresu email.
- Pole bio jest domyślnie puste (null) przy rejestracji.