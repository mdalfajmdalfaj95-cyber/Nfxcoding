/* ==========================================================
   Coding Reel Studio — Home / Dashboard
   UI-only prototype: no real functionality yet.
   ========================================================== */

(function () {
  'use strict';

  /* ---- Bottom nav: visual active state only ---- */
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      navItems.forEach((n) => n.classList.remove('active'));
      item.classList.add('active');
    });
  });

  /* ---- Project cards: soft glow follows the pointer ---- */
  const cards = document.querySelectorAll('.card');
  cards.forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--mx', '50%');
      card.style.setProperty('--my', '0%');
    });
  });
})();


/* ==========================================================
   STEP 2 — Projects, New Project modal, Workspace
   Storage: localStorage ("crs.projects"). No backend.
   ========================================================== */
(function () {
  'use strict';

  const KEY = 'crs.projects';
  const $ = (id) => document.getElementById(id);
  const el = { home: $('homeView'), ws: $('workspace'), modal: $('projectModal'), form: $('projectForm'), name: $('projectName'),
    grid: document.querySelector('.grid'), wsName: $('wsName'), save: $('saveState'), sel: $('deviceSel'), list: $('fileList'),
    code: $('code'), hl: $('hl'), curFile: $('curFile'), lang: $('edLang'), frame: $('frame'), device: $('device'),
    scaler: $('scaler'), stage: $('stage'), vp: $('vpLabel') };

  const DEVICES = { phone: [390, 844], tablet: [820, 1180], desktop: [1440, 900] };

  /* ---------- Starter files ---------- */
  const STARTER = {
    'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>My Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <main class="card">\n    <h1>Hello, Reel Studio</h1>\n    <p>Edit the code and watch this update.</p>\n    <button id="btn">Clicked 0 times</button>\n  </main>\n  <script src="script.js"></script>\n</body>\n</html>\n',
    'style.css': '* { box-sizing: border-box; margin: 0; }\n\nbody {\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  font-family: system-ui, sans-serif;\n  background: #0f1020;\n  color: #fff;\n}\n\n.card {\n  padding: 32px;\n  text-align: center;\n  border-radius: 20px;\n  background: rgba(255, 255, 255, 0.08);\n  border: 1px solid rgba(255, 255, 255, 0.15);\n}\n\np { margin: 8px 0 20px; opacity: 0.7; }\n\nbutton {\n  padding: 12px 22px;\n  border: 0;\n  border-radius: 12px;\n  font-size: 1rem;\n  color: #fff;\n  background: linear-gradient(120deg, #ff8a3d, #8b5cf6);\n}\n',
    'script.js': "const btn = document.getElementById('btn');\nlet count = 0;\n\nbtn.addEventListener('click', () => {\n  count++;\n  btn.textContent = `Clicked ${count} times`;\n});\n",
    blank: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>Untitled</title>\n</head>\n<body>\n\n</body>\n</html>\n'
  };

  /* ---------- Storage ---------- */
  let projects = [];
  let current = null;
  try { projects = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { projects = []; }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(projects)); return true; } catch (e) { return false; }
  }
  const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function createProject(name, type) {
    const now = new Date().toISOString();
    const files = type === 'blank'
      ? [{ name: 'index.html', content: STARTER.blank }]
      : ['index.html', 'style.css', 'script.js'].map((n) => ({ name: n, content: STARTER[n] }));
    const p = { id: uid(), name: name, type: type, files: files, kept: false, created: now, updated: now };
    projects.unshift(p);
    persist();
    return p;
  }

  /* ---------- Home: saved project cards ---------- */
  function timeAgo(iso) {
    const m = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + (m === 1 ? ' minute ago' : ' minutes ago');
    const h = Math.floor(m / 60);
    if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    const d = Math.floor(h / 24);
    return d === 1 ? 'yesterday' : d + ' days ago';
  }

  function renderProjects() {
    el.grid.querySelectorAll('.card[data-id]').forEach((c) => c.remove());
    projects.slice().reverse().forEach((p) => {
      let tags = p.type === 'blank' ? '<span class="tag html">HTML</span>'
        : '<span class="tag html">HTML</span><span class="tag css">CSS</span><span class="tag js">JS</span>';
      if (p.kept !== true) tags += '<span class="tag tmp">Temporary</span>';
      const card = document.createElement('article');
      card.className = 'card';
      card.dataset.id = p.id;
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.innerHTML =
        '<div class="thumb"><div class="code"><i style="--w:60%" class="o"></i><i style="--w:78%"></i><i style="--w:42%" class="b"></i><i style="--w:66%"></i><i style="--w:34%" class="p"></i></div><div class="pv"><span class="pill">Open</span></div></div>' +
        '<div class="card-body"><div class="card-top"><h3>' + esc(p.name) + '</h3></div><div class="tags">' + tags + '</div>' +
        '<p class="edited"><svg class="ic"><use href="#i-clock"/></svg>Edited ' + timeAgo(p.updated) + '</p></div>';
      el.grid.prepend(card);
    });
  }
  const openCard = (card) => { const p = projects.find((x) => x.id === card.dataset.id); if (p) openWorkspace(p); };
  el.grid.addEventListener('click', (e) => { const c = e.target.closest('.card[data-id]'); if (c) openCard(c); });
  el.grid.addEventListener('keydown', (e) => { const c = e.target.closest('.card[data-id]'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openCard(c); } });
  document.addEventListener('pointermove', (e) => {
    const c = e.target.closest && e.target.closest('.card');
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  });

  /* ---------- Modal ---------- */
  let lastFocus = null;
  function openModal() {
    lastFocus = document.activeElement;
    el.form.reset();
    el.name.classList.remove('err');
    el.modal.hidden = false;
    setTimeout(() => el.name.focus(), 50);
  }
  function closeModal() { el.modal.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  document.querySelectorAll('#homeView .btn-primary, #homeView .btn-ghost, #homeView .nav-create').forEach((b) => b.addEventListener('click', openModal));
  el.modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !el.modal.hidden) closeModal(); });
  el.name.addEventListener('input', () => el.name.classList.remove('err'));
  el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.name.value.trim();
    if (!name) { el.name.classList.add('err'); el.name.focus(); return; }
    const type = el.form.elements.ptype.value;
    const p = createProject(name, type);
    el.modal.hidden = true;
    renderProjects();
    openWorkspace(p);
  });

  /* ---------- Workspace ---------- */
  let activeFile = null, saveT = 0, prevT = 0;

  function openWorkspace(p) {
    animStop();
    current = p;
    activeFile = p.files[0];
    el.wsName.textContent = p.name;
    el.ws.dataset.pane = 'code';
    el.ws.classList.remove('files-open');
    document.querySelectorAll('.ws-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.pane === 'code'));
    setState('saved');
    updateKeep();
    el.home.hidden = true;
    el.ws.hidden = false;
    document.body.classList.add('ws-open');
    buildFileList();
    loadFile();
    applyDevice();
    renderPreview();
  }
  function closeWorkspace() {
    animStop();
    flushSave();
    el.ws.hidden = true;
    el.home.hidden = false;
    document.body.classList.remove('ws-open');
    current = null;
    renderProjects();
    window.scrollTo(0, 0);
  }
  $('wsBack').addEventListener('click', closeWorkspace);

  function langOf(n) { return n.endsWith('.css') ? 'css' : n.endsWith('.js') ? 'js' : 'html'; }
  function buildFileList() {
    el.list.innerHTML = '';
    current.files.forEach((f) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.className = f === activeFile ? 'on' : '';
      b.innerHTML = '<i class="f-' + langOf(f.name) + '"></i>';
      b.append(f.name);
      b.addEventListener('click', () => { animStop(); activeFile = f; buildFileList(); loadFile(); el.ws.classList.remove('files-open'); });
      li.appendChild(b);
      el.list.appendChild(li);
    });
  }
  function loadFile() {
    el.code.value = activeFile.content;
    el.curFile.textContent = activeFile.name;
    el.lang.textContent = langOf(activeFile.name).toUpperCase();
    highlight();
    el.code.scrollTop = el.code.scrollLeft = 0;
    syncScroll();
  }
  $('fileBtn').addEventListener('click', (e) => { e.stopPropagation(); el.ws.classList.toggle('files-open'); });
  document.addEventListener('click', (e) => { if (!e.target.closest('#wsFiles')) el.ws.classList.remove('files-open'); });

  document.querySelectorAll('.ws-tabs button').forEach((b) => b.addEventListener('click', () => {
    el.ws.dataset.pane = b.dataset.pane;
    document.querySelectorAll('.ws-tabs button').forEach((x) => x.classList.toggle('on', x === b));
    requestAnimationFrame(fit);
  }));

  /* Basic syntax highlighting (editor overlay) */
  const RULES = {
    html: [/(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?[a-zA-Z][\w-]*|\/?&gt;)|("[^"\n]*"|'[^'\n]*')|(\s[\w:-]+(?==))/g, ['c', 't', 's', 'a']],
    css: [/(\/\*[\s\S]*?\*\/)|("[^"\n]*"|'[^'\n]*')|(#[0-9a-fA-F]{3,8}\b|\b\d+\.?\d*(?:px|%|em|rem|vh|vw|s|ms|deg)?\b)|([\w-]+)(?=\s*:)/g, ['c', 's', 'n', 'p']],
    js: [/(\/\/.*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\[\s\S])*`)|(\b(?:const|let|var|function|return|if|else|for|while|new|class|import|export|from|async|await|true|false|null|undefined|this|typeof|of|in)\b)|(\b\d+\.?\d*\b)/g, ['c', 's', 'k', 'n']]
  };
  function hlText(text, lang) {
    const [re, cls] = RULES[lang];
    return esc(text).replace(re, function () {
      const g = Array.prototype.slice.call(arguments, 1, 1 + cls.length);
      const i = g.findIndex((x) => x !== undefined);
      return '<span class="tk-' + cls[i] + '">' + g[i] + '</span>';
    });
  }
  function highlight() {
    el.hl.innerHTML = hlText(el.code.value, langOf(activeFile.name)) + '\n';
    updateGutter();
  }
  const gIn = $('gIn');
  let gLines = 0;
  function updateGutter() {
    const n = el.code.value.split('\n').length;
    if (n === gLines) return;
    gLines = n;
    let t = '';
    for (let i = 1; i <= n; i++) t += i + '\n';
    gIn.textContent = t;
  }
  function syncScroll() {
    const st = el.code.scrollTop, sl = el.code.scrollLeft;
    el.hl.style.transform = 'translate(' + (-sl) + 'px,' + (-st) + 'px)';
    gIn.style.transform = 'translateY(' + (-st) + 'px)';
  }
  el.code.addEventListener('scroll', syncScroll);
  function insert(t) {
    el.code.focus();
    if (!document.execCommand || !document.execCommand('insertText', false, t)) {
      el.code.setRangeText(t, el.code.selectionStart, el.code.selectionEnd, 'end');
      el.code.dispatchEvent(new Event('input'));
    }
  }
  function indentLines(out) {
    const v = el.code.value, s = el.code.selectionStart, e = el.code.selectionEnd;
    const ls = v.lastIndexOf('\n', s - 1) + 1;
    let le = v.indexOf('\n', e); if (le < 0) le = v.length;
    const block = v.slice(ls, le), orig = block.split('\n');
    const lines = orig.map((l) => out ? l.replace(/^( {1,2}|\t)/, '') : '  ' + l);
    const nb = lines.join('\n');
    el.code.setSelectionRange(ls, le);
    insert(nb);
    el.code.setSelectionRange(Math.max(ls, s + lines[0].length - orig[0].length), e + nb.length - block.length);
  }
  el.code.addEventListener('keydown', (e) => {
    if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
    const v = el.code.value, s = el.code.selectionStart, en = el.code.selectionEnd;
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey || s !== en) indentLines(e.shiftKey); else insert('  ');
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const ls = v.lastIndexOf('\n', s - 1) + 1;
      const indent = /^[ \t]*/.exec(v.slice(ls, s))[0];
      const prev = v[s - 1], next = v[en];
      let ins = '\n' + indent, back = 0;
      if (prev === '{' || prev === '(' || prev === '[') {
        ins += '  ';
        if ({ '{': '}', '(': ')', '[': ']' }[prev] === next) { ins += '\n' + indent; back = 1 + indent.length; }
      }
      insert(ins);
      if (back) { const c = el.code.selectionStart - back; el.code.setSelectionRange(c, c); }
    }
  });
  el.code.addEventListener('input', () => {
    activeFile.content = el.code.value;
    highlight();
    syncScroll();
    setState('saving');
    clearTimeout(saveT); saveT = setTimeout(flushSave, 500);
    clearTimeout(prevT); prevT = setTimeout(renderPreview, 300);
  });

  /* Save */
  function setState(s) {
    el.save.dataset.state = s;
    el.save.querySelector('em').textContent = s === 'saving' ? 'Saving…' : s === 'error' ? 'Not saved' : 'Saved';
  }
  function flushSave() {
    clearTimeout(saveT);
    if (!current) return;
    current.updated = new Date().toISOString();
    setState(persist() ? 'saved' : 'error');
  }

  /* Live preview (sandboxed iframe, srcdoc) */
  function buildDoc(ov) {
    const f = (n) => (ov && ov.name === n) ? ov : current.files.find((x) => x.name === n);
    const idx = f('index.html');
    let html = idx ? idx.content : '';
    html = html.replace(/<link[^>]*href=["']([^"']+)["'][^>]*>/gi, (m, h) => {
      const x = f(h); return x && /stylesheet/i.test(m) ? '<style>' + x.content + '</style>' : m;
    });
    html = html.replace(/<script([^>]*?)\ssrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (m, a, h, b) => {
      const x = f(h); return x ? '<script' + a + b + '>' + x.content.replace(/<\/script/gi, '<\\/script') + '<\/script>' : m;
    });
    return html;
  }
  function renderPreview(ov) { if (current) el.frame.srcdoc = buildDoc(ov); }

  /* Preview device: real viewport size + scaled to fit */
  function applyDevice() {
    const d = el.sel.value, size = DEVICES[d];
    el.device.dataset.device = d;
    el.frame.style.width = size[0] + 'px';
    el.frame.style.height = size[1] + 'px';
    el.vp.textContent = size[0] + ' × ' + size[1];
    fit();
  }
  function fit() {
    if (el.ws.hidden || !el.stage.clientWidth) return;
    const w = el.device.offsetWidth, h = el.device.offsetHeight;
    const s = Math.min((el.stage.clientWidth - 32) / w, (el.stage.clientHeight - 32) / h, 1);
    el.device.style.transform = 'scale(' + s + ')';
    el.scaler.style.width = w * s + 'px';
    el.scaler.style.height = h * s + 'px';
  }
  el.sel.addEventListener('change', applyDevice);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(el.stage);
  window.addEventListener('resize', fit);
  window.addEventListener('pagehide', flushSave);

  /* ---------- Keep Project (temporary vs kept) ---------- */
  const keepBtn = $('keepBtn');
  function updateKeep() {
    const on = !!(current && current.kept === true);
    keepBtn.classList.toggle('on', on);
    keepBtn.setAttribute('aria-pressed', String(on));
    keepBtn.querySelector('span').textContent = on ? 'Kept' : 'Keep Project';
    keepBtn.title = on ? 'This project is kept' : 'Keep Project';
  }
  keepBtn.addEventListener('click', () => {
    if (!current || current.kept === true) return;
    current.kept = true;
    flushSave();
    updateKeep();
  });

  /* ---------- Mobile keyboard: keep the editor visible ---------- */
  const vv = window.visualViewport;
  function vvSync() {
    if (!vv || el.ws.hidden) return;
    const kb = window.innerWidth < 960 && window.innerHeight - vv.height > 120;
    el.ws.classList.toggle('kb', kb);
    el.ws.style.height = kb ? vv.height + 'px' : '';
    el.ws.style.top = kb ? vv.offsetTop + 'px' : '';
    fit();
  }
  if (vv) { vv.addEventListener('resize', vvSync); vv.addEventListener('scroll', vvSync); }

  /* ==========================================================
     STEP 4 — Basic automatic code typing (animation mode)
     The animation only READS activeFile.content. It renders a
     temporary view, so the real project code is never changed.
     ========================================================== */
  const ed = document.querySelector('.ed');
  const tv = $('tv');
  const aPlay = $('aPlay'), aReplay = $('aReplay'), aStop = $('aStop'), aStatus = $('aStatus');
  const STATUS = { idle: 'Ready', typing: 'Typing…', paused: 'Paused', done: 'Completed' };
  const anim = { due: 0, lead: true, mood: 1, moodLeft: 0, state: 'idle', view: false, text: '', pos: 0, acc: 0, last: 0, raf: 0, finishT: 0, file: null,
    line: '', idx: 0, st: { c: false }, cur: null, lh: 22, cw: 8, gw: 48, x: 0, y: 0, saveX: 0, saveY: 0, lastPrev: 0, prevPos: -1 };

  function setStatus(state) {
    anim.state = state;
    aStatus.dataset.state = state;
    aStatus.querySelector('em').textContent = STATUS[state];
    const typing = state === 'typing';
    aPlay.querySelector('span').textContent = typing ? 'Pause' : 'Play';
    aPlay.querySelector('use').setAttribute('href', typing ? '#i-pause' : '#i-play');
    aPlay.setAttribute('aria-label', typing ? 'Pause' : 'Play');
    aStop.disabled = state === 'idle';
  }

  /* Line-based highlighter (carries block-comment state between lines) */
  function hlLine(line, lang, st) {
    const open = lang === 'html' ? '<!--' : '/*', close = lang === 'html' ? '-->' : '*/';
    let out = '', rest = line;
    if (st.c) {
      const i = rest.indexOf(close);
      if (i < 0) return '<span class="tk-c">' + esc(rest) + '</span>';
      out = '<span class="tk-c">' + esc(rest.slice(0, i + close.length)) + '</span>';
      rest = rest.slice(i + close.length); st.c = false;
    }
    const o = rest.lastIndexOf(open);
    if (o >= 0 && rest.indexOf(close, o + open.length) < 0 && !(lang === 'js' && rest.slice(0, o).indexOf('//') >= 0)) {
      st.c = true;
      return out + hlText(rest.slice(0, o), lang) + '<span class="tk-c">' + esc(rest.slice(o)) + '</span>';
    }
    return out + hlText(rest, lang);
  }

  function renderCur() {
    anim.cur.innerHTML = hlLine(anim.line, langOf(anim.file.name), { c: anim.st.c }) + '<span class="caret"></span>';
  }
  function commitLine() {
    const d = document.createElement('div');
    d.className = 'ln';
    d.innerHTML = hlLine(anim.line, langOf(anim.file.name), anim.st);   // advances comment state
    tv.insertBefore(d, anim.cur);
    anim.idx++;
    gIn.appendChild(document.createTextNode((anim.idx + 1) + '\n'));
  }

  /* Keep the typing position visible: scroll down by whole lines, follow long lines sideways */
  function followCaret() {
    const bottom = 14 + (anim.idx + 1) * anim.lh;
    const y = Math.max(anim.y, bottom + anim.lh * 2 - ed.clientHeight);
    const x = Math.max(0, anim.line.length * anim.cw + 52 - (ed.clientWidth - anim.gw));
    if (y === anim.y && x === anim.x) return;
    anim.y = y; anim.x = x;
    tv.style.transform = 'translate(' + (-x) + 'px,' + (-y) + 'px)';
    gIn.style.transform = 'translateY(' + (-y) + 'px)';
  }

  /* Live preview while typing: throttled; unfinished tags hidden; JS only runs syntactically valid snapshots */
  function animPreview(force) {
    const now = performance.now();
    if (!force && (now - anim.lastPrev < 220 || anim.prevPos === anim.pos)) return;
    const lang = langOf(anim.file.name);
    let t = anim.text.slice(0, anim.pos);
    anim.lastPrev = now;
    if (lang === 'html') t = t.replace(/<[^>]*$/, '');
    else if (lang === 'js') { try { new Function(t); } catch (e) { return; } }
    anim.prevPos = anim.pos;
    renderPreview({ name: anim.file.name, content: t });
  }

  /* ---------- Human-like rhythm ----------
     Every character has its own small random delay; extra pauses are added only at
     structural points (line ends, tags, braces, blank lines). Returns the wait in ms
     before the NEXT character, given that `end` characters are already typed. */
  const R = (a, b) => a + Math.random() * (b - a);
  function nextDelay(end) {
    const t = anim.text, ch = t[end - 1], prev = t[end - 2], lang = langOf(anim.file.name);
    if (ch === '\n') anim.lead = true; else if (ch !== ' ' && ch !== '\t') anim.lead = false;
    if (anim.lead && (ch === ' ' || ch === '\t')) return R(3, 8);        // indentation is typed quickly

    if (--anim.moodLeft <= 0) { anim.mood = R(0.7, 1.35); anim.moodLeft = 6 + Math.floor(Math.random() * 14); }
    const d = R(11, 24) * anim.mood;                                     // base speed with drifting rhythm
    let pause = 0;

    if (ch === '\n') {
      pause = R(80, 200);                                                // line break
      if (prev === '\n') pause += R(200, 420);                           // blank line = new section
    } else if (ch === '{') {
      const line = t.slice(t.lastIndexOf('\n', end - 2) + 1, end);
      pause = (lang === 'js' && /function|=>|\)\s*\{$/.test(line)) ? R(220, 420) : R(150, 300);
    } else if (ch === '}') {
      pause = R(140, 320);
    } else if (ch === ';') {
      if (Math.random() < 0.5) pause = R(30, 90);
    } else if (ch === '>' && lang === 'html') {
      const tag = t.slice(t.lastIndexOf('<', end - 1), end);             // a tag was just completed
      const name = (/^<\/?([a-zA-Z][\w-]*)/.exec(tag) || [])[1];
      if (tag[1] === '!') pause = R(150, 300);                           // doctype / comment
      else if (tag[1] === '/') pause = R(100, 240);                      // closing tag
      else if (/^(html|head|body|main|section|header|footer|nav|div|ul|form|script|style)$/i.test(name)) pause = R(130, 300);
      else pause = R(40, 110);
    } else if (ch === ' ' && Math.random() < 0.012) {
      pause = R(140, 340);                                               // rare "thinking" moment
    }
    return Math.min(d + pause, 700);
  }

  function tick(now) {
    const dt = Math.min(now - anim.last, 100);
    anim.last = now;
    anim.acc += dt;                                                      // ms of typing time available
    let end = anim.pos;
    for (let g = 0; g < 12 && anim.acc >= anim.due && end < anim.text.length; g++) {
      anim.acc -= anim.due;
      end++;
      const c = anim.text.charCodeAt(end - 1);
      if (c >= 0xD800 && c <= 0xDBFF && end < anim.text.length) end++;  // never split an emoji
      anim.due = nextDelay(end);
    }
    if (anim.acc > anim.due) anim.acc = anim.due;                       // no catch-up bursts after a slow frame
    if (end > anim.pos) {
      const parts = anim.text.slice(anim.pos, end).split('\n');
      anim.pos = end;
      anim.line += parts[0];
      for (let i = 1; i < parts.length; i++) { commitLine(); anim.line = parts[i]; }
      renderCur();            // one small DOM update per frame, not per character
      followCaret();
      animPreview(false);
    }
    if (anim.pos >= anim.text.length) { animFinish(); return; }
    anim.raf = requestAnimationFrame(tick);
  }

  /* Leave the animation view and show the normal (real, unchanged) editor again */
  function exitView(restoreScroll) {
    clearTimeout(anim.finishT);
    cancelAnimationFrame(anim.raf);
    if (!anim.view) return;
    anim.view = false;
    ed.classList.remove('anim');
    el.code.readOnly = false;
    tv.textContent = '';
    tv.style.transform = '';
    el.code.value = activeFile.content;
    highlight();
    gLines = 0; updateGutter();
    el.code.scrollTop = restoreScroll ? anim.saveY : anim.y;
    el.code.scrollLeft = restoreScroll ? anim.saveX : anim.x;
    syncScroll();
  }

  function animStart() {
    exitView(false);
    const f = activeFile;
    if (!f) return;
    anim.file = f;
    anim.text = f.content.replace(/\r\n?/g, '\n');
    anim.pos = 0; anim.acc = 0; anim.due = 260; anim.lead = true; anim.mood = 1; anim.moodLeft = 0; anim.idx = 0; anim.line = ''; anim.st = { c: false };
    anim.x = anim.y = 0; anim.prevPos = -1;
    anim.saveX = el.code.scrollLeft; anim.saveY = el.code.scrollTop;
    el.code.blur();
    el.code.readOnly = true;
    tv.textContent = '';
    tv.style.transform = '';
    gIn.textContent = '1\n';
    gIn.style.transform = '';
    anim.cur = document.createElement('div');
    anim.cur.className = 'ln cur';
    tv.appendChild(anim.cur);
    ed.classList.add('anim');
    anim.view = true;
    anim.lh = anim.cur.offsetHeight || 22;
    anim.gw = parseFloat(getComputedStyle(ed).getPropertyValue('--gw')) || 48;
    const probe = document.createElement('span');                        // measure one monospace character
    probe.style.cssText = 'position:absolute;visibility:hidden';
    probe.textContent = '0000000000';
    tv.appendChild(probe); anim.cw = probe.offsetWidth / 10 || 8; probe.remove();
    renderCur();
    setStatus('typing');
    animPreview(true);                                                   // starts from an empty file
    if (!anim.text.length) { animFinish(); return; }
    anim.last = performance.now();
    anim.raf = requestAnimationFrame(tick);
  }
  function animPause() { cancelAnimationFrame(anim.raf); setStatus('paused'); }
  function animResume() { setStatus('typing'); anim.last = performance.now(); anim.raf = requestAnimationFrame(tick); }
  function animFinish() {
    cancelAnimationFrame(anim.raf);
    setStatus('done');
    renderPreview();                                                     // final, real project output
    anim.finishT = setTimeout(() => exitView(false), 1400);              // caret stays briefly, then normal editor
  }
  function animStop() {
    if (anim.state === 'idle') return;
    exitView(true);
    setStatus('idle');
    renderPreview();
  }

  aPlay.addEventListener('click', () => {
    if (anim.state === 'typing') animPause();
    else if (anim.state === 'paused') animResume();
    else animStart();                                                    // idle or completed → from the beginning
  });
  aReplay.addEventListener('click', animStart);
  aStop.addEventListener('click', animStop);
  el.code.addEventListener('input', () => { if (anim.state === 'done') setStatus('idle'); });
  setStatus('idle');

  /* ==========================================================
     STEP 5 — Recording Mode foundation
     A separate full-screen view. It only READS the project
     (files + preview device); it never edits project data and
     never touches the Workspace editor or Automatic Typing.
     Controls are placeholders: nothing is captured or exported.
     ========================================================== */
  const rc = {
    root: $('recMode'), project: $('rcProject'), status: $('rcStatus'), seq: $('rcSeq'), files: $('rcFiles'), lang: $('rcLang'),
    gut: $('rcGut'), src: $('rcSrc'), scroll: $('rcScroll'), vp: $('rcVp'), stage: $('rcStage'), scaler: $('rcScaler'),
    device: $('rcDevice'), frame: $('rcFrame'), note: $('rcNote'),
    start: $('rcStart'), pause: $('rcPause'), stop: $('rcStop'), test: $('rcTest'),
    result: $('rcResult'), video: $('rcVideo'), resMeta: $('rcResMeta'), resClose: $('rcResClose'), resAgain: $('rcResAgain')
  };
  rc.main = rc.root.querySelector('.rc-main');
  const RC_STATUS = { idle: 'Ready', starting: 'Starting…', recording: 'Recording', paused: 'Paused', stopped: 'Stopped', testing: 'Testing' };
  const RC_NOTE = {
    idle: 'Ready. Records the code and preview area only.',
    starting: 'Choose “This Tab” in the browser prompt to begin.',
    recording: 'Recording the code and preview area.',
    paused: 'Paused. Resume to continue the same video.',
    stopped: 'Stopped. The video is kept in memory only.',
    testing: 'Showing the full project preview.'
  };
  const rcs = { open: false, state: 'idle', file: null, step: 'html' };

  function rcStepOf(f) { return langOf(f.name); }

  /* Sequence indicator: HTML → CSS → JavaScript → Test (display only) */
  function rcUpdateSeq() {
    const has = {};
    current.files.forEach((f) => { has[rcStepOf(f)] = true; });
    rc.seq.querySelectorAll('li').forEach((li) => {
      const s = li.dataset.step;
      li.classList.toggle('on', s === rcs.step);
      li.classList.toggle('na', s !== 'test' && !has[s]);
      if (s === rcs.step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
  }

  /* Current file indicator + read-only code display */
  function rcBuildFiles() {
    rc.files.innerHTML = '';
    current.files.forEach((f) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(f === rcs.file));
      b.className = f === rcs.file ? 'on' : '';
      b.innerHTML = '<i class="f-' + langOf(f.name) + '"></i>';
      b.append(f.name);
      b.addEventListener('click', () => { rcShowFile(f); });
      rc.files.appendChild(b);
    });
  }
  function rcShowFile(f) {
    rcs.file = f;
    rcs.step = rcStepOf(f);
    rcBuildFiles();
    const lang = langOf(f.name);
    const text = f.content.replace(/\r\n?/g, '\n');
    rc.src.innerHTML = hlText(text, lang) + '\n';
    const n = text.split('\n').length;
    let g = '';
    for (let i = 1; i <= n; i++) g += i + '\n';
    rc.gut.textContent = g;
    rc.lang.textContent = lang.toUpperCase();
    rc.scroll.scrollTop = rc.scroll.scrollLeft = 0;
    rcUpdateSeq();
    if (rcs.state === 'testing') rcSetState('idle');
  }

  /* Status area + placeholder control states */
  function rcSetState(s) {
    rcs.state = s;
    rc.status.dataset.state = s;
    rc.status.querySelector('em').textContent = RC_STATUS[s];
    rc.note.textContent = RC_NOTE[s];
    rc.note.classList.remove('err');
    const live = s === 'recording', paused = s === 'paused';
    rc.start.disabled = live || s === 'starting';
    rc.start.querySelector('span').textContent = paused ? 'Resume Recording' : 'Start Recording';
    rc.pause.disabled = !live;
    rc.stop.disabled = !(live || paused);
  }

  /* Large preview: full project, same device the Workspace preview uses */
  function rcRenderPreview() { rc.frame.srcdoc = buildDoc(); }
  function rcApplyDevice() {
    const d = el.sel.value, size = DEVICES[d];
    rc.device.dataset.device = d;
    rc.frame.style.width = size[0] + 'px';
    rc.frame.style.height = size[1] + 'px';
    rc.vp.textContent = size[0] + ' × ' + size[1];
    rcFit();
  }
  function rcFit() {
    if (rc.root.hidden || !rc.stage.clientWidth) return;
    const w = rc.device.offsetWidth, h = rc.device.offsetHeight;
    const s = Math.min((rc.stage.clientWidth - 32) / w, (rc.stage.clientHeight - 32) / h, 1);
    rc.device.style.transform = 'scale(' + s + ')';
    rc.scaler.style.width = w * s + 'px';
    rc.scaler.style.height = h * s + 'px';
  }
  if (window.ResizeObserver) new ResizeObserver(rcFit).observe(rc.stage);
  window.addEventListener('resize', rcFit);

  /* Open / exit */
  function rcOpen() {
    if (!current || rcs.open) return;
    animStop();                                   // leave Automatic Typing in a clean state
    flushSave();
    rcs.open = true;
    rcCloseResult(); rcDiscardVideo();
    rc.project.textContent = current.name;
    rcs.file = activeFile && current.files.indexOf(activeFile) >= 0 ? activeFile : current.files[0];
    rcSetState('idle');
    rcShowFile(rcs.file);
    el.ws.inert = true;                           // Workspace stays untouched underneath
    rc.root.hidden = false;
    rcApplyDevice();
    rcRenderPreview();
    requestAnimationFrame(rcFit);
  }
  function rcExit() {
    if (!rcs.open) return;
    if ((rcs.state === 'recording' || rcs.state === 'paused') && !window.confirm('Stop recording and discard it?')) return;
    rcAbort();                                    // stop capture, release the screen-share, drop any chunks
    rcCloseResult(); rcDiscardVideo();
    rcs.open = false;
    rcSetState('idle');
    rc.root.hidden = true;
    rc.frame.srcdoc = '';                         // stop any preview scripts
    el.ws.inert = false;
    requestAnimationFrame(fit);
    const b = $('recOpen'); if (b) b.focus();
  }
  $('recOpen').addEventListener('click', rcOpen);
  $('rcExit').addEventListener('click', rcExit);

  /* ---------- Real capture (Step 1: record / pause / resume / stop) ----------
     Only the element returned by rcCaptureTarget() is recorded — never the whole
     screen. Chrome/Edge: Element Capture (preferred) or Region Capture. If neither
     exists, or the user shares anything but this tab, nothing is recorded. */
  const rcCaptureTarget = () => rc.main;          // ← the ONE place that decides what gets recorded (code + preview)
  const rec = { recorder: null, chunks: [], session: 0, t0: 0, acc: 0, url: '' };

  function rcCaptureMethod() {
    const T = window.BrowserCaptureMediaStreamTrack;
    if (window.RestrictionTarget && T && T.prototype.restrictTo) return 'element';
    if (window.CropTarget && T && T.prototype.cropTo) return 'region';
    return '';
  }
  function rcUnsupported() {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) || !window.MediaRecorder) {
      return 'Recording isn’t supported on this browser or device. Use Chrome or Edge on a desktop, over https or localhost.';
    }
    if (!rcCaptureMethod()) {
      return 'This browser can’t record just the code and preview area (it needs Element or Region Capture, available in desktop Chrome and Edge). Nothing was recorded.';
    }
    return '';
  }
  function rcPickMime() {
    return ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find((t) => MediaRecorder.isTypeSupported(t)) || '';
  }
  function rcStopTracks(stream) { if (stream) stream.getTracks().forEach((t) => { try { t.stop(); } catch (e) { /* already stopped */ } }); }
  function rcFail(msg) { rcSetState('idle'); rc.note.textContent = msg; rc.note.classList.add('err'); }
  function rcErrorText(err) {
    const n = err && err.name;
    if (n === 'NotAllowedError') return 'Screen sharing was cancelled, so nothing was recorded.';
    if (n === 'RcSurface') return 'Please choose “This Tab” in the sharing prompt. Nothing was recorded.';
    return 'Couldn’t limit the capture to the code and preview area, so nothing was recorded' + (n ? ' (' + n + ')' : '') + '.';
  }
  const rcClock = () => performance.now();

  async function rcStartCapture() {
    const why = rcUnsupported();
    if (why) { rcFail(why); return; }
    rcCloseResult(); rcDiscardVideo();
    const sid = ++rec.session;
    rcSetState('starting');
    let stream = null;
    try {
      const method = rcCaptureMethod();
      const el0 = rcCaptureTarget();
      const target = method === 'element' ? await RestrictionTarget.fromElement(el0) : await CropTarget.fromElement(el0);
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } }, audio: false,
        preferCurrentTab: true, selfBrowserSurface: 'include', surfaceSwitching: 'exclude', monitorTypeSurfaces: 'exclude', systemAudio: 'exclude'
      });
      if (sid !== rec.session) { rcStopTracks(stream); return; }          // exited / cancelled while the prompt was open
      const track = stream.getVideoTracks()[0];
      const surface = (track.getSettings() || {}).displaySurface;
      if (surface && surface !== 'browser') { const e = new Error('not this tab'); e.name = 'RcSurface'; throw e; }
      if (method === 'element') await track.restrictTo(target); else await track.cropTo(target);   // limit BEFORE any frame is recorded
      if (sid !== rec.session) { rcStopTracks(stream); return; }

      const mime = rcPickMime();
      const opts = { videoBitsPerSecond: 6000000 };
      if (mime) opts.mimeType = mime;
      const mr = new MediaRecorder(stream, opts);
      mr.rcStream = stream; mr.rcDiscard = false;
      rec.chunks = []; rec.acc = 0;
      mr.ondataavailable = (e) => { if (rec.recorder === mr && e.data && e.data.size) rec.chunks.push(e.data); };
      mr.onstop = () => rcFinish(mr);
      mr.onerror = () => { rcAbort(); rcFail('Recording stopped unexpectedly. Nothing was saved.'); };
      track.addEventListener('ended', () => { if (rec.recorder === mr && mr.state !== 'inactive') rcStopCapture(); });   // browser "Stop sharing"
      rec.recorder = mr;
      mr.start(1000);
      rec.t0 = rcClock();
      rcSetState('recording');
    } catch (err) {
      rcStopTracks(stream);
      if (sid === rec.session) rcFail(rcErrorText(err));
    }
  }
  function rcPauseCapture() {
    const mr = rec.recorder;
    if (!mr || mr.state !== 'recording') return;
    mr.pause();
    rec.acc += rcClock() - rec.t0;
    rcSetState('paused');
  }
  function rcResumeCapture() {
    const mr = rec.recorder;
    if (!mr || mr.state !== 'paused') return;
    mr.resume();
    rec.t0 = rcClock();
    rcSetState('recording');
  }
  function rcStopCapture() {
    const mr = rec.recorder;
    if (!mr || mr.state === 'inactive') return;
    if (mr.state === 'recording') rec.acc += rcClock() - rec.t0;
    rc.pause.disabled = true; rc.stop.disabled = true;
    try { mr.stop(); } catch (e) { rcAbort(); rcFail('Couldn’t finish the recording. Nothing was saved.'); }
  }
  /* Recorder finished: join the chunks into one Blob that lives only in memory */
  function rcFinish(mr) {
    rcStopTracks(mr.rcStream);
    if (mr.rcDiscard) return;
    if (rec.recorder === mr) rec.recorder = null;
    if (!rec.chunks.length) { rcFail('No video data was captured.'); return; }
    const blob = new Blob(rec.chunks, { type: mr.mimeType || 'video/webm' });
    rec.chunks = [];
    rec.url = URL.createObjectURL(blob);
    rcSetState('stopped');
    rcShowResult(blob);
  }
  /* Drop everything without saving (exit, error, closed while prompt was open) */
  function rcAbort() {
    rec.session++;
    const mr = rec.recorder;
    rec.recorder = null;
    rec.chunks = [];
    if (mr) { mr.rcDiscard = true; if (mr.state !== 'inactive') { try { mr.stop(); } catch (e) { /* ignore */ } } rcStopTracks(mr.rcStream); }
  }

  /* Playback preview */
  const rcFmtTime = (ms) => { const s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function rcShowResult(blob) {
    rc.video.src = rec.url;
    rc.resMeta.textContent = rcFmtTime(rec.acc) + ' · ' + (blob.size / 1048576).toFixed(1) + ' MB · ' + (blob.type.split(';')[0].replace('video/', '') || 'video').toUpperCase() + ' — kept in memory only; closing discards it.';
    rc.result.hidden = false;
    rc.resClose.focus();
  }
  function rcCloseResult() { rc.result.hidden = true; rc.video.pause(); }
  function rcDiscardVideo() {
    if (rec.url) URL.revokeObjectURL(rec.url);
    rec.url = '';
    rc.video.pause();
    rc.video.removeAttribute('src');
    rc.video.load();
  }
  /* MediaRecorder WebM reports an infinite duration; this makes the seek bar work */
  rc.video.addEventListener('loadedmetadata', () => {
    if (rc.video.duration !== Infinity) return;
    const v = rc.video;
    v.currentTime = 1e101;
    v.addEventListener('timeupdate', function reset() { v.removeEventListener('timeupdate', reset); v.currentTime = 0; });
  });

  rc.start.addEventListener('click', () => { if (rcs.state === 'paused') rcResumeCapture(); else rcStartCapture(); });
  rc.pause.addEventListener('click', rcPauseCapture);
  rc.stop.addEventListener('click', rcStopCapture);
  rc.resClose.addEventListener('click', () => { rcCloseResult(); rcDiscardVideo(); });
  rc.resAgain.addEventListener('click', () => { rcCloseResult(); rcDiscardVideo(); rcStartCapture(); });
  rc.test.addEventListener('click', () => {
    rcs.step = 'test';
    rcUpdateSeq();
    rcRenderPreview();                            // reload the finished project
    if (rcs.state === 'idle' || rcs.state === 'stopped') rcSetState('testing');
  });

  renderProjects();
})();
