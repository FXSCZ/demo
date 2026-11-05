# Astro Liška

Retro horizontální vesmírná střílečka ve stylu monochromatického displeje starých mobilů.
Ukázkový mikroprojekt společnosti Foxios pro práci s GitHubem a Claude Code.

## Jak hrát

| Akce | Klávesnice | Dotyk |
|---|---|---|
| Pohyb | šipky nebo `WASD` | směrový kříž |
| Střelba | `Mezerník` nebo `J` | tlačítko **PAL** |
| Start / pauza | `Enter`, `P` | **START / PAUZA** |
| Zvuk | `M` | **ZVUK** |

Máš tři životy. Nepřátelé přilétají ve vlnách a s každou vlnou zrychlují:

- **Dron** letí rovně (10 bodů)
- **Kmitač** se vlní nahoru a dolů (20 bodů, od 2. vlny)
- **Střelec** vydrží dva zásahy a střílí po tobě (30 bodů, od 3. vlny)
- **Mateřská loď** přiletí každou pátou vlnu (250 bodů)

Rekord se ukládá v prohlížeči.

## Spuštění

Žádná instalace ani build. Stačí otevřít `index.html` v prohlížeči.

### GitHub Pages

1. V repozitáři otevři **Settings → Pages**.
2. V části **Build and deployment** zvol **Deploy from a branch**.
3. Vyber větev `main` a složku `/ (root)`, ulož.
4. Za minutu bude hra na `https://fxscz.github.io/demo/`.

## Struktura

- `index.html` – stránka, displej a tlačítka
- `style.css` – vzhled zařízení a responzivní rozložení
- `game.js` – herní logika: sprity, pixelové písmo, vlny nepřátel, kolize, zvuk
