Kalendář domácnosti - klientská kostra

Krátce:
- Klientská aplikace pro správu společného kalendáře (role admin/user, typy událostí, barevné štítky podle člena, CSV import rekurencí, iCal export, localStorage persistence).

Struktura souborů:
- `index.html`: hlavní stránka (načítá CDN a lokální skripty)
- `css/style.css`: styly a úpravy vzhledu
- `js/app.js`: entrypoint, UI bindings, backup/restore
- `js/calendar.js`: integrace FullCalendar, render, CRUD hooky
- `js/storage.js`: localStorage wrapper a migrace
- `js/csv.js`: import CSV → události (text→RRULE převod)
- `js/ical.js`: iCal export (.ics) včetně RRULE a jednoduchého VTIMEZONE
- `js/members.js`: správa členů (barvy, role)
- `js/members-ui.js`: modal pro správu členů
- `templates/*.html`: HTML fragmenty pro modály

Spuštění (lokálně):
1) Otevřete `index.html` ve vašem prohlížeči (double-click nebo "Open with" ve VS Code).
2) Používá se čistě client-side, není potřeba server.

Rychlý návod pro testování funkcí:
1) Role: přepněte `Role` v pravém horním toolbaru na `admin` pro plná práva.
2) Nová událost: klikněte "Nová událost", vyplňte formulář, uložte. Událost se uloží do localStorage pod klíčem `hhcal.events.v1`.
3) CSV import: připravte CSV se sloupci title,type,member,start,end,recurrence,description,visibility. Import provede mapování opakování (např. "každé úterý" → RRULE:FREQ=WEEKLY;BYDAY=TU).
4) iCal export: klikněte "Export iCal" pro stáhnutí .ics se zahrnutými RRULE a kategoriemi. Export používá UTC časový formát; přidává jednoduchý VTIMEZONE, aby byly události kompatibilnější.
5) Záloha/obnova: klikněte "Záloha" pro stažení JSON souboru; "Obnovit" pro nahrání zálohy (před přepsáním se vytvoří lokální záloha původních dat).
6) Správa členů: klikněte "Členové" pro přidání/úpravu/smazání členů; změny se projeví v barvách událostí.

Formáty:
- CSV: title,type,member,start,end,recurrence,description,visibility (příklad: Vynést koš,úklid,Jan,2026-01-06T08:00,2026-01-06T08:15,"každé úterý",Koš před domem,public)
- iCal: generuje `VEVENT` s `DTSTART/DTEND` v UTC, `RRULE` pokud je přítomno, `CATEGORIES` obsahuje typ a jméno člena.

Další poznámky:
- Data jsou uložena pouze lokálně (localStorage). Pro sdílení mezi zařízeními je potřeba serverové API.
- Pokud chcete, mohu: přidat lepší VTIMEZONE generátor, přidat export/import uživatelských nastavení, nebo vytvořit jednoduchý Node.js backend pro sdílení dat.

Autor: GitHub Copilot (implementováno klient-side)
