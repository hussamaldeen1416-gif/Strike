// ضربة الديرة — main game
import { M4, hex, createRenderer, buildStatic, World, moveBody, STEP } from './engine.js';
import { WEAPONS, PRIMARIES, SECONDARIES, PISTOL, KNIFE, GUNGAME, NADE, CHARS, BOTNAMES, MODES, MAPS, MAPINFO, WSKINS, CSKINS } from './data.js';

// ============================== basics ==============================
const $ = s => document.querySelector(s);
const FAST = Math.max(1, +window.__FAST || 1);
const LSNS = window.__LSNS || '';
const TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0 && matchMedia('(pointer:coarse)').matches);
const T = () => performance.now() / 1000;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = n => Math.floor(Math.random() * n);
const TAU = Math.PI * 2;
const angD = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f​‎‏‪-‮⁦-⁩,|:]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const lsGet = (k, d) => { try { const v = localStorage.getItem(k + LSNS); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k + LSNS, JSON.stringify(v)); } catch (e) { } };
const fmtT = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
let toastT = 0;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }

const SET = Object.assign({ q: TOUCH ? 1 : 2, sens: 1, auto: TOUCH ? 1 : 0, tpp: 0, snd: 1, fps: 0 }, lsGet('ds_set', {}));
const PROF = Object.assign({ name: '', ch: rint(8), pw: 0, sw: 0, csk: {}, wsk: {}, gtab: 'p' }, lsGet('ds_prof', {}));
if (!PROF.csk || typeof PROF.csk !== 'object') PROF.csk = {}; if (!PROF.wsk || typeof PROF.wsk !== 'object') PROF.wsk = {};
PROF.ch = (PROF.ch | 0) % CHARS.length; if (PRIMARIES[PROF.pw] == null) PROF.pw = 0; if (SECONDARIES[PROF.sw] == null) PROF.sw = 0;
const STATS = Object.assign({ k: 0, d: 0, g: 0, w: 0 }, lsGet('ds_stats', {}));
if (!PROF.name) { try { PROF.name = clean(localStorage.getItem('mf_name') || '', 14); } catch (e) { } }
const saveSet = () => lsSet('ds_set', SET), saveProf = () => lsSet('ds_prof', PROF), saveStats = () => lsSet('ds_stats', STATS);

// ============================== renderer ==============================
const cv = $('#cv');
const R = createRenderer(cv, { aa: SET.q >= 2 && !TOUCH, keep: !!window.__KEEP });
const resScale = () => [0.6, Math.min(devicePixelRatio || 1, 1.3), Math.min(devicePixelRatio || 1, 2)][SET.q] || 1;
const LOOK = new Map();
function look(ch, sk) {
  ch = (ch | 0) % CHARS.length; sk = (sk | 0) % CSKINS.length; const key = ch * 100 + sk; let L = LOOK.get(key);
  if (!L) {
    const c = CHARS[ch], o = CSKINS[sk] || CSKINS[0], v = (k, d) => o[k] != null ? o[k] : d;
    L = { ...c, camo: v('camo', c.camo || 0), cs: hex(v('shirt', c.shirt)), cp: hex(v('pants', c.pants)), cv: hex(v('vest', c.vest)), vm: v('vm', 12), ck: hex(c.skin), cb: hex(v('boots', c.boots)), h0: hex(v('h0', c.hc[0])), h1: hex(v('h1', c.hc[1])), bulk: c.bulk || 1 };
    LOOK.set(key, L);
  }
  return L;
}
const myCS = () => (PROF.csk[PROF.ch] | 0);
const myWS = w => (PROF.wsk[w] | 0);
const kills = () => STATS.k | 0;
const TEAMC = [hex(0x4ea8ff), hex(0xff4d5e)];

// ---------- gun models (gun space: x right, y up, -z forward) ----------
const GM = {
  ar: { mz: -0.54, sy: 0.105, p: [[0, 0, 0, .07, .1, .42, 0x2d2f33, 6], [0, .012, -.37, .034, .034, .3, 0x15171a, 6], [0, 0, -.25, .08, .085, .22, 0x3b3e44, 6], [0, -.12, -.06, .05, .17, .085, 0x1f2124, 6], [0, -.095, .085, .045, .12, .06, 0x1f2124, 6], [0, -.012, .31, .06, .1, .22, 0x2d2f33, 6], [0, .075, -.03, .032, .045, .13, 0x111214, 6]] },
  ak: { mz: -0.56, sy: 0.09, p: [[0, 0, 0, .07, .1, .4, 0x2a2a2a, 6], [0, .015, -.38, .032, .032, .32, 0x161616, 6], [0, 0, -.25, .078, .08, .2, 0x8a4f22, 4], [0, -.12, -.05, .05, .18, .08, 0x2b2b2b, 6, .25], [0, -.09, .08, .045, .12, .06, 0x5a3416, 4], [0, -.02, .3, .06, .11, .24, 0x8a4f22, 4], [0, .065, -.18, .02, .03, .03, 0x111111, 6]] },
  smg: { mz: -0.37, sy: 0.095, p: [[0, 0, 0, .065, .095, .3, 0x232527, 6], [0, .01, -.24, .03, .03, .16, 0x111111, 6], [0, -.11, -.05, .04, .16, .06, 0x1a1a1a, 6, .12], [0, -.09, .07, .045, .11, .055, 0x1a1a1a, 6], [0, 0, .2, .05, .07, .14, 0x232527, 6], [0, .07, -.02, .03, .04, .1, 0x111111, 6]] },
  sg: { mz: -0.64, sy: 0.085, p: [[0, 0, 0, .07, .1, .32, 0x2a2a2a, 6], [0, .02, -.4, .045, .045, .46, 0x1a1a1a, 6], [0, -.035, -.32, .065, .06, .2, 0x7a4a24, 4], [0, -.09, .07, .045, .12, .06, 0x5a3416, 4], [0, -.03, .28, .065, .12, .26, 0x7a4a24, 4]] },
  sniper: { mz: -0.8, sy: 0.13, p: [[0, 0, 0, .07, .1, .44, 0x4a5638, 6], [0, .015, -.5, .03, .03, .56, 0x1d1f1a, 6], [0, .1, -.02, .05, .06, .26, 0x111214, 6], [0, .1, -.16, .065, .075, .04, 0x111214, 6], [0, -.09, .08, .045, .12, .06, 0x2a2f24, 6], [0, -.02, .32, .065, .12, .26, 0x4a5638, 6], [0, -.09, -.06, .04, .08, .07, 0x1d1f1a, 6]] },
  lmg: { mz: -0.64, sy: 0.1, p: [[0, 0, 0, .09, .12, .48, 0x33363a, 6], [0, .01, -.44, .045, .045, .36, 0x15171a, 6], [0, -.13, -.04, .13, .13, .14, 0x3d4a2e, 6], [0, -.1, .12, .05, .12, .06, 0x222222, 6], [0, -.01, .34, .07, .11, .22, 0x33363a, 6], [0, .08, -.05, .04, .05, .12, 0x111111, 6], [-.04, -.12, -.5, .02, .18, .02, 0x111111, 6], [.04, -.12, -.5, .02, .18, .02, 0x111111, 6]] },
  dmr: { mz: -0.64, sy: 0.12, p: [[0, 0, 0, .07, .1, .44, 0x8a7a5a, 6], [0, .012, -.42, .032, .032, .38, 0x1a1a1a, 6], [0, .09, -.03, .045, .055, .2, 0x15171a, 6], [0, -.12, -.05, .05, .15, .08, 0x2a2a2a, 6], [0, -.09, .09, .045, .12, .06, 0x2a2a2a, 6], [0, -.01, .32, .06, .1, .22, 0x8a7a5a, 6]] },
  pistol: { mz: -0.13, sy: 0.075, p: [[0, .03, -.02, .04, .05, .2, 0x2a2c30, 6], [0, -.05, .04, .036, .11, .05, 0x1a1a1a, 6, -.2], [0, .06, -.08, .01, .015, .015, 0x111111, 6]] },
  knife: { mz: -0.2, sy: 0.05, p: [[0, 0, .04, .028, .035, .11, 0x1a1a1a, 6], [0, .005, -.1, .008, .035, .2, 0xcfd4da, 6], [0, 0, -.01, .05, .05, .015, 0x444444, 6]] },
  scar: { mz: -0.52, sy: 0.11, p: [[0, 0, 0, .075, .11, .4, 0xb59a6a, 6], [0, .012, -.36, .036, .036, .28, 0x15171a, 6], [0, -.005, -.24, .082, .088, .2, 0xb59a6a, 6], [0, -.11, -.05, .055, .13, .09, 0x1f2124, 6], [0, -.095, .085, .045, .12, .06, 0x1f2124, 6], [0, -.01, .29, .07, .11, .2, 0xb59a6a, 6], [0, .08, -.03, .034, .05, .14, 0x111214, 6]] },
  uzi: { mz: -0.24, sy: 0.085, p: [[0, 0, 0, .07, .11, .24, 0x3a3d42, 6], [0, .02, -.17, .03, .03, .1, 0x111111, 6], [0, -.12, 0, .045, .18, .055, 0x1a1a1a, 6], [0, .07, .02, .02, .03, .12, 0x111111, 6], [0, -.02, .15, .03, .03, .14, 0x55585e, 6]] },
  aug: { mz: -0.47, sy: 0.14, p: [[0, 0, -.05, .075, .12, .5, 0x4f6b3a, 6], [0, .015, -.38, .032, .032, .16, 0x15171a, 6], [0, .1, -.12, .05, .06, .2, 0x1d1f22, 6], [0, -.11, .1, .05, .15, .08, 0x1f2124, 6], [0, -.1, -.12, .04, .12, .05, 0x4f6b3a, 6]] },
  sg2: { mz: -0.62, sy: 0.09, p: [[0, 0, 0, .075, .11, .36, 0x3f4247, 6], [0, .02, -.4, .045, .045, .42, 0x1a1a1a, 6], [0, -.11, -.04, .06, .13, .1, 0x222222, 6], [0, -.09, .09, .045, .12, .06, 0x222222, 6], [0, -.02, .3, .065, .12, .24, 0x3f4247, 6], [0, .075, -.05, .03, .04, .12, 0x111111, 6]] },
  barrett: { mz: -0.94, sy: 0.15, p: [[0, 0, 0, .09, .13, .5, 0x5a5f4a, 6], [0, .015, -.55, .045, .045, .6, 0x1d1f1a, 6], [0, .015, -.88, .08, .06, .08, 0x1d1f1a, 6], [0, .12, -.02, .06, .07, .3, 0x111214, 6], [0, -.12, -.08, .07, .14, .12, 0x2a2f24, 6], [0, -.1, .1, .05, .13, .06, 0x2a2f24, 6], [0, -.02, .38, .075, .13, .26, 0x5a5f4a, 6], [-.05, -.12, -.6, .02, .2, .02, 0x111111, 6], [.05, -.12, -.6, .02, .2, .02, 0x111111, 6]] },
  deagle: { mz: -0.16, sy: 0.085, p: [[0, .035, -.03, .05, .065, .24, 0xb8bcc2, 6], [0, -.055, .05, .045, .12, .06, 0x1a1a1a, 6, -.2], [0, .075, -.12, .012, .02, .02, 0x111111, 6]] },
};
for (const k in GM) GM[k].p.forEach(p => { const c = p[6]; p[6] = hex(c); const l = .3 * p[6][0] + .59 * p[6][1] + .11 * p[6][2]; p[9] = p[7] === 4 ? 1 : l < .12 ? 2 : 0; }); // role: 0 body, 1 furniture, 2 dark parts
const gunOf = w => GM[(WEAPONS[w] || WEAPONS[0]).model] || GM.ar;
const SKINNED = new Map();
function gunParts(w, sk) {
  const g = gunOf(w); sk = (sk | 0) % WSKINS.length; if (!sk) return g.p;
  const key = (WEAPONS[w] || WEAPONS[0]).model + sk; let ps = SKINNED.get(key);
  if (!ps) { const S = WSKINS[sk]; const c1 = hex(S.c1), c2 = hex(S.c2), c3 = S.c3 != null ? hex(S.c3) : null;
    ps = g.p.map(p => { const q = p.slice(); if (p[9] === 0) { q[6] = c1; q[7] = S.m1 || 6; } else if (p[9] === 1) { q[6] = c2; q[7] = S.m2 || 6; } else if (c3) { q[6] = c3; q[7] = S.m3 || 6; } return q; });
    SKINNED.set(key, ps); }
  return ps;
}

// ---------- drawing helpers ----------
const MS = Array.from({ length: 12 }, () => M4.create());
function part(B, parent, x, y, z, sx, sy, sz, c, mat, a, rx, ry) {
  const m = MS[11]; M4.copy(m, parent); M4.tr(m, x, y, z); if (ry) M4.ry(m, ry); if (rx) M4.rx(m, rx); M4.sc(m, sx, sy, sz);
  B.push(m, c[0], c[1], c[2], a == null ? 1 : a, mat == null ? 12 : mat);
}
function drawGun(B, parent, w, sk) {
  const g = gunOf(w);
  for (const p of gunParts(w, sk)) part(B, parent, p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], 1, p[8] || 0);
  return g;
}
// headgear relative to the head center
function drawHead(B, hm, c, deadDark) {
  const sk = c.ck, h0 = c.h0, h1 = c.h1;
  switch (c.head) {
    case 'ghutra':
      part(B, hm, 0, 0, 0, .28, .3, .28, sk); part(B, hm, 0, .1, .01, .32, .13, .32, h0); part(B, hm, -.155, -.02, .03, .03, .3, .28, h0); part(B, hm, .155, -.02, .03, .03, .3, .28, h0);
      part(B, hm, 0, -.03, .155, .32, .32, .04, h0); part(B, hm, 0, -.22, .16, .34, .18, .05, h1); part(B, hm, 0, .155, .015, .34, .04, .34, [0.07, 0.07, 0.08]); break;
    case 'balaclava':
      part(B, hm, 0, 0, 0, .29, .31, .29, h0); part(B, hm, 0, .025, -.146, .22, .055, .01, sk); part(B, hm, 0, .11, -.15, .27, .07, .04, h1, 15); break;
    case 'helmet':
      part(B, hm, 0, 0, 0, .28, .3, .28, sk); part(B, hm, 0, .12, .01, .34, .15, .34, h0, 13); part(B, hm, 0, .055, -.04, .36, .03, .38, h0, 13); part(B, hm, 0, -.1, -.1, .2, .04, .1, h1); break;
    case 'skull':
      part(B, hm, 0, .03, .02, .31, .32, .31, c.cs); part(B, hm, 0, -.01, -.146, .26, .27, .01, h0); part(B, hm, -.06, .03, -.152, .07, .06, .01, h1); part(B, hm, .06, .03, -.152, .07, .06, .01, h1); part(B, hm, 0, -.08, -.152, .12, .03, .01, h1); break;
    case 'beret':
      part(B, hm, 0, 0, 0, .28, .3, .28, sk); part(B, hm, -.02, .165, .01, .31, .06, .3, h0); part(B, hm, .08, .17, -.13, .05, .05, .02, h1, 15); part(B, hm, 0, -.05, -.143, .12, .03, .01, [0.25, 0.15, 0.1]); break;
    case 'cap':
      part(B, hm, 0, 0, 0, .28, .3, .28, sk); part(B, hm, 0, .15, .01, .3, .08, .3, h0); part(B, hm, 0, .125, -.2, .25, .02, .15, h0); part(B, hm, 0, .03, .16, .27, .22, .04, h1); part(B, hm, 0, -.1, .2, .08, .22, .07, h1); break;
    case 'snow':
      part(B, hm, 0, 0, 0, .28, .3, .28, sk); part(B, hm, 0, .11, .01, .34, .17, .34, h0, 13); part(B, hm, 0, .03, -.15, .26, .08, .02, h1, 15); part(B, hm, 0, -.09, -.12, .24, .08, .06, c.cv); break;
    case 'navy':
      part(B, hm, 0, 0, 0, .28, .3, .28, sk); part(B, hm, 0, .12, .01, .33, .14, .33, h0); part(B, hm, 0, .035, -.152, .26, .08, .04, h1, 15); part(B, hm, 0, -.09, -.165, .12, .08, .06, [0.1, 0.1, 0.12]); break;
    case 'hood':
      part(B, hm, 0, 0, 0, .28, .3, .28, sk); part(B, hm, 0, .04, .035, .33, .35, .3, h0, c.camo ? 13 : 12); part(B, hm, -.15, -.02, -.09, .03, .3, .1, h0); part(B, hm, .15, -.02, -.09, .03, .3, .1, h0); part(B, hm, 0, -.12, -.13, .27, .1, .07, h1); break;
    case 'heavy':
      part(B, hm, 0, .03, 0, .37, .37, .37, h0, 6); part(B, hm, 0, .05, -.19, .29, .08, .02, h1, 15); part(B, hm, 0, -.11, -.15, .3, .1, .08, h0, 6); part(B, hm, -.19, .02, 0, .04, .2, .2, [0.18, 0.2, 0.22]); part(B, hm, .19, .02, 0, .04, .2, .2, [0.18, 0.2, 0.22]); break;
    case 'police':
      part(B, hm, 0, 0, 0, .28, .3, .28, sk); part(B, hm, 0, .15, .01, .3, .08, .3, h0); part(B, hm, 0, .115, -.19, .26, .02, .13, [0.05, 0.05, 0.06]); part(B, hm, 0, .165, -.152, .06, .05, .01, h1, 15); part(B, hm, 0, .03, -.146, .22, .045, .01, [0.04, 0.04, 0.05]); break;
    case 'ninja':
      part(B, hm, 0, 0, 0, .29, .31, .29, h0); part(B, hm, 0, .03, -.147, .22, .05, .01, sk); part(B, hm, 0, .085, .0, .31, .04, .31, h1); part(B, hm, .03, .07, .2, .04, .04, .14, h1, 12, 0, .4); part(B, hm, -.03, .06, .2, .04, .04, .12, h1, 12, 0, -.4); break;
    case 'gasmask':
      part(B, hm, 0, 0, 0, .29, .31, .29, c.cp); part(B, hm, 0, -.03, -.15, .22, .19, .04, h0); part(B, hm, 0, -.11, -.2, .1, .1, .08, h1); part(B, hm, -.06, .04, -.172, .07, .07, .01, [0.4, 0.55, 0.6], 15); part(B, hm, .06, .04, -.172, .07, .07, .01, [0.4, 0.55, 0.6], 15); break;
  }
}
// a full soldier. a: {x,y,z,yaw,pitch,ch,w,walk,spd,deadT,alive,team,flash,ads}
function skinOf(a, w) { if (a.me) return myWS(w); if (a.bot) return a.wskAll | 0; return (a.wsMap && a.wsMap[w]) | 0; }
function drawSoldier(B, a, teamMark) {
  const c = look(a.ch, a.me ? myCS() : a.cs), root = MS[0], bk = c.bulk || 1;
  M4.ident(root); M4.tr(root, a.x, a.y, a.z); M4.ry(root, a.yaw);
  const sk = a.alive ? (a.slideK || 0) : 0, lean = 1.05 * sk;
  if (sk > .01) { M4.tr(root, 0, .86 - .5 * sk, 0); M4.rx(root, lean); M4.tr(root, 0, -.86, 0); }
  if (!a.alive) { const k = Math.min(1, (a.deadT || 0) / 0.35); M4.rx(root, k * Math.PI / 2 * 0.96); if ((a.deadT || 0) > 3.2) M4.tr(root, 0, -Math.min(1.2, ((a.deadT || 0) - 3.2) * 0.6), 0); }
  const sw = Math.sin(a.walk || 0) * 0.65 * Math.min(1, a.spd || 0) * (1 - sk), camo = c.camo ? 13 : 12;
  for (const s of [-1, 1]) {
    const lm = MS[1]; M4.copy(lm, root); M4.tr(lm, s * .11, .86, 0); M4.rx(lm, s * sw);
    part(B, lm, 0, -.4, 0, .19, .8, .22, c.cp, camo); part(B, lm, 0, -.8, -.02, .21, .13, .27, c.cb);
  }
  part(B, root, 0, 1.16, 0, .48 * bk, .62, .27 * bk, c.cs, camo);
  part(B, root, 0, 1.18, -.005, .52 * bk, .42, .31 * bk, c.cv, c.vm);
  if (bk > 1.05) { part(B, root, -.33 * bk, 1.38, 0, .2, .12, .3, c.cv, c.vm); part(B, root, .33 * bk, 1.38, 0, .2, .12, .3, c.cv, c.vm); }
  part(B, root, 0, .87, 0, .46, .08, .28, [0.12, 0.1, 0.08]);
  const hm = MS[2]; M4.copy(hm, root); M4.tr(hm, 0, 1.62, 0); M4.rx(hm, (a.pitch || 0) * 0.5 - lean * .6); drawHead(B, hm, c);
  const p = a.alive ? (a.pitch || 0) - lean : 0, aim = Math.PI / 2 + p;
  // arms holding the gun
  const ra = MS[3]; M4.copy(ra, root); M4.tr(ra, .29 * bk, 1.38, 0); M4.ry(ra, 0.18); M4.rx(ra, aim - 0.25);
  part(B, ra, 0, -.24, 0, .14, .5, .14, c.cs, camo); part(B, ra, 0, -.5, 0, .11, .1, .11, c.ck);
  const la = MS[4]; M4.copy(la, root); M4.tr(la, -.29 * bk, 1.38, 0); M4.ry(la, -0.55); M4.rx(la, aim - 0.05);
  part(B, la, 0, -.28, 0, .14, .58, .14, c.cs, camo); part(B, la, 0, -.6, 0, .11, .1, .11, c.ck);
  if (teamMark) part(B, la, 0, -.1, 0, .16, .07, .16, teamMark, 10);
  const gm = MS[5]; M4.copy(gm, root); M4.tr(gm, .1, 1.36, -.12); M4.rx(gm, p); M4.tr(gm, 0, 0, -.22);
  const g = drawGun(B, gm, a.w, a.wsk != null ? a.wsk : skinOf(a, a.w));
  if (a.flash) { const fm = MS[6]; M4.copy(fm, gm); M4.tr(fm, 0, .01, g.mz - .06); M4.ry(fm, Math.random() * 3); M4.sc(fm, .14, .14, .2); R.trans.push(fm, 1, .8, .3, .9, 10); }
  // soft shadow
  if (a.alive) R.trans.box(a.x, a.groundY == null ? a.y + .02 : a.groundY + .02, a.z, 1.0, .01, 1.0, 0, 0, 0, 0, .32, 11);
}

// ============================== audio ==============================
const AU = { ctx: null, out: null, nb: null };
function auInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume().catch(() => { }); return; }
  try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  AU.out = AU.ctx.createGain(); AU.out.gain.value = 0.7; AU.out.connect(AU.ctx.destination);
  const len = AU.ctx.sampleRate; AU.nb = AU.ctx.createBuffer(1, len, AU.ctx.sampleRate); const d = AU.nb.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
}
addEventListener('pointerdown', auInit, { capture: true }); addEventListener('keydown', auInit, { capture: true });
const SND = { scar: [1500, .15, .6, 90], uzi: [2600, .07, .38, 130], aug: [1900, .12, .5, 105], sg2: [1000, .25, .7, 75], barrett: [800, .6, 1, 45], deagle: [1700, .2, .7, 85], ar: [1800, .12, .5, 110], ak: [1300, .15, .55, 95], smg: [2400, .08, .4, 120], sg: [900, .3, .8, 70], sniper: [1100, .45, .9, 60], lmg: [1500, .13, .55, 90], dmr: [1600, .2, .65, 80], pistol: [2200, .1, .45, 130], knife: [3000, .12, .2, 0] };
function auOK() { return SET.snd && AU.ctx && AU.ctx.state === 'running'; }
function noiseHit(t0, f, q, dur, vol, type, pan) {
  const c = AU.ctx, s = c.createBufferSource(); s.buffer = AU.nb; s.loopStart = Math.random() * .5;
  const fl = c.createBiquadFilter(); fl.type = type || 'bandpass'; fl.frequency.value = f; fl.Q.value = q;
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node = g; if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); node = p; }
  s.connect(fl); fl.connect(g); node.connect(AU.out); s.start(t0, Math.random() * .5); s.stop(t0 + dur + .05);
}
function toneHit(t0, f0, f1, dur, vol, type, pan) {
  const c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t0); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .006); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node = g; if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); node = p; }
  o.connect(g); node.connect(AU.out); o.start(t0); o.stop(t0 + dur + .05);
}
function sGun(w, dist, pan) {
  if (!auOK()) return; const s = SND[(WEAPONS[w] || WEAPONS[0]).model] || SND.ar, t0 = AU.ctx.currentTime;
  const att = 1 / (1 + (dist || 0) * 0.07), f = s[0] * (dist > 20 ? 0.6 : 1);
  noiseHit(t0, f, 0.9, s[1] * (1 + (dist || 0) * 0.01), s[2] * att, 'bandpass', pan);
  if (s[3]) toneHit(t0, s[3] * 1.6, s[3] * 0.5, 0.12, s[2] * att * 0.8, 'sine', pan);
}
const sfx = {
  hit() { if (auOK()) toneHit(AU.ctx.currentTime, 1800, 1500, .05, .2, 'square'); },
  head() { if (auOK()) { const t = AU.ctx.currentTime; toneHit(t, 2600, 0, .09, .22, 'triangle'); toneHit(t + .03, 3400, 0, .1, .16, 'triangle'); } },
  kill() { if (auOK()) { const t = AU.ctx.currentTime; toneHit(t, 880, 0, .12, .25, 'triangle'); toneHit(t + .08, 1320, 0, .18, .22, 'triangle'); } },
  hurt() { if (auOK()) { toneHit(AU.ctx.currentTime, 140, 60, .18, .35, 'sine'); noiseHit(AU.ctx.currentTime, 400, .7, .12, .25, 'lowpass'); } },
  reload() { if (auOK()) { const t = AU.ctx.currentTime; noiseHit(t, 3000, 3, .04, .25, 'bandpass'); noiseHit(t + .35, 2400, 3, .05, .28, 'bandpass'); } },
  empty() { if (auOK()) noiseHit(AU.ctx.currentTime, 4000, 5, .03, .2, 'bandpass'); },
  boom(dist, pan) { if (!auOK()) return; const t = AU.ctx.currentTime, a = 1 / (1 + dist * 0.05); noiseHit(t, 300, .6, .9, .9 * a, 'lowpass', pan); toneHit(t, 90, 35, .5, .7 * a, 'sine', pan); },
  swish() { if (auOK()) noiseHit(AU.ctx.currentTime, 2500, 1.5, .15, .25, 'highpass'); },
  slide() { if (auOK()) { const t = AU.ctx.currentTime; noiseHit(t, 700, .6, .55, .35, 'lowpass'); noiseHit(t, 2200, 1, .3, .12, 'bandpass'); } },
  step() { if (auOK()) noiseHit(AU.ctx.currentTime, 250, 1, .06, .12, 'lowpass'); },
  throw() { if (auOK()) noiseHit(AU.ctx.currentTime, 1200, 1, .2, .2, 'bandpass'); },
  start() { if (auOK()) { const t = AU.ctx.currentTime; [440, 554, 659].forEach((f, i) => toneHit(t + i * .12, f, 0, .25, .2, 'sawtooth')); } },
  win() { if (auOK()) { const t = AU.ctx.currentTime; [523, 659, 784, 1046].forEach((f, i) => toneHit(t + i * .13, f, 0, .3, .2, 'triangle')); } },
  lose() { if (auOK()) { const t = AU.ctx.currentTime; [392, 330, 262].forEach((f, i) => toneHit(t + i * .2, f, 0, .4, .2, 'triangle')); } },
  click() { if (auOK()) toneHit(AU.ctx.currentTime, 900, 0, .04, .12, 'sine'); },
};

// ============================== state ==============================
const P = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r: .35, h: 1.75, onG: true, yaw: 0, pitch: 0, hp: 100, alive: false, life: 0, deadAt: 0, killer: '', kw: 0, kh: 0, slots: [], slot: 0, nextShot: 0, reloadEnd: 0, reloadStart: 0, switchEnd: 0, ads: 0, bloom: 0, kick: 0, nades: NADE.n, meleeEnd: 0, meleeStart: -9, lastDmg: -99, prot: 0, k: 0, d: 0, streak: 0, gs: 0, eyeH: 1.6, slideT: 0, slideDur: .8, slideV: 0, slideDx: 0, slideDz: 0, slideCd: 0, slideK: 0, firing: false, sprint: false, bob: 0, firedAt: -9, stepT: 0, tpp: !!SET.tpp, walk: 0, spd: 0, autoT: 0, aimId: null, aimT: 0 };
const G = {
  scr: 'boot', room: null, host: false, hostPeer: null, M: null, mapIdx: -1, map: null, W: null, wps: [], mini: null,
  actors: new Map(), bots: [], events: [], evSeq: 0, evDirty: false, lastSeq: new Map(), nextPub: 0, pub: {},
  peers: [], peersDirty: false, feed: [], matchId: -1, inMatch: false, hostSeen: 0, tally: {}, nextBotPub: 0, endShown: -1,
  ov: null, board: false, paused: false, uavUntil: 0, lastHit: 0, shake: 0,
};
let NET = null, netState = 'connecting', netWhy = '';
const meId = () => G.room ? G.room.id : 'me';
const myTeam = () => (G.M && G.M.T && G.M.T[meId()] != null) ? G.M.T[meId()] : 0;
const isTeams = () => !!(G.M && MODES[G.M.mode] && MODES[G.M.mode].teams);
const enemyOf = (a, b) => a !== b && (!isTeams() || a.team !== b.team);

// ============================== effects ==============================
const FX = { parts: [], tracers: [], nades: [], booms: [], holes: [] };
function addTracer(x0, y0, z0, x1, y1, z1, kind) { if (FX.tracers.length > 80) FX.tracers.shift(); FX.tracers.push({ x0, y0, z0, x1, y1, z1, life: .07, k: kind || 0 }); }
function addParts(x, y, z, n, col, spd, life, size, grav, up) {
  for (let i = 0; i < n; i++) { if (FX.parts.length > 400) FX.parts.shift(); FX.parts.push({ x, y, z, vx: rnd(-1, 1) * spd, vy: rnd(-.3, 1) * spd + (up || 0), vz: rnd(-1, 1) * spd, life: life * rnd(.6, 1), max: life, s: size * rnd(.6, 1.2), c: col, g: grav == null ? 9 : grav }); }
}
function addHole(x, y, z, n) { if (FX.holes.length > 70) FX.holes.shift(); FX.holes.push({ x: x + n[0] * .01, y: y + n[1] * .01, z: z + n[2] * .01, n: n.slice(), life: 12 }); }
const DUST = [0.75, 0.68, 0.55], BLOOD = [0.55, 0.05, 0.05], SPARK = [1, 0.85, 0.4];
function boom(x, y, z) {
  FX.booms.push({ x, y, z, t: 0 });
  addParts(x, y + .3, z, 26, [1, .55, .15], 7, .6, .22, 4, 2); addParts(x, y + .3, z, 18, [0.25, 0.23, 0.22], 3, 1.4, .5, -0.6, 1.5);
  const d = Math.hypot(x - P.x, y - P.y, z - P.z); G.shake = Math.max(G.shake, clamp(1.2 - d / 12, 0, 1)); sfx.boom(d, panOf(x, z));
}
function panOf(x, z) { const dx = x - P.x, dz = z - P.z, L = Math.hypot(dx, dz) || 1; const rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw); return (dx * rx + dz * rz) / L * 0.8; }
function updateFX(dt) {
  for (let i = FX.parts.length - 1; i >= 0; i--) { const p = FX.parts[i]; p.life -= dt; if (p.life <= 0) { FX.parts.splice(i, 1); continue; } p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.y < 0.02 && p.g > 0) { p.y = .02; p.vy *= -.3; p.vx *= .6; p.vz *= .6; } }
  for (let i = FX.tracers.length - 1; i >= 0; i--) { FX.tracers[i].life -= dt; if (FX.tracers[i].life <= 0) FX.tracers.splice(i, 1); }
  for (let i = FX.holes.length - 1; i >= 0; i--) { FX.holes[i].life -= dt; if (FX.holes[i].life <= 0) FX.holes.splice(i, 1); }
  for (let i = FX.booms.length - 1; i >= 0; i--) { FX.booms[i].t += dt; if (FX.booms[i].t > .5) FX.booms.splice(i, 1); }
  // grenades
  for (let i = FX.nades.length - 1; i >= 0; i--) {
    const n = FX.nades[i]; n.t += dt;
    if (n.t >= NADE.fuse) { FX.nades.splice(i, 1); boom(n.x, n.y, n.z); if (n.own) nadeDamage(n); continue; }
    const W = G.W; if (!W) continue; n.vy -= 20 * dt;
    for (const ax of [0, 1, 2]) {
      const v = ax === 0 ? n.vx : ax === 1 ? n.vy : n.vz, ox = n.x, oy = n.y, oz = n.z;
      if (ax === 0) n.x += v * dt; else if (ax === 1) n.y += v * dt; else n.z += v * dt;
      const inside = n.y < .08 || !W.freeAt(n.x, n.z, .08, n.y - .08, .16);
      if (inside) { n.x = ox; n.y = oy; n.z = oz; if (ax === 0) n.vx *= -.4; else if (ax === 1) { n.vy *= -.35; n.vx *= .7; n.vz *= .7; } else n.vz *= -.4; }
    }
  }
}
const MT = M4.create();
function drawFX() {
  const B = R.trans;
  for (const p of FX.parts) { const a = clamp(p.life / p.max, 0, 1); R.opaque.box(p.x, p.y, p.z, p.s, p.s, p.s, p.x * 3, p.c[0], p.c[1], p.c[2], 1, 10); if (a < 0) B.box(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10); }
  for (const t of FX.tracers) {
    const dx = t.x1 - t.x0, dy = t.y1 - t.y0, dz = t.z1 - t.z0, L = Math.hypot(dx, dy, dz); if (L < .3) continue;
    M4.ident(MT); M4.tr(MT, (t.x0 + t.x1) / 2, (t.y0 + t.y1) / 2, (t.z0 + t.z1) / 2); M4.ry(MT, Math.atan2(-dx, -dz)); M4.rx(MT, Math.asin(clamp(dy / L, -1, 1))); M4.sc(MT, .025, .025, L);
    B.push(MT, 1, .9, .55, clamp(t.life / .07, 0, 1) * .75, 10);
  }
  for (const h of FX.holes) { const a = Math.min(1, h.life / 2) * .8, n = h.n; B.box(h.x, h.y, h.z, n[0] ? .01 : .1, n[1] ? .01 : .1, n[2] ? .01 : .1, 0, .05, .05, .05, a, 10); }
  for (const n of FX.nades) { R.opaque.box(n.x, n.y, n.z, .12, .14, .12, n.t * 9, .2, .28, .16, 1, 6); }
  for (const b of FX.booms) { const k = b.t / .5, s = 1 + k * 5; B.box(b.x, b.y + .6, b.z, s, s * .8, s, k * 2, 1, .6 - k * .4, .15, (1 - k) * .85, 10); B.box(b.x, .03, b.z, s * 1.2, .01, s * 1.2, 0, .05, .04, .03, (1 - k) * .6, 11); }
}

// ============================== maps ==============================
function loadMap(idx) {
  if (G.mapIdx === idx && G.W) return;
  const m = MAPS[idx](); G.map = m; G.mapIdx = idx;
  R.setStatic(buildStatic(m.boxes)); Object.assign(R.env, m.theme);
  G.W = new World(m.boxes, m.bounds);
  // bot waypoints: open ground spots
  const b = m.bounds; G.wps = [];
  for (let x = b[0] + 1.5; x <= b[2] - 1.5; x += 2.5) for (let z = b[1] + 1.5; z <= b[3] - 1.5; z += 2.5) if (G.W.freeAt(x, z, .55) && G.W.groundAt(x, z, .5, .5) < .3) G.wps.push([x, z]);
  // minimap texture
  const sc = 4, w = (b[2] - b[0]) * sc, h = (b[3] - b[1]) * sc, c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.fillStyle = 'rgba(60,66,74,.55)'; x.fillRect(0, 0, w, h);
  const boxes = m.boxes.filter(q => !q.nc && !q.rot).sort((p, q) => p.y1 - q.y1);
  for (const q of boxes) { const hh = q.y1; x.fillStyle = hh > 2.4 ? 'rgba(225,230,235,.85)' : hh > 1 ? 'rgba(170,176,184,.8)' : 'rgba(120,126,134,.7)'; x.fillRect((q.x0 - b[0]) * sc, (q.z0 - b[1]) * sc, (q.x1 - q.x0) * sc, (q.z1 - q.z0) * sc); }
  G.mini = { c, sc, b };
}
function spawnPoint(team, forBot) {
  const m = G.map; let list = isTeams() ? (team === 0 ? m.spawns.a : m.spawns.b) : [...m.spawns.a, ...m.spawns.b, ...m.extra];
  let best = null, bs = -1;
  for (const s of list) {
    let md = 99;
    for (const a of G.actors.values()) { if (!a.alive || a.id === (forBot || meId())) continue; const d = Math.hypot(a.x - s[0], a.z - s[1]); if (d < 1.2) { md = -1; break; } if (isTeams() ? a.team !== team : true) md = Math.min(md, d); }
    const sc = md + rnd(0, 6); if (sc > bs) { bs = sc; best = s; }
  }
  best = best || list[0];
  const yawTo = Math.atan2(best[0], best[1]); // face the middle
  return { x: best[0] + rnd(-.4, .4), z: best[1] + rnd(-.4, .4), yaw: yawTo };
}

// ============================== actors ==============================
function getActor(id) { return G.actors.get(id); }
function mkActor(id, o) {
  let a = G.actors.get(id);
  if (!a) {
    a = { id, name: '', ch: 0, team: 0, bot: false, me: false, x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, alive: false, hp: 100, w: 0, flags: 0, life: 0, k: 0, d: 0, gs: 0, walk: 0, spd: 0, deadT: 9, fireAcc: 0, lastFire: -9, firedAt: -9, tag: null, seen: false, lastSnd: 0, groundY: 0 };
    G.actors.set(id, a);
  }
  Object.assign(a, o || {}); return a;
}
function removeActor(id) { const a = G.actors.get(id); if (!a) return; if (a.tag) a.tag.remove(); G.actors.delete(id); }
function stateStr() {
  const f = (P.alive ? 1 : 0) | (P.firing && T() - P.firedAt < .12 ? 2 : 0) | (P.ads > .5 ? 4 : 0) | (P.sprint ? 8 : 0) | (T() < P.reloadEnd ? 16 : 0) | (P.onG ? 32 : 0) | (P.spd > .5 ? 64 : 0) | (T() < P.meleeEnd ? 128 : 0) | (P.slideT > 0 || P.h < 1.5 ? 256 : 0);
  return [P.x.toFixed(2), P.y.toFixed(2), P.z.toFixed(2), P.yaw.toFixed(3), P.pitch.toFixed(3), f, curW(), Math.ceil(P.hp), P.life].join(',');
}
function applyState(a, s) {
  if (typeof s !== 'string') return; const v = s.split(','); if (v.length < 9) return;
  const wasAlive = a.alive, ox = a.tx, oz = a.tz;
  a.tx = +v[0]; a.ty = +v[1]; a.tz = +v[2]; a.tyaw = +v[3]; a.tpitch = +v[4]; a.flags = +v[5] | 0; a.w = +v[6] | 0; a.hp = +v[7]; a.life = +v[8] | 0;
  a.alive = !!(a.flags & 1);
  if (!a.seen || (a.alive && !wasAlive) || Math.hypot(a.tx - a.x, a.tz - a.z) > 6) { a.x = a.tx; a.y = a.ty; a.z = a.tz; a.yaw = a.tyaw; a.pitch = a.tpitch; }
  if (wasAlive && !a.alive) a.deadT = 0;
  if (a.alive) a.deadT = 9;
  a.seen = true;
}
function updateActors(dt) {
  const k = 1 - Math.exp(-dt * 14), t = T();
  for (const a of G.actors.values()) {
    if (a.me) continue;
    if (!a.botLocal) {
      const px = a.x, pz = a.z;
      a.x += (a.tx - a.x) * k; a.y += (a.ty - a.y) * k; a.z += (a.tz - a.z) * k;
      a.yaw += angD(a.yaw, a.tyaw) * k; a.pitch += (a.tpitch - a.pitch) * k;
      const sp = Math.hypot(a.x - px, a.z - pz) / Math.max(dt, 1e-3); a.spd = lerp(a.spd, clamp(sp / 5, 0, 1.4), .2);
    }
    a.walk += dt * 9 * Math.min(1.3, a.spd + .05);
    a.slideK = lerp(a.slideK || 0, (a.flags & 256) ? 1 : 0, Math.min(1, dt * 12));
    if (!a.alive) a.deadT += dt;
    // cosmetic fire of others (and of local bots)
    a.flash = false;
    if (a.alive && (a.flags & 2)) {
      const W = WEAPONS[a.w] || WEAPONS[0]; a.fireAcc += dt;
      const iv = 60 / (W.rpm || 600);
      if (a.fireAcc >= iv || t - a.lastFire > iv * 1.5) { a.fireAcc = 0; a.lastFire = t; cosmeticShot(a, W); }
      a.flash = t - a.lastFire < .05;
    }
    if (G.W) a.groundY = G.W.groundAt(a.x, a.z, .25, a.y + .3);
  }
}
const _o = [0, 0, 0];
function cosmeticShot(a, W) {
  if (W.melee) { if (t0snd(a)) sfx.swish(); return; }
  const cp = Math.cos(a.pitch), dx = -Math.sin(a.yaw) * cp, dy = Math.sin(a.pitch), dz = -Math.cos(a.yaw) * cp;
  const ox = a.x + dx * .7 + Math.cos(a.yaw) * .1, oy = a.y + 1.42 + dy * .7, oz = a.z + dz * .7 - Math.sin(a.yaw) * .1;
  const sp = (W.hip || 2) * .4 * Math.PI / 180;
  const ex = dx + rnd(-sp, sp), ey = dy + rnd(-sp, sp), ez = dz + rnd(-sp, sp);
  let tt = G.W ? G.W.rayG(ox, oy, oz, ex, ey, ez, 70) : 70; if (tt === Infinity) tt = 70;
  addTracer(ox, oy, oz, ox + ex * tt, oy + ey * tt, oz + ez * tt);
  if (tt < 70) addParts(ox + ex * tt, oy + ey * tt, oz + ez * tt, 2, DUST, 1.5, .3, .05);
  const d = Math.hypot(a.x - P.x, a.z - P.z);
  if (t0snd(a)) sGun(a.w, d, panOf(a.x, a.z));
}
function t0snd(a) { const t = T(); if (t - a.lastSnd < .045) return false; a.lastSnd = t; return true; }

// ============================== weapons / local player ==============================
function curW() { const s = P.slots[P.slot]; return s ? s.w : 0; }
function curS() { return P.slots[P.slot]; }
function loadout() {
  if (G.M && MODES[G.M.mode].id === 'gun') { const w = GUNGAME[Math.min(P.gs, GUNGAME.length - 1)]; return [{ w, mag: WEAPONS[w].mag, res: WEAPONS[w].res }]; }
  const pw = PRIMARIES[PROF.pw] != null ? PRIMARIES[PROF.pw] : 0;
  const sw = SECONDARIES[PROF.sw] != null ? SECONDARIES[PROF.sw] : PISTOL;
  return [{ w: pw, mag: WEAPONS[pw].mag, res: WEAPONS[pw].res }, { w: sw, mag: WEAPONS[sw].mag, res: WEAPONS[sw].res }];
}
function spawnMe() {
  const sp = spawnPoint(myTeam());
  Object.assign(P, { x: sp.x, y: 0, z: sp.z, vx: 0, vy: 0, vz: 0, yaw: sp.yaw, pitch: 0, hp: 100, alive: true, onG: true, h: 1.75, eyeH: 1.6, slideT: 0, slideK: 0, slots: loadout(), slot: 0, nextShot: 0, reloadEnd: 0, switchEnd: 0, ads: 0, bloom: 0, nades: NADE.n, prot: T() + 1.6, lastDmg: -99, streak: 0, meleeEnd: 0 });
  P.y = G.W.groundAt(P.x, P.z, P.r, 50);
  P.life++;
  const me = mkActor(meId(), { me: true }); me.alive = true;
  closeOv('death'); G.pub.s = '';
}
function giveGun(stage) { const w = GUNGAME[Math.min(stage, GUNGAME.length - 1)]; P.slots = [{ w, mag: WEAPONS[w].mag, res: WEAPONS[w].res }]; P.slot = 0; P.reloadEnd = 0; P.switchEnd = T() + .35; }

const IN = { mx: 0, mz: 0, fire: false, ads: false, adsT: false, sprint: false, slide: 0, jump: 0, reload: 0, swap: 0, nade: 0, knife: 0, keys: {}, joy: null, look: null, fireTouch: new Set() };
function eyePos(out) { out[0] = P.x; out[1] = P.y + P.eyeH; out[2] = P.z; return out; }
function trySlide() {
  const sp = Math.hypot(P.vx, P.vz), t = T();
  if (!P.alive || !P.onG || P.slideT > 0 || t < P.slideCd) return;
  if (sp < 3) { if (t > (P.slideHint || 0)) { P.slideHint = t + 4; toast('🛝 اركض أول وبعدين زحلق'); } return; }
  P.slideDur = P.slideT = .8; P.slideV = Math.max(sp, 7.5) * 1.3; P.slideDx = P.vx / sp; P.slideDz = P.vz / sp; P.h = 1.1; P.sprint = false; P.ads = Math.min(P.ads, .4);
  sfx.slide();
}
function endSlide() { if (P.slideT > 0) { P.slideT = 0; P.slideCd = T() + .35; } }
function fwd(yaw, pitch, out) { const cp = Math.cos(pitch); out[0] = -Math.sin(yaw) * cp; out[1] = Math.sin(pitch); out[2] = -Math.cos(yaw) * cp; return out; }
// ray against soldiers' hitboxes
function rayActors(ox, oy, oz, dx, dy, dz, maxT, skip) {
  let best = maxT, hit = null, head = false;
  for (const a of G.actors.values()) {
    if (!a.alive || a.id === skip) continue;
    if (skip === meId() && isTeams() && a.team === myTeam() && !a.me) continue;
    for (let h = 0; h < 2; h++) {
      const lo = (a.slideK || 0) > .5;
      const x0 = a.x - (h ? .17 : .32), x1 = a.x + (h ? .17 : .32), y0 = a.y + (h ? (lo ? .55 : 1.45) : 0), y1 = a.y + (h ? (lo ? .95 : 1.82) : (lo ? .9 : 1.45)), z0 = a.z - (h ? .17 : .32), z1 = a.z + (h ? .17 : .32);
      let t1 = (x0 - ox) / dx, t2 = (x1 - ox) / dx, tn = Math.min(t1, t2), tf = Math.max(t1, t2);
      t1 = (y0 - oy) / dy; t2 = (y1 - oy) / dy; tn = Math.max(tn, Math.min(t1, t2)); tf = Math.min(tf, Math.max(t1, t2));
      t1 = (z0 - oz) / dz; t2 = (z1 - oz) / dz; tn = Math.max(tn, Math.min(t1, t2)); tf = Math.min(tf, Math.max(t1, t2));
      if (tf >= tn && tf > 0 && tn < best) { best = Math.max(tn, 0); hit = a; head = h === 1; }
    }
  }
  return hit ? { t: best, a: hit, head } : null;
}
const _e = [0, 0, 0], _f = [0, 0, 0];
function falloff(W, d) { return d <= W.r0 ? 1 : d >= W.r1 ? W.dmin : lerp(1, W.dmin, (d - W.r0) / (W.r1 - W.r0)); }
function camAim(out) { // origin+dir of the aim ray (camera center)
  eyePos(_e); fwd(P.yaw, P.pitch, _f); out.ox = _e[0]; out.oy = _e[1]; out.oz = _e[2]; out.dx = _f[0]; out.dy = _f[1]; out.dz = _f[2]; return out;
}
const AIM = {};
function shoot() {
  const W = WEAPONS[curW()], t = T();
  camAim(AIM);
  const moving = P.spd > .3, air = !P.onG;
  const cone = (lerp(W.hip, W.ads, P.ads) * (moving ? 1.25 : 1) * (air ? 1.8 : 1) + P.bloom) * Math.PI / 180;
  const pel = W.pel || 1, hits = new Map(); let anyHead = false;
  const mx = AIM.ox + AIM.dx * .6 + Math.cos(P.yaw) * .14 - AIM.dy * 0, my = AIM.oy - .12, mz = AIM.oz + AIM.dz * .6 - Math.sin(P.yaw) * .14;
  for (let i = 0; i < pel; i++) {
    // random direction inside the cone
    const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * Math.tan(cone);
    const rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw), ux = -AIM.dy * rz * 0 + Math.sin(P.pitch) * Math.sin(P.yaw), uy = Math.cos(P.pitch), uz = Math.sin(P.pitch) * Math.cos(P.yaw);
    let dx = AIM.dx + (rx * Math.cos(a) + ux * Math.sin(a)) * r, dy = AIM.dy + uy * Math.sin(a) * r, dz = AIM.dz + (rz * Math.cos(a) + uz * Math.sin(a)) * r;
    const L = Math.hypot(dx, dy, dz); dx /= L; dy /= L; dz /= L;
    let tw = G.W.rayG(AIM.ox, AIM.oy, AIM.oz, dx, dy, dz, 160); const wn = G.W.hn.slice();
    const h = rayActors(AIM.ox, AIM.oy, AIM.oz, dx, dy, dz, tw, meId());
    const te = h ? h.t : tw;
    const ex = AIM.ox + dx * Math.min(te, 160), ey = AIM.oy + dy * Math.min(te, 160), ez = AIM.oz + dz * Math.min(te, 160);
    if (i < 3 || pel === 1) addTracer(P.tpp ? P.x + Math.cos(P.yaw) * .1 - Math.sin(P.yaw) * .7 : mx, P.tpp ? P.y + 1.42 : my, P.tpp ? P.z - Math.sin(P.yaw) * .1 - Math.cos(P.yaw) * .7 : mz, ex, ey, ez);
    if (h) {
      const dmg = W.dmg * falloff(W, h.t) * (h.head ? W.hm : 1);
      const prev = hits.get(h.a.id) || { a: h.a, dmg: 0, head: false }; prev.dmg += dmg; prev.head = prev.head || h.head; hits.set(h.a.id, prev);
      addParts(ex, ey, ez, 5, BLOOD, 2.2, .45, .07); anyHead = anyHead || h.head;
    } else if (tw < 160) { addParts(ex, ey, ez, 4, DUST, 2.5, .4, .06); addHole(ex, ey, ez, wn); if (Math.random() < .3) addParts(ex, ey, ez, 2, SPARK, 3, .15, .03, 0); }
  }
  for (const v of hits.values()) dealDamage(v.a, Math.round(v.dmg), curW(), v.head);
  if (hits.size) hitMarker(anyHead ? 'head' : '');
  sGun(curW(), 0, 0);
  P.firedAt = t; P.bloom = Math.min(P.bloom + W.rec * .35, 5); P.kick = Math.min(1, P.kick + .5 + W.rec * .15);
  const rk = W.rec * (P.ads > .5 ? .55 : 1) * .012; P.pitch = clamp(P.pitch + rk * (0.8 + Math.random() * .4), -1.45, 1.45); P.yaw += rnd(-rk, rk) * .6;
}
function melee() {
  const t = T(); if (t < P.meleeEnd) return; P.meleeEnd = t + .55; P.meleeStart = t; sfx.swish();
  camAim(AIM);
  let best = null, bd = 2.6;
  for (const a of G.actors.values()) {
    if (!a.alive || a.me || !enemyOf(meA(), a)) continue;
    const dx = a.x - P.x, dz = a.z - P.z, dy = (a.y + 1) - (P.y + 1), d = Math.hypot(dx, dz, dy * .5); if (d > bd) continue;
    const dot = (dx * AIM.dx + dz * AIM.dz) / (Math.hypot(dx, dz) || 1); if (dot < .55) continue;
    if (!G.W.clear(P.x, P.y + 1.2, P.z, a.x, a.y + 1.2, a.z)) continue;
    best = a; bd = d;
  }
  if (best) { dealDamage(best, 100, KNIFE, false); hitMarker(''); addParts(best.x, best.y + 1.2, best.z, 8, BLOOD, 2, .5, .08); }
}
function throwNade() {
  if (P.nades <= 0 || !P.alive) return; P.nades--; sfx.throw();
  camAim(AIM); const sp = 15;
  const n = [+(AIM.ox + AIM.dx * .5).toFixed(2), +(AIM.oy + AIM.dy * .5).toFixed(2), +(AIM.oz + AIM.dz * .5).toFixed(2), +(AIM.dx * sp + P.vx * .5).toFixed(2), +(AIM.dy * sp + 3.5).toFixed(2), +(AIM.dz * sp + P.vz * .5).toFixed(2)];
  emit(['g', ...n]);
}
function nadeDamage(n) {
  for (const a of G.actors.values()) {
    if (!a.alive) continue;
    if (!a.me && isTeams() && a.team === myTeam() && !a.me) continue;
    const ax = a.me ? P.x : a.x, ay = a.me ? P.y : a.y, az = a.me ? P.z : a.z;
    const d = Math.hypot(ax - n.x, ay + .9 - n.y, az - n.z); if (d > NADE.rad) continue;
    if (!G.W.clear(n.x, n.y + .2, n.z, ax, ay + 1, az)) continue;
    const dmg = Math.round(NADE.dmg * (1 - d / NADE.rad) + 10);
    if (a.me) applyDamage(dmg, meId(), 9, false); else dealDamage(a, dmg, 9, false);
  }
}
function meA() { return G.actors.get(meId()) || { id: meId(), team: myTeam() }; }
// I hit actor a
function dealDamage(a, dmg, w, head) {
  if (a.me) return;
  if (a.bot) { if (G.host) botDamage(a, dmg, meId(), w, head); else emit(['h', a.id, dmg, head ? 1 : 0, w, a.life]); }
  else emit(['h', a.id, dmg, head ? 1 : 0, w, a.life]);
  if (head) sfx.head(); else sfx.hit();
  P.aimId = a.id; P.aimT = T();
}
function hitMarker(kind) { const h = $('#hm'); h.className = 'show ' + (kind || ''); clearTimeout(hitMarker.t); hitMarker.t = setTimeout(() => { h.className = kind === 'kill' ? '' : ''; }, 120); }
// someone hit me
function applyDamage(dmg, from, w, head) {
  const t = T(); if (!P.alive || t < P.prot) return;
  P.hp -= dmg; P.lastDmg = t; sfx.hurt();
  const src = G.actors.get(from); if (src && from !== meId()) dmgDir(src.x, src.z);
  if (P.hp <= 0) die(from, w, head);
}
function die(killer, w, head) {
  if (!P.alive) return;
  P.alive = false; P.hp = 0; P.deadAt = T(); P.killer = killer; P.kw = w; P.kh = head; P.d++; P.streak = 0; P.ads = 0; G.board = false; IN.fire = false; IN.fireTouch.clear();
  STATS.d++; saveStats();
  const me = meA(); if (me) { me.alive = false; me.deadT = 0; me.x = P.x; me.y = P.y; me.z = P.z; me.yaw = P.yaw; }
  emit(['d', killer, w, head ? 1 : 0]);
  if (document.pointerLockElement) document.exitPointerLock();
  showDeath();
}
function respawnReady() { return !P.alive && T() - P.deadAt >= 3 / FAST; }

function playerUpdate(dt) {
  const t = T(), W = WEAPONS[curW()] || WEAPONS[0], S = curS();
  // look (mouse/touch deltas already applied); clamp pitch
  P.pitch = clamp(P.pitch, -1.45, 1.45);
  if (!P.alive) { P.firing = false; return; }
  const ws = G.W;
  // inputs
  let mx = IN.mx, mz = IN.mz; const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
  const wantSprint = (IN.sprint || (TOUCH && IN.joy && IN.joy.mag > .92 && mz < -.6)) && mz < -.3;
  const reloading = t < P.reloadEnd, switching = t < P.switchEnd;
  if (IN.slide) { IN.slide = 0; trySlide(); }
  const sliding = P.slideT > 0;
  P.sprint = !sliding && wantSprint && !IN.fire && P.ads < .3 && !reloading && t > P.firedAt + .25;
  const adsWant = (IN.ads || IN.adsT) && !P.sprint && !W.melee && !switching;
  P.ads = clamp(P.ads + (adsWant ? 7 : -7) * dt, 0, 1);
  // movement
  const spd = 5.2 * W.spd * (P.sprint ? 1.45 : 1) * (P.ads > .5 ? .62 : 1);
  const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
  const tvx = (fx * -mz + rx * mx) * spd, tvz = (fz * -mz + rz * mx) * spd;
  if (sliding) {
    P.slideT -= dt; const k = Math.exp(-(P.slideDur - P.slideT) * 2.2), v = Math.max(2.6, P.slideV * k);
    P.vx = P.slideDx * v; P.vz = P.slideDz * v;
    if (Math.random() < dt * 25) addParts(P.x - P.slideDx * .3, P.y + .05, P.z - P.slideDz * .3, 1, DUST, 1, .35, .09, 2);
    if (P.slideT <= 0 || !P.onG) endSlide();
  } else { const acc = P.onG ? 14 : 3; P.vx = lerp(P.vx, tvx, Math.min(1, acc * dt)); P.vz = lerp(P.vz, tvz, Math.min(1, acc * dt)); }
  // stand up again when there is headroom
  if (P.slideT <= 0 && P.h < 1.75) { const c = ws.ceilAt(P.x, P.z, P.r * .7, P.y + 1.1); if (c >= P.y + 1.78) P.h = 1.75; }
  P.eyeH = lerp(P.eyeH, P.h < 1.5 ? .95 : 1.6, Math.min(1, dt * 12)); P.slideK = lerp(P.slideK, P.slideT > 0 || P.h < 1.5 ? 1 : 0, Math.min(1, dt * 12));
  if (IN.jump && P.onG) { if (P.slideT > 0) { endSlide(); const c = ws.ceilAt(P.x, P.z, P.r * .7, P.y + 1.1); if (c >= P.y + 1.78) P.h = 1.75; } P.vy = 7.2; P.onG = false; }
  IN.jump = 0;
  const wasG = P.onG, vyBefore = P.vy;
  moveBody(ws, P, dt);
  if (!wasG && P.onG && vyBefore < -6) sfx.step();
  if (P.y < -5) { P.hp = 0; die(meId(), 9, false); return; }
  const sp = Math.hypot(P.vx, P.vz); P.spd = sp / 5.2; P.walk += dt * 9 * Math.min(1.4, P.spd);
  if (P.onG && sp > 1 && P.slideT <= 0) { P.stepT -= dt * sp; if (P.stepT <= 0) { P.stepT = 2.2; sfx.step(); } }
  P.bob += dt * sp * 1.9;
  // weapon actions
  P.bloom = Math.max(0, P.bloom - dt * 6); P.kick = Math.max(0, P.kick - dt * 8);
  if (IN.swap) { IN.swap = 0; if (P.slots.length > 1 && !switching) { P.slot = 1 - P.slot; P.switchEnd = t + .4; P.reloadEnd = 0; sfx.click(); } }
  if (IN.reload) { IN.reload = 0; startReload(); }
  if (IN.nade) { IN.nade = 0; throwNade(); }
  if (IN.knife) { IN.knife = 0; melee(); }
  if (reloading && t >= P.reloadEnd - 1e-3) { }
  if (P.reloadEnd && t >= P.reloadEnd && S) { const take = Math.min(W.mag - S.mag, S.res); S.mag += take; S.res -= take; P.reloadEnd = 0; }
  // auto-fire (simple mode) when the crosshair is on an enemy
  let autoFire = false;
  if (SET.auto && TOUCH && !W.melee) { if (t > P.autoT) { P.autoT = t + .06; camAim(AIM); let tw = G.W.ray(AIM.ox, AIM.oy, AIM.oz, AIM.dx, AIM.dy, AIM.dz, W.r1 * 1.3); const h = rayActors(AIM.ox, AIM.oy, AIM.oz, AIM.dx, AIM.dy, AIM.dz, tw, meId()); P.autoOn = !!(h && enemyOf(meA(), h.a)); } autoFire = P.autoOn; }
  const wantFire = (IN.fire || autoFire) && !P.sprint;
  P.firing = wantFire;
  if (wantFire && t >= P.nextShot && t >= P.switchEnd && t >= P.reloadEnd && t >= P.meleeEnd) {
    if (W.melee) { melee(); P.nextShot = t + 60 / W.rpm; }
    else if (S && S.mag > 0) { shoot(); S.mag--; P.nextShot = t + 60 / W.rpm; P.prot = 0; if (S.mag === 0) setTimeout(() => startReload(), 250); }
    else if (S) { sfx.empty(); P.nextShot = t + .3; startReload(); }
  }
  // regen
  if (t - P.lastDmg > 4.5 && P.hp < 100) P.hp = Math.min(100, P.hp + 40 * dt);
}
function startReload() {
  const W = WEAPONS[curW()], S = curS(), t = T();
  if (!S || W.melee || t < P.reloadEnd || S.mag >= W.mag || S.res <= 0) return;
  P.reloadStart = t; P.reloadEnd = t + W.rl; P.ads = 0; sfx.reload();
}

// ============================== camera & first-person weapon ==============================
const CAM = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, fov: 1.1 };
function baseFov() { const asp = cv.clientWidth / Math.max(1, cv.clientHeight); const h = 1.62; return clamp(2 * Math.atan(Math.tan(h / 2) / asp), .85, 1.25); }
function updateCamera(dt) {
  const W = WEAPONS[curW()] || WEAPONS[0];
  const zoom = lerp(1, W.zoom || 1, P.ads);
  let fov = baseFov() / zoom; if (P.sprint) fov *= 1.06;
  CAM.fov = lerp(CAM.fov, fov, Math.min(1, dt * 14));
  const sh = G.shake; G.shake = Math.max(0, G.shake - dt * 2.5);
  const sx = sh ? rnd(-1, 1) * sh * .06 : 0, sy = sh ? rnd(-1, 1) * sh * .06 : 0;
  if (!P.alive) {
    // death cam: look at the killer from above
    const k = G.actors.get(P.killer); const tt = Math.min(1, (T() - P.deadAt) * 1.5);
    CAM.x = P.x + Math.sin(P.yaw) * 2.5 * tt; CAM.y = P.y + 1.6 + 2.2 * tt; CAM.z = P.z + Math.cos(P.yaw) * 2.5 * tt;
    if (k && k !== G.actors.get(meId())) { const dx = k.x - CAM.x, dy = k.y + 1.2 - CAM.y, dz = k.z - CAM.z; const ty = Math.atan2(-dx, -dz), tp = Math.atan2(dy, Math.hypot(dx, dz)); CAM.yaw += angD(CAM.yaw, ty) * Math.min(1, dt * 4); CAM.pitch = lerp(CAM.pitch, tp, Math.min(1, dt * 4)); }
    else { CAM.yaw = P.yaw; CAM.pitch = lerp(CAM.pitch, -0.5, dt * 3); }
    return;
  }
  const tpp = P.tpp && P.ads < .5;
  CAM.yaw = P.yaw + sx; CAM.pitch = P.pitch + sy + P.kick * .012;
  const ex = P.x, ey = P.y + P.eyeH, ez = P.z;
  if (tpp) {
    const cp = Math.cos(P.pitch), fx = -Math.sin(P.yaw) * cp, fy = Math.sin(P.pitch), fz = -Math.cos(P.yaw) * cp, rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    let bx = -fx * 2.7 + rx * .65, by = -fy * 2.7 + .35, bz = -fz * 2.7 + rz * .65; const L = Math.hypot(bx, by, bz); bx /= L; by /= L; bz /= L;
    let d = G.W.rayG(ex, ey, ez, bx, by, bz, L); d = Math.min(L, (d === Infinity ? L : d) - .25); d = Math.max(.3, d);
    CAM.x = ex + bx * d; CAM.y = ey + by * d; CAM.z = ez + bz * d;
  } else { CAM.x = ex; CAM.y = ey - (P.onG ? Math.abs(Math.sin(P.bob)) * .025 * Math.min(1, P.spd) : 0); CAM.z = ez; }
}
const VM = M4.create(), VMP = M4.create();
function drawViewmodel() {
  if (!P.alive || (P.tpp && P.ads < .5)) return;
  const W = WEAPONS[curW()], g = gunOf(curW()), t = T(), c = look(PROF.ch, myCS());
  if (W.scope && P.ads > .85) return;
  const ads = P.ads, bob = P.onG ? Math.min(1, P.spd) : 0;
  let x = lerp(.2, 0, ads), y = lerp(-.2, -g.sy - .015, ads), z = lerp(-.5, -.34, ads);
  x += Math.cos(P.bob) * .012 * bob * (1 - ads * .8); y += -Math.abs(Math.sin(P.bob)) * .016 * bob * (1 - ads * .8);
  z += P.kick * .045;
  let rx = P.kick * .09, ry = 0;
  if (P.sprint) { x += .05; y -= .06; ry = .65; rx = -.25; }
  if (P.slideK > .02) { x -= .03 * P.slideK; y -= .02 * P.slideK; }
  const sw = t < P.switchEnd ? (P.switchEnd - t) / .4 : 0; y -= sw * .25;
  if (t < P.reloadEnd) { const k = (t - P.reloadStart) / (P.reloadEnd - P.reloadStart); const s = Math.sin(Math.min(1, k) * Math.PI); y -= s * .1; rx -= s * .5; ry += s * .25; }
  let melee = 0; if (t < P.meleeEnd) melee = Math.sin(clamp((t - P.meleeStart) / .5, 0, 1) * Math.PI);
  M4.ident(VM); M4.tr(VM, x, y, z); if (P.slideK > .02) M4.rz(VM, .35 * P.slideK); if (ry) M4.ry(VM, ry); if (rx) M4.rx(VM, rx);
  const B = R.vm;
  if (melee > 0 && !W.melee) {
    const km = MS[7]; M4.ident(km); M4.tr(km, .1 - melee * .15, -.12, -.35 - melee * .12); M4.ry(km, -melee * 1.1); M4.rx(km, -.2);
    for (const p of GM.knife.p) part(B, km, p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]);
    part(B, km, 0, -.03, .1, .07, .07, .1, c.ck);
  }
  if (W.melee) { M4.ry(VM, -melee * 1.2); M4.tr(VM, 0, 0, -melee * .15); }
  const gm = drawGun(B, VM, curW(), myWS(curW()));
  // hands
  part(B, VM, .02, -.085, .095, .075, .075, .085, c.ck); part(B, VM, .06, -.13, .24, .095, .095, .28, c.cs, c.camo ? 13 : 12);
  if (!W.melee) { const hz = W.model === 'pistol' ? .03 : -.24; part(B, VM, -.035, -.065, hz, .075, .07, .095, c.ck); part(B, VM, -.11, -.12, hz + .17, .095, .095, .3, c.cs, c.camo ? 13 : 12, 0, 0, .5); }
  if (t - P.firedAt < .045 && !W.melee) { const fm = MS[8]; M4.copy(fm, VM); M4.tr(fm, 0, .012, gm.mz - .05); M4.rz(fm, Math.random() * 3); M4.sc(fm, .09, .09, .14); R.vmT.push(fm, 1, .75, .3, 1, 10); M4.copy(fm, VM); M4.tr(fm, 0, .012, gm.mz - .05); M4.rz(fm, .8); M4.sc(fm, .13, .02, .02); R.vmT.push(fm, 1, .9, .5, 1, 10); }
}

// ============================== bots (host) ==============================
const DIFF = [{ n: 'سهل', acc: .16, react: .95, turn: 3.2 }, { n: 'متوسط', acc: .27, react: .55, turn: 5.5 }, { n: 'صعب', acc: .4, react: .3, turn: 9 }];
const BOTW = [0, 1, 2, 3, 5, 6, 7, 9, 10, 11, 12, 14];
function makeBots(n, teamsNeeded) {
  for (const b of G.bots) removeActor(b.id); G.bots = [];
  const used = new Set();
  for (let i = 0; i < n; i++) {
    let nm; do { nm = BOTNAMES[rint(BOTNAMES.length)]; } while (used.has(nm) && used.size < BOTNAMES.length); used.add(nm);
    const b = mkActor('b' + i, { name: nm, ch: rint(CHARS.length), cs: rint(CSKINS.length), wskAll: Math.random() < .5 ? 0 : rint(WSKINS.length), team: teamsNeeded[i] || 0, bot: true, botLocal: true, alive: false, k: 0, d: 0, gs: 0, life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r: .35, h: 1.75, onG: true, respawnAt: T() + .3 + i * .15, w: BOTW[rint(BOTW.length)], mag: 0, nextShot: 0, reloadEnd: 0, tgt: null, scanT: 0, seenT: 0, wp: null, stuck: 0, lx: 0, lz: 0, strafe: 1, strafeT: 0, fireUntil: 0, hp: 100 });
    G.bots.push(b);
  }
}
function spawnBot(b) {
  const sp = spawnPoint(b.team, b.id);
  if (G.M && MODES[G.M.mode].id === 'gun') b.w = GUNGAME[Math.min(b.gs, GUNGAME.length - 1)];
  Object.assign(b, { x: sp.x, z: sp.z, y: 0, vx: 0, vy: 0, vz: 0, h: 1.75, slideT: 0, yaw: sp.yaw, tyaw: sp.yaw, pitch: 0, hp: 100, alive: true, mag: WEAPONS[b.w].mag, reloadEnd: 0, tgt: null, seenT: 0, wp: null, deadT: 9, lastHurt: null });
  b.y = G.W.groundAt(b.x, b.z, .35, 50); b.life++;
}
function botVisible(b, a) { return G.W.clear(b.x, b.y + 1.55, b.z, a.x, a.y + 1.3, a.z); }
function botThink(b, dt, t) {
  if (!b.alive) { if (t >= b.respawnAt) spawnBot(b); return; }
  const W = WEAPONS[b.w] || WEAPONS[0], D = DIFF[G.M.df] || DIFF[1];
  b.scanT -= dt;
  if (b.scanT <= 0) {
    b.scanT = .2 + Math.random() * .12;
    let best = null, bd = 60;
    const fx = -Math.sin(b.yaw), fz = -Math.cos(b.yaw);
    for (const a of G.actors.values()) {
      if (!a.alive || a === b || !enemyOf(b, a)) continue;
      const ax = a.me ? P.x : a.x, az = a.me ? P.z : a.z, dx = ax - b.x, dz = az - b.z, d = Math.hypot(dx, dz); if (d > bd) continue;
      const dot = (dx * fx + dz * fz) / (d || 1); if (d > 9 && dot < .1 && b.lastHurt !== a.id) continue;
      if (!botVisible(b, a.me ? { x: P.x, y: P.y - (P.h < 1.5 ? .6 : 0), z: P.z } : a)) continue;
      best = a; bd = d;
    }
    if (best && b.tgt !== best.id) b.seenT = t;
    b.tgt = best ? best.id : null;
  }
  const tg = b.tgt && G.actors.get(b.tgt);
  let mvx = 0, mvz = 0, spd = 0;
  if (tg && tg.alive) {
    const tx = tg.me ? P.x : tg.x, ty = tg.me ? P.y : tg.y, tz = tg.me ? P.z : tg.z;
    const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz);
    const wy = Math.atan2(-dx, -dz), wp = Math.atan2(ty + 1.2 - (b.y + 1.55), d);
    const turn = D.turn * dt; b.yaw += clamp(angD(b.yaw, wy), -turn, turn); b.pitch += clamp(wp - b.pitch, -turn, turn);
    b.strafeT -= dt; if (b.strafeT <= 0) { b.strafeT = rnd(.5, 1.4); b.strafe = Math.random() < .5 ? -1 : 1; }
    const rx = Math.cos(b.yaw), rz = -Math.sin(b.yaw), fx = -Math.sin(b.yaw), fz = -Math.cos(b.yaw);
    const fwdM = d > W.r1 * .8 ? 1 : d < 4 ? -.6 : 0;
    mvx = rx * b.strafe * .8 + fx * fwdM; mvz = rz * b.strafe * .8 + fz * fwdM; spd = 3.4;
    const aimed = Math.abs(angD(b.yaw, wy)) < .12;
    if (t >= b.reloadEnd && b.mag <= 0) { b.reloadEnd = t + W.rl; b.mag = W.mag; }
    if (aimed && t >= b.nextShot && t >= b.seenT + D.react && t >= b.reloadEnd && d < (W.melee ? 2.2 : W.r1 * 1.6)) {
      b.nextShot = t + 60 / W.rpm * (W.auto ? 1.15 : 1.6) + (W.auto ? 0 : rnd(0, .25)); b.mag--; b.fireUntil = t + .12;
      const tm = tg.me ? P.spd : tg.spd;
      let p = D.acc * (d < W.r0 ? 1.15 : .75) * (tm > .5 ? .8 : 1) * (W.pel ? 2.2 : 1) * (W.melee ? 3 : 1);
      if (Math.random() < Math.min(.9, p)) {
        const head = Math.random() < .12;
        let dmg = W.dmg * falloff(W, d) * (head ? W.hm : 1) * (W.pel ? W.pel * .55 : 1);
        dmg = Math.round(dmg);
        if (tg.me) applyDamage(dmg, b.id, b.w, head);
        else if (tg.bot) botDamage(tg, dmg, b.id, b.w, head);
        else emit(['h', tg.id, dmg, head ? 1 : 0, b.w, tg.life, b.id]);
      }
    }
  } else {
    b.tgt = null;
    if (!b.wp || Math.hypot(b.wp[0] - b.x, b.wp[1] - b.z) < 1.2 || b.stuck > 1.1) {
      b.stuck = 0; let pick = null;
      for (let i = 0; i < 10 && G.wps.length; i++) { const w = G.wps[rint(G.wps.length)]; const d = Math.hypot(w[0] - b.x, w[1] - b.z); if (d < 4 || d > 30) continue; if (G.W.clear(b.x, b.y + 1, b.z, w[0], 1, w[1])) { pick = w; break; } }
      b.wp = pick || G.wps[rint(G.wps.length)] || [0, 0];
    }
    const dx = b.wp[0] - b.x, dz = b.wp[1] - b.z, d = Math.hypot(dx, dz) || 1; mvx = dx / d; mvz = dz / d; spd = 4.3;
    const wy = Math.atan2(-dx, -dz); b.yaw += clamp(angD(b.yaw, wy), -4 * dt, 4 * dt); b.pitch *= .9;
  }
  if (!(b.slideT > 0) && b.onG && spd > 0 && t > (b.slideCd || 0) && Math.random() < dt * (tg ? .35 : .12)) { const L = Math.hypot(mvx, mvz) || 1; b.slideT = .7; b.slideDx = mvx / L; b.slideDz = mvz / L; b.h = 1.1; }
  if (b.slideT > 0) { b.slideT -= dt; const v = Math.max(2.6, 9 * Math.exp(-(.7 - b.slideT) * 2.2)); b.vx = b.slideDx * v; b.vz = b.slideDz * v; if (b.slideT <= 0 || !b.onG) { b.slideT = 0; b.slideCd = t + rnd(2, 5); } }
  else b.vx = lerp(b.vx, mvx * spd * (WEAPONS[b.w].spd || 1), Math.min(1, 10 * dt)), b.vz = lerp(b.vz, mvz * spd * (WEAPONS[b.w].spd || 1), Math.min(1, 10 * dt));
  if (!(b.slideT > 0) && b.h < 1.75 && G.W.ceilAt(b.x, b.z, .25, b.y + 1.1) >= b.y + 1.78) b.h = 1.75;
  const ox = b.x, oz = b.z; moveBody(G.W, b, dt);
  const moved = Math.hypot(b.x - ox, b.z - oz); if (spd > 0 && moved < spd * dt * .3) { b.stuck += dt; if (b.stuck > .6 && b.onG) b.vy = 7; } else b.stuck = Math.max(0, b.stuck - dt);
  b.spd = Math.hypot(b.vx, b.vz) / 5.2;
  b.flags = (b.alive ? 1 : 0) | (t < b.fireUntil ? 2 : 0) | (b.onG ? 32 : 0) | (b.spd > .5 ? 64 : 0) | (b.slideT > 0 ? 256 : 0);
}
function botDamage(b, dmg, from, w, head, life) {
  if (!b.alive || (life != null && life !== b.life)) return;
  if (isTeams()) { const s = G.actors.get(from); if (s && s.team === b.team && s !== b) return; }
  b.hp -= dmg; b.lastHurt = from;
  if (b.hp <= 0) { b.alive = false; b.hp = 0; b.deadT = 0; b.d++; b.respawnAt = T() + 3 / FAST; emit(['d', from, w, head ? 1 : 0, b.id]); }
}

// ============================== events ==============================
function emit(ev) {
  const e = [++G.evSeq, ...ev]; G.events.push(e); if (G.events.length > 30) G.events.shift(); G.evDirty = true; G.nextPub = Math.min(G.nextPub, T() + .03);
  handleEvent(meId(), e);
}
function handleEvent(src, e) {
  const type = e[1];
  if (type === 'h') {
    const [, , target, dmg, head, w, life, shooter] = e; const from = shooter || src;
    if (target === meId() && src !== meId()) { if (life === P.life) applyDamage(dmg, from, w, !!head); }
    else if (G.host && typeof target === 'string' && target[0] === 'b' && src !== meId()) { const b = G.actors.get(target); if (b && b.bot) botDamage(b, dmg, from, w, !!head, life); }
  } else if (type === 'd') {
    const [, , killer, w, head, victimBot] = e; const victim = victimBot || src;
    onDeath(victim, killer, w, !!head);
  } else if (type === 'g') {
    const [, , x, y, z, vx, vy, vz] = e;
    FX.nades.push({ x, y, z, vx, vy, vz, t: 0, own: src === meId() });
  }
}
function onDeath(victim, killer, w, head) {
  const va = G.actors.get(victim), ka = G.actors.get(killer);
  if (va) { va.alive = false; va.deadT = 0; }
  if (killer === meId() && victim !== meId()) {
    P.k++; P.streak++; STATS.k++; saveStats(); sfx.kill(); hitMarker('kill');
    const nm = va ? va.name : '';
    medal((head ? '🎯 ضربة رأس! ' : '💀 ') + '+100 ' + esc(nm));
    if (P.streak >= 3 && P.streak % 2 === 1) medal('🔥 سلسلة قتل ×' + P.streak);
    if (P.streak === 3) { G.uavUntil = T() + 15; medal('📡 طيارة استطلاع — الأعداء ظاهرين بالخريطة'); }
    const S = curS(); if (S && !WEAPONS[S.w].melee) S.res = Math.min(S.res + Math.ceil(WEAPONS[S.w].mag / 2), WEAPONS[S.w].res * 2);
    if (G.M && MODES[G.M.mode].id === 'gun') { P.gs++; if (P.gs < GUNGAME.length) { giveGun(P.gs); medal('⬆️ سلاح جديد: ' + WEAPONS[GUNGAME[P.gs]].n); } }
  }
  if (G.host && ka && ka.bot && victim !== killer) { ka.k++; if (G.M && MODES[G.M.mode].id === 'gun') { ka.gs++; if (ka.gs < GUNGAME.length) ka.w = GUNGAME[ka.gs]; } }
  if (G.host && G.M) {
    const kt = ka ? ka.team : null, vt = va ? va.team : null;
    if (killer !== victim && ka) { G.tally[killer] = (G.tally[killer] || 0) + 1; if (isTeams() && kt != null && kt !== vt) G.M.sc[kt]++; }
  }
  addFeed(killer, victim, w, head);
}
function addFeed(killer, victim, w, head) {
  const ka = G.actors.get(killer), va = G.actors.get(victim);
  const cls = a => a ? (a.me ? 'me' : isTeams() ? (a.team === myTeam() ? 'a' : 'b') : 'b') : '';
  const wn = w === 9 ? '💣' : w === KNIFE ? '🔪' : (WEAPONS[w] ? WEAPONS[w].n : '');
  const line = killer === victim || !ka ? `<span class="${cls(va)}">${esc(va ? va.name : '?')}</span> 💀` : `<span class="${cls(ka)}">${esc(ka.name)}</span> ${head ? '🎯' : '›'} <small>${esc(wn)}</small> › <span class="${cls(va)}">${esc(va ? va.name : '?')}</span>`;
  G.feed.push({ h: line, t: T() }); if (G.feed.length > 5) G.feed.shift(); renderFeed();
}
function renderFeed() { $('#feed').innerHTML = G.feed.map(f => `<div>${f.h}</div>`).join(''); }
function medal(h) { const m = $('#medal'); const d = document.createElement('div'); d.innerHTML = h; m.appendChild(d); setTimeout(() => d.remove(), 1700); while (m.children.length > 3) m.firstChild.remove(); }

// ============================== networking ==============================
function hostPeer(list) { let h = null; for (const p of list) if (p.presence && p.presence.h === 1 && (!h || (p.presence.hs || 0) > (h.presence.hs || 0))) h = p; return h; }
function onPeers(list) { G.peers = list; G.peersDirty = true; }
function processPeers() {
  if (!G.room) return; const list = G.room.peers(); const t = T();
  const hp = hostPeer(list);
  if (hp) { G.hostSeen = t; G.hostPeer = hp.peer; if (!G.host) { const M = hp.presence.M; if (M && typeof M === 'object') { const ms = JSON.stringify(M); if (ms !== G.lastMs) { G.lastMs = ms; onHostM(M); } } } }
  const seen = new Set([meId()]);
  for (const p of list) {
    if (p.sameTab) continue; const pr = p.presence || {}; seen.add(p.peer);
    const a = mkActor(p.peer); if (a.lastPres !== pr) {
      a.lastPres = pr; a.name = clean(pr.n, 14) || 'لاعب'; a.ch = (pr.c | 0) % CHARS.length; a.cs = (pr.cs | 0) % CSKINS.length; a.wsMap = parseWS(pr.ws); a.k = pr.k | 0; a.d = pr.dc | 0; a.gs = pr.gs | 0;
      a.team = G.M && G.M.T && G.M.T[p.peer] != null ? G.M.T[p.peer] : 0;
      if (pr.s) applyState(a, pr.s); else a.alive = false;
      // events
      const E = Array.isArray(pr.E) ? pr.E : [];
      const last = G.lastSeq.get(p.peer);
      if (last == null) G.lastSeq.set(p.peer, E.reduce((m, e) => Math.max(m, e[0] | 0), 0));
      else { let mx = last; for (const e of E) { if ((e[0] | 0) > last) { handleEvent(p.peer, e); mx = Math.max(mx, e[0] | 0); } } G.lastSeq.set(p.peer, mx); }
      // bots of the host
      if (!G.host && pr.h === 1 && p.peer === G.hostPeer) syncBots(pr);
    }
  }
  for (const id of [...G.actors.keys()]) { const a = G.actors.get(id); if (a.me || a.bot) continue; if (!seen.has(id)) removeActor(id); }
  if (!G.host && !hp) { for (const id of [...G.actors.keys()]) if (G.actors.get(id).bot) removeActor(id); }
  if (G.host) hostPeersUpdate(list);
}
function wsStr() { return Object.keys(PROF.wsk).filter(k => PROF.wsk[k] | 0).map(k => k + ':' + (PROF.wsk[k] | 0)).join(','); }
function parseWS(s) { const o = {}; if (typeof s === 'string') for (const kv of s.split(',')) { const [k, v] = kv.split(':'); if (k !== '' && v) o[+k] = +v; } return o; }
function looksPatch() { return { c: PROF.ch, cs: myCS(), ws: wsStr() || null }; }
function syncBots(pr) {
  const info = Array.isArray(pr.BI) ? pr.BI : []; const ids = new Set();
  for (const b of info) { const [id, name, ch, team, k, d, cs, wk] = b; ids.add(id); mkActor(id, { name: clean(name, 14), ch: ch | 0, team: team | 0, k: k | 0, d: d | 0, cs: cs | 0, wskAll: wk | 0, bot: true }); }
  if (typeof pr.B === 'string') for (const s of pr.B.split('|')) { const i = s.indexOf(':'); if (i < 0) continue; const id = s.slice(0, i), a = G.actors.get(id); if (a) applyState(a, s.slice(i + 1)); }
  for (const id of [...G.actors.keys()]) { const a = G.actors.get(id); if (a.bot && !ids.has(id)) removeActor(id); }
}
function onHostM(M) {
  const prev = G.M; G.M = M;
  for (const a of G.actors.values()) if (!a.bot && M.T && M.T[a.id] != null) a.team = M.T[a.id];
  const me = G.actors.get(meId()); if (me && M.T) me.team = myTeam();
  if (M.ph === 'play' && G.matchId !== M.id) enterMatch();
  else if (M.ph === 'lobby' && G.scr !== 'lobby' && G.scr !== 'home') toLobby();
  else if (M.ph === 'end' && G.endShown !== M.id) showEnd();
  if (G.scr === 'lobby') renderMenu();
}
function netTick() {
  if (!G.room) return; const t = T();
  if (t < G.nextPub) return; G.nextPub = t + (G.inMatch ? .08 : .3);
  const p = {};
  if (G.inMatch) { const s = stateStr(); if (s !== G.pub.s) { p.s = s; G.pub.s = s; } }
  if (G.evDirty) { p.E = G.events.slice(-24); G.evDirty = false; }
  if (P.k !== G.pub.k) { p.k = P.k; G.pub.k = P.k; } if (P.d !== G.pub.dc) { p.dc = P.d; G.pub.dc = P.d; } if (P.gs !== G.pub.gs) { p.gs = P.gs; G.pub.gs = P.gs; }
  if (G.host && G.M) {
    if (G.M.ph === 'play') G.M.t = Math.max(0, Math.ceil((G.M.endAt - Date.now()) / 1000));
    const ms = JSON.stringify(G.M); if (ms !== G.pub.M) { p.M = G.M; G.pub.M = ms; }
    if (G.inMatch && t >= G.nextBotPub) {
      G.nextBotPub = t + .1;
      const B = G.bots.map(b => b.id + ':' + [b.x.toFixed(2), b.y.toFixed(2), b.z.toFixed(2), b.yaw.toFixed(3), b.pitch.toFixed(3), b.flags, b.w, Math.ceil(b.hp), b.life].join(',')).join('|');
      if (B !== G.pub.B) { p.B = B; G.pub.B = B; }
      const BI = G.bots.map(b => [b.id, b.name, b.ch, b.team, b.k, b.d, b.cs | 0, b.wskAll | 0]); const bs = JSON.stringify(BI); if (bs !== G.pub.BI) { p.BI = BI; G.pub.BI = bs; }
    }
  }
  if (Object.keys(p).length) G.room.presence(p);
}
// ---------- host ----------
function newM() { return { ph: 'lobby', id: 0, mode: 0, map: 0, lim: MODES[0].lim, dur: MODES[0].dur, nb: 4, df: 1, T: {}, t: 0, sc: [0, 0], w: null, endAt: 0 }; }
function hostPeersUpdate(list) {
  const M = G.M; if (!M) return; let ch = false;
  const ids = list.map(p => p.peer); const T0 = M.T || (M.T = {});
  for (const id of Object.keys(T0)) if (!ids.includes(id)) { delete T0[id]; ch = true; }
  for (const p of list) {
    const want = p.presence && p.presence.wt;
    if (T0[p.peer] == null) { T0[p.peer] = teamWithFewer(); ch = true; }
    else if (M.ph === 'lobby' && (want === 0 || want === 1) && T0[p.peer] !== want && p.presence.wq !== (G.wqSeen || {})[p.peer]) { T0[p.peer] = want; (G.wqSeen || (G.wqSeen = {}))[p.peer] = p.presence.wq; ch = true; }
  }
  if (ch && G.scr === 'lobby') renderMenu();
}
function teamWithFewer() { const c = [0, 0]; const M = G.M; for (const id in M.T) c[M.T[id]]++; for (const b of G.bots) c[b.team]++; return c[0] <= c[1] ? 0 : 1; }
function hostStart() {
  const M = G.M; if (!M) return;
  M.id++; M.ph = 'play'; M.sc = [0, 0]; M.w = null; M.endAt = Date.now() + M.dur * 1000 / FAST; M.lim = MODES[M.mode].lim; G.tally = {};
  // balance teams: humans first, bots fill the smaller side
  const humans = Object.keys(M.T); const cnt = [0, 0];
  if (MODES[M.mode].teams) { humans.forEach((id, i) => { cnt[M.T[id]]++; }); }
  const bt = []; for (let i = 0; i < M.nb; i++) { const tm = cnt[0] <= cnt[1] ? 0 : 1; cnt[tm]++; bt.push(tm); }
  makeBots(M.nb, bt);
  G.pub.M = ''; enterMatch();
}
function hostTick(dt) {
  const M = G.M; if (!M || M.ph !== 'play') return; const t = T();
  for (const b of G.bots) botThink(b, dt, t);
  // win check
  const mode = MODES[M.mode]; let w = null;
  if (mode.teams) { if (M.sc[0] >= M.lim) w = 'a'; else if (M.sc[1] >= M.lim) w = 'b'; }
  else { for (const a of G.actors.values()) { const k = a.me ? (mode.id === 'gun' ? P.gs : P.k) : (mode.id === 'gun' ? a.gs : a.k); if (k >= M.lim) { w = a.id; break; } } }
  if (!w && Date.now() >= M.endAt) {
    if (mode.teams) w = M.sc[0] > M.sc[1] ? 'a' : M.sc[1] > M.sc[0] ? 'b' : 'draw';
    else { let bk = -1; for (const a of G.actors.values()) { const k = a.me ? (mode.id === 'gun' ? P.gs : P.k) : (mode.id === 'gun' ? a.gs : a.k); if (k > bk) { bk = k; w = a.id; } } }
  }
  if (w) { M.ph = 'end'; M.w = w; M.final = board().map(r => [r.id, r.name, r.team, r.k, r.d, r.bot ? 1 : 0]); G.pub.M = ''; showEnd(); }
}

// ============================== match flow ==============================
function enterMatch() {
  const M = G.M; loadMap(M.map); G.matchId = M.id; G.inMatch = true; G.endShown = -1;
  P.k = 0; P.d = 0; P.gs = 0; P.streak = 0; G.feed = []; renderFeed(); G.uavUntil = 0;
  FX.parts.length = 0; FX.tracers.length = 0; FX.nades.length = 0; FX.holes.length = 0;
  for (const a of G.actors.values()) { if (!a.me) { a.k = 0; a.d = 0; } }
  mkActor(meId(), { me: true, name: PROF.name, ch: PROF.ch, team: myTeam() });
  setScr('match'); spawnMe(); sfx.start();
  medal(MODES[M.mode].e + ' ' + MODES[M.mode].n + ' — ' + G.map.name);
  if (TOUCH) { try { document.documentElement.requestFullscreen && document.fullscreenElement == null && document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => { }); } catch (e) { } }
}
function toLobby() { G.inMatch = false; P.alive = false; closeOv(); for (const b of G.bots) removeActor(b.id); if (G.host) G.bots = []; setScr('lobby'); }

// ============================== voice chat (WebRTC mesh, signalled through the room) ==============================
// lobby: everyone hears everyone · team modes: your team only · free-for-all: by distance (45 m)
const VC = { on: false, joining: false, mic: null, muted: false, pcs: new Map(), sig: {}, lvl: new Map(), speaking: new Set(), an: null, anBuf: null, hint: false };
const VC_ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }].concat(Array.isArray(window.VC_TURN) ? window.VC_TURN : []);
const VC_RANGE = 45;
function vcAvail() { return !!(G.room && !G.room.local); }
function vcTeam(id) { return (G.M && G.M.T && G.M.T[id] != null) ? G.M.T[id] : 0; }
function vcPos(id) { if (id === meId()) return [P.x, P.z]; const a = G.actors.get(id); return a ? [a.x, a.z] : null; }
function vcLive() { return !!(G.inMatch && G.M && G.M.ph === 'play'); }
function vcDist(a, b) { const pa = vcPos(a), pb = vcPos(b); return pa && pb ? Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) : 0; }
function vcCan(a, b) { // can "a" be heard by "b"
  if (!vcLive()) return true;
  if (isTeams()) return vcTeam(a) === vcTeam(b);
  return vcDist(a, b) < VC_RANGE;
}
function vcVol(peer) { if (!vcLive() || isTeams()) return 1; return clamp(1.15 - vcDist(peer, meId()) / VC_RANGE, .12, 1); }
function vcPub(p) { if (G.room) G.room.presence(p); }
async function vcButton() {
  if (!vcAvail()) { toast('🎤 الصوت يشتغل بالغرف الأونلاين مع ربعك'); return; }
  if (!VC.on) return vcJoin();
  if (!VC.mic) { toast('🎧 تسمع بس — ما فيه مايك'); return; }
  VC.muted = !VC.muted; vcGate(); vcRender(); toast(VC.muted ? '🤐 سكّرت المايك' : '🎤 المايك شغّال');
}
async function vcJoin() {
  if (VC.on || VC.joining || !vcAvail()) return;
  if (!window.RTCPeerConnection) { toast('جهازك أو المتصفح ما يدعم الصوت 😕'); return; }
  VC.joining = true; vcRender();
  try { if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no-media'); VC.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }); }
  catch (e) { console.warn('mic', e); VC.mic = null; toast('ما فيه إذن للمايك — بتسمع بس 🎧'); }
  VC.joining = false;
  if (!vcAvail()) { vcLeave(); return; }
  VC.on = true; VC.muted = false; VC.sig = {};
  if (VC.mic) vcMeter();
  vcPub({ vo: 1, v: null });
  if (!VC.hint) { VC.hint = true; setTimeout(() => { if (VC.on) toast(isTeams() && vcLive() ? '🎤 دخلت الصوت — فريقك بس يسمعك' : '🎤 دخلت الصوت — اضغط الزر عشان تسكّر المايك'); }, 300); }
  vcTick();
}
function vcLeave() {
  for (const peer of [...VC.pcs.keys()]) vcClose(peer, true);
  if (VC.mic) { VC.mic.getTracks().forEach(t => t.stop()); VC.mic = null; }
  VC.an = null; VC.on = false; VC.joining = false; VC.sig = {}; VC.speaking.clear(); VC.lvl.clear();
  if (G.room) vcPub({ vo: null, v: null });
  vcRender();
}
function vcSig(peer, o) { if (o) VC.sig[peer] = o; else delete VC.sig[peer]; vcPub({ v: Object.keys(VC.sig).length ? { ...VC.sig } : null }); }
function vcClose(peer, keepSig) {
  const e = VC.pcs.get(peer); if (!e) return; VC.pcs.delete(peer);
  try { e.pc.close(); } catch (_) { } if (e.tr) try { e.tr.stop(); } catch (_) { }
  if (e.audio) { try { e.audio.srcObject = null; e.audio.remove(); } catch (_) { } }
  VC.lvl.delete(peer); VC.speaking.delete(peer);
  if (!keepSig && VC.sig[peer]) vcSig(peer, null);
}
function vcGathered(pc) { return new Promise(res => { if (pc.iceGatheringState === 'complete') return res(); const t = setTimeout(res, 2500); pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } }); }); }
function vcNew(peer, sid, role) {
  const pc = new RTCPeerConnection({ iceServers: VC_ICE });
  const tr = VC.mic && VC.mic.getAudioTracks()[0] ? VC.mic.getAudioTracks()[0].clone() : null; if (tr) tr.enabled = false;
  const e = { pc, sid, role, tr, audio: null, t0: T(), ans: false };
  pc.onconnectionstatechange = () => { const st = pc.connectionState; if (st === 'disconnected') { if (!e.dAt) e.dAt = T(); } else e.dAt = 0; };
  pc.ontrack = ev => {
    if (VC.pcs.get(peer) !== e) return;
    if (!e.audio) { e.audio = document.createElement('audio'); e.audio.autoplay = true; e.audio.setAttribute('playsinline', ''); $('#vcAudio').appendChild(e.audio); }
    e.audio.srcObject = (ev.streams && ev.streams[0]) ? ev.streams[0] : new MediaStream([ev.track]);
    e.audio.muted = !vcCan(peer, meId()); e.audio.play().catch(() => { });
  };
  VC.pcs.set(peer, e); return e;
}
async function vcOffer(peer) {
  const sid = Math.random().toString(36).slice(2, 8), e = vcNew(peer, sid, 'o');
  try { const tx = e.pc.addTransceiver('audio', { direction: 'sendrecv' }); if (e.tr) await tx.sender.replaceTrack(e.tr);
    await e.pc.setLocalDescription(await e.pc.createOffer()); await vcGathered(e.pc); if (VC.pcs.get(peer) !== e) return; vcSig(peer, { s: sid, o: e.pc.localDescription.sdp }); }
  catch (err) { console.warn('vc offer', err); }
}
async function vcAnswer(peer, sig) {
  const e = vcNew(peer, sig.s, 'a');
  try { await e.pc.setRemoteDescription({ type: 'offer', sdp: sig.o }); const tx = e.pc.getTransceivers()[0]; if (tx) { if (e.tr) await tx.sender.replaceTrack(e.tr); tx.direction = 'sendrecv'; }
    await e.pc.setLocalDescription(await e.pc.createAnswer()); await vcGathered(e.pc); if (VC.pcs.get(peer) !== e) return; vcSig(peer, { s: sig.s, a: e.pc.localDescription.sdp }); }
  catch (err) { console.warn('vc answer', err); }
}
function vcTick() {
  if (!VC.on) { vcRender(); return; }
  if (!vcAvail()) { vcLeave(); return; }
  const me = meId(), others = G.room.peers().filter(p => !p.sameTab && p.presence && p.presence.vo === 1), want = new Set(others.map(p => p.peer));
  for (const peer of [...VC.pcs.keys()]) if (!want.has(peer)) vcClose(peer);
  for (const peer of Object.keys(VC.sig)) if (!want.has(peer)) vcSig(peer, null);
  for (const p of others) {
    const X = p.peer, sig = (p.presence.v && p.presence.v[me]) || null, e = VC.pcs.get(X);
    if (me < X) {
      const st = e ? e.pc.connectionState : '';
      const stale = e && (st === 'failed' || st === 'closed' || (st === 'disconnected' && e.dAt && T() - e.dAt > 8) || (st !== 'connected' && st !== 'disconnected' && T() - e.t0 > 20));
      if (!e || stale) { if (e) vcClose(X, true); vcOffer(X); }
      else if (sig && sig.s === e.sid && sig.a && !e.ans) { e.ans = true; e.pc.setRemoteDescription({ type: 'answer', sdp: sig.a }).catch(err => console.warn('vc ans', err)); }
    } else if (sig && sig.o && (!e || e.sid !== sig.s)) { if (e) vcClose(X, true); vcAnswer(X, sig); }
  }
  vcGate(); vcLevels(); vcRender();
}
function vcGate() {
  const me = meId();
  for (const [peer, e] of VC.pcs) {
    if (e.tr) e.tr.enabled = !VC.muted && vcCan(me, peer);
    if (e.audio) { const m = !vcCan(peer, me); if (e.audio.muted !== m) e.audio.muted = m; const v = vcVol(peer); if (Math.abs(e.audio.volume - v) > .02) { try { e.audio.volume = v; } catch (_) { } } if (!m && e.audio.paused) e.audio.play().catch(() => { }); }
  }
}
function vcMeter() { try { auInit(); if (!AU.ctx || !VC.mic) return; const src = AU.ctx.createMediaStreamSource(VC.mic), an = AU.ctx.createAnalyser(); an.fftSize = 512; src.connect(an); VC.an = an; VC.anBuf = new Uint8Array(an.fftSize); } catch (e) { VC.an = null; } }
function vcLevels() {
  const t = T(), TH = .035, HOLD = .7, me = meId();
  for (const [peer, e] of VC.pcs) {
    let lv = 0; try { const rc = e.pc.getReceivers()[0]; const ss = rc && rc.getSynchronizationSources ? rc.getSynchronizationSources() : []; if (ss.length) lv = ss[0].audioLevel || 0; } catch (_) { }
    if (e.audio && !e.audio.muted && lv > TH) VC.lvl.set(peer, t);
    if (t - (VC.lvl.get(peer) || -9) < HOLD) VC.speaking.add(peer); else VC.speaking.delete(peer);
  }
  let lvl = 0; if (VC.an && VC.anBuf) { VC.an.getByteTimeDomainData(VC.anBuf); let m = 0; for (let i = 0; i < VC.anBuf.length; i++) { const d = Math.abs(VC.anBuf[i] - 128); if (d > m) m = d; } lvl = m / 128; }
  const sending = VC.mic && !VC.muted;
  if (sending && lvl > .08) VC.lvl.set(me, t);
  if (sending && t - (VC.lvl.get(me) || -9) < HOLD) VC.speaking.add(me); else VC.speaking.delete(me);
}
function vcLabel() { if (VC.joining) return '⏳ نوصّل الصوت…'; if (!VC.on) return '🎤 ادخل الصوت'; if (!VC.mic) return '🎧 تسمع بس'; return VC.muted ? '🤐 المايك مسكّر — اضغط تفتحه' : '🎤 المايك شغّال — اضغط تسكّره'; }
function vcRender() {
  if (G.scr === 'lobby') { const lb = document.querySelector('#menu [data-act=voice]'); if (lb) { const l = vcLabel(); if (lb.textContent !== l) lb.textContent = l; lb.classList.toggle('on', VC.on && !!VC.mic && !VC.muted); } }
  const b = $('#bVoice'), hud = $('#vcHud'); if (!b || !hud) return;
  const show = vcAvail();
  b.classList.toggle('hidden', !show);
  const n = VC.on ? [...VC.pcs.values()].filter(e => e.pc.connectionState === 'connected').length : 0;
  const ic = VC.joining ? '⏳' : !VC.on ? '🎙️' : !VC.mic ? '🎧' : VC.muted ? '🤐' : '🎤';
  if (b.textContent !== ic) b.textContent = ic;
  b.classList.toggle('live', VC.on && !!VC.mic && !VC.muted); b.classList.toggle('talk', VC.speaking.has(meId()));
  const names = [...VC.speaking].filter(p => p !== meId()).map(p => { const a = G.actors.get(p); if (a) return a.name; const q = G.room && G.room.peers().find(x => x.peer === p); return clean(q && q.presence && q.presence.n, 12) || 'لاعب'; });
  const h = !show || !VC.on ? '' : `${ic} ${n}${VC.speaking.has(meId()) ? ' · 🗣️ أنت' : ''}${names.length ? ' · 🗣️ ' + names.slice(0, 3).map(esc).join('، ') : ''}`;
  if (hud.__h !== h) { hud.__h = h; hud.innerHTML = h; hud.classList.toggle('hidden', !h); }
}
setInterval(vcTick, 400);
addEventListener('pointerdown', () => { if (VC.on) for (const e of VC.pcs.values()) if (e.audio && !e.audio.muted && e.audio.paused) e.audio.play().catch(() => { }); }, { capture: true });
addEventListener('pagehide', () => { if (VC.on) vcLeave(); });

function leaveRoom() {
  if (VC.on || VC.joining) vcLeave();
  if (G.room) { try { G.room.leave(); } catch (e) { } }
  G.room = null; G.host = false; G.M = null; G.inMatch = false; G.matchId = -1; P.alive = false; G.bots = []; G.lastSeq.clear(); G.events = []; G.pub = {};
  for (const id of [...G.actors.keys()]) removeActor(id);
  closeOv(); setScr('home');
}
function board() {
  const rows = [];
  for (const a of G.actors.values()) rows.push({ id: a.id, name: a.me ? PROF.name : a.name, team: a.me ? myTeam() : a.team, k: a.me ? P.k : a.k, d: a.me ? P.d : a.d, gs: a.me ? P.gs : a.gs, bot: a.bot, me: a.me });
  return rows.sort((a, b) => b.k - a.k || a.d - b.d);
}
function createRoom(solo) {
  const M = newM(); Object.assign(M, G.setup || {}); M.lim = MODES[M.mode].lim; M.dur = MODES[M.mode].dur;
  if (solo) { G.room = window.makeLocalRoom(); }
  else { if (!NET) { toast('⏳ لحظة… نتصل بالسيرفر'); return; } let code; code = String(1000 + rint(9000)); G.room = NET.join(code); }
  G.host = true; G.M = M; G.lastSeq.clear(); G.events = []; G.evSeq = 0; G.pub = {}; G.hostSeen = T();
  M.T[G.room.id] = 0;
  G.room.onPeers(onPeers); G.room.onError && G.room.onError(e => { toast('⚠️ ما فيه صلاحية للغرفة — تأكد من قواعد Firebase'); });
  G.room.presence({ n: PROF.name, ...looksPatch(), h: 1, hs: Date.now(), M });
  if (solo) hostStart(); else setScr('lobby');
}
function joinRoom(code) {
  if (!NET) { toast('⏳ لحظة… نتصل بالسيرفر'); return; }
  G.room = NET.join(code); G.host = false; G.M = null; G.lastMs = ''; G.lastSeq.clear(); G.events = []; G.evSeq = 0; G.pub = {}; G.hostSeen = T(); G.joinAt = T();
  G.room.onPeers(onPeers); G.room.onError && G.room.onError(() => toast('⚠️ ما فيه صلاحية للغرفة — تأكد من قواعد Firebase'));
  G.room.presence({ n: PROF.name, ...looksPatch() });
  setScr('joining');
}

// ============================== input ==============================
const KEYS = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
function keyAxes() { const k = IN.keys; IN.mx = (k.r ? 1 : 0) - (k.l ? 1 : 0); IN.mz = (k.b ? 1 : 0) - (k.f ? 1 : 0); }
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (G.scr !== 'match') return;
  const m = KEYS[e.code]; if (m) { IN.keys[m] = true; keyAxes(); }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') IN.sprint = true;
  if (e.code === 'Space') { IN.jump = 1; e.preventDefault(); }
  if (e.code === 'KeyR') IN.reload = 1; if (e.code === 'KeyQ' || e.code === 'Digit1' || e.code === 'Digit2') IN.swap = 1;
  if (e.code === 'KeyG') IN.nade = 1; if (e.code === 'KeyF') IN.knife = 1; if (e.code === 'KeyV') toggleCam();
  if (e.code === 'KeyC' || e.code === 'ControlLeft') IN.slide = 1;
  if (e.code === 'KeyT') vcButton();
  if (e.code === 'Tab') { e.preventDefault(); G.board = true; }
  if (e.code === 'Escape') togglePause();
});
addEventListener('keyup', e => {
  const m = KEYS[e.code]; if (m) { IN.keys[m] = false; keyAxes(); }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') IN.sprint = false;
  if (e.code === 'Tab') G.board = false;
});
cv.addEventListener('mousedown', e => {
  if (G.scr !== 'match' || TOUCH) return;
  if (!document.pointerLockElement) { if (!G.paused && P.alive) cv.requestPointerLock && cv.requestPointerLock(); return; }
  if (e.button === 0) IN.fire = true; if (e.button === 2) IN.ads = true;
});
addEventListener('mouseup', e => { if (e.button === 0) IN.fire = false; if (e.button === 2) IN.ads = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('mousemove', e => {
  if (G.scr !== 'match' || !document.pointerLockElement || !P.alive) return;
  const z = Math.pow(lerp(1, (WEAPONS[curW()] || WEAPONS[0]).zoom || 1, P.ads), .85), s = .0022 * SET.sens / z;
  P.yaw -= e.movementX * s; P.pitch -= e.movementY * s;
});
addEventListener('wheel', e => { if (G.scr === 'match') IN.swap = 1; }, { passive: true });
// touch
const TP = new Map(); // pointerId -> role
function lookMove(dx, dy) { const z = Math.pow(lerp(1, (WEAPONS[curW()] || WEAPONS[0]).zoom || 1, P.ads), .8), s = .0058 * SET.sens / z; P.yaw -= dx * s; P.pitch -= dy * s * .85; }
const touchEl = $('#touch');
touchEl.addEventListener('pointerdown', e => {
  e.preventDefault(); auInit();
  const b = e.target.closest('.tb'); const id = b ? b.id : '';
  if (id) {
    b.classList.add('act');
    if (id === 'bFire' || id === 'bFire2') { IN.fireTouch.add(e.pointerId); IN.fire = true; TP.set(e.pointerId, { r: 'look', x: e.clientX, y: e.clientY, btn: b }); }
    else if (id === 'bAds') { IN.adsT = !IN.adsT; TP.set(e.pointerId, { r: 'btn', btn: b }); }
    else if (id === 'bJump') { IN.jump = 1; TP.set(e.pointerId, { r: 'look', x: e.clientX, y: e.clientY, btn: b }); }
    else { TP.set(e.pointerId, { r: 'btn', btn: b }); if (id === 'bReload') IN.reload = 1; else if (id === 'bNade') IN.nade = 1; else if (id === 'bKnife') IN.knife = 1; else if (id === 'bSlide') IN.slide = 1; else if (id === 'bVoice') vcButton(); else if (id === 'bSwap') IN.swap = 1; else if (id === 'bCam') toggleCam(); else if (id === 'bBoard') { G.board = G.ov !== 'board'; if (!G.board) closeOv('board'); } else if (id === 'bPause') togglePause(); }
    try { touchEl.setPointerCapture(e.pointerId); } catch (_) { }
    return;
  }
  const W = innerWidth, H = innerHeight;
  if (e.clientX < W * .42 && e.clientY > H * .28 && !IN.joy) {
    IN.joy = { id: e.pointerId, x: e.clientX, y: e.clientY, mag: 0 }; const j = $('#joy'); j.style.left = e.clientX + 'px'; j.style.top = e.clientY + 'px'; j.style.display = 'block'; $('#joyK').style.transform = '';
    TP.set(e.pointerId, { r: 'joy' });
  } else TP.set(e.pointerId, { r: 'look', x: e.clientX, y: e.clientY });
  try { touchEl.setPointerCapture(e.pointerId); } catch (_) { }
}, { passive: false });
touchEl.addEventListener('pointermove', e => {
  const r = TP.get(e.pointerId); if (!r) return; e.preventDefault();
  if (r.r === 'joy' && IN.joy) {
    let dx = e.clientX - IN.joy.x, dy = e.clientY - IN.joy.y; const L = Math.hypot(dx, dy), max = 56;
    if (L > max) { dx = dx / L * max; dy = dy / L * max; }
    IN.mx = dx / max; IN.mz = dy / max; IN.joy.mag = Math.min(1, L / max); $('#joyK').style.transform = `translate(${dx}px,${dy}px)`;
  } else if (r.r === 'look') { lookMove(e.clientX - r.x, e.clientY - r.y); r.x = e.clientX; r.y = e.clientY; }
}, { passive: false });
function touchEnd(e) {
  const r = TP.get(e.pointerId); if (!r) return; TP.delete(e.pointerId);
  if (r.btn) r.btn.classList.remove('act');
  if (IN.fireTouch.delete(e.pointerId) && !IN.fireTouch.size) IN.fire = false;
  if (r.r === 'joy') { IN.joy = null; IN.mx = 0; IN.mz = 0; $('#joy').style.display = 'none'; }
}
touchEl.addEventListener('pointerup', touchEnd); touchEl.addEventListener('pointercancel', touchEnd);
function toggleCam() { P.tpp = !P.tpp; SET.tpp = P.tpp ? 1 : 0; saveSet(); toast(P.tpp ? '🎥 منظور الشخص الثالث' : '👁️ منظور الشخص الأول'); }
function togglePause() { if (G.scr !== 'match') return; if (G.ov === 'pause') closeOv(); else { if (document.pointerLockElement) document.exitPointerLock(); showPause(); } }

// ============================== HUD ==============================
const tagPos = [0, 0, 0];
function hud(dt) {
  const t = T(), W = WEAPONS[curW()] || WEAPONS[0], S = curS(), M = G.M;
  // score bar
  if (M) {
    const tl = M.t != null ? M.t : 0, mode = MODES[M.mode];
    let h;
    if (mode.teams) { const mt = myTeam(), s = M.sc || [0, 0]; h = `<div class="s a">${s[mt]}<span class="lim">فريقك</span></div><div class="tm">⏱ ${fmtT(tl)}</div><div class="s b">${s[1 - mt]}<span class="lim">العدو</span></div>`; }
    else { const rows = board(); const top = rows[0]; const mine = mode.id === 'gun' ? P.gs : P.k; const topk = top ? (mode.id === 'gun' ? top.gs : top.k) : 0; h = `<div class="s a">${mine}<span class="lim">أنت / ${M.lim}</span></div><div class="tm">⏱ ${fmtT(tl)}</div><div class="s b">${topk}<span class="lim">${esc(top ? (top.me ? 'أنت الأول' : top.name) : '')}</span></div>`; }
    if (h !== hud.sc) { hud.sc = h; $('#score').innerHTML = h; }
  }
  // health / ammo
  const hp = Math.max(0, Math.ceil(P.hp)); $('#hpBar i').style.width = hp + '%'; $('#hpBar').classList.toggle('low', hp < 35); if (hud.hp !== hp) { hud.hp = hp; $('#hpTxt').textContent = hp; }
  const am = W.melee ? '🔪' : S ? `${S.mag}<small>/${S.res}</small>` : '';
  if (am !== hud.am) { hud.am = am; $('#ammo').innerHTML = am; $('#ammo').classList.toggle('low', !!S && !W.melee && S.mag <= Math.ceil(W.mag * .25)); }
  const wn = W.n; if (wn !== hud.wn) { hud.wn = wn; $('#wpnName').textContent = wn; }
  const nd = '💣'.repeat(P.nades); if (nd !== hud.nd) { hud.nd = nd; $('#nades').textContent = nd; }
  const rl = t < P.reloadEnd; $('#reloadBar').classList.toggle('hidden', !rl); if (rl) $('#reloadBar i').style.width = ((t - P.reloadStart) / (P.reloadEnd - P.reloadStart) * 100) + '%';
  // crosshair
  const cone = (lerp(W.hip, W.ads, P.ads) * (P.spd > .3 ? 1.25 : 1) * (P.onG ? 1 : 1.8) + P.bloom) * Math.PI / 180;
  const gap = Math.max(4, Math.tan(cone) / Math.tan(CAM.fov / 2) * innerHeight / 2);
  const xh = $('#xh'); const showX = P.alive && !(W.scope && P.ads > .85) && !(P.ads > .9 && !P.tpp);
  xh.style.display = showX ? '' : 'none';
  if (showX) { const q = xh.children; q[0].style.top = (-gap - 9) + 'px'; q[1].style.top = gap + 'px'; q[2].style.left = (-gap - 9) + 'px'; q[3].style.left = gap + 'px'; xh.classList.toggle('enemy', !!P.autoOn || (t - P.aimT < .2)); }
  $('#scope').style.display = W.scope && P.ads > .85 && P.alive ? 'block' : 'none';
  // damage vignette
  const dv = clamp((t - P.lastDmg < .4 ? .8 : 0) + (P.hp < 35 && P.alive ? .35 + .15 * Math.sin(t * 6) : 0), 0, 1); $('#vig').style.opacity = dv;
  $('#spawnP').textContent = P.alive && t < P.prot ? '🛡️ حماية' : '';
  // feed fade
  if (G.feed.length && t - G.feed[0].t > 6) { G.feed.shift(); renderFeed(); }
  // damage direction indicators
  for (const el of [...$('#dmgDirs').children]) { const a = (t - el.__t) / 1.2; if (a >= 1) el.remove(); else { const rel = Math.atan2(el.__x - P.x, el.__z - P.z); const ang = -(rel - Math.atan2(-Math.sin(P.yaw), -Math.cos(P.yaw))); el.style.transform = `rotate(${ang}rad) translateY(-90px)`; el.style.opacity = 1 - a; } }
  drawMini();
  drawTags();
  if (SET.fps) { hud.fc = (hud.fc || 0) + 1; if (t - (hud.ft || 0) > 1) { $('#fpsBox').textContent = hud.fc + ' fps · ' + (R.triCount | 0) + ' tri'; hud.fc = 0; hud.ft = t; } } else if (hud.ft) { $('#fpsBox').textContent = ''; hud.ft = 0; }
  if (G.board && G.ov !== 'board' && !G.ov) showBoard(); else if (!G.board && G.ov === 'board') closeOv();
  else if (G.ov === 'board' && t - (G.boardAt || 0) > 1) { const bx = $('#ov .box'); if (bx) { const h = boardHTML(board(), G.M); if (bx.__h !== h) { bx.__h = h; bx.firstElementChild.outerHTML = h; } } G.boardAt = t; }
  if (G.ov === 'death') updateDeath();
  $('#rotate').style.display = TOUCH && innerHeight > innerWidth ? 'flex' : 'none';
}
function dmgDir(x, z) { const el = document.createElement('i'); el.__t = T(); el.__x = x; el.__z = z; $('#dmgDirs').appendChild(el); while ($('#dmgDirs').children.length > 4) $('#dmgDirs').firstChild.remove(); }
function drawMini() {
  const c = $('#mini'), x = c.getContext('2d'), mm = G.mini; if (!mm) return;
  const W = c.width, H = c.height, s = 3.3 * (W / 236) * 1.1;
  x.clearRect(0, 0, W, H); x.save(); x.beginPath(); x.arc(W / 2, H / 2, W / 2, 0, TAU); x.clip();
  x.translate(W / 2, H / 2); x.rotate(P.yaw); x.scale(s / mm.sc, s / mm.sc); x.translate(-(P.x - mm.b[0]) * mm.sc, -(P.z - mm.b[1]) * mm.sc);
  x.drawImage(mm.c, 0, 0);
  const t = T(), uav = t < G.uavUntil, me = meA();
  for (const a of G.actors.values()) {
    if (a.me || !a.alive) continue; const fr = isTeams() && a.team === myTeam();
    if (!fr && !uav && t - a.lastFire > 1.5) continue;
    x.fillStyle = fr ? '#4ea8ff' : '#ff4d5e'; x.beginPath(); x.arc((a.x - mm.b[0]) * mm.sc, (a.z - mm.b[1]) * mm.sc, 2.4 * mm.sc / s * 1.4, 0, TAU); x.fill();
  }
  x.restore();
  x.fillStyle = '#ffd23f'; x.beginPath(); x.moveTo(W / 2, H / 2 - 9); x.lineTo(W / 2 - 6, H / 2 + 6); x.lineTo(W / 2 + 6, H / 2 + 6); x.closePath(); x.fill();
}
function drawTags() {
  const t = T();
  for (const a of G.actors.values()) {
    if (a.me) continue;
    let show = false; const fr = isTeams() && a.team === myTeam();
    if (a.alive && G.inMatch) {
      const p = R.project(a.x, a.y + 2.05, a.z, tagPos);
      if (p && p[2] < (fr ? 70 : 45)) { show = fr || (P.aimId === a.id && t - P.aimT < 1.2) || (t - (a.aimSeen || 0) < 1); if (!fr && show && !(t - (a.aimSeen || 0) < 1)) show = false; }
      if (show) {
        if (!a.tag) { a.tag = document.createElement('div'); $('#tags').appendChild(a.tag); }
        const h = `${VC.speaking.has(a.id) ? '🗣️ ' : ''}${a.bot ? '🤖 ' : ''}${esc(a.name)}<div class="hp"><i style="width:${clamp(a.hp, 0, 100)}%"></i></div>`; if (a.tag.__h !== h) { a.tag.__h = h; a.tag.innerHTML = h; }
        a.tag.className = fr ? 'a' : 'b'; a.tag.style.transform = `translate(${p[0]}px,${p[1]}px) translate(-50%,-100%)`; a.tag.style.display = '';
      }
    }
    if (!show && a.tag) a.tag.style.display = 'none';
  }
}
function updateAimSeen() { // enemy name appears when you look at them
  if (!P.alive || !G.W) return; camAim(AIM); const tw = G.W.ray(AIM.ox, AIM.oy, AIM.oz, AIM.dx, AIM.dy, AIM.dz, 60); const h = rayActors(AIM.ox, AIM.oy, AIM.oz, AIM.dx, AIM.dy, AIM.dz, tw, meId()); if (h) h.a.aimSeen = T();
}

// ============================== overlays ==============================
function closeOv(only) { if (only && G.ov !== only) return; if (G.ov === 'board') G.board = false; G.ov = null; $('#ov').innerHTML = ''; G.paused = false; }
function ovHTML(h, k) { G.ov = k; $('#ov').innerHTML = h; }
function showDeath() {
  ovHTML(`<div class="death"><h2 id="dTitle"></h2><div class="mut" id="dSub"></div>
    <div class="chips" style="justify-content:center;margin:10px 0" id="dLoad"></div>
    <button class="big" id="dGo" style="max-width:320px" data-act="respawn">⏳</button></div>`, 'death');
  const ka = G.actors.get(P.killer), wn = P.kw === 9 ? 'قنبلة 💣' : WEAPONS[P.kw] ? WEAPONS[P.kw].n : '';
  $('#dTitle').innerHTML = P.killer === meId() || !ka ? '💀 متّ' : `💀 قتلك <span class="k">${esc(ka.name)}</span>`;
  $('#dSub').textContent = (wn ? 'بـ ' + wn : '') + (P.kh ? ' — ضربة رأس 🎯' : '');
  const gun = G.M && MODES[G.M.mode].id === 'gun';
  $('#dLoad').innerHTML = gun ? `<span class="mut">سلاحك الحالي: ${esc(WEAPONS[GUNGAME[Math.min(P.gs, GUNGAME.length - 1)]].n)}</span>` : PRIMARIES.map((w, i) => `<button class="chip ${PROF.pw === i ? 'on' : ''}" data-act="pw" data-i="${i}">${esc(WEAPONS[w].n)}</button>`).join('');
}
function updateDeath() { const b = $('#dGo'); if (!b) return; const left = 3 / FAST - (T() - P.deadAt); const txt = left > 0 ? `⏳ تنزل بعد ${Math.ceil(left)}` : '🪂 انزل'; if (b.textContent !== txt) b.textContent = txt; b.disabled = left > 0; if (left < -6 / FAST) spawnMe(); }
function showPause() {
  G.paused = true;
  ovHTML(`<div class="ovb"><div class="box"><div class="ttl">⏸ قائمة <button class="btn" data-act="resume">▶️ كمّل</button></div>
    ${settingsHTML()}
    ${vcAvail() ? `<div class="lbl">🎤 الصوت ${isTeams() ? '(فريقك بس يسمعك)' : '(اللي قريبين منك يسمعونك)'}</div><div class="row"><button class="btn" data-act="voice">${vcLabel()}</button>${VC.on ? '<button class="btn" data-act="vcOff">🔇 اطلع من الصوت</button>' : ''}</div>` : ''}
    <div class="row" style="margin-top:10px"><button class="btn" data-act="leave">🚪 اطلع من المباراة</button></div></div></div>`, 'pause');
}
function boardHTML(rows, M) {
  const teams = M && MODES[M.mode].teams; const gun = M && MODES[M.mode].id === 'gun';
  const tr = r => `<tr class="${teams ? (r.team === myTeam() ? 'a' : 'b') : ''} ${r.me ? 'me' : ''}"><td>${r.bot ? '🤖 ' : ''}${esc(r.name)}</td><td>${gun ? (r.gs + 1) + '/' + GUNGAME.length : r.k}</td><td>${r.d}</td></tr>`;
  return `<table class="tbl"><tr><th>اللاعب</th><th>${gun ? 'السلاح' : 'قتلات'}</th><th>موت</th></tr>${rows.map(tr).join('')}</table>`;
}
function showBoard() { ovHTML(`<div class="ovb pass"><div class="box" data-act="closeBoard">${boardHTML(board(), G.M)}<div class="mut" style="text-align:center;margin-top:8px">اضغط هنا أو 📋 عشان تقفلها</div></div></div>`, 'board'); G.boardAt = T(); }
function showEnd() {
  const M = G.M; if (!M) return; G.endShown = M.id; G.inMatch = false; P.alive = false; if (document.pointerLockElement) document.exitPointerLock();
  const mode = MODES[M.mode]; let title, won;
  if (mode.teams) { if (M.w === 'draw') { title = '🤝 تعادل'; won = null; } else { const wt = M.w === 'a' ? 0 : 1; won = wt === myTeam(); title = won ? '🏆 فاز فريقك!' : '❌ خسر فريقك'; } }
  else { won = M.w === meId(); const wa = G.actors.get(M.w); title = won ? '🥇 أنت الأول!' : `🥇 الفايز: ${esc(wa ? wa.name : (M.final || []).find(r => r[0] === M.w)?.[1] || '؟')}`; }
  STATS.g++; if (won) STATS.w++; saveStats(); won ? sfx.win() : sfx.lose();
  const rows = M.final ? M.final.map(r => ({ id: r[0], name: r[0] === meId() ? PROF.name : r[1], team: r[2], k: r[3], d: r[4], bot: !!r[5], me: r[0] === meId(), gs: r[3] })) : board();
  ovHTML(`<div class="ovb"><div class="box"><div class="winner">${title}</div>
    ${mode.teams ? `<div class="mut" style="text-align:center;margin-bottom:8px">${(M.sc || [0, 0])[myTeam()]} — ${(M.sc || [0, 0])[1 - myTeam()]}</div>` : ''}
    ${boardHTML(rows, M)}
    <div class="row" style="margin-top:12px">${G.host ? `<button class="big" data-act="again">🔄 ${G.room && G.room.local ? 'العب مرة ثانية' : 'رجوع للغرفة'}</button>` : `<div class="mut" style="text-align:center">⏳ انتظر المضيف…</div>`}<button class="btn" data-act="leave">🚪 خروج</button></div></div></div>`, 'end');
  setScr('end');
}

// ============================== menus ==============================
G.setup = Object.assign({ mode: 0, map: 0, nb: 4, df: 1 }, lsGet('ds_setup', {}));
function setScr(s) {
  G.scr = s; const inM = s === 'match';
  $('#hud').classList.toggle('hidden', !inM); $('#touch').classList.toggle('hidden', !(inM && TOUCH));
  if (!inM) { $('#tags').innerHTML = ''; for (const a of G.actors.values()) a.tag = null; }
  if (!inM && s !== 'end') closeOv();
  renderMenu();
}
function statBars(w) {
  const W = WEAPONS[w]; const dps = W.dmg * (W.pel || 1) * W.rpm / 60;
  const rows = [['ضرر', Math.min(1, W.dmg * (W.pel || 1) / 110)], ['سرعة', Math.min(1, W.rpm / 900)], ['مدى', Math.min(1, W.r1 / 120)], ['دقة', 1 - Math.min(1, W.hip / 7)], ['حركة', clamp((W.spd - .8) / .3, 0, 1)]];
  return `<div class="stat">${rows.map(r => `<span>${r[0]}</span><div class="bar"><i style="width:${Math.round(r[1] * 100)}%"></i></div>`).join('')}</div>`;
}
function settingsHTML() {
  const ch = (k, v, l) => `<button class="chip ${SET[k] === v ? 'on' : ''}" data-act="set" data-k="${k}" data-v="${v}">${l}</button>`;
  return `<div class="lbl">🖼️ الجرافيكس</div><div class="chips">${ch('q', 0, 'خفيف')}${ch('q', 1, 'متوسط')}${ch('q', 2, 'عالي')}</div>
  <div class="lbl">🎯 حساسية التصويب: <b id="sensV">${SET.sens.toFixed(1)}</b></div><input type="range" min="0.3" max="2.5" step="0.1" value="${SET.sens}" id="sens" style="width:100%">
  <div class="lbl">🔫 إطلاق تلقائي لما تصوّب على عدو (الوضع البسيط)</div><div class="chips">${ch('auto', 1, 'شغّال')}${ch('auto', 0, 'طافي')}</div>
  <div class="lbl">🎥 الكاميرا</div><div class="chips">${ch('tpp', 0, 'شخص أول')}${ch('tpp', 1, 'شخص ثالث')}</div>
  <div class="lbl">🔊 الصوت</div><div class="chips">${ch('snd', 1, 'شغّال')}${ch('snd', 0, 'طافي')}</div>
  <div class="lbl">📈 عرض الأداء</div><div class="chips">${ch('fps', 1, 'شغّال')}${ch('fps', 0, 'طافي')}</div>`;
}
function renderMenu() {
  const m = $('#menu'), s = G.scr;
  if (s === 'match' || s === 'end' || s === 'boot') { m.innerHTML = ''; return; }
  let h = '';
  const nn = netState === 'ok' ? '🟢 متصل' : netState === 'connecting' ? '⏳ نتصل بالسيرفر…' : `🔴 ما فيه اتصال (${esc(netWhy)}) — التدريب مع البوتات شغّال`;
  if (s === 'home') {
    h = `<div class="panel">
      <div><div class="logo">ضربة <b>الديرة</b></div><div class="sub">لعبة تصويب أونلاين — مع ربعك أو ضد البوتات</div></div>
      <div class="card"><div class="lbl" style="margin-top:0">اسمك</div><input class="inp" id="nameIn" maxlength="14" placeholder="اكتب اسمك" value="${esc(PROF.name)}" autocomplete="off"></div>
      <button class="big" data-act="quick">⚡ تدريب سريع ضد البوتات</button>
      <div class="g2"><button class="btn" data-act="go" data-s="online">👥 العب مع ربعك</button><button class="btn" data-act="go" data-s="custom">🛠️ تدريب مخصص</button></div>
      <div class="g3"><button class="btn" data-act="go" data-s="chars">🧍 الشخصية</button><button class="btn" data-act="go" data-s="guns">🔫 السلاح</button><button class="btn" data-act="go" data-s="settings">⚙️ إعدادات</button></div>
      <div class="card mut">🧍 ${esc(CHARS[PROF.ch].n)} · 🔫 ${esc(WEAPONS[PRIMARIES[PROF.pw]].n)} · 🏆 ${STATS.w} فوز · 💀 ${STATS.k} قتلة</div>
      <div class="netn">${nn}</div>
      ${TOUCH ? '' : '<div class="mut">🖱️ الكمبيوتر: WASD حركة · ماوس تصويب · كلك يسار إطلاق · يمين تصويب · R تعبئة · G قنبلة · F سكين · C زحلقة · T المايك · Q بدّل · V الكاميرا · Tab النتائج</div>'}
    </div>`;
  } else if (s === 'chars') {
    const L = look(PROF.ch, myCS());
    h = `<button class="back" data-act="go" data-s="home">→ رجوع</button><div class="panel"><div class="logo" style="font-size:28px">🧍 الشخصيات <span class="mut" style="font-size:14px">🏆 قتلاتك: ${kills()}</span></div>
      <div class="g4">${CHARS.map((c, i) => `<button class="ch ${PROF.ch === i ? 'on' : ''}" data-act="ch" data-i="${i}"><div class="sw"><i style="background:${hx(c.shirt)}"></i><i style="background:${hx(c.hc[0])}"></i><i style="background:${hx(c.pants)}"></i></div>${esc(c.n)}</button>`).join('')}</div>
      <div class="card"><b>${esc(CHARS[PROF.ch].n)}</b> <span class="mut">— ${esc(CHARS[PROF.ch].d)}</span>
        <div class="lbl">👕 السكنات</div><div class="chips">${CSKINS.map((k, i) => skinChip('csk', i, k, i ? [k.shirt != null ? k.shirt : CHARS[PROF.ch].shirt, k.vest != null ? k.vest : CHARS[PROF.ch].vest] : [CHARS[PROF.ch].shirt, CHARS[PROF.ch].vest], myCS() === i)).join('')}</div></div>
      <button class="big" data-act="go" data-s="home">✔️ تم</button></div>`;
  } else if (s === 'guns') {
    const sec = PROF.gtab === 's', list = sec ? SECONDARIES : PRIMARIES, cur = sec ? PROF.sw : PROF.pw, w = list[cur];
    h = `<button class="back" data-act="go" data-s="home">→ رجوع</button><div class="panel"><div class="logo" style="font-size:28px">🔫 الأسلحة <span class="mut" style="font-size:14px">🏆 قتلاتك: ${kills()}</span></div>
      <div class="g2"><button class="btn ${sec ? '' : 'on'}" data-act="gtab" data-t="p">🔫 أساسي</button><button class="btn ${sec ? 'on' : ''}" data-act="gtab" data-t="s">🔫 ثانوي</button></div>
      <div class="wl">${list.map((x, i) => `<button class="wi ${cur === i ? 'on' : ''}" data-act="${sec ? 'sw' : 'pw'}" data-i="${i}"><span class="nm">${esc(WEAPONS[x].n)}${myWS(x) ? ' <small style="color:var(--acc2)">🎨 ' + esc(WSKINS[myWS(x)].n) + '</small>' : ''}</span><span class="ty">${esc(WEAPONS[x].t)}</span></button>`).join('')}</div>
      <div class="card"><b>${esc(WEAPONS[w].n)}</b>${statBars(w)}
        <div class="lbl">🎨 سكنات ${esc(WEAPONS[w].n)}</div><div class="chips">${WSKINS.map((k, i) => skinChip('wsk', i, k, k.sw, myWS(w) === i, w)).join('')}</div></div>
      <button class="big" data-act="go" data-s="home">✔️ تم</button></div>`;
  } else if (s === 'settings') {
    h = `<button class="back" data-act="go" data-s="home">→ رجوع</button><div class="panel"><div class="logo" style="font-size:28px">⚙️ الإعدادات</div><div class="card">${settingsHTML()}</div><div class="mut">تغيير الجرافيكس يتطبق كامل بعد ما تعيد فتح اللعبة</div></div>`;
  } else if (s === 'online') {
    h = `<button class="back" data-act="go" data-s="home">→ رجوع</button><div class="panel"><div class="logo" style="font-size:28px">👥 العب مع ربعك</div>
      <div class="card"><div class="ttl">🏠 سوّ غرفة</div><div class="mut" style="margin-bottom:8px">تختار الخريطة والطور، وترسل الكود لربعك</div><button class="big" data-act="go" data-s="create">سوّ غرفة جديدة</button></div>
      <div class="card"><div class="ttl">🔗 ادخل غرفة</div><div class="row"><input class="inp" id="codeIn" inputmode="numeric" maxlength="4" placeholder="كود الغرفة" value="${esc(urlCode())}" style="flex:2"><button class="big" style="flex:1" data-act="join">دخول</button></div></div>
      <div class="netn">${nn}</div></div>`;
  } else if (s === 'create' || s === 'custom') {
    const st = G.setup, solo = s === 'custom';
    h = `<button class="back" data-act="go" data-s="${solo ? 'home' : 'online'}">→ رجوع</button><div class="panel"><div class="logo" style="font-size:28px">${solo ? '🛠️ تدريب مخصص' : '🏠 غرفة جديدة'}</div>
      ${setupHTML(st)}
      <button class="big" data-act="${solo ? 'solo' : 'create'}">${solo ? '▶️ ابدأ' : '🏠 سوّ الغرفة'}</button></div>`;
  } else if (s === 'joining') {
    h = `<div class="panel" style="justify-content:center;text-align:center"><div class="logo" style="font-size:30px">⏳ ندخلك الغرفة…</div><button class="btn" data-act="leave">إلغاء</button></div>`;
  } else if (s === 'lobby') {
    const M = G.M || newM(); const list = G.room ? G.room.peers() : [];
    const teams = MODES[M.mode].teams;
    const pl = p => { const pr = p.presence || {}; return `<div class="pl">${pr.h ? '👑' : '🎮'} ${esc(clean(pr.n, 14) || 'لاعب')}${p.sameTab ? '<span class="you">أنت</span>' : ''}${VC.speaking.has(p.peer) ? ' 🗣️' : pr.vo === 1 ? ' 🎧' : ''}</div>`; };
    const botsTxt = M.nb ? `<div class="pl">🤖 ${M.nb} بوت (${DIFF[M.df].n})</div>` : '';
    const lists = teams ? `<div class="teams"><div class="tm a"><h4>🔵 الفريق الأزرق</h4>${list.filter(p => (M.T || {})[p.peer] === 0).map(pl).join('')}</div><div class="tm b"><h4>🔴 الفريق الأحمر</h4>${list.filter(p => (M.T || {})[p.peer] === 1).map(pl).join('')}</div></div>${botsTxt}<div class="mut">البوتات تتوزع على الفريقين بالتساوي</div>` : `${list.map(pl).join('')}${botsTxt}`;
    h = `<div class="panel"><div class="logo" style="font-size:26px">🏠 الغرفة</div>
      <div class="card" style="text-align:center"><div class="mut">كود الغرفة</div><div class="code">${esc(G.room ? G.room.code : '')}</div><div class="g2"><button class="btn" data-act="share">📤 أرسل الرابط</button><button class="btn" data-act="copy">📋 نسخ</button></div></div>
      <div class="card"><div class="ttl">👥 اللاعبين (${list.length})${teams ? ' <button class="chip" data-act="swTeam">🔄 بدّل فريقي</button>' : ''}</div>${lists}</div>
      <div class="card">${G.host ? setupHTML(M, true) : `<div class="mut">🗺️ ${esc(MAPINFO[M.map].name)} · ${MODES[M.mode].e} ${esc(MODES[M.mode].n)}</div>`}</div>
      ${G.host ? '<button class="big" data-act="start">▶️ ابدأ المباراة</button>' : '<div class="mut" style="text-align:center">⏳ ننتظر المضيف يبدأ…</div>'}
      <button class="btn ${VC.on && VC.mic && !VC.muted ? 'on' : ''}" data-act="voice">${vcLabel()}</button>
      <div class="g2"><button class="btn" data-act="go" data-s="chars2">🧍 الشخصية</button><button class="btn" data-act="leave">🚪 خروج</button></div></div>`;
  } else if (s === 'chars2') { G.scr = 'chars'; renderMenu(); G.backTo = 'lobby'; return; }
  m.innerHTML = h;
  const ni = $('#nameIn'); if (ni) ni.addEventListener('input', () => { PROF.name = clean(ni.value, 14); saveProf(); });
  const se = $('#sens'); if (se) se.addEventListener('input', () => { SET.sens = +se.value; $('#sensV').textContent = SET.sens.toFixed(1); saveSet(); });
}
const hx = n => '#' + (n >>> 0).toString(16).padStart(6, '0');
function skinChip(act, i, k, sw, on, w) {
  const locked = kills() < (k.k | 0);
  return `<button class="chip ${on ? 'on' : ''}" style="${locked ? 'opacity:.55' : ''}" data-act="${act}" data-i="${i}"${w != null ? ` data-w="${w}"` : ''}><span style="display:inline-flex;gap:2px;vertical-align:middle;margin-inline-end:4px"><i style="width:11px;height:11px;border-radius:3px;background:${hx(sw[0])}"></i><i style="width:11px;height:11px;border-radius:3px;background:${hx(sw[1])}"></i></span>${esc(k.n)}${locked ? ' 🔒' + k.k : ''}</button>`;
}
function setupHTML(st, live) {
  const k = live ? 'M' : 'S';
  const chip = (key, v, l) => `<button class="chip ${st[key] === v ? 'on' : ''}" data-act="setup" data-t="${k}" data-k="${key}" data-v="${v}">${l}</button>`;
  return `<div class="lbl" style="margin-top:0">🗺️ الخريطة</div><div class="g3">${MAPINFO.map((m, i) => `<button class="mp ${st.map === i ? 'on' : ''}" data-act="setup" data-t="${k}" data-k="map" data-v="${i}" style="border-top:3px solid ${m.col}"><b>${m.e} ${esc(m.name)}</b><div>${esc(m.sz)}</div></button>`).join('')}</div>
    <div class="mut" style="margin-top:4px">${esc(MAPINFO[st.map].d)}</div>
    <div class="lbl">🎮 الطور</div><div class="chips">${MODES.map((m, i) => chip('mode', i, m.e + ' ' + m.n)).join('')}</div><div class="mut" style="margin-top:4px">${esc(MODES[st.mode].d)}</div>
    <div class="lbl">🤖 البوتات</div><div class="chips">${[0, 2, 4, 6, 8, 10].map(n => chip('nb', n, n)).join('')}</div>
    <div class="lbl">💪 صعوبة البوتات</div><div class="chips">${DIFF.map((d, i) => chip('df', i, d.n)).join('')}</div>`;
}
function urlCode() { try { const r = new URLSearchParams(location.search).get('r'); return /^\d{4}$/.test(r || '') ? r : ''; } catch (e) { return ''; } }
function needName() { const ni = $('#nameIn'); if (ni) { PROF.name = clean(ni.value, 14); saveProf(); } if (!PROF.name) { PROF.name = 'لاعب ' + (100 + rint(900)); saveProf(); } return true; }
const ACT = {
  go(b) { const s = b.dataset.s; if ((s === 'home') && G.backTo === 'lobby' && G.room) { G.backTo = null; G.scr = 'lobby'; if (G.room) G.room.presence(looksPatch()); renderMenu(); return; } G.scr = s; renderMenu(); },
  quick() { needName(); G.setup = Object.assign({}, G.setup, { mode: 0, map: rint(MAPS.length), nb: Math.max(G.setup.nb || 4, 4) }); createRoom(true); },
  solo() { needName(); lsSet('ds_setup', G.setup); createRoom(true); },
  create() { needName(); lsSet('ds_setup', G.setup); createRoom(false); },
  join() { needName(); const c = clean(($('#codeIn') || {}).value, 4).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)); if (!/^\d{4}$/.test(c)) { toast('🔢 الكود 4 أرقام'); return; } joinRoom(c); },
  ch(b) { PROF.ch = +b.dataset.i; saveProf(); renderMenu(); },
  csk(b) { const i = +b.dataset.i, k = CSKINS[i]; if (kills() < (k.k | 0)) { toast(`🔒 ${k.n} ينفتح بعد ${k.k} قتلة (عندك ${kills()})`); return; } PROF.csk[PROF.ch] = i; saveProf(); renderMenu(); },
  wsk(b) { const i = +b.dataset.i, w = +b.dataset.w, k = WSKINS[i]; if (kills() < (k.k | 0)) { toast(`🔒 ${k.n} ينفتح بعد ${k.k} قتلة (عندك ${kills()})`); return; } PROF.wsk[w] = i; saveProf(); renderMenu(); },
  gtab(b) { PROF.gtab = b.dataset.t; saveProf(); renderMenu(); },
  sw(b) { PROF.sw = +b.dataset.i; saveProf(); renderMenu(); },
  pw(b) { PROF.pw = +b.dataset.i; saveProf(); if (G.scr === 'match') { showDeath(); } else renderMenu(); },
  set(b) { const k = b.dataset.k, v = +b.dataset.v; SET[k] = v; saveSet(); if (k === 'tpp') P.tpp = !!v; if (k === 'q') R.resize(resScale()); if (G.ov === 'pause') showPause(); else renderMenu(); },
  setup(b) { const k = b.dataset.k, v = +b.dataset.v; const tgt = b.dataset.t === 'M' ? G.M : G.setup; if (!tgt) return; tgt[k] = v; if (k === 'mode') { tgt.lim = MODES[v].lim; tgt.dur = MODES[v].dur; } if (b.dataset.t !== 'M') lsSet('ds_setup', G.setup); else G.pub.M = ''; renderMenu(); },
  start() { if (G.host) { if (G.M) G.pub.M = ''; hostStart(); } },
  again() { if (!G.host || !G.M) return; if (G.room && G.room.local) { hostStart(); return; } G.M.ph = 'lobby'; G.pub.M = ''; toLobby(); },
  leave() { leaveRoom(); },
  resume() { closeOv(); },
  voice() { vcButton().then(() => { if (G.ov === 'pause') showPause(); else renderMenu(); }); setTimeout(() => { if (G.ov === 'pause') showPause(); else if (G.scr === 'lobby') renderMenu(); }, 50); },
  vcOff() { vcLeave(); if (G.ov === 'pause') showPause(); },
  closeBoard() { G.board = false; closeOv('board'); },
  respawn() { if (respawnReady()) spawnMe(); },
  swTeam() { const cur = myTeam(); G.wq = (G.wq || 0) + 1; if (G.host) { G.M.T[meId()] = 1 - cur; G.pub.M = ''; renderMenu(); } else G.room.presence({ wt: 1 - cur, wq: G.wq }); },
  share() { const url = location.href.split('?')[0].split('#')[0] + '?r=' + G.room.code; const text = `تعال العب معي ضربة الديرة 🔫 كود الغرفة: ${G.room.code}`; if (navigator.share) navigator.share({ title: 'ضربة الديرة', text, url }).catch(() => { }); else ACT.copy(url); },
  copy(v) { const s = typeof v === 'string' ? v : G.room.code; if (navigator.clipboard) navigator.clipboard.writeText(s).then(() => toast('📋 انسخ!'), () => toast(s)); else toast(s); },
};
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; const f = ACT[b.dataset.act]; if (f) { e.preventDefault(); auInit(); sfx.click(); f(b); } });

// ============================== menu showroom ==============================
let showroom = null;
function showroomMesh() {
  const B = [];
  const box = (x, z, w, d, h, y, m, c) => B.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, y0: y || 0, y1: (y || 0) + h, m, c: hex(c) });
  box(0, 0, 80, 80, .2, -.2, 7, 0xcfae80); box(0, 0, 3.2, 3.2, .18, 0, 6, 0x3a3f46); box(0, 0, 2.6, 2.6, .02, .18, 10, 0xff8a1f);
  box(-4, -6, 6.1, 2.44, 2.6, 0, 3, 0x2c5d9e); box(3.5, -7, 2.44, 6.1, 2.6, 0, 3, 0xb0392b); box(3.5, -7, 2.44, 6.1, 2.6, 2.6, 3, 0x3f7d4a);
  box(-1.5, -4.2, 1.2, 1.2, 1.2, 0, 4, 0x9a6b3c); box(-.3, -4.4, 1.2, 1.2, 1.2, 0, 4, 0x9a6b3c); box(-1, -4.3, 1.2, 1.2, 1.2, 1.2, 4, 0x8a5b2c);
  box(-8, -12, 10, 6, 5, 0, 1, 0xc9a477); box(9, -14, 8, 6, 6, 0, 1, 0xb8956a); box(-2.6, 2.5, 3, .7, .9, 0, 1, 0xa89466); box(4, 1, .7, 3, .9, 0, 1, 0xa89466);
  return buildStatic(B);
}
const SR = { rot: 0 };
function renderShowroom(dt) {
  if (!showroom) { showroom = showroomMesh(); }
  if (R.__static !== 'show') { R.setStatic(showroom); R.__static = 'show'; G.mapIdx = -1; G.W = null; Object.assign(R.env, { sun: (() => { const v = [.6, .45, .55], n = Math.hypot(...v); return v.map(x => x / n); })(), sunCol: hex(0xffd9a8), sky: hex(0xb7c9e6), gnd: hex(0x8a6a48), fog: hex(0xe8c9a0), fogR: [18, 70], top: hex(0x3f6fb5), hor: hex(0xf5c58a), cloud: .5 }); }
  SR.rot += dt * .35;
  const port = innerHeight > innerWidth;
  if (port) R.camera(0, 1.25, 5.8, 0, -.25, 1.05);
  else R.camera(1.7, 1.15, 4.2, 0, -.05, .8);
  const showW = G.scr === 'guns' ? (PROF.gtab === 's' ? SECONDARIES[PROF.sw] : PRIMARIES[PROF.pw]) : PRIMARIES[PROF.pw];
  const a = { x: 0, y: .18, z: 0, yaw: SR.rot, pitch: 0, ch: PROF.ch, me: true, w: showW, walk: 0, spd: 0, alive: true, deadT: 9 };
  if (G.scr === 'guns') { // weapons screen: the selected gun alone, big and turning on the stand
    const small = (WEAPONS[showW].model === 'pistol' || WEAPONS[showW].model === 'deagle' || WEAPONS[showW].model === 'uzi'), sc = small ? 5.2 : 3.2;
    const gm = MS[9]; M4.ident(gm); M4.tr(gm, 0, port ? 1.25 : 1.05, 0); M4.ry(gm, SR.rot * 1.2 + 1.2); M4.rx(gm, Math.sin(SR.rot * .8) * .12); M4.sc(gm, sc, sc, sc);
    drawGun(R.opaque, gm, showW, myWS(showW));
  } else drawSoldier(R.opaque, a);
  R.time += dt; R.render();
}

// ============================== world rendering ==============================
function renderWorld(dt) {
  if (R.__static !== 'map' + G.mapIdx && G.map) { R.setStatic(buildStatic(G.map.boxes)); R.__static = 'map' + G.mapIdx; Object.assign(R.env, G.map.theme); }
  R.camera(CAM.x, CAM.y, CAM.z, CAM.yaw, CAM.pitch, CAM.fov);
  const t = T();
  for (const a of G.actors.values()) {
    if (a.me) {
      if (!(P.tpp && P.ads < .5) && P.alive) continue;
      const me = { me: true, x: P.x, y: P.y, z: P.z, yaw: P.yaw, pitch: P.pitch, ch: PROF.ch, w: curW(), walk: P.walk, spd: P.spd, slideK: P.slideK, alive: P.alive, deadT: P.alive ? 9 : t - P.deadAt, flash: t - P.firedAt < .05, groundY: P.y };
      drawSoldier(R.opaque, me, isTeams() ? TEAMC[myTeam() === myTeam() ? 0 : 1] : null); continue;
    }
    if (!a.alive && a.deadT > 4.5) continue;
    const mark = isTeams() ? TEAMC[a.team === myTeam() ? 0 : 1] : TEAMC[1];
    drawSoldier(R.opaque, a, mark);
  }
  drawFX(); drawViewmodel();
  R.time += dt; R.render();
}

// ============================== main loop ==============================
let last = T();
function frame() {
  const t = T(); let dt = Math.min(.12, t - last); last = t;
  R.resize(resScale());
  if (G.room) { processPeers(); }
  if (G.scr === 'match' || G.scr === 'end') {
    // fixed-ish sub-steps keep game time = real time even on slow phones
    const n = Math.max(1, Math.ceil(dt / .034)), h = dt / n;
    for (let i = 0; i < n; i++) {
      if (G.scr === 'match' && (!G.paused || !G.room || !G.room.local)) playerUpdate(h);
      if (G.host) hostTick(h);
      updateFX(h);
    }
    if (G.scr === 'match') updateAimSeen();
    updateActors(dt); updateCamera(dt);
    const me = G.actors.get(meId()); if (me) { me.x = P.x; me.y = P.y; me.z = P.z; me.yaw = P.yaw; me.pitch = P.pitch; me.alive = P.alive; me.team = myTeam(); me.hp = P.hp; me.name = PROF.name; me.ch = PROF.ch; me.spd = P.spd; me.w = curW(); }
    renderWorld(dt);
    if (G.scr === 'match') hud(dt);
  } else renderShowroom(dt);
  netTick();
  // lost host / room not found
  if (G.room && !G.host) {
    const since = t - G.hostSeen;
    if (G.scr === 'joining' && t - G.joinAt > 9) { toast('🤔 ما لقينا غرفة بهالكود'); leaveRoom(); }
    else if (G.scr !== 'joining' && since > 7) { toast('👋 المضيف طلع — انتهت الغرفة'); leaveRoom(); }
  }
  requestAnimationFrame(frame);
}

// ============================== boot ==============================
async function boot() {
  if (!R) { $('#bootMsg').innerHTML = '😕 جهازك أو المتصفح ما يدعم WebGL2 — جرّب متصفح أحدث (Chrome أو Safari)'; return; }
  P.tpp = !!SET.tpp;
  $('#boot').remove(); setScr('home'); requestAnimationFrame(frame);
  if (urlCode()) { G.scr = 'online'; renderMenu(); }
  // network (optional: practice works offline)
  try {
    const cfg = window.FB_CONFIG || {};
    if (!cfg.apiKey || !cfg.databaseURL) { netState = 'off'; netWhy = 'CFG'; renderMenu(); return; }
    const t0 = Date.now(); while (!window.FBAPI && Date.now() - t0 < 20000) await new Promise(r => setTimeout(r, 150));
    if (!window.FBAPI) { netState = 'off'; netWhy = 'SDK'; renderMenu(); return; }
    NET = await window.makeNet(window.FBAPI, cfg); netState = 'ok'; renderMenu();
  } catch (e) { console.warn(e); netState = 'off'; netWhy = (e && (e.code || e.message)) || 'x'; renderMenu(); }
}
window.__dbg = { VC, vcCan, vcButton, G, P, IN, ACT, R, SET, PROF, die, applyDamage, get W() { return G.W; }, spawnMe, emit, board, shoot, melee, throwNade, hostStart, createRoom, joinRoom, leaveRoom, WEAPONS, MAPS, CHARS, rayActors, meId, myTeam, curW, curS };
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
boot();
