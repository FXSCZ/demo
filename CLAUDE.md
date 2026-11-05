# CLAUDE.md

Kontext pro Claude (Claude Code, projekty na claude.ai), aby šlo pokračovat na jakémkoli počítači.

## O repozitáři

`FXSCZ/demo` je ukázkové repo společnosti Foxios pro práci s GitHubem a Claude. Obsahuje dvě malé hry:

- **Astro Liška** (kořen repa: `index.html`, `style.css`, `game.js`) – retro horizontální vesmírná
  střílečka ve stylu monochromatického displeje starých mobilů.
- **Pusa na dálku** (složka `pusa/`) – romantická mobilní hra pro Karla a jeho partnerku.
  Sólo režim s volbou „za koho hraju“ a režim ve dvou na jednom mobilu.

Technologie: čisté HTML, CSS a JavaScript. Žádné závislosti, žádný build, žádný `npm`.
Hra se spustí otevřením `index.html` v prohlížeči.

Nasazení: GitHub Pages z větve `main`, složka `/ (root)`.

- Astro Liška: `https://fxscz.github.io/demo/`
- Pusa na dálku: `https://fxscz.github.io/demo/pusa/`

Každá hra má vlastní `README.md` s ovládáním a strukturou souborů.

## Konvence

- **Čeština** ve všem: texty ve hrách, README, commit zprávy, popisy PR i komunikace.
- **Větev + PR workflow:** do `main` se necommituje přímo. Nová práce vzniká na nové větvi
  z aktuálního `main`, končí pull requestem a Karel ho mergne. Mergnutý PR se znovu nepoužívá,
  další změna znamená novou větev a nový PR.
- **Fotky nikdy do repa.** Repo i GitHub Pages jsou veřejné. Fotky (např. do Pusy na dálku) si
  hráči vybírají přímo v prohlížeči, drží se jen v paměti zařízení, případně v `localStorage`.
- Zachovat nulové závislosti a funkčnost bez buildu. Hry musí fungovat na mobilu (dotyk,
  responzivní rozložení) i na počítači (klávesnice).
- Když se mění ovládání, režimy nebo struktura, aktualizovat i README dané hry.

## O uživateli

Karel Šťástka (GitHub `FXSCZ`), zakladatel a majitel technologické společnosti **Foxios**
(IT služby, vývoj softwaru, technologická řešení). Jeho cílem je silná, právně ošetřená
a technologicky špičková firma.

Od Claude očekává roli **zkušeného poradce, technického architekta a obchodního partnera**:
vést k dobrým rozhodnutím, doporučit řešení místo výčtu možností a vysvětlovat srozumitelně.
S workflow Claude + GitHub se teprve seznamuje, proto kroky na GitHubu (PR, merge, Pages)
krátce vysvětlit.
