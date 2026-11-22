// =====================================================
//   VANTRA STUDIO — Radio Now Playing · script.js
//   Shows the streamer's music as a fictional FM station.
//   Source: Last.fm "now playing" (Spotify, Apple Music via Web Scrobbler, Deezer…) or manual text.
// =====================================================

const CONFIG = {
  // Station
  station:       'neon',          // neon | rock | hiphop | lofi
  stationName:   '',              // empty = name of the preset (e.g. "Neon FM")
  frequency:     '',              // empty = frequency of the preset (e.g. "103.5")

  // Music source
  source:        'lastfm',        // lastfm | manual
  lastfmUser:    '',
  lastfmKey:     '',
  manualTitle:   'Midnight Drive',
  manualArtist:  'Vantra Studio',
  pollSeconds:   8,

  // Behaviour
  idleMode:      'message',       // message | last (last track played) | hide
  idleText:      'Waiting for the next track…',
  hideWhenIdle:  false,           // old setting, same as idleMode "hide"
  staticSound:   true,
  staticVolume:  30,
  scrollSpeed:   40,              // px per second for long titles
  fitToSource:   true,            // scale the 520x110 banner to the browser source width

  // Optional color overrides (empty = preset colors)
  nameColor:     '',
  lcdColor:      '',
  needleColor:   '',
  eqFrom:        '',
  eqTo:          '',
};

const DEFAULTS = { ...CONFIG };

// Station presets — only names and colors change
const STATIONS = {
  neon:   { name: 'Neon FM',     freq: '103.5', name_c: '#ff3fa4', lcd: '#2de2e6', needle: '#ff8a3d', eqFrom: '#ff6b5b', eqTo: '#ff2e88', bg1: '#1a0b2e', bg2: '#2a0f3d', edge: '#ff3fa4' },
  rock:   { name: 'Thunder Rock', freq: '98.7', name_c: '#ffd166', lcd: '#ffb000', needle: '#ff3b30', eqFrom: '#ff8a00', eqTo: '#e10600', bg1: '#180a08', bg2: '#2b0d0a', edge: '#ff6a00' },
  hiphop: { name: 'Block Party', freq: '105.9', name_c: '#ffd700', lcd: '#b388ff', needle: '#ffd700', eqFrom: '#7c4dff', eqTo: '#ff2e88', bg1: '#120a24', bg2: '#22103a', edge: '#ffd700' },
  lofi:   { name: 'Chill Wave',  freq: '88.1',  name_c: '#d6c6f2', lcd: '#9be7c4', needle: '#ffb4a2', eqFrom: '#a0c4ff', eqTo: '#ffc6ff', bg1: '#141a2e', bg2: '#1f2440', edge: '#a0c4ff' },
};

let current   = { key: null, title: '', artist: '' };
let playing   = false;
let pollTimer = null;

// =====================================================
//   StreamElements
// =====================================================

window.addEventListener('onWidgetLoad', ({ detail }) => {
  if (detail?.fieldData) applyFields(detail.fieldData);
  applyConfig();
});

// =====================================================
//   Settings
// =====================================================

function coerce(key, value) {
  const def = DEFAULTS[key];
  if (typeof def === 'number')  return Number.isFinite(+value) ? +value : def;
  if (typeof def === 'boolean') return value === true || value === 'true' || value === '1' || value === 1;
  return value == null ? def : String(value);
}

function applyFields(f) {
  Object.keys(f || {}).forEach(k => { if (k in DEFAULTS) CONFIG[k] = coerce(k, f[k]); });
  if (CONFIG.hideWhenIdle) CONFIG.idleMode = 'hide';
  if (!['lastfm', 'manual'].includes(CONFIG.source)) CONFIG.source = 'lastfm';
}

function applyUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const f = {};
  params.forEach((v, k) => { f[k] = v; });
  applyFields(f);
  return [...params.keys()].length > 0;
}

const validHex = c => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : '');

function preset() { return STATIONS[CONFIG.station] || STATIONS.neon; }
function stationFreq() {
  const f = parseFloat(String(CONFIG.frequency || preset().freq).replace(',', '.'));
  return Number.isFinite(f) ? Math.min(108, Math.max(88, f)) : 103.5;
}

function applyConfig() {
  const p = preset();
  const r = document.documentElement.style;
  r.setProperty('--name',    validHex(CONFIG.nameColor)   || p.name_c);
  r.setProperty('--lcd',     validHex(CONFIG.lcdColor)    || p.lcd);
  r.setProperty('--needle',  validHex(CONFIG.needleColor) || p.needle);
  r.setProperty('--eq-from', validHex(CONFIG.eqFrom)      || p.eqFrom);
  r.setProperty('--eq-to',   validHex(CONFIG.eqTo)        || p.eqTo);
  r.setProperty('--bg1', p.bg1);
  r.setProperty('--bg2', p.bg2);
  r.setProperty('--edge', p.edge);

  document.getElementById('station').textContent = CONFIG.stationName || p.name;
  document.getElementById('freq').textContent = stationFreq().toFixed(1);
  placeNeedle(stationFreq());
  fitScale();
  startSource();
}

function fitScale() {
  const s = CONFIG.fitToSource ? Math.max(0.2, window.innerWidth / 520) : 1;
  document.documentElement.style.setProperty('--scale', String(s));
}
window.addEventListener('resize', fitScale);

// =====================================================
//   Dial needle
// =====================================================

const needlePos = f => `calc(8px + (100% - 16px) * ${(f - 88) / 20})`;

function placeNeedle(f) {
  document.getElementById('needle').style.left = needlePos(f);
}

// =====================================================
//   Track change: needle sweep + 400 ms radio static, then the new title
// =====================================================

const TUNE_MS = 400;

function showTrack(title, artist, isLast = false) {
  title = String(title || '').trim();
  artist = String(artist || '').trim();
  const key = `${title}␟${artist}␟${isLast}`;
  if (key === current.key) return;
  current = { key, title, artist };
  setPlaying(!!title && !isLast);

  const radio = document.getElementById('radio-widget');
  radio.classList.remove('idle-hidden');
  radio.classList.add('tuning');

  const f = stationFreq();
  const needle = document.getElementById('needle');
  needle.animate([
    { left: needlePos(f) },
    { left: needlePos(88.6), offset: 0.3 },
    { left: needlePos(107.4), offset: 0.75 },
    { left: needlePos(f) },
  ], { duration: TUNE_MS, easing: 'ease-in-out' });

  playStatic();
  runStaticCanvas(TUNE_MS);

  setTimeout(() => {
    setLine('title', title || CONFIG.idleText);
    setLine('artist', title ? (isLast ? `Last played · ${artist}` : artist) : '');
    radio.classList.remove('tuning');
    if (!title && CONFIG.idleMode === 'hide') radio.classList.add('idle-hidden');
    notifyParent('track', { title, artist });
  }, TUNE_MS);
}

// Nothing playing: message, last track played, or hidden (see "idleMode")
function showIdle(last) {
  if (CONFIG.idleMode === 'last' && last && last.title) { showTrack(last.title, last.artist, true); return; }
  if (current.key === '␟␟false') return;
  showTrack('', '');
}

// Long titles scroll (marquee); short ones stay still
function setLine(id, text) {
  const el = document.getElementById(id);
  el.classList.remove('scroll');
  el.style.removeProperty('--shift');
  el.textContent = text;
  requestAnimationFrame(() => {
    const box = el.parentElement.clientWidth;
    const w = el.scrollWidth;
    if (w > box - 4) {
      el.innerHTML = `${esc(text)}<span class="gap"></span>${esc(text)}<span class="gap"></span>`;
      const shift = w + 48;
      el.style.setProperty('--shift', `-${shift}px`);
      el.style.setProperty('--dur', `${Math.max(4, shift / Math.max(10, CONFIG.scrollSpeed)) / 0.88}s`);
      el.classList.add('scroll');
    }
  });
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Visual static (noise) on the LCD and the text area
function runStaticCanvas(ms) {
  const canvases = [...document.querySelectorAll('canvas.static')];
  const end = performance.now() + ms;
  const draw = () => {
    canvases.forEach(c => {
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(c.width, c.height);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() < 0.5 ? 0 : Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = Math.random() < 0.6 ? 200 : 0;
      }
      ctx.putImageData(img, 0, 0);
    });
    if (performance.now() < end) requestAnimationFrame(draw);
  };
  draw();
}

// Radio "crackle": 400 ms of filtered white noise (Web Audio, no file needed)
let audioCtx = null;
function playStatic() {
  if (!CONFIG.staticSound || !(CONFIG.staticVolume > 0)) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const len = Math.floor(audioCtx.sampleRate * TUNE_MS / 1000);
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const crackle = Math.random() < 0.004 ? (Math.random() * 2 - 1) * 3 : 0;   // little pops
      d[i] = (Math.random() * 2 - 1) * 0.55 + crackle;
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const band = audioCtx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(900, audioCtx.currentTime);
    band.frequency.linearRampToValueAtTime(3200, audioCtx.currentTime + TUNE_MS / 1000);   // the "sweep"
    band.Q.value = 0.8;
    const gain = audioCtx.createGain();
    const v = Math.min(1, CONFIG.staticVolume / 100) * 0.6;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(v, audioCtx.currentTime + 0.04);
    gain.gain.setValueAtTime(v, audioCtx.currentTime + TUNE_MS / 1000 - 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + TUNE_MS / 1000);
    src.connect(band).connect(gain).connect(audioCtx.destination);
    src.start();
  } catch (_) { /* audio not allowed: the visual static still plays */ }
}

// =====================================================
//   Equalizer — 12 animated bars (lively while music plays, resting when idle)
// =====================================================

const BARS = 12;
const bars = [];
let eqLevels = new Array(BARS).fill(0.08);

function buildEq() {
  const eq = document.getElementById('eq');
  eq.innerHTML = '';
  for (let i = 0; i < BARS; i++) { const b = document.createElement('i'); eq.appendChild(b); bars.push(b); }
}

function setPlaying(on) { playing = on; }

let lastEq = 0;
function eqLoop(t) {
  if (t - lastEq > 90) {
    lastEq = t;
    const beat = 0.55 + 0.45 * Math.abs(Math.sin(t / 260));
    for (let i = 0; i < BARS; i++) {
      // bass on the left is taller, treble on the right is livelier
      const shape = 1 - Math.abs(i - 3.5) / 11;
      const target = playing ? Math.min(1, (0.25 + Math.random() * 0.75) * shape * beat + 0.08) : 0.06 + Math.random() * 0.04;
      eqLevels[i] += (target - eqLevels[i]) * (playing ? 0.75 : 0.3);
      bars[i].style.height = `${Math.round(eqLevels[i] * 100)}%`;
    }
  }
  requestAnimationFrame(eqLoop);
}

// =====================================================
//   Music sources
// =====================================================

function stopSources() {
  clearInterval(pollTimer);
  pollTimer = null;
}

function status(msg, ok = true) { notifyParent('status', { msg, ok }); }

function startSource() {
  stopSources();

  if (CONFIG.source === 'manual') {
    showTrack(CONFIG.manualTitle, CONFIG.manualArtist);
    status('Manual mode: showing your own text.');
    return;
  }

  if (!CONFIG.lastfmUser || !CONFIG.lastfmKey) { status('Last.fm: add your username and API key.', false); showIdle(); return; }
  const every = Math.max(4, +CONFIG.pollSeconds || 8) * 1000;
  const poll = () => pollLastfm().catch(() => status('Last.fm: no answer right now (internet or Last.fm down). Trying again…', false));
  poll();
  pollTimer = setInterval(poll, every);
}

// Last.fm error codes → plain-English help
const LASTFM_ERRORS = {
  6:  'Last.fm: username not found. Check the spelling of your Last.fm username.',
  10: 'Last.fm: invalid API key. Copy the 32-character "API key" again (not the shared secret).',
  17: 'Last.fm: your listening history is private. Untick "Hide recent listening information" in your Last.fm privacy settings.',
  26: 'Last.fm: this API key was suspended. Create a new one.',
  29: 'Last.fm: too many checks. Raise "Check every" to 8 seconds or more.',
};

// Last.fm — the track marked "now playing" by your scrobbler (Spotify, Web Scrobbler…)
async function pollLastfm() {
  const url = 'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=1&format=json'
    + `&user=${encodeURIComponent(CONFIG.lastfmUser.trim())}&api_key=${encodeURIComponent(CONFIG.lastfmKey.trim())}`;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  if (data.error) { status(LASTFM_ERRORS[data.error] || `Last.fm: ${data.message || 'error'}`, false); showIdle(); return; }
  const tr = [].concat(data?.recenttracks?.track || [])[0];
  const track = tr ? { title: tr.name, artist: tr.artist?.['#text'] || tr.artist?.name || '' } : null;
  if (tr && tr['@attr'] && tr['@attr'].nowplaying === 'true') {
    showTrack(track.title, track.artist);
    status(`Last.fm: now playing for ${CONFIG.lastfmUser}.`);
  } else {
    showIdle(track);
    status(`Last.fm: connected to ${CONFIG.lastfmUser} — nothing playing right now. Start a song and wait a few seconds.`);
  }
}

// =====================================================
//   Configurator bridge
// =====================================================

function notifyParent(type, payload) {
  try { window.parent.postMessage({ type: `radio:${type}`, ...payload }, '*'); } catch (_) {}
}

window.addEventListener('message', ({ data }) => {
  if (!data || typeof data.type !== 'string') return;
  if (data.type === 'cmd:config') { applyFields(data.config || {}); applyConfig(); }
  if (data.type === 'cmd:track')  { showTrack(data.title, data.artist); }
  if (data.type === 'cmd:idle')   { showIdle(); }
});

// =====================================================
//   Boot
// =====================================================

const IS_SE = typeof window.SE_API !== 'undefined' || /streamelements\.com/.test(window.location.href);
const HAS_PARAMS = applyUrlParams();
const DEMO = new URLSearchParams(window.location.search).has('demo');

buildEq();
requestAnimationFrame(eqLoop);

function boot() {
  // Opened by itself with no settings (or ?demo=1): cycle through a few sample tracks
  if (DEMO || (!IS_SE && window === window.top && !HAS_PARAMS)) {
    CONFIG.source = 'manual';
    applyConfig();
    const demo = [
      ['Midnight Drive', 'Vantra Studio'],
      ['Ocean Boulevard Sunset (Extended Night Mix)', 'The Palm Street Collective'],
      ['Neon Heartbeat', 'Laser Coast'],
    ];
    let i = 0;
    setInterval(() => { i = (i + 1) % demo.length; showTrack(...demo[i]); }, 6000);
    showTrack(...demo[0]);
  } else if (!IS_SE) {
    applyConfig();
  }
  notifyParent('ready', {});
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
