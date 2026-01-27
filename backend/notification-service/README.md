# 📄 Dokumentacja API: Notification-Service

Serwis obsługujący powiadomienia użytkownika (REST) oraz publikujący zdarzenia do RabbitMQ. Dostarcza listę powiadomień, oznaczanie jako przeczytane oraz usuwanie.

**Base URL (REST):** `http://localhost:3007/notifications`

---

## 🔐 Autentykacja
Wymagana dla wszystkich endpointów:
- Nagłówek: `x-user-data: {"id": "uuid", "name": "string" }`
- Nagłówek musi zawierać `id` użytkownika; brak lub błędny nagłówek ⇒ `401 Brak autoryzacji`.

---

## 🚀 Endpointy

### 1. Pobranie powiadomień użytkownika
`GET /notifications?limit=20&offset=0`
- **Wymaga autoryzacji**
- Sortowanie: `created_at DESC`
- Paginacja przez `limit` (domyślnie 20) i `offset` (domyślnie 0)

**Odpowiedź (200 OK):**
```json
{
	"notifications": [
		{
			"id": "uuid",
			"user_id": "uuid",
			"type": "string",
			"title": "string",
			"message": "string",
			"data": { "...": "..." },
			"is_read": false,
			"created_at": "timestamp"
		}
	],
	"total": 42,
	"limit": 20,
	"offset": 0
}
```

### 2. Licznik nieprzeczytanych
`GET /notifications/unread-count`
- **Wymaga autoryzacji**

**Odpowiedź (200 OK):**
```json
{ "unreadCount": 5 }
```

### 3. Oznaczenie powiadomienia jako przeczytane
`PATCH /notifications/:id/read`
- **Wymaga autoryzacji**
- Działa tylko na powiadomienia zalogowanego użytkownika

**Odpowiedź (200 OK):**
```json
{
	"message": "Notification marked as read",
	"notification": { "id": "uuid", "is_read": true }
}
```
- **404** gdy powiadomienie nie istnieje lub nie należy do użytkownika

### 4. Oznaczenie wszystkich jako przeczytane
`PATCH /notifications/read-all`
- **Wymaga autoryzacji**

**Odpowiedź (200 OK):**
```json
{ "message": "Marked X notifications as read", "count": 12 }
```

### 5. Usunięcie powiadomienia
`DELETE /notifications/:id`
- **Wymaga autoryzacji**

**Odpowiedź (200 OK):**
```json
{ "message": "Notification deleted", "notificationId": "uuid" }
```
- **404** gdy nie znaleziono

### 6. Usunięcie wszystkich powiadomień
`DELETE /notifications/`
- **Wymaga autoryzacji**

**Odpowiedź (200 OK):**
```json
{ "message": "Deleted X notifications", "count": 42 }
```

### 7. Utworzenie powiadomienia (test/internal)
`POST /notifications/`
- **Wymaga autoryzacji** (zwykle tylko serwisy wewnętrzne)
- Body:
```json
{
	"userId": "uuid",          // wymagane
	"type": "string",          // opcjonalne, domyślnie "general"
	"title": "string",         // wymagane
	"message": "string",       // opcjonalne
	"data": { "any": "json" } // opcjonalne
}
```

**Odpowiedź (201 Created):**
```json
{
	"message": "Notification created",
	"notification": { "id": "uuid", "title": "string", "data": {"...": "..."} }
}
```
- **400** gdy brakuje `userId` lub `title`

---

## 📡 Zdarzenia RabbitMQ
Serwis publikuje zdarzenie `notification.created` po utworzeniu powiadomienia (POST /notifications/).

**Payload przykładowy:**
```json
{
	"notificationId": "uuid",
	"userId": "uuid",
	"type": "post.liked",
	"title": "Twój post został polubiony"
}
```

---

## 📬 Typy powiadomień i realne pola w `data`
Każde powiadomienie ma pola główne: `id`, `user_id`, `type`, `title`, `message`, `data`, `is_read`, `created_at`. Poniżej **rzeczywiste** payloady `data` wynikające z kodu w [backend/notification-service/utils/rabbitmq-client.js](backend/notification-service/utils/rabbitmq-client.js):

### `friend.request`
**Routing key:** dowolny z polem `requesteeId`  
**Target:** `requesteeId` (osoba, która otrzymuje zaproszenie)

**title:** `"Zaproszenie do znajomych"`  
**message:** `"{requesterName} {requesterSurname} zaprasza Cię do znajomych"`

```json
{
	"requesterId": "uuid",
	"requesterName": "Jan",
	"requesterSurname": "Kowalski",
	"requesterProfilePicture": "uuid-of-avatar"
}
```

**Fallback** (brak danych użytkownika w DB):
```json
{
	"requesterId": "uuid"
}
```

### `friend.accepted`
**Routing key:** `user.friendAccepted`  
**Target:** `friendId` (osoba, która wysłała oryginalne zaproszenie)

**title:** `"Zaproszenie zaakceptowane"`  
**message:** `"{accepterName} {accepterSurname} zaakceptował(a) Twoje zaproszenie do znajomych"`

```json
{
	"userId": "uuid-acceptor",
	"accepterName": "Anna",
	"accepterSurname": "Nowak",
	"accepterProfilePicture": "uuid-of-avatar"
}
```

**Fallback** (brak danych użytkownika w DB):
```json
{
	"userId": "uuid-acceptor"
}
```

### `user.mentioned` ⚠️ NIE ZAIMPLEMENTOWANE
**Routing key:** `user.mentioned`  
**Target:** `mentionedUserId` (osoba wspomniana)

> **Status:** Handler w notification-service istnieje, ale **żaden serwis nie publikuje tego eventu**. Wymaga implementacji w post-service (wykrywanie @wzmianek w treści posta/komentarza).

**title:** `"Zostałeś wspomniany"`  
**message:** `"{mentionerName} {mentionerSurname} wspomniał o Tobie"` lub `"Użytkownik cię wspomniał"`

```json
{
	"postId": "uuid-post",
	"mentionedUserId": "uuid-mentioned",
	"mentionerId": "uuid-author",
	"authorId": "uuid-author",
	"commentId": "uuid-comment",
	"content": "Treść z wzmianką @user",
	"mentionerName": "Maria",
	"mentionerSurname": "Lewandowska",
	"mentionerProfilePicture": "uuid-of-avatar"
}
```

**Uwaga:** obiekt `data` zawiera **wszystkie** pola przychodzącego eventu (spread `...content`) plus wzbogacone dane użytkownika.

**Fallback** (brak danych w DB):
```json
{
	"postId": "uuid-post",
	"mentionedUserId": "uuid-mentioned",
	"mentionerId": "uuid-author",
	"authorId": "uuid-author",
	"commentId": "uuid-comment",
	"content": "Treść z wzmianką @user"
}
```

### `post.liked`
**Routing key:** `reaction.created` z polem `postOwnerId`  
**Target:** `postOwnerId` (właściciel posta)

**title:** `"Twój post został polubiony"`  
**message:** `"{reactorName} {reactorSurname} polubił Twój post"`

```json
{
	"postId": "uuid-post",
	"userId": "uuid-reactor",
	"reactorName": "Piotr",
	"reactorSurname": "Wiśniewski",
	"reactorProfilePicture": "uuid-of-avatar",
	"reactionType": "like"
}
```

**Fallback** (brak danych w DB):
```json
{
	"postId": "uuid-post",
	"postOwnerId": "uuid-owner",
	"userId": "uuid-reactor",
	"reactionType": "like"
}
```

### `post.commented`
**Routing key:** `comment.created` z polem `postOwnerId`  
**Target:** `postOwnerId` (właściciel posta)

**title:** `"Nowy komentarz"`  
**message:** `"{commenterName} {commenterSurname} skomentował Twój post"`

```json
{
	"postId": "uuid-post",
	"commentId": "uuid-comment",
	"creatorId": "uuid-commenter",
	"commenterName": "Agnieszka",
	"commenterSurname": "Kowalczyk",
	"commenterProfilePicture": "uuid-of-avatar",
	"commentText": "Świetny post!"
}
```

**Fallback** (brak danych w DB):
```json
{
	"postId": "uuid-post",
	"postOwnerId": "uuid-owner",
	"commentId": "uuid-comment",
	"creatorId": "uuid-commenter",
	"commentText": "Świetny post!"
}
```

### `group.invited` ⚠️ NIE ZAIMPLEMENTOWANE
**Routing key:** `group.invited` z polem `invitedUserId`  
**Target:** `invitedUserId` (osoba zaproszona do grupy)

> **Status:** Handler w notification-service istnieje, ale **żaden serwis nie publikuje tego eventu**. Wymaga implementacji w group-service (funkcja zapraszania użytkowników do grupy).

**title:** `"Zaproszenie do grupy"`  
**message:** `"Zostałeś zaproszony do grupy \"{groupName}\""`

```json
{
	"groupId": "uuid-group",
	"groupName": "JavaScript",
	"groupProfilePicture": "uuid-of-group-image",
	"inviterId": "uuid-inviter"
}
```

**Fallback** (brak danych grupy w DB):
```json
{
	"groupId": "uuid-group",
	"invitedUserId": "uuid-invited",
	"inviterId": "uuid-inviter"
}
```

### `group.memberAccepted`
**Routing key:** `group.memberAccepted`  
**Target:** `userId` (osoba, której prośba o dołączenie została zaakceptowana)

**title:** `"Zostałeś zaakceptowany do grupy"`  
**message:** `"Twoja prośba o dołączenie do grupy \"{groupName}\" została zaakceptowana"`

```json
{
	"groupId": "uuid-group",
	"groupName": "JavaScript",
	"groupProfilePicture": "uuid-of-group-image",
	"acceptedBy": "uuid-admin"
}
```

**Fallback** (brak danych grupy w DB):
```json
{
	"groupId": "uuid-group",
	"userId": "uuid-user",
	"acceptedBy": "uuid-admin"
}
```

### `chat.created`
**Routing key:** `chat.created` z polem `participants` (tablica UUID)  
**Target:** każdy uczestnik z `participants` poza `creatorId`

**title:** `"{creatorName} {creatorSurname} dodał Cię do czatu"` lub `"Dodano Cię do czatu"`  
**message:** `"Zostałeś dodany do czatu \"{chatName}\""` lub `"Zostałeś dodany do nowego czatu"`

```json
{
	"chatId": "uuid-chat",
	"chatName": "Projekt X",
	"creatorId": "uuid-creator",
	"creatorName": "Katarzyna",
	"creatorSurname": "Dąbrowska",
	"creatorProfilePicture": "uuid-of-avatar"
}
```

**Fallback** (brak danych twórcy w DB):
```json
{
	"chatId": "uuid-chat",
	"chatName": "Projekt X",
	"creatorId": "uuid-creator"
}
```

### `message.created`
**Routing key:** `message.created`  
**Target:** wszyscy uczestnicy czatu poza nadawcą (z tabeli `Chat_Participants`)

**title:** `"{senderName} {senderSurname}"` lub `"Nowa wiadomość"`  
**message:** treść wiadomości (max 100 znaków) lub `"Otrzymałeś nową wiadomość"`

```json
{
	"chatId": "uuid-chat",
	"messageId": "uuid-message",
	"creatorId": "uuid-sender",
	"senderName": "Tomasz",
	"senderSurname": "Zieliński",
	"senderProfilePicture": "uuid-of-avatar"
}
```

**Fallback** (brak danych nadawcy w DB):
```json
{
	"chatId": "uuid-chat",
	"messageId": "uuid-message",
	"creatorId": "uuid-sender"
}
```

**Uwaga:** treść wiadomości trafia do pola `message` powiadomienia (nie do `data`).

### `general` / `notification.created` / inne z polem `userId`
**Routing key:** `notification.created`, `notification.*` lub dowolny z polem `userId`  
**Target:** `userId`

**title:** wartość z eventu `content.title` lub `"Nowe powiadomienie"`  
**message:** wartość z eventu `content.message` lub pusty string

```json
{
	"customField1": "dowolna wartość",
	"customField2": 123,
	"anyOtherData": true
}
```

Obiekt `data` zawiera dokładnie to, co przyszło w polu `content.data` z eventu RabbitMQ. Serwis nie wzbogaca tych powiadomień o dodatkowe dane.

---

## ⚠️ Obsługa błędów
| Kod | Komunikat | Opis |
|:--- |:--- |:--- |
| 400 | Missing required fields | Brak `userId` lub `title` przy tworzeniu |
| 401 | Brak autoryzacji | Brak poprawnego nagłówka `x-user-data` |
| 403 | Forbidden | Próba dostępu do cudzych powiadomień |
| 404 | Notification not found | Powiadomienie nie istnieje lub nie należy do użytkownika |
| 500 | Error retrieving/creating... | Błąd bazy lub wewnętrzny |

---

## 🧭 Szybki start
1) Dodaj nagłówek `x-user-data` z JSON zawierającym `id` użytkownika.
2) Uderz `GET /notifications` aby pobrać listę.
3) Używaj `PATCH /notifications/:id/read` lub `PATCH /notifications/read-all` aby aktualizować stan.
4) Użyj `DELETE /notifications/:id` lub `DELETE /notifications/` aby usuwać.

---

## 🧪 Przykładowe zapytanie (curl)
```bash
curl -H "x-user-data: {\"id\": \"user-uuid\", \"name\": \"Jan\"}" \\
		 "http://localhost:3007/notifications?limit=10&offset=0"
```
