/*
 * Astro Liška – retro horizontální vesmírná střílečka.
 * Čistý JavaScript bez knihoven. Herní plocha má 84 × 48 pixelů
 * a vykresluje se dvěma barvami jako starý monochromatický LCD displej.
 */
(() => {
  'use strict';

  // ---------- Konstanty ----------
  const W = 84;
  const H = 48;
  const TOP = 7;               // pod touto řádkou začíná herní plocha (nad ní je HUD)
  const BG = '#c7f0d8';
  const FG = '#43523d';
  const STEP = 1000 / 60;      // pevný krok simulace: 60 aktualizací za sekundu

  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');

  // ---------- Sprity (# = rozsvícený pixel) ----------
  function sprite(rows) {
    const px = [];
    rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') px.push([x, y]); }));
    return { w: rows[0].length, h: rows.length, px };
  }

  const SPR = {
    player: sprite([
      '##......',
      '.###....',
      '.######.',
      '########',
      '.######.',
      '.###....',
      '##......',
    ]),
    drone: sprite([
      '..##.',
      '.####',
      '##.##',
      '.####',
      '..##.',
    ]),
    zig: sprite([
      '.#..#.',
      '######',
      '#.##.#',
      '.#..#.',
    ]),
    gunner: sprite([
      '...###',
      '.#####',
      '###...',
      '.#####',
      '...###',
    ]),
    boss: sprite([
      '......######',
      '....########',
      '..###..#####',
      '.####..#####',
      '############',
      '###.........',
      '############',
      '.####..#####',
      '..###..#####',
      '....########',
      '......######',
    ]),
    heart: sprite([
      '.#.#.',
      '#####',
      '.###.',
      '..#..',
    ]),
  };

  // ---------- Pixelové písmo 3 × 5 (řádky shora dolů, # = pixel) ----------
  const GLYPHS = {
    A: '.#. #.# ### #.# #.#', B: '##. #.# ##. #.# ##.', C: '.## #.. #.. #.. .##', D: '##. #.# #.# #.# ##.',
    E: '### #.. ##. #.. ###', F: '### #.. ##. #.. #..', G: '.## #.. #.# #.# .##', H: '#.# #.# ### #.# #.#',
    I: '### .#. .#. .#. ###', J: '..# ..# ..# #.# .#.', K: '#.# #.# ##. #.# #.#', L: '#.. #.. #.. #.. ###',
    M: '#.# ### ### #.# #.#', N: '##. #.# #.# #.# #.#', O: '.#. #.# #.# #.# .#.', P: '##. #.# ##. #.. #..',
    Q: '.#. #.# #.# ##. .##', R: '##. #.# ##. #.# #.#', S: '.## #.. .#. ..# ##.', T: '### .#. .#. .#. .#.',
    U: '#.# #.# #.# #.# ###', V: '#.# #.# #.# #.# .#.', W: '#.# #.# ### ### #.#', X: '#.# #.# .#. #.# #.#',
    Y: '#.# #.# .#. .#. .#.', Z: '### ..# .#. #.. ###',
    0: '### #.# #.# #.# ###', 1: '.#. ##. .#. .#. ###', 2: '##. ..# .#. #.. ###', 3: '##. ..# .#. ..# ##.',
    4: '#.# #.# ### ..# ..#', 5: '### #.. ##. ..# ##.', 6: '.## #.. ### #.# ###', 7: '### ..# .#. .#. .#.',
    8: '### #.# ### #.# ###', 9: '### #.# ### ..# ##.',
    ':': '... .#. ... .#. ...', '!': '.#. .#. .#. ... .#.', '-': '... ... ### ... ...',
    '.': '... ... ... ... .#.', ' ': '... ... ... ... ...',
  };
  const FONT = Object.fromEntries(Object.entries(GLYPHS).map(([k, v]) => [k, v.replace(/ /g, '')]));

  function text(str, x, y) {
    let cx = x;
    for (const ch of String(str).toUpperCase()) {
      const g = FONT[ch] || FONT[' '];
      for (let i = 0; i < 15; i++) if (g[i] === '#') ctx.fillRect(cx + (i % 3), y + ((i / 3) | 0), 1, 1);
      cx += 4;
    }
  }
  const textWidth = (str) => String(str).length * 4 - 1;
  const textCenter = (str, y) => text(str, Math.round((W - textWidth(str)) / 2), y);
  const pad = (n, len = 5) => String(n).padStart(len, '0');

  function draw(s, x, y) {
    const ox = Math.round(x), oy = Math.round(y);
    for (const [dx, dy] of s.px) ctx.fillRect(ox + dx, oy + dy, 1, 1);
  }

  // ---------- Uložení (rekord, zvuk) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('astroliska.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('astroliska.' + k, JSON.stringify(v)); } catch { /* bez úložiště to nevadí */ } },
  };

  // ---------- Zvuk (generované pípání přes Web Audio) ----------
  let audio = null;
  let soundOn = store.get('sound', true);
  function beep(freq, dur = 0.06, slide = 0, vol = 0.04) {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime;
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + dur);
    } catch { /* zvuk je jen bonus */ }
  }
  const sfx = {
    shoot: () => beep(880, 0.04, -300),
    hit: () => beep(220, 0.08, -120),
    boom: () => beep(160, 0.2, -120, 0.06),
    hurt: () => beep(120, 0.35, -80, 0.07),
    wave: () => { beep(660, 0.08); setTimeout(() => beep(990, 0.1), 90); },
  };

  // ---------- Ovládání ----------
  const keys = { up: false, down: false, left: false, right: false, fire: false };
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    Space: 'fire', KeyJ: 'fire',
  };

  window.addEventListener('keydown', (e) => {
    const k = KEYMAP[e.code];
    if (k) { keys[k] = true; e.preventDefault(); }
    if (e.repeat) return;
    if (e.code === 'Enter' || (k === 'fire' && state !== 'play' && state !== 'pause')) startOrPause();
    else if (e.code === 'KeyP' || e.code === 'Escape') { if (state === 'play' || state === 'pause') startOrPause(); }
    else if (e.code === 'KeyM') toggleSound();
  });
  window.addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  document.querySelectorAll('[data-key]').forEach((btn) => {
    const k = btn.dataset.key;
    const on = (e) => {
      e.preventDefault();
      keys[k] = true;
      btn.classList.add('pressed');
      if (k === 'fire' && (state === 'title' || state === 'over')) startOrPause();
    };
    const off = () => { keys[k] = false; btn.classList.remove('pressed'); };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointerleave', off);
    btn.addEventListener('pointercancel', off);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  const btnStart = document.getElementById('btn-start');
  const btnSound = document.getElementById('btn-sound');
  btnStart.addEventListener('click', () => { startOrPause(); btnStart.blur(); });
  btnSound.addEventListener('click', () => { toggleSound(); btnSound.blur(); });

  function toggleSound() {
    soundOn = !soundOn;
    store.set('sound', soundOn);
    updateSoundButton();
    if (soundOn) beep(660, 0.06);
  }
  function updateSoundButton() {
    btnSound.textContent = soundOn ? 'ZVUK: ZAP' : 'ZVUK: VYP';
    btnSound.setAttribute('aria-pressed', String(soundOn));
  }
  updateSoundButton();

  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') state = 'pause'; });

  // ---------- Herní stav ----------
  let state = 'title';           // title | play | pause | over
  let hi = store.get('hi', 0);
  let newRecord = false;
  let tick = 0;
  let score, lives, wave, player, bullets, eBullets, enemies, parts, queue, waveTick, banner, nextWaveIn;

  const stars = Array.from({ length: 14 }, () => ({
    x: Math.random() * W, y: TOP + Math.random() * (H - TOP), v: 0.15 + Math.random() * 0.45,
  }));

  function startOrPause() {
    if (state === 'play') { state = 'pause'; return; }
    if (state === 'pause') { state = 'play'; return; }
    newGame();
  }

  function newGame() {
    score = 0;
    lives = 3;
    wave = 0;
    newRecord = false;
    player = { x: 4, y: 24, cd: 0, inv: 90 };
    bullets = []; eBullets = []; enemies = []; parts = []; queue = [];
    nextWaveIn = 0;
    state = 'play';
    startWave();
  }

  function startWave() {
    wave++;
    waveTick = 0;
    banner = 90;
    sfx.wave();
    queue = [];
    if (wave % 5 === 0) {
      queue.push({ type: 'boss', at: 60 });
      return;
    }
    const count = 6 + wave * 2;
    const gap = Math.max(16, 40 - wave * 3);
    const types = ['drone'];
    if (wave >= 2) types.push('zig');
    if (wave >= 3) types.push('gunner');
    for (let i = 0; i < count; i++) {
      queue.push({ type: types[(Math.random() * types.length) | 0], at: 60 + i * gap });
    }
  }

  const speedUp = () => 1 + (wave - 1) * 0.06;

  function spawn(type) {
    const s = SPR[type];
    const y = TOP + 1 + Math.random() * (H - TOP - s.h - 2);
    const e = { type, s, x: W + 1, y, baseY: y, t: 0, flash: 0 };
    if (type === 'drone') Object.assign(e, { vx: -0.55 * speedUp(), hp: 1, pts: 10 });
    if (type === 'zig') Object.assign(e, { vx: -0.45 * speedUp(), hp: 1, pts: 20, amp: 4 + Math.random() * 6 });
    if (type === 'gunner') Object.assign(e, { vx: -0.32 * speedUp(), hp: 2, pts: 30, fire: 50 + Math.random() * 40 });
    if (type === 'boss') {
      Object.assign(e, { y: (H + TOP - s.h) / 2, vx: -0.3, hp: 18 + wave * 2, pts: 250, fire: 60 });
      e.maxHp = e.hp;
    }
    enemies.push(e);
  }

  const hitbox = (a, ax, ay, b, bx, by) =>
    ax < bx + b.w && ax + a.w > bx && ay < by + b.h && ay + a.h > by;

  function explode(x, y, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 0.3 + Math.random() * 0.9;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 14 + Math.random() * 12 });
    }
  }

  function hurtPlayer() {
    if (player.inv > 0) return;
    lives--;
    sfx.hurt();
    explode(player.x + 4, player.y + 3, 14);
    player.inv = 120;
    if (lives <= 0) {
      state = 'over';
      if (score > hi) { hi = score; newRecord = true; store.set('hi', hi); }
    }
  }

  // ---------- Simulace jednoho kroku ----------
  function update() {
    tick++;
    for (const s of stars) { s.x -= s.v; if (s.x < 0) { s.x = W; s.y = TOP + Math.random() * (H - TOP); } }
    if (state !== 'play') return;

    // Hráč
    const sp = 0.9;
    if (keys.up) player.y -= sp;
    if (keys.down) player.y += sp;
    if (keys.left) player.x -= sp;
    if (keys.right) player.x += sp;
    player.x = Math.max(0, Math.min(W / 2, player.x));
    player.y = Math.max(TOP, Math.min(H - SPR.player.h, player.y));
    if (player.cd > 0) player.cd--;
    if (player.inv > 0) player.inv--;
    if (keys.fire && player.cd === 0 && bullets.length < 4) {
      bullets.push({ x: player.x + 8, y: player.y + 3 });
      player.cd = 10;
      sfx.shoot();
    }

    // Vlny nepřátel
    waveTick++;
    if (banner > 0) banner--;
    while (queue.length && queue[0].at <= waveTick) spawn(queue.shift().type);
    if (!queue.length && !enemies.length) {
      if (nextWaveIn === 0) nextWaveIn = 60;
      else if (--nextWaveIn === 0) startWave();
    }

    // Střely hráče
    for (const b of bullets) b.x += 2.4;
    bullets = bullets.filter((b) => b.x < W);

    // Nepřátelé
    for (const e of enemies) {
      e.t++;
      if (e.flash > 0) e.flash--;
      if (e.type === 'boss') {
        if (e.x > W - e.s.w - 3) e.x += e.vx;
        e.y = (H + TOP - e.s.h) / 2 + Math.sin(e.t * 0.03) * 12;
        if (--e.fire <= 0) {
          e.fire = Math.max(28, 60 - wave * 2);
          for (const vy of [-0.35, 0, 0.35]) eBullets.push({ x: e.x, y: e.y + 5, vx: -1.1, vy });
          beep(300, 0.05, -100, 0.03);
        }
      } else {
        e.x += e.vx;
        if (e.type === 'zig') e.y = e.baseY + Math.sin(e.t * 0.08) * e.amp;
        e.y = Math.max(TOP, Math.min(H - e.s.h, e.y));
        if (e.type === 'gunner' && --e.fire <= 0 && e.x < W - 4) {
          e.fire = Math.max(45, 100 - wave * 5);
          const dy = player.y + 3 - (e.y + 2);
          eBullets.push({ x: e.x, y: e.y + 2, vx: -1.2, vy: Math.max(-0.4, Math.min(0.4, dy / 60)) });
        }
      }

      for (const b of bullets) {
        if (!b.dead && hitbox({ w: 3, h: 1 }, b.x, b.y, e.s, e.x, e.y)) {
          b.dead = true;
          e.hp--;
          e.flash = 4;
          if (e.hp <= 0) {
            e.dead = true;
            score += e.pts;
            explode(e.x + e.s.w / 2, e.y + e.s.h / 2, e.type === 'boss' ? 30 : 8);
            e.type === 'boss' ? sfx.boom() : sfx.hit();
          } else beep(500, 0.03);
        }
      }

      if (!e.dead && hitbox(SPR.player, player.x, player.y, e.s, e.x, e.y)) {
        hurtPlayer();
        if (e.type !== 'boss') { e.dead = true; explode(e.x + 2, e.y + 2); }
      }
    }
    bullets = bullets.filter((b) => !b.dead);
    enemies = enemies.filter((e) => !e.dead && e.x > -e.s.w - 2);

    // Střely nepřátel
    for (const b of eBullets) {
      b.x += b.vx; b.y += b.vy;
      if (hitbox({ w: 2, h: 1 }, b.x, b.y, SPR.player, player.x, player.y)) { b.dead = true; hurtPlayer(); }
    }
    eBullets = eBullets.filter((b) => !b.dead && b.x > -2 && b.y > TOP - 1 && b.y < H);

    // Částice výbuchů
    for (const p of parts) { p.x += p.vx; p.y += p.vy; p.life--; }
    parts = parts.filter((p) => p.life > 0);
  }

  // ---------- Vykreslení ----------
  function render() {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = FG;

    for (const s of stars) if (state !== 'play' || (tick + (s.v * 100 | 0)) % 3) ctx.fillRect(s.x | 0, s.y | 0, 1, 1);

    if (state === 'title') return renderTitle();

    // HUD
    for (let i = 0; i < lives; i++) draw(SPR.heart, 1 + i * 6, 1);
    text(pad(score), W - textWidth(pad(score)) - 1, 1);
    for (let x = 0; x < W; x += 2) ctx.fillRect(x, TOP - 1, 1, 1);

    // Herní objekty
    for (const e of enemies) if (!(e.flash & 1)) draw(e.s, e.x, e.y);
    for (const b of bullets) ctx.fillRect(Math.round(b.x), Math.round(b.y), 3, 1);
    for (const b of eBullets) ctx.fillRect(Math.round(b.x), Math.round(b.y), 2, 1);
    for (const p of parts) ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    if (state !== 'over' && !(player.inv > 0 && (tick >> 2) & 1)) draw(SPR.player, player.x, player.y);

    // Ukazatel zdraví mateřské lodi
    const boss = enemies.find((e) => e.type === 'boss');
    if (boss) {
      const w = Math.ceil((boss.hp / boss.maxHp) * 30);
      ctx.fillRect(27, 2, w, 2);
    }

    if (state === 'play' && banner > 0 && (banner >> 3) & 1) {
      textCenter(wave % 5 === 0 ? 'MATERSKA LOD!' : 'VLNA ' + wave, 22);
    }
    if (state === 'pause') box(['PAUZA']);
    if (state === 'over') box(['KONEC HRY', 'SKORE ' + pad(score), newRecord ? 'NOVY REKORD!' : 'REKORD ' + pad(hi)]);
  }

  function box(lines) {
    const h = lines.length * 7 + 5;
    const y0 = Math.round((H + TOP - h) / 2);
    ctx.fillStyle = BG;
    ctx.fillRect(10, y0, W - 20, h);
    ctx.fillStyle = FG;
    ctx.strokeStyle = FG;
    ctx.lineWidth = 1;
    ctx.strokeRect(10.5, y0 + 0.5, W - 21, h - 1);
    lines.forEach((l, i) => textCenter(l, y0 + 3 + i * 7));
  }

  function renderTitle() {
    textCenter('ASTRO LISKA', 4);
    for (let x = 20; x < 64; x++) ctx.fillRect(x, 11, 1, 1);
    draw(SPR.player, 22, 19 + Math.round(Math.sin(tick * 0.06) * 2));
    draw(SPR.drone, 44, 18);
    draw(SPR.zig, 54, 23);
    draw(SPR.gunner, 64, 18);
    if ((tick >> 5) & 1) ctx.fillRect(32, 22, 3, 1);
    text('REKORD ' + pad(hi), 1 + Math.round((W - textWidth('REKORD ' + pad(hi))) / 2), 31);
    if ((tick >> 4) & 1) textCenter('STISKNI START', 40);
  }

  // ---------- Hlavní smyčka ----------
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    acc += Math.min(100, now - last);
    last = now;
    while (acc >= STEP) { update(); acc -= STEP; }
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
