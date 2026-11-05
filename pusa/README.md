# Pusa na dálku

Roztomilá mobilní hra pro dva. Chytáš srdíčka, uhýbáš zamračeným mráčkům, a když naplníte
srdce, vaše fotky si dají pusu. S každou pusou je hra o kousek rychlejší.

## Režimy

- **Hrát** (sólo): vybereš, za koho hraješ. Ty dole chytáš, partner/ka nahoře pluje a hází ti srdíčka.
- **Ve dvou na jednom mobilu**: oba jste dole, každý táhne prstem svou fotku. Když jste u sebe,
  srdíčka se počítají dvojnásob.

| Předmět | Účinek |
|---|---|
| ❤ růžové srdíčko | +1 do měřiče |
| 💛 zlaté srdíčko | +3 do měřiče |
| ☁ mráček s bleskem | −1 život (máte 3, každou 3. úroveň se jeden vrací) |

Na počítači: šipky (sólo), ve dvou `A`/`D` a šipky. `P` pauza.

## Fotky a soukromí

Fotky se **nenahrávají do repozitáře ani na server**. Každý si je vybere přímo ve hře
(galerie nebo fotoaparát). Hra je zmenší a ořízne v prohlížeči a drží je jen v paměti telefonu.
Po zaškrtnutí *Zapamatovat* se uloží do `localStorage` daného zařízení, tlačítko *Smazat fotky* je odstraní.

## Spuštění

Stačí otevřít `index.html`. Na GitHub Pages běží na `https://fxscz.github.io/demo/pusa/`.

## Struktura

- `index.html` – menu, pauza, konec hry
- `style.css` – vzhled a rozložení pro mobil
- `game.js` – herní logika, kreslené výchozí postavičky, zpracování fotek, zvuky
