# 🚀 Uruchamianie Środowiska Backendowego

Ten przewodnik opisuje, jak za pomocą jednej komendy uruchomić całą architekturę mikroserwisową (API Gateway, wszystkie serwisy) przy użyciu Docker i Docker Compose.

## 📋 Wymagania Wstępne

Zanim zaczniesz, upewnij się, że na Twoim systemie zainstalowane są:

1.  **Docker Engine:** [Oficjalna instrukcja instalacji](https://docs.docker.com/engine/install/).
2.  **Docker Compose (Plugin):** Zazwyczaj instalowany razem z Docker Engine. Sprawdź, czy działa, wpisując w terminalu `docker compose version` (bez myślnika).

## ⚙️ Konfiguracja Początkowa

Przed pierwszym uruchomieniem, należy skonfigurować zmienne środowiskowe.

Utwórz plik `.env` i dostosuj zmienne. Najważniejszą z nich jest `JWT_SECRET` – powinna to być długa, losowa i trudna do odgadnięcia fraza.
    ```
    # Plik: .env
    JWT_SECRET=super_secret
    DB_USER=user
    DB_HOST=host
    DB_NAME=postgres
    DB_PASSWORD=password
    DB_PORT=5432
    PBKDF2_ITERATIONS=number
    PBKDF2_KEYLEN=int
    PBKDF2_DIGEST=sha
    ```
    

**Ważne:** Plik `.env` zawiera wrażliwe dane i **nie powinien** być dodawany do repozytorium Git! Upewnij się, że plik `.gitignore` zawiera wpis `.env`.

## ▶️ Uruchamianie Środowiska

Wszystkie komendy należy wykonywać z głównego folderu `backend/`, gdzie znajduje się plik `docker-compose.yml`.

### Pierwsze Uruchomienie (lub po Zmianach w Kodzie)

Użyj tej komendy, aby zbudować obrazy Docker dla każdego serwisu i uruchomić wszystkie kontenery w tle.

```
docker compose up --build -d
```

-   `--build`: Wymusza przebudowanie obrazów, uwzględniając najnowsze zmiany w kodzie.
-   `-d` (detached): Uruchamia kontenery w tle, dzięki czemu terminal pozostaje wolny.

Po wykonaniu tej komendy, cała infrastruktura (Gateway, serwisy, baza danych) będzie działać. Twoje API będzie dostępne pod adresem bramy, np. `http://localhost:3000`.

### Standardowe Uruchomienie (bez zmian w kodzie)

Jeśli nie wprowadzałeś żadnych zmian w plikach `Dockerfile` ani w kodzie serwisów, możesz szybko uruchomić środowisko używając istniejących obrazów.

```
docker compose up -d
```
## ⏹️ Zatrzymywanie Środowiska

Aby zatrzymać i usunąć wszystkie uruchomione kontenery oraz sieć, użyj komendy:

```
docker compose down
```

Ta komenda domyślnie **nie usuwa** danych z bazy danych (dzięki użyciu wolumenu). Aby usunąć również dane, dodaj flagę `-v`: `docker compose down -v`.

---
## 🔍 Przydatne Komendy Diagnostyczne

Poniższe komendy pomogą Ci monitorować i debugować działanie Twoich kontenerów.

### Sprawdzanie Statusu Kontenerów

Pokazuje listę wszystkich uruchomionych serwisów i ich status.

```
docker compose ps
```
### Podglądanie Logów

Logi to Twoje główne narzędzie do debugowania.

-   **Logi wszystkich serwisów na żywo:**
```
docker compose logs -f
```
-   **Logi tylko jednego, konkretnego serwisu (np. `gateway`):**
```
docker compose logs -f gateway
```

Wciśnij `Ctrl+C`, aby zakończyć śledzenie logów.

### Wykonywanie Komend wewnątrz Kontenera

Czasami przydatne jest "wejście" do kontenera, aby sprawdzić system plików lub uruchomić jakąś komendę.

```
docker compose exec <nazwa_serwisu> sh
```

**Przykład:** Wejście do powłoki kontenera `user-service`.

```
docker compose exec user-service sh
```

Wpisz `exit`, aby opuścić powłokę kontenera.

# Tutorial do poszczególnego mikroserwisu
Jak dodajecie jakiegos nowego mikroserwisa to robicie katalog, a potem walicie go 

```bash
npm init -y
npm install express pg cors dotenv
```

i skopiujcie .gitignore'a z innego folderu. Dodajecie ponadto ręcznie do package.json "type": "module" albo wpisujecie w cmd, bo wam wyjebie błąd

```bash
npm pkg set type=module
```

Ponadto do każdego mikroserwisu trzeba dodać .enva z PORT i JWT_SECRET