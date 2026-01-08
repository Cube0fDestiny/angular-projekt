# WAZNE
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