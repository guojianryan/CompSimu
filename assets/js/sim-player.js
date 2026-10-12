/* Shared step/play/reset controller for CompSimu simulations. */
(function (global) {
  function $(id) { return document.getElementById(id); }

  function highlightPython(line) {
    return String(line)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/(#.*)$/g, '<span class="tok-cm">$1</span>')
      .replace(/\b(for|while|if|elif|else|in|range|len|True|False|None|def|return|print|not|and|or)\b/g, '<span class="tok-op">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="tok-num">$1</span>')
      .replace(/(".*?")/g, '<span class="tok-temp">$1</span>')
      .replace(/('.*?')/g, '<span class="tok-temp">$1</span>');
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
        `<div class="ln" data-i="${i}"><span class="num">${i + 1}</span><span>${highlightPython(l)}</span></div>`
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
      updateUI();
      if (s.apply) await s.apply(state, { sleep, dur, animate: true, gen: () => myGen === gen });
      if (myGen !== gen) return;
      busy = false;
      updateUI();
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

  global.CompSimu = { createPlayer, highlightPython };
})(window);
