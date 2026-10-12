/* Shared step/play/reset controller for CompSimu simulations. */
(function (global) {
  function $(id) { return document.getElementById(id); }

  function highlightPython(line) {
    // Tokenize so indentation/spaces stay intact and comments/strings are not re-colored.
    const src = String(line);
    const parts = [];
    const re = /(#.*)$|("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')|\b(for|while|if|elif|else|in|from|import|True|False|None|def|return|print|not|and|or)\b|\b(\d+)\b|([^#'"\w]+|\w+)/g;
    let m;
    while ((m = re.exec(src))) {
      if (m[1]) parts.push(['cm', m[1]]);
      else if (m[2] || m[3]) parts.push(['temp', m[2] || m[3]]);
      else if (m[4]) parts.push(['op', m[4]]);
      else if (m[5]) parts.push(['num', m[5]]);
      else parts.push([null, m[6]]);
    }
    return parts.map(([kind, text]) => {
      const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return kind ? `<span class="tok-${kind}">${esc}</span>` : esc;
    }).join('');
  }

  function createPlayer(opts) {
    const programs = opts.programs;
    let mode = opts.initialMode || Object.keys(programs)[0];
    let idx = 0, playing = false, busy = false, gen = 0, speed = 1;
    const freshState = () => {
      if (!opts.initialState) return {};
      const raw = opts.initialState.length ? opts.initialState(mode) : opts.initialState();
      return structuredClone(raw);
    };
    let state = freshState();

    const codeEl = $('code');
    const explainEl = $('explain'), badgeEl = $('explainBadge'), txtEl = $('explainTxt');
    const btnPlay = $('btnPlay'), btnStep = $('btnStep'), btnBack = $('btnBack'), btnReset = $('btnReset');

    const dur = (ms) => ms / speed;
    const sleep = (ms) => new Promise((r) => setTimeout(r, dur(ms)));

    function program() { return programs[mode]; }

    function renderCode() {
      const p = program();
      codeEl.innerHTML = p.lines.map((l, i) =>
        `<div class="ln" data-i="${i}"><span class="num">${i + 1}</span><span class="src">${highlightPython(l)}</span></div>`
      ).join('');
      if ($('fileName')) $('fileName').textContent = p.file;
      if ($('stageMode')) $('stageMode').textContent = p.label;
    }

    function updateUI() {
      const p = program(), n = p.steps.length;
      const cur = idx > 0 ? p.steps[idx - 1].line : -1;
      codeEl.querySelectorAll('.ln').forEach((el) => {
        const i = +el.dataset.i;
        el.classList.toggle('current', i === cur);
        el.classList.toggle('done', cur >= 0 && i < cur);
      });
      $('stepLabel').textContent = `Step ${idx} / ${n}`;
      $('progressBar').style.width = `${n ? (idx / n) * 100 : 0}%`;
      explainEl.classList.remove('warn', 'good');
      if (idx === 0) {
        badgeEl.textContent = 'Ready';
        txtEl.innerHTML = p.ready || 'Press <b>Step</b> to begin, or <b>Play</b> to run automatically.';
      } else {
        const s = p.steps[idx - 1];
        badgeEl.textContent = s.badge || `Line ${(s.line ?? 0) + 1}`;
        txtEl.innerHTML = s.text;
        if (s.kind) explainEl.classList.add(s.kind);
      }
      btnStep.disabled = idx >= n || busy;
      btnBack.disabled = idx === 0 || busy;
      $('playTxt').textContent = playing ? 'Pause' : (idx >= n ? 'Replay' : 'Play');
      $('playIcon').innerHTML = playing
        ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>'
        : '<path d="M8 5v14l11-7z"/>';
      if (opts.render) opts.render(state, { mode, idx, busy, playing });
    }

    async function step() {
      const p = program();
      if (busy || idx >= p.steps.length) return;
      busy = true;
      const myGen = gen;
      const s = p.steps[idx];
      idx++;
      const result = s.apply
        ? s.apply(state, { sleep, dur, animate: true, gen: () => myGen === gen })
        : null;
      // Sync applies (most loop sims): update state before painting so boxes
      // show the new value on the same step as the explanation.
      // Async applies (e.g. python-swap flies): paint first, then finish animation.
      if (result && typeof result.then === 'function') {
        updateUI();
        await result;
        if (myGen !== gen) return;
        busy = false;
        updateUI();
      } else {
        if (myGen !== gen) return;
        busy = false;
        updateUI();
      }
    }

    async function play() {
      if (idx >= program().steps.length) reset();
      playing = true; updateUI();
      const myGen = gen;
      while (playing && myGen === gen && idx < program().steps.length) {
        await step();
        if (!playing || myGen !== gen) break;
        if (idx < program().steps.length) await sleep(700);
      }
      if (myGen === gen) { playing = false; updateUI(); }
    }

    function pause() { playing = false; updateUI(); }

    function reset() {
      gen++; playing = false; busy = false; idx = 0;
      state = freshState();
      updateUI();
    }

    function jumpTo(target) {
      gen++; playing = false; busy = false;
      state = freshState();
      const p = program();
      const end = Math.max(0, Math.min(target, p.steps.length));
      for (let i = 0; i < end; i++) {
        if (p.steps[i].apply) p.steps[i].apply(state, { sleep: async () => {}, dur: (ms) => 0, animate: false, gen: () => true });
      }
      idx = end;
      updateUI();
    }

    function setMode(m) {
      if (!programs[m]) return;
      mode = m;
      document.querySelectorAll('[data-mode]').forEach((t) => t.classList.toggle('active', t.dataset.mode === m));
      renderCode();
      reset();
    }

    btnStep.onclick = () => { if (playing) pause(); step(); };
    btnPlay.onclick = () => (playing ? pause() : play());
    btnReset.onclick = reset;
    btnBack.onclick = () => { if (!busy) jumpTo(idx - 1); };
    document.querySelectorAll('[data-mode]').forEach((t) => (t.onclick = () => setMode(t.dataset.mode)));
    document.querySelectorAll('[data-jump]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      setMode(a.dataset.jump);
      document.getElementById('simulation')?.scrollIntoView({ behavior: 'smooth' });
    }));
    if ($('speed')) {
      $('speed').oninput = (e) => { speed = +e.target.value; $('speedVal').textContent = speed + '×'; };
    }
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); btnStep.click(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); btnBack.click(); }
      else if (e.key.toLowerCase() === 'r') reset();
    });

    renderCode();
    updateUI();
    return { setMode, reset, state: () => state };
  }

  /** Build labeled variable boxes: [{ name, value, flash?, badge? }] */
  function renderVars(vars, title) {
    const boxes = (vars || []).map((v) => {
      const empty = v.value === undefined || v.value === null || v.value === '';
      const shown = empty ? '—' : v.value;
      const badge = v.badge
        ? `<span class="var-bump">${v.badge}</span>`
        : '';
      // cache-bust flash animation when the same box keeps flashing across steps
      const flashKey = v.flash ? ` style="animation-name:val-flash;animation-duration:.6s"` : '';
      return `<div class="var sm" data-name="${String(v.name).replace(/"/g, '')}">
        <span class="label">${v.name}</span>
        <div class="val${empty ? ' empty' : ''}${v.flash ? ' flash' : ''}"${flashKey}>${shown}</div>
        ${badge}
      </div>`;
    }).join('');
    const heading = title === false ? '' : `<div class="vars-label">${title || 'Variables'}</div>`;
    return `${heading}<div class="vars vars-track">${boxes}</div>`;
  }

  global.CompSimu = { createPlayer, highlightPython, renderVars };
})(window);
