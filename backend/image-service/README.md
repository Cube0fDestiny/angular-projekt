# 📄 Dokumentacja API: Image-Service

Serwis dedykowany do uploadu, serwowania i usuwania obrazów. Przechowuje binarne dane plików i oferuje dynamiczne skalowanie.

**Base URL:** `http://localhost:3002/images`

---
## 🔐 Autentykacja

Wymagane dla endpointów chronionych (`POST`, `DELETE`):

-   Nagłówek: `Authorization: Bearer <token_jwt>`

---
## 🚀 Endpointy

### 1\. Upload nowego obrazu

`POST /`

**Wymagana autoryzacja**

Przesyła plik obrazu na serwer, zapisuje go w bazie danych i zwraca jego unikalny identyfikator.

#### Body:

Żądanie musi być wysłane jako `multipart/form-data` i zawierać pole pliku (`File`) o nazwie `image`.

#### Odpowiedź (201 Created):
```
{
  "id": "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6"
}
```

### 2\. Pobranie obrazu (z opcją skalowania)

`GET /:id`

**Endpoint publiczny**

Zwraca surowe dane binarne obrazu. Nagłówek `Content-Type` jest automatycznie ustawiany na podstawie typu obrazu zapisanego w bazie (np. `image/jpeg`).

#### Parametry Ścieżki:
| Parametr | Typ | Opis |
|---|---|---|
| :id | uuid | Wymagany. Identyfikator obrazu do pobrania. |
#### Parametry Zapytania (Query):
| Parametr | Typ | Opis |
|---|---|---|
| w | integer | Docelowa szerokość obrazu w pikselach. |
| h | integer | Docelowa wysokość obrazu w pikselach. |

**Uwaga:** Skalowanie zostanie wykonane **tylko i wyłącznie**, jeśli w zapytaniu podane zostaną **oba** parametry (\`w\` oraz \`h\`). Podanie tylko jednego parametru lub brak parametrów spowoduje zwrot oryginalnego obrazu.

#### Odpowiedź (200 OK):

Ciało odpowiedzi zawiera surowe dane obrazu (nie JSON).

### 3\. Usunięcie obrazu

`DELETE /:id`

**Wymagana autoryzacja**

Trwale usuwa obraz z bazy danych. Powinno być wywoływane przez inny serwis (np. przez Gateway), gdy powiązany z obrazem zasób (np. post) jest usuwany.

#### Parametry Ścieżki:
| Parametr | Typ | Opis |
|---|---|---|
| :id | uuid | Wymagany. Identyfikator obrazu do usunięcia. |
#### Odpowiedź (204 No Content):

Serwer zwraca status `204`, co oznacza pomyślne usunięcie. Ciało odpowiedzi jest puste.

---
## ⚠️ Obsługa Błędów
| Kod | Komunikat | Opis |
|---|---|---|
| 400 | Bad Request | Nie przesłano pliku w żądaniu POST lub podano niepoprawne parametry skalowania (w, h). |
| 401 | Unauthorized | Token JWT jest nieprawidłowy lub wygasł. |
| 403 | Forbidden | Brak tokena JWT w nagłówku Authorization. |
| 404 | Not Found | Nie znaleziono obrazu o podanym identyfikatorze. |
| 500 | Internal Server Error | Wewnętrzny błąd serwera, np. problem z połączeniem z bazą danych lub błąd podczas przetwarzania obrazu. |