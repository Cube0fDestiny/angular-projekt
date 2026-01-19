## 🚀 Istniejące Endpointy

### 1. Pobranie wszystkich grup
`GET /`

**Endpoint publiczny**

Pobiera listę wszystkich aktywnych grup.

**Odpowiedź (200 OK):**

```json
[
  {
    "id": uuid,
    "bio": string,
    "header_picture_id": uuid,
    "profile_picture_id": uuid,
    "name": string,
    "created_at": timestamp,
    "member_data": {
        "members": int,
        "owner_id": uuid
    }
  }
]

```

### 2. Pobranie konkretnej grupy
`GET /:g_id`

**Endpoint publiczny**

Pobiera konkretną grupę o id g_id.

**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :g_id | uuid | ID grupy |



**Odpowiedź (200 OK):**

```json 
   {
    "id": uuid,
    "bio": string,
    "header_picture_id": uuid,
    "profile_picture_id": uuid,
    "name": string,
    "created_at": timestamp,
    "member_data": {
        "members": int,
        "owner_id": uuid
    }
  }
 
```


### 3. Pobranie konkretnej grupy
`GET /user-groups` (ewentualnie ?id={id wyszukiwanego użytkwnika})

**Endpoint publiczny**
Pobiera listę wszystkich grup których członkiem jest użytkwonik
  

**Odpowiedź (200 OK):**

```json 
[
   {
    "id": uuid,
    "bio": string,
    "header_picture_id": uuid,
    "profile_picture_id": uuid,
    "name": string,
    "created_at": timestamp,
    "member_data": {
        "members": int,
        "owner_id": uuid
    }
  }
]
```
### 4. Pobranie listy członków grupy
`GET :id/get_members`  

**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :id | uuid | ID grupy |


**Endpoint publiczny**
Pobiera listę członków grupy i ich ról


**Body**

```json
{
    "target_user": "9da9dc7a-f029-4091-88d3-435ee8163d2f"
}
```

target user zawiera uuid użytkownika którego status chcemy podejrzec


**Odpowiedź (200 OK):**

```json 
[
    {
        "user_id": uuid,
        "name": string,
        "surname": string,
        "profile_picture_id": uuid,
        "profile_header": uuid,
        "member_type": "normal_member" || "moderator" || "admin" || "owner" || "banned"
    }
]
```

### 5. Pobranie statusu członka w grupie
`GET :id/get_membership`  

**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :id | uuid | ID grupy |


**Endpoint publiczny**
Pobiera rolę użytkownika w grupie
 


**Odpowiedź (200 OK):**

```json  
    {
        "user_id": uuid,
        "name": string,
        "surname": string,
        "profile_picture_id": uuid,
        "profile_header": uuid,
        "member_type": "normal_member" || "moderator" || "admin" || "owner" || "banned"
    } 
```


### 6. Pobranie aplikacji do grupy
`GET :id/applications`  


**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :id | uuid | ID grupy |


**Wymagana autoryzacja**


Pobiera rolę użytkwonika w grupie
Tylko członkowie z rolą "admin" lub "owner" mogą podejrzeć aplikacje


**Odpowiedź (200 OK):**

```json  
 [
    {
        "user_id": uuid,
        "created_at": timestamp,
        "group_id": uuid,
        "valid": boolean,
        "member_type": "normal_member" || "moderator" || "admin" || "owner" || "banned",
        "deleted": boolean
    }
]
```



### 7.Edytowanie danych grupy
`PUT :id`  

**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :id | uuid | ID grupy |


**Body**
```json
{
    "name":string,
    "bio": string,
    "header_picture_id": uuid,
    "profile_picture_id":uuid,
    "free_join":boolean
}
```


**Wymagana autoryzacja**

Edytuje dane grupy
Tylko członkowie z rolą "admin" lub "owner" mogą edytować grupę


**Odpowiedź (200 OK):**

```json  
 {
    "created_at": timestamp,
    "bio": string,
    "header_picture_id": uuid,
    "profile_picture_id": uuid,
    "id":uuid,
    "name": string,
    "deleted": boolean,
    "free_join": boolean
}
```



### 8. Usunięcie grupy (soft delete)
`DELETE :id`  

**Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :id | uuid | ID grupy |


 


**Wymagana autoryzacja**


Usuwa grupę
Tylko "owner" może usunąć grupę

**Odpowiedź (200 OK):**
```json
{
  "message": "Grupa została usunięta"
}
```



### 9.Stworzenie grupy
`POST /`   
 

**Wymagana autoryzacja** 
Jedynie zalogowani użytkownicy mogą stworzyć grupę

**Body**
```json
{
    "name":string,
    "bio": string,
    "header_picture_id": uuid,
    "profile_picture_id":uuid,
    "free_join":boolean
}
```
**Odpowiedź (200 OK):**
```json
{
    "name":string,
    "bio": string,
    "header_picture_id": uuid,
    "profile_picture_id":uuid,
    "free_join":boolean
}
```


### 10.Wyjście z grupy
`POST /:id/leave`   
 
 **Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :id | uuid | ID grupy |



**Wymagana autoryzacja** 
Jedynie członkowie grupy mogą ją opuścić
 
**Odpowiedź (200 OK):**
```json
 {
        "user_id": uuid,
        "created_at": timestamp,
        "group_id": uuid,
        "valid": boolean,
        "member_type": "normal_member" || "moderator" || "admin" || "owner" || "banned",
        "deleted": boolean
    }
```



### 11.Zmiana statusu członka grupy
`POST /:id/alter_member`   
 
 **Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :id | uuid | ID grupy |



**Wymagana autoryzacja** 
Jedynie członkowie grupy o randze wyższej od teraźniejszej rangi zmienianego członka jak i przyszłej rangi zmienianego członka mogą ją zmienić


**Body**
```json
{
    "action":"change_role"|| "kick" || "accept",
    "target_user":uuid,
    "target_role": "normal_member" || "moderator" || "admin" || "banned"
}
```
wyjaśnienie akcji:change role  zmienia rolę użytkownika (w tym z/na banned), kick wyrzuca go z grupy (valid=false,deleted=true), accept akceptuje go do grupy (valid=false->true)

**Odpowiedź (200 OK):**
```json
 {
        "user_id": uuid,
        "created_at": timestamp,
        "group_id": uuid,
        "valid": boolean,
        "member_type": "normal_member" || "moderator" || "admin" || "owner" || "banned",
        "deleted": boolean
    }
```





### 11.Dołączenie do grupy
`POST /:group_id/join` 
 **Parametry:**
| Parametr | Typ | Opis |
|---|---|---|
| :group_id | uuid | ID grupy |



**Wymagana autoryzacja** 
Jedynie zalogowani użytkownicy mogą prosić o dołączenie do grupy
Jeżeli grupa pozwala na dołączenie bez potwierdzenia (Free_join)


**Odpowiedź (200 OK):**
```json{message: "Użytkownik dołączył do grupy"}
```
LUB 
```json
{
"message": "Użytkownik wysłał prośbę o dołączenie do grupy"
 }
```

## ⚠️ Obsługa Błędów

| Kod | Komunikat | Opis |
|---|---|---|
| 400 | Bad Request | Błąd walidacji lub brakujące wymagane pola. |
| 401 | Unauthorized | Token JWT jest nieprawidłowy lub wygasł. |
| 403 | Forbidden | Brak tokena JWT lub brak uprawnień (nie jesteś twórcą). |
| 404 | Not Found | Wydarzenie nie istnieje. |
| 500 | Internal Server Error | Wewnętrzny błąd serwera lub baza danych. |

