# Czech Jump Rope – Webová aplikace pro správu soutěží

Webová aplikace pro správu sportovních soutěží ve skákání přes švihadlo, umožňující registraci uživatelů, přihlašování do soutěží, správu rolí a administraci systému.

Projekt je realizován jako full-stack webová aplikace s odděleným frontendem, backendem a databází.

Funkcionalita
## Uživatelé

Registrace a přihlášení (lokální účet nebo Google OAuth)

Správa profilu

Přepínání aktivní role uživatele

Změna hesla (pro lokální účty)


### Soutěže

Vytváření, editace a mazání soutěží

Nastavení registračního období

Přiřazení disciplín a věkových kategorií

Export přihlášek do PDF

Vytvaření a prřídání nových disciplin a rozhodčích

### Registrace

Vytváření přihlášek do soutěží

Týmy a závodníci

Individuální i týmové disciplíny

Validace přihlášky před odesláním

Vracení ypět do modu pro úpravu soutěžícím

### Admin

Přehled všech uživatelů a důležitých změn

Trvalé mazání uživatelských dat

Role v systému

Notifikace

## Role:
user – základní uživatel, 
organizator – organizátor soutěží, 
admin – administrátor systému,

## Použité technologie
### Frontend
React

Axios

Google OAuth

### Backend
Node.js

Express

JWT autentizace

### Databáze
PostgreSQL

### Infrastruktura
Docker & Docker Compose

Nginx

HTTPS (Let’s Encrypt)

## Spuštění projektu

Projekt je určen ke spuštění pomocí Docker Compose.

docker compose up -d --build

## Aplikace je dostupná na:

https://95-217-4-84.sslip.io (produkční nasazení) a taky http://95-217-4-84.sslip.io 
