# 📄 Dokumentacja API: User-Service

Serwis obsługujący zarządzanie użytkownikami, rejestrację oraz autentykację (JWT + PBKDF2).

**Base URL:** `http://localhost:3001/users`

---

## 🔐 Autentykacja
Wymagane dla endpointów chronionych:
- Nagłówek: `Authorization: Bearer <token_jwt>`
- Token wygasa po: **1h**

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

### 6. Usunięcie konta (Soft Delete)
`DELETE /:id`
- *Wymagana autoryzacja (Właściciel lub Admin)*

**Odpowiedź (200 OK):**
{
  "message": "Profil został usunięty",
  "user_id": "uuid"
}

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