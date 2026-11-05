/* Pusa na dálku – roztomilá mobilní hra pro dva.
 * Čisté HTML/CSS/JS. Fotky se načítají jen v prohlížeči a nikam se neodesílají. */
(() => {
  'use strict';

  // ---------- Pomocné ----------
  const $ = (id) => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  const store = {
    get(k) { try { return localStorage.getItem('pusa.' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('pusa.' + k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem('pusa.' + k); } catch (e) { /* nic */ } },
  };

  // ---------- Výchozí kreslené tváře ----------
  function drawDefaultFace(hair, hairStyle) {
    const s = 256, c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    g.fillStyle = '#ffe3ea';
    g.fillRect(0, 0, s, s);
    // vlasy vzadu
    g.fillStyle = hair;
    if (hairStyle === 'long') {
      g.beginPath(); g.ellipse(128, 150, 100, 110, 0, 0, Math.PI * 2); g.fill();
    }
    // obličej
    g.fillStyle = '#ffd2b0';
    g.beginPath(); g.arc(128, 140, 78, 0, Math.PI * 2); g.fill();
    // vlasy nahoře
    g.fillStyle = hair;
    g.beginPath();
    g.ellipse(128, 92, 84, 48, 0, Math.PI, Math.PI * 2);
    g.fill();
    if (hairStyle === 'short') {
      g.beginPath(); g.ellipse(80, 90, 30, 22, -0.5, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(170, 86, 34, 22, 0.4, 0, Math.PI * 2); g.fill();
    } else {
      g.beginPath(); g.ellipse(150, 92, 60, 26, 0.3, 0, Math.PI * 2); g.fill();
      // mašlička
      g.fillStyle = '#ff6f91';
      g.beginPath(); g.ellipse(196, 70, 16, 11, 0.6, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(214, 90, 16, 11, 0.6, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(205, 80, 7, 0, Math.PI * 2); g.fill();
    }
    // oči
    g.fillStyle = '#3b2430';
    g.beginPath(); g.ellipse(100, 140, 9, 12, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(156, 140, 9, 12, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(103, 136, 3.5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(159, 136, 3.5, 0, Math.PI * 2); g.fill();
    // tvářičky
    g.fillStyle = 'rgba(255,111,145,.45)';
    g.beginPath(); g.ellipse(82, 168, 15, 9, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(174, 168, 15, 9, 0, 0, Math.PI * 2); g.fill();
    // pusa
    g.strokeStyle = '#c2405f'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.arc(128, 168, 16, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    return c.toDataURL('image/png');
  }

  const DEFAULT_FACES = [drawDefaultFace('#6b4226', 'short'), drawDefaultFace('#c8763a', 'long')];

  // ---------- Hráči: fotky a jména ----------
  const players = [0, 1].map((i) => ({
    name: i === 0 ? 'On' : 'Ona',
    photo: null,          // dataURL z vlastní fotky
    img: new Image(),
  }));

  function setPhoto(i, dataUrl) {
    players[i].photo = dataUrl;
    players[i].img.src = dataUrl || DEFAULT_FACES[i];
    $('preview-' + i).src = players[i].img.src;
  }

  // Zmenší a ořízne fotku na čtverec 320 px, aby byla lehká a vešla se do localStorage.
  function loadPhotoFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const size = 320, c = document.createElement('canvas');
        c.width = c.height = size;
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - side) / 2;
        // u portrétů posuň výřez trochu nahoru, kde bývá obličej
        const sy = img.naturalHeight > img.naturalWidth ? (img.naturalHeight - side) * 0.3 : (img.naturalHeight - side) / 2;
        c.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Fotku se nepodařilo načíst')); };
      img.src = url;
    });
  }

  function saveIfRemember() {
    if (!$('remember').checked) return;
    players.forEach((p, i) => {
      store.set('name' + i, p.name);
      if (p.photo) { if (!store.set('photo' + i, p.photo)) alert('Fotku se nepodařilo uložit, telefon nemá místo.'); }
      else store.del('photo' + i);
    });
  }

  function restore() {
    const remember = store.get('remember') === '1';
    $('remember').checked = remember;
    players.forEach((p, i) => {
      const name = remember && store.get('name' + i);
      if (name) { p.name = name; $('name-' + i).value = name; }
      setPhoto(i, remember ? store.get('photo' + i) : null);
    });
    const me = parseInt(store.get('me') || '0', 10);
    selectMe(me === 1 ? 1 : 0);
    updateLabels();
    showRecord();
  }

  // ---------- Zvuk ----------
  let audio = null, soundOn = store.get('sound') !== '0';
  function ac() {
    if (!audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }
  function tone(freq, dur, type = 'sine', vol = 0.15, slideTo) {
    if (!soundOn) return;
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur);
  }
  const sfx = {
    heart: () => { tone(660, 0.12, 'sine', 0.12, 990); },
    gold: () => { tone(784, 0.1); setTimeout(() => tone(1046, 0.1), 80); setTimeout(() => tone(1318, 0.18), 160); },
    hit: () => { tone(160, 0.3, 'triangle', 0.2, 70); },
    kiss: () => { tone(900, 0.08, 'sine', 0.18, 1600); setTimeout(() => tone(1400, 0.15, 'sine', 0.12, 500), 90); },
    melody: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.1), 250 + i * 140)),
    over: () => [440, 392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.12), i * 180)),
  };

  // ---------- Plátno ----------
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, R = 40; // R = poloměr avatara

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = clamp(Math.min(W, H) * 0.11, 30, 56);
    if (game) layout();
  }

  // ---------- Stav hry ----------
  let game = null;       // aktuální hra
  let state = 'menu';    // menu | play | kiss | pause | over
  let me = 0;            // za koho hraje sólo hráč
  const clouds = Array.from({ length: 5 }, () => ({ x: Math.random(), y: Math.random() * 0.6, s: rand(0.6, 1.2), v: rand(4, 10) }));

  function newGame(mode) {
    game = {
      mode,                        // 'solo' | 'duo'
      level: 1,
      kisses: 0,
      lives: 3,
      meter: 0,
      goal: 8,
      items: [],
      particles: [],
      texts: [],
      spawnT: 0,
      cloudT: 2,
      shake: 0,
      kissT: 0,
      hintT: 3.5,
      avatars: [0, 1].map((i) => ({ i, x: 0, y: 0, tx: 0, hurt: 0, bob: Math.random() * 6, rot: 0, scale: 1 })),
      pointers: new Map(),
    };
    layout(true);
    state = 'play';
  }

  // Výchozí rozmístění avatarů.
  function homePos(a) {
    if (game.mode === 'duo') return { x: a.i === 0 ? W * 0.3 : W * 0.7, y: H - R * 2.2 };
    if (a.i === me) return { x: W / 2, y: H - R * 2.2 };
    return { x: W / 2, y: 120 + R * 1.2 };   // druhý hráč nahoře posílá srdíčka
  }
  function layout(reset) {
    game.avatars.forEach((a) => {
      const p = homePos(a);
      if (reset || game.mode === 'duo' || a.i === me) { a.y = p.y; }
      if (reset) { a.x = a.tx = p.x; }
      a.x = clamp(a.x, R, W - R); a.tx = clamp(a.tx, R, W - R);
    });
  }

  function speed() { return (H * 0.28) * (1 + (game.level - 1) * 0.12); }

  function spawnItem(fromX, fromY, type) {
    const r = type === 'cloud' ? R * 0.75 : R * 0.42;
    game.items.push({
      type, x: clamp(fromX, r, W - r), y: fromY, r,
      vx: type === 'cloud' ? rand(-20, 20) : rand(-40, 40),
      vy: speed() * (type === 'cloud' ? rand(0.8, 1.1) : rand(0.85, 1.2)),
      rot: rand(-0.3, 0.3), wob: Math.random() * 6,
    });
  }

  function burst(x, y, n, colors, power = 1) {
    for (let k = 0; k < n; k++) {
      const ang = Math.random() * Math.PI * 2, sp = rand(60, 260) * power;
      game.particles.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 60, life: rand(0.6, 1.2), max: 1.2, size: rand(6, 14), color: colors[k % colors.length] });
    }
  }
  function floatText(x, y, text, color = '#e04e74') { game.texts.push({ x, y, text, color, life: 1 }); }

  // ---------- Ovládání ----------
  function pointerAvatar(x) {
    if (game.mode === 'solo') return game.avatars[me];
    // ve dvou: prst ovládá bližšího avatara
    const [a, b] = game.avatars;
    return Math.abs(a.x - x) <= Math.abs(b.x - x) ? a : b;
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (state !== 'play' || !game) return;
    ac();
    const a = pointerAvatar(e.clientX);
    // ve dvou nedovol, aby oba prsty ovládaly stejného avatara
    if (game.mode === 'duo') {
      for (const [, av] of game.pointers) if (av === a) { game.pointers.set(e.pointerId, game.avatars[1 - a.i]); game.avatars[1 - a.i].tx = e.clientX; return; }
    }
    game.pointers.set(e.pointerId, a);
    a.tx = e.clientX;
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!game) return;
    const a = game.pointers.get(e.pointerId);
    if (a) a.tx = clamp(e.clientX, R, W - R);
  });
  const release = (e) => { if (game) game.pointers.delete(e.pointerId); };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  const keys = new Set();
  window.addEventListener('keydown', (e) => {
    keys.add(e.key.toLowerCase());
    if ((e.key === 'p' || e.key === 'Escape') && (state === 'play' || state === 'pause')) togglePause();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

  function keyboardMove(dt) {
    const v = W * 1.1 * dt;
    const p1 = game.mode === 'solo' ? game.avatars[me] : game.avatars[0];
    const p2 = game.mode === 'duo' ? game.avatars[1] : null;
    if (game.mode === 'solo') {
      if (keys.has('arrowleft') || keys.has('a')) p1.tx -= v;
      if (keys.has('arrowright') || keys.has('d')) p1.tx += v;
    } else {
      if (keys.has('a')) p1.tx -= v;
      if (keys.has('d')) p1.tx += v;
      if (keys.has('arrowleft')) p2.tx -= v;
      if (keys.has('arrowright')) p2.tx += v;
    }
    game.avatars.forEach((a) => { a.tx = clamp(a.tx, R, W - R); });
  }

  // ---------- Aktualizace ----------
  function update(dt) {
    clouds.forEach((c) => { c.x += c.v * dt / Math.max(W, 1); if (c.x > 1.2) c.x = -0.2; });
    if (!game) return;
    if (state === 'play') updatePlay(dt);
    else if (state === 'kiss') updateKiss(dt);
    if (state === 'play' || state === 'kiss' || state === 'over') updateFx(dt);
  }

  function updatePlay(dt) {
    keyboardMove(dt);
    const g = game;
    g.hintT -= dt;
    g.avatars.forEach((a) => {
      a.bob += dt * 4;
      a.hurt = Math.max(0, a.hurt - dt);
      if (g.mode === 'solo' && a.i !== me) {
        // partner nahoře pluje sem a tam a hází srdíčka
        a.tx = W / 2 + Math.sin(performance.now() / 900) * (W / 2 - R * 1.3);
      }
      a.x += (a.tx - a.x) * Math.min(1, dt * 14);
      a.rot = clamp((a.tx - a.x) / 300, -0.25, 0.25);
    });

    // srdíčka
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      g.spawnT = Math.max(0.35, 1.0 - g.level * 0.07) * rand(0.7, 1.2);
      const gold = Math.random() < 0.08;
      if (g.mode === 'solo') {
        const thrower = g.avatars[1 - me];
        spawnItem(thrower.x, thrower.y + R * 0.8, gold ? 'gold' : 'heart');
      } else {
        spawnItem(rand(R, W - R), -R, gold ? 'gold' : 'heart');
      }
    }
    // mráčky
    g.cloudT -= dt;
    if (g.cloudT <= 0) {
      g.cloudT = Math.max(0.7, 2.4 - g.level * 0.2) * rand(0.7, 1.3);
      spawnItem(rand(R, W - R), -R, 'cloud');
    }

    const catchers = g.mode === 'solo' ? [g.avatars[me]] : g.avatars;
    const together = g.mode === 'duo' && Math.abs(g.avatars[0].x - g.avatars[1].x) < R * 2.6;

    for (let k = g.items.length - 1; k >= 0; k--) {
      const it = g.items[k];
      it.wob += dt * 5;
      it.x += (it.vx + Math.sin(it.wob) * 25) * dt;
      it.y += it.vy * dt;
      if (it.x < it.r || it.x > W - it.r) it.vx *= -1;
      let hitBy = null;
      for (const a of catchers) {
        if (Math.hypot(a.x - it.x, a.y - it.y) < R * 0.9 + it.r * 0.8) { hitBy = a; break; }
      }
      if (hitBy) {
        g.items.splice(k, 1);
        if (it.type === 'cloud') {
          if (hitBy.hurt > 0) continue;
          g.lives--; hitBy.hurt = 1.2; g.shake = 0.35;
          sfx.hit();
          if (navigator.vibrate) navigator.vibrate(120);
          burst(it.x, it.y, 10, ['#8e9aaf', '#b8c0d0', '#6c7a93']);
          floatText(hitBy.x, hitBy.y - R * 1.3, 'Au!', '#6c7a93');
          if (g.lives <= 0) return gameOver();
        } else {
          let pts = it.type === 'gold' ? 3 : 1;
          if (together) pts *= 2;
          g.meter += pts;
          if (it.type === 'gold') sfx.gold(); else sfx.heart();
          burst(it.x, it.y, it.type === 'gold' ? 14 : 7, it.type === 'gold' ? ['#ffd34e', '#ffb800', '#fff1a8'] : ['#ff6f91', '#ff9db5', '#ffd0dc'], 0.7);
          floatText(it.x, it.y - 10, '+' + pts + (together ? ' spolu!' : ''));
          if (g.meter >= g.goal) return startKiss();
        }
      } else if (it.y > H + it.r * 2) {
        g.items.splice(k, 1);
      }
    }
  }

  // ---------- Pusa ----------
  function startKiss() {
    const g = game;
    state = 'kiss';
    g.kissT = 0;
    g.meter = g.goal;
    g.items.forEach((it) => burst(it.x, it.y, 4, it.type === 'cloud' ? ['#b8c0d0'] : ['#ff9db5']));
    g.items = [];
    g.pointers.clear();
    const cy = H * 0.45, off = R * 0.82;
    // kdo je vlevo, zůstane vlevo
    const [a, b] = g.avatars;
    const leftIsA = a.x <= b.x;
    g.avatars.forEach((av) => {
      av.from = { x: av.x, y: av.y };
      const isLeft = (av === a) === leftIsA;
      av.meet = { x: W / 2 + (isLeft ? -off : off), y: cy };
      av.side = isLeft ? 1 : -1;
    });
    g.kissed = false;
  }

  const KISS_IN = 0.9, KISS_HOLD = 1.3, KISS_OUT = 0.7;
  function updateKiss(dt) {
    const g = game;
    g.kissT += dt;
    const t = g.kissT;
    g.avatars.forEach((av) => {
      if (t < KISS_IN) {
        const k = ease(t / KISS_IN);
        av.x = av.from.x + (av.meet.x - av.from.x) * k;
        av.y = av.from.y + (av.meet.y - av.from.y) * k - Math.sin(k * Math.PI) * R;
        av.rot = av.side * 0.28 * k;
        av.scale = 1 + 0.35 * k;
      } else if (t < KISS_IN + KISS_HOLD) {
        const h = (t - KISS_IN) / KISS_HOLD;
        av.x = av.meet.x + av.side * Math.sin(h * Math.PI * 6) * 2;
        av.y = av.meet.y;
        av.rot = av.side * 0.28;
        av.scale = 1.35 + Math.sin(h * Math.PI) * 0.08;
      } else {
        const k = ease(clamp((t - KISS_IN - KISS_HOLD) / KISS_OUT, 0, 1));
        const home = homePos(av);
        av.x = av.meet.x + (home.x - av.meet.x) * k;
        av.y = av.meet.y + (home.y - av.meet.y) * k;
        av.rot = av.side * 0.28 * (1 - k);
        av.scale = 1.35 - 0.35 * k;
      }
    });
    if (!g.kissed && t >= KISS_IN) {
      g.kissed = true;
      g.kisses++;
      sfx.kiss(); sfx.melody();
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
      burst(W / 2, H * 0.45, 40, ['#ff6f91', '#ff9db5', '#ffd0dc', '#ffd34e'], 1.4);
    }
    if (t >= KISS_IN + KISS_HOLD + KISS_OUT) {
      g.level++;
      g.meter = 0;
      g.goal = 8 + (g.level - 1) * 2;
      g.avatars.forEach((av) => { av.rot = 0; av.scale = 1; av.tx = av.x; });
      if (g.level % 3 === 0 && g.lives < 3) { g.lives++; floatText(W / 2, H * 0.4, '+1 život ❤'); }
      state = 'play';
      g.spawnT = 0.6; g.cloudT = 1.8;
    }
  }

  function updateFx(dt) {
    const g = game;
    g.shake = Math.max(0, g.shake - dt);
    for (let k = g.particles.length - 1; k >= 0; k--) {
      const p = g.particles[k];
      p.life -= dt; p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life <= 0) g.particles.splice(k, 1);
    }
    for (let k = g.texts.length - 1; k >= 0; k--) {
      const t = g.texts[k];
      t.life -= dt; t.y -= 50 * dt;
      if (t.life <= 0) g.texts.splice(k, 1);
    }
  }

  // ---------- Kreslení ----------
  function heartPath(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.45);
    ctx.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
    ctx.closePath();
  }
  function drawHeart(x, y, s, fill, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    heartPath(0, s * 0.2, s);
    ctx.fillStyle = fill; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.beginPath(); ctx.ellipse(-s * 0.4, -s * 0.3, s * 0.16, s * 0.1, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawCloud(x, y, s, color, face) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-s * 0.5, s * 0.1, s * 0.45, 0, Math.PI * 2);
    ctx.arc(0, -s * 0.15, s * 0.6, 0, Math.PI * 2);
    ctx.arc(s * 0.55, s * 0.1, s * 0.42, 0, Math.PI * 2);
    ctx.rect(-s * 0.5, s * 0.05, s * 1.05, s * 0.5);
    ctx.fill();
    if (face) {
      ctx.fillStyle = '#3d4658';
      ctx.beginPath(); ctx.arc(-s * 0.22, 0, s * 0.07, 0, Math.PI * 2); ctx.arc(s * 0.22, 0, s * 0.07, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3d4658'; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, s * 0.32, s * 0.16, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
      // obočí
      ctx.beginPath(); ctx.moveTo(-s * 0.34, -s * 0.16); ctx.lineTo(-s * 0.12, -s * 0.1);
      ctx.moveTo(s * 0.34, -s * 0.16); ctx.lineTo(s * 0.12, -s * 0.1); ctx.stroke();
      // blesk
      ctx.fillStyle = '#ffd34e';
      ctx.beginPath(); ctx.moveTo(s * 0.05, s * 0.55); ctx.lineTo(-s * 0.12, s * 0.9); ctx.lineTo(s * 0.02, s * 0.88);
      ctx.lineTo(-s * 0.06, s * 1.15); ctx.lineTo(s * 0.18, s * 0.78); ctx.lineTo(s * 0.04, s * 0.8); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawAvatar(a) {
    const p = players[a.i];
    const r = R * (a.scale || 1);
    const bob = state === 'play' ? Math.sin(a.bob) * 3 : 0;
    ctx.save();
    ctx.translate(a.x, a.y + bob);
    ctx.rotate(a.rot || 0);
    if (a.hurt > 0 && Math.floor(a.hurt * 10) % 2 === 0) ctx.globalAlpha = 0.45;
    // stín / záře
    ctx.shadowColor = 'rgba(224,78,116,.35)'; ctx.shadowBlur = 16;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, r + 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
    if (p.img.complete && p.img.naturalWidth) ctx.drawImage(p.img, -r, -r, r * 2, r * 2);
    ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = '#ff6f91';
    ctx.beginPath(); ctx.arc(0, 0, r + 5, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    // jmenovka
    if (state !== 'kiss') {
      ctx.font = '700 ' + Math.round(R * 0.32) + 'px "Trebuchet MS", system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const ty = a.y + bob + r + 10;
      const tw = ctx.measureText(p.name).width + 14;
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      roundRect(a.x - tw / 2, ty - 2, tw, R * 0.32 + 8, 8); ctx.fill();
      ctx.fillStyle = '#5a2a3c'; ctx.fillText(p.name, a.x, ty + 2);
    }
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function drawBackground() {
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#ffc2d1'); grd.addColorStop(0.6, '#ffe3ea'); grd.addColorStop(1, '#fff3f6');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    // ozdobné obláčky v pozadí
    clouds.forEach((c) => drawCloud(c.x * W, c.y * H + 40, R * c.s, 'rgba(255,255,255,.55)', false));
    // trávník se srdíčkovými kytičkami
    ctx.fillStyle = '#ffd0dc';
    ctx.beginPath(); ctx.ellipse(W / 2, H + R * 0.4, W * 0.8, R * 1.4, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawHud() {
    const g = game;
    const top = 14;
    // životy
    for (let k = 0; k < 3; k++) drawHeart(24 + k * 30, top + 16, 11, k < g.lives ? '#ff6f91' : 'rgba(90,42,60,.18)');
    // počet pus
    ctx.font = '700 18px "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#5a2a3c';
    ctx.fillText('💋 ' + g.kisses, 112, top + 16);
    // měřič lásky
    const mw = Math.min(W - 48, 360), mx = (W - mw) / 2, my = top + 50;
    ctx.fillStyle = 'rgba(255,255,255,.7)'; roundRect(mx, my, mw, 16, 8); ctx.fill();
    const f = clamp(g.meter / g.goal, 0, 1);
    if (f > 0) {
      const mg = ctx.createLinearGradient(mx, 0, mx + mw, 0);
      mg.addColorStop(0, '#ff9db5'); mg.addColorStop(1, '#ff4f7b');
      ctx.fillStyle = mg; roundRect(mx, my, Math.max(16, mw * f), 16, 8); ctx.fill();
    }
    drawHeart(mx + mw, my + 8, 13, f >= 1 ? '#ff4f7b' : '#ffb3c6');
    ctx.font = '700 12px "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.fillStyle = '#5a2a3c';
    ctx.fillText('Do pusy: ' + Math.max(0, g.goal - g.meter) + ' ❤   ·   úroveň ' + g.level, W / 2, my + 30);
  }

  function draw() {
    ctx.save();
    if (game && game.shake > 0) ctx.translate(rand(-6, 6) * game.shake * 3, rand(-6, 6) * game.shake * 3);
    drawBackground();
    if (game && state !== 'menu') {
      const g = game;
      g.items.forEach((it) => {
        if (it.type === 'cloud') drawCloud(it.x, it.y, it.r, '#b8c0d0', true);
        else drawHeart(it.x, it.y, it.r, it.type === 'gold' ? '#ffc93c' : '#ff6f91', it.rot + Math.sin(it.wob) * 0.15);
      });
      // ve dvou: zvýrazni, když jsou spolu (bonus ×2)
      if (g.mode === 'duo' && state === 'play' && Math.abs(g.avatars[0].x - g.avatars[1].x) < R * 2.6) {
        const cx = (g.avatars[0].x + g.avatars[1].x) / 2;
        drawHeart(cx, g.avatars[0].y - R * 1.5, R * 0.3 + Math.sin(performance.now() / 150) * 2, '#ff4f7b');
      }
      g.avatars.forEach(drawAvatar);
      if (state === 'kiss' && g.kissT >= KISS_IN && g.kissT < KISS_IN + KISS_HOLD) {
        const h = (g.kissT - KISS_IN) / KISS_HOLD;
        const s = Math.min(1, h * 5);
        ctx.font = Math.round(R * 1.1 * s) + 'px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('💋', W / 2, H * 0.45 - R * 1.9);
        ctx.font = '700 ' + Math.round(R * 0.6) + 'px "Trebuchet MS", system-ui, sans-serif';
        ctx.fillStyle = '#e04e74';
        ctx.globalAlpha = s;
        ctx.fillText('Pusa č. ' + g.kisses + '!', W / 2, H * 0.45 + R * 2.3);
        ctx.globalAlpha = 1;
      }
      g.particles.forEach((p) => {
        ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
        drawHeart(p.x, p.y, p.size * 0.6, p.color);
      });
      ctx.globalAlpha = 1;
      g.texts.forEach((t) => {
        ctx.globalAlpha = clamp(t.life, 0, 1);
        ctx.font = '700 18px "Trebuchet MS", system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
      });
      ctx.globalAlpha = 1;
      drawHud();
      if (g.hintT > 0) {
        ctx.globalAlpha = clamp(g.hintT, 0, 1);
        ctx.font = '700 17px "Trebuchet MS", system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.fillStyle = '#5a2a3c';
        ctx.fillText(g.mode === 'duo' ? 'Každý táhne prstem svou fotku' : 'Táhni prstem doleva a doprava', W / 2, H * 0.62);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  // ---------- Smyčka ----------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // ---------- Obrazovky ----------
  function show(id) {
    ['menu', 'pause', 'over'].forEach((s) => { $(s).hidden = s !== id; });
    $('btn-pause').hidden = !(id === null && (state === 'play' || state === 'kiss'));
  }
  function best() { return parseInt(store.get('best') || '0', 10); }
  function showRecord() { const b = best(); $('record').textContent = b ? 'Váš rekord: ' + b + ' 💋' : ''; }

  function start(mode) {
    players.forEach((p, i) => { p.name = ($('name-' + i).value.trim() || (i ? 'Ona' : 'On')); });
    store.set('remember', $('remember').checked ? '1' : '0');
    saveIfRemember();
    ac();
    newGame(mode);
    show(null);
  }

  function gameOver() {
    state = 'over';
    sfx.over();
    const k = game.kisses;
    const rec = k > best();
    if (rec) store.set('best', String(k));
    $('over-score').textContent = k === 1 ? '1 pusa 💋' : (k >= 2 && k <= 4 ? k + ' pusy 💋' : k + ' pus 💋');
    $('over-record').textContent = rec && k > 0 ? 'Nový rekord!' : 'Rekord: ' + best() + ' 💋';
    setTimeout(() => show('over'), 500);
  }

  function togglePause() {
    if (state === 'play' || state === 'kiss') { game.resume = state; state = 'pause'; show('pause'); }
    else if (state === 'pause') { state = game.resume || 'play'; last = performance.now(); show(null); }
  }

  function toMenu() { state = 'menu'; game = null; showRecord(); show('menu'); }

  function selectMe(i) {
    me = i;
    [0, 1].forEach((k) => {
      const b = $('me-' + k);
      b.classList.toggle('active', k === i);
      b.setAttribute('aria-checked', k === i ? 'true' : 'false');
    });
    store.set('me', String(i));
  }
  function updateLabels() {
    [0, 1].forEach((i) => { $('me-' + i).textContent = $('name-' + i).value.trim() || (i ? 'Ona' : 'On'); });
  }

  // ---------- Události menu ----------
  [0, 1].forEach((i) => {
    $('file-' + i).addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        setPhoto(i, await loadPhotoFile(file));
        if ($('remember').checked) saveIfRemember();
      } catch (err) { alert(err.message); }
      e.target.value = '';
    });
    $('name-' + i).addEventListener('input', updateLabels);
    $('me-' + i).addEventListener('click', () => selectMe(i));
  });
  $('remember').addEventListener('change', (e) => {
    store.set('remember', e.target.checked ? '1' : '0');
    if (e.target.checked) saveIfRemember();
    else [0, 1].forEach((i) => { store.del('photo' + i); store.del('name' + i); });
  });
  $('btn-clear').addEventListener('click', () => {
    [0, 1].forEach((i) => { setPhoto(i, null); store.del('photo' + i); });
  });
  $('btn-share').addEventListener('click', async () => {
    const url = location.href.split('#')[0];
    try {
      if (navigator.share) await navigator.share({ title: 'Pusa na dálku', text: 'Zahraj si se mnou 💋', url });
      else { await navigator.clipboard.writeText(url); alert('Odkaz je zkopírovaný:\n' + url); }
    } catch (e) { /* sdílení zrušeno */ }
  });
  $('btn-solo').addEventListener('click', () => start('solo'));
  $('btn-duo').addEventListener('click', () => start('duo'));
  $('btn-pause').addEventListener('click', togglePause);
  $('btn-resume').addEventListener('click', togglePause);
  $('btn-quit').addEventListener('click', toMenu);
  $('btn-again').addEventListener('click', () => { const m = game.mode; newGame(m); show(null); });
  $('btn-menu').addEventListener('click', toMenu);
  const soundBtn = $('btn-sound');
  const syncSound = () => { soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false'); soundBtn.setAttribute('aria-label', soundOn ? 'Vypnout zvuk' : 'Zapnout zvuk'); };
  soundBtn.addEventListener('click', () => { soundOn = !soundOn; store.set('sound', soundOn ? '1' : '0'); syncSound(); if (soundOn) tone(880, 0.1); });
  syncSound();

  document.addEventListener('visibilitychange', () => { if (document.hidden && (state === 'play' || state === 'kiss')) togglePause(); });
  window.addEventListener('resize', resize);

  if (/[?&]debug\b/.test(location.search)) window.pusaDebug = { get game() { return game; }, startKiss: () => startKiss() };

  resize();
  restore();
  requestAnimationFrame(loop);
})();
