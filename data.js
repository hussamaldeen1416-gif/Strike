// ضربة الديرة — weapons, characters, modes and maps
import { hex } from './engine.js';

// spread in degrees, ranges in meters, rl = reload seconds, spd = move speed multiplier
export const WEAPONS = [
  {id:'m4',  n:'إم-فور',        t:'رشاش هجومي', dmg:26, hm:1.5, rpm:720, mag:30, res:150, rl:2.0, hip:2.4, ads:0.45, rec:0.55, r0:28, r1:55, dmin:0.72, spd:0.96, zoom:1.45, auto:1, model:'ar'},
  {id:'ak',  n:'كلاشنكوف',      t:'رشاش هجومي', dmg:31, hm:1.5, rpm:600, mag:30, res:150, rl:2.3, hip:2.8, ads:0.65, rec:0.85, r0:32, r1:60, dmin:0.7,  spd:0.94, zoom:1.45, auto:1, model:'ak'},
  {id:'mp5', n:'إم بي-5',       t:'رشاش خفيف',  dmg:20, hm:1.4, rpm:850, mag:32, res:192, rl:1.8, hip:2.6, ads:1.0,  rec:0.4,  r0:12, r1:30, dmin:0.6,  spd:1.06, zoom:1.3,  auto:1, model:'smg'},
  {id:'sg',  n:'شوزن',          t:'بندقية صيد', dmg:15, pel:8, hm:1.2, rpm:72, mag:6, res:30, rl:2.6, hip:6.0, ads:4.6, rec:2.6, r0:6, r1:15, dmin:0.25, spd:1.0, zoom:1.15, auto:0, model:'sg'},
  {id:'sn',  n:'قنّاص',          t:'بندقية قنص', dmg:110, hm:1.6, rpm:42, mag:5, res:25, rl:3.0, hip:7.0, ads:0.0, rec:3.6, r0:100, r1:160, dmin:0.9, spd:0.88, zoom:4.0, scope:1, auto:0, model:'sniper'},
  {id:'lmg', n:'رشاش ثقيل',     t:'رشاش ثقيل',  dmg:25, hm:1.4, rpm:680, mag:75, res:150, rl:4.0, hip:3.2, ads:0.85, rec:0.7, r0:30, r1:60, dmin:0.72, spd:0.85, zoom:1.4, auto:1, model:'lmg'},
  {id:'dmr', n:'بندقية دقيقة',  t:'نصف آلية',   dmg:46, hm:1.6, rpm:330, mag:15, res:60, rl:2.4, hip:2.6, ads:0.15, rec:1.3, r0:45, r1:90, dmin:0.8, spd:0.93, zoom:2.2, auto:0, model:'dmr'},
  {id:'pst', n:'مسدس',          t:'سلاح ثانوي', dmg:30, hm:1.4, rpm:420, mag:12, res:48, rl:1.4, hip:1.8, ads:0.7, rec:0.9, r0:12, r1:28, dmin:0.6, spd:1.08, zoom:1.2, auto:0, model:'pistol'},
  {id:'kn',  n:'سكين',          t:'قتال قريب',  dmg:100, melee:1, rpm:110, mag:0, res:0, rl:0, hip:0, ads:0, rec:0, r0:2.4, r1:2.4, dmin:1, spd:1.1, zoom:1, auto:0, model:'knife'},
  {id:'scar',n:'سكار',          t:'رشاش هجومي', dmg:34, hm:1.5, rpm:560, mag:20, res:120, rl:2.2, hip:2.6, ads:0.5, rec:1.0, r0:35, r1:65, dmin:0.72, spd:0.93, zoom:1.5, auto:1, model:'scar'},
  {id:'uzi', n:'عوزي',          t:'رشاش خفيف',  dmg:17, hm:1.3, rpm:1000, mag:32, res:224, rl:1.7, hip:3.0, ads:1.4, rec:0.35, r0:9, r1:22, dmin:0.55, spd:1.08, zoom:1.2, auto:1, model:'uzi'},
  {id:'aug', n:'أوغ',           t:'رشاش هجومي', dmg:25, hm:1.5, rpm:750, mag:30, res:150, rl:2.3, hip:2.4, ads:0.35, rec:0.5, r0:30, r1:60, dmin:0.72, spd:0.95, zoom:1.7, auto:1, model:'aug'},
  {id:'asg', n:'شوزن آلي',      t:'بندقية صيد', dmg:12, pel:8, hm:1.2, rpm:220, mag:8, res:40, rl:2.8, hip:6.5, ads:5.2, rec:1.6, r0:5, r1:13, dmin:0.25, spd:0.98, zoom:1.15, auto:0, model:'sg2'},
  {id:'bar', n:'قنّاص ثقيل',     t:'بندقية قنص', dmg:160, hm:1.5, rpm:34, mag:5, res:20, rl:3.4, hip:8.0, ads:0.0, rec:4.5, r0:120, r1:200, dmin:0.9, spd:0.82, zoom:5.0, scope:1, auto:0, model:'barrett'},
  {id:'dgl', n:'ديزرت إيقل',    t:'سلاح ثانوي', dmg:52, hm:1.5, rpm:200, mag:7, res:35, rl:1.9, hip:2.4, ads:0.6, rec:2.2, r0:15, r1:35, dmin:0.65, spd:1.06, zoom:1.25, auto:0, model:'deagle'},
];
export const PRIMARIES = [0,1,2,3,4,5,6,9,10,11,12,13];
export const SECONDARIES = [7,14];
export const PISTOL = 7, KNIFE = 8;
export const GUNGAME = [7,14,10,2,3,1,9,11,5,6,4,8];
export const NADE = {dmg:120, rad:5.5, fuse:2.1, n:2};

export const CHARS = [
  {n:'صقر',  d:'قوات الصحراء',  shirt:0xc8a46e, pants:0x8a6a44, vest:0x6b5a3a, skin:0xc68c5a, boots:0x3a2a1a, head:'ghutra',  hc:[0xf4f4f2,0xc0392b], camo:1},
  {n:'ذيب',  d:'العمليات السوداء', shirt:0x26282d, pants:0x1c1d21, vest:0x34373d, skin:0xb07a52, boots:0x111111, head:'balaclava', hc:[0x17181c,0x3ddc84]},
  {n:'نمر',  d:'وحدة الغابات',  shirt:0x56703c, pants:0x3c4f2c, vest:0x657548, skin:0xd9a274, boots:0x2a2418, head:'helmet',  hc:[0x4d5c38,0x2b2f22], camo:1},
  {n:'شبح',  d:'القنّاص الصامت', shirt:0x5d636a, pants:0x45494f, vest:0x2f3338, skin:0xd9a274, boots:0x1f1f1f, head:'skull',   hc:[0xe8e4d8,0x111111]},
  {n:'فارس', d:'الحرس الملكي',  shirt:0x2b5291, pants:0x1f2d4a, vest:0x173058, skin:0xc68c5a, boots:0x14161c, head:'beret',   hc:[0xb3262e,0xd4af37]},
  {n:'ريم',  d:'الاستطلاع',     shirt:0x93303d, pants:0x2b2b33, vest:0x3a3a44, skin:0xe0b08a, boots:0x1a1a1a, head:'cap',     hc:[0x222326,0x4a2e1a]},
  {n:'ثلج',  d:'وحدة الجبال',   shirt:0xe6ebf0, pants:0xcfd6dd, vest:0x9aa6b2, skin:0xe8b896, boots:0x6a7480, head:'snow',    hc:[0xf4f6f8,0x46c2ff], camo:1},
  {n:'عقرب', d:'المرتزقة',      shirt:0xd9771f, pants:0x3a3a3a, vest:0x2a2a2a, skin:0xb5835a, boots:0x1a1a1a, head:'gasmask', hc:[0x2a2a2a,0x9aa0a6]},
  {n:'بدر',  d:'الضفادع البشرية', shirt:0x1d2b3a, pants:0x16212c, vest:0x2b3d4f, skin:0xc68c5a, boots:0x0f141a, head:'navy',   hc:[0x1d2b3a,0x46c2ff]},
  {n:'جازي', d:'فارس البادية',  shirt:0xe8e0cc, pants:0x6b5a44, vest:0x5a3a22, skin:0xb5835a, boots:0x3a2a1a, head:'ghutra',  hc:[0xc0392b,0xf4f4f2]},
  {n:'نورة', d:'قنّاصة الظل',   shirt:0x3b4a3a, pants:0x2e3a2d, vest:0x4a5a44, skin:0xe0b08a, boots:0x1f1f1f, head:'hood',    hc:[0x3b4a3a,0x1a1a1a], camo:1},
  {n:'رعد',  d:'المدرّع الثقيل', shirt:0x3a3f46, pants:0x2c3036, vest:0x5d6670, skin:0xc68c5a, boots:0x1a1a1a, head:'heavy',   hc:[0x4a525c,0xff6a2e], bulk:1.18},
  {n:'سيف',  d:'القوات الخاصة', shirt:0x1c2a44, pants:0x161f30, vest:0x101826, skin:0xd9a274, boots:0x0d0d0d, head:'police',  hc:[0x101826,0xd4af37]},
  {n:'ظل',   d:'النينجا',       shirt:0x161618, pants:0x0e0e10, vest:0x222226, skin:0xd9a274, boots:0x0a0a0a, head:'ninja',   hc:[0x141416,0xc0392b]},
];
// weapon skins: c1/m1 = body, c2/m2 = wood & furniture, c3/m3 = dark small parts. k = total kills needed
export const WSKINS = [
  {n:'أصلي',      k:0,   sw:[0x2d2f33,0x7a4a24]},
  {n:'صحراوي',    k:0,   c1:0xc2a272, m1:13, c2:0x8a6a44, m2:13, sw:[0xc2a272,0x8a6a44]},
  {n:'غابة',      k:0,   c1:0x56703c, m1:13, c2:0x2e3b24, m2:13, sw:[0x56703c,0x2e3b24]},
  {n:'ثلجي',      k:0,   c1:0xe8edf2, m1:13, c2:0xaab4be, m2:13, sw:[0xe8edf2,0xaab4be]},
  {n:'أحمر ناري', k:10,  c1:0xc0392b, m1:6, c2:0x1a1a1a, m2:6, sw:[0xc0392b,0x1a1a1a]},
  {n:'أزرق ملكي', k:25,  c1:0x2b5291, m1:6, c2:0xd4af37, m2:6, sw:[0x2b5291,0xd4af37]},
  {n:'كربون',     k:40,  c1:0x2a2c30, m1:14, c2:0x55595f, m2:14, c3:0x111111, sw:[0x2a2c30,0x55595f]},
  {n:'ذهبي',      k:75,  c1:0xd4af37, m1:6, c2:0x2a2a2a, m2:6, c3:0xb8902a, m3:6, sw:[0xd4af37,0xb8902a]},
  {n:'نيون',      k:120, c1:0x14181d, m1:6, c2:0x00e5ff, m2:15, c3:0x00e5ff, m3:15, sw:[0x14181d,0x00e5ff]},
  {n:'كريستال',   k:200, c1:0x2f9fd0, m1:15, c2:0x7fd8f5, m2:15, c3:0x1d5f80, m3:6, sw:[0x2f9fd0,0x7fd8f5]},
];
// character outfits (any character). k = total kills needed
export const CSKINS = [
  {n:'أصلي',   k:0},
  {n:'ليلي',   k:0,   shirt:0x22262c, pants:0x1a1d22, vest:0x2f343b, boots:0x111111, camo:0},
  {n:'صحراوي', k:0,   shirt:0xc8a46e, pants:0x8a6a44, vest:0x6b5a3a, camo:1},
  {n:'غابة',   k:5,   shirt:0x56703c, pants:0x3c4f2c, vest:0x657548, camo:1},
  {n:'ثلجي',   k:15,  shirt:0xe6ebf0, pants:0xcfd6dd, vest:0x9aa6b2, camo:1, h0:0xf4f6f8},
  {n:'دموي',   k:30,  shirt:0x8a1c24, pants:0x2a2a2a, vest:0x1a1a1a, h0:0x8a1c24, camo:0},
  {n:'ملكي',   k:60,  shirt:0x1f3a6e, pants:0x1a2236, vest:0xd4af37, vm:6, h0:0xd4af37, camo:0},
  {n:'نيون',   k:100, shirt:0x14181d, pants:0x101317, vest:0x00e5ff, vm:15, h1:0x00e5ff, camo:0},
  {n:'ذهبي',   k:150, shirt:0xd4af37, pants:0x2a2a2a, vest:0xb8902a, vm:6, h0:0xd4af37, camo:0},
];
export const BOTNAMES = ['سالم','مشاري','نايف','بدر','حمد','راشد','ماجد','زياد','وليد','فيصل','عمر','يوسف','سلطان','هزاع'];

export const MODES = [
  {id:'tdm', n:'فريق ضد فريق',  e:'⚔️', d:'فريقين — أول فريق يوصل لحد القتلات يفوز', lim:30, dur:480, teams:1},
  {id:'ffa', n:'الكل ضد الكل',  e:'💥', d:'كل واحد لحاله — أول واحد يوصل للحد يفوز',   lim:20, dur:480, teams:0},
  {id:'gun', n:'سباق الأسلحة',  e:'🔫', d:'كل قتلة تعطيك سلاح جديد — آخر سلاح سكين!', lim:GUNGAME.length, dur:600, teams:0},
];

// ---------------- map building helpers ----------------
function builder(){
  const B = [];
  const A = {
    B,
    box(x, z, w, d, h, y, m, c, o){ B.push({x0:x-w/2, x1:x+w/2, z0:z-d/2, z1:z+d/2, y0:y||0, y1:(y||0)+h, m, c:hex(c), nc:!!(o&&o.nc), nj:!!(o&&o.nj)}); },
    deco(cx, cy, cz, sx, sy, sz, yaw, pitch, m, c, roll){ B.push({rot:1, cx, cy, cz, sx, sy, sz, yaw:yaw||0, pitch:pitch||0, roll:roll||0, m, c:hex(c), nc:true}); },
    // wall with openings along an axis. axis 'x': runs along x at z; 'z': runs along z at x
    wall(axis, c0, c1, at, t, h, y, m, col, opens){
      const L = c1-c0, mid = (c0+c1)/2; const ops = (opens||[]).map(o=>({a:mid+o[0], w:o[1], y0:o[2]||0, y1:o[3]||h})).sort((p,q)=>p.a-q.a);
      let cur = c0;
      const seg = (s0, s1, yy0, yy1) => { if(s1-s0<0.02 || yy1-yy0<0.02) return; const cc=(s0+s1)/2;
        if(axis==='x') A.box(cc, at, s1-s0, t, yy1-yy0, (y||0)+yy0, m, col); else A.box(at, cc, t, s1-s0, yy1-yy0, (y||0)+yy0, m, col); };
      for(const o of ops){ seg(cur, o.a-o.w/2, 0, h); seg(o.a-o.w/2, o.a+o.w/2, 0, o.y0); seg(o.a-o.w/2, o.a+o.w/2, o.y1, h); cur=o.a+o.w/2; }
      seg(cur, c1, 0, h);
    },
    // hollow building. o.doors/o.wins: {n:[[offset,width]], ...}; windows [offset,width,sill,top]
    room(x, z, w, d, h, o){
      const t=o.t||0.35, m=o.m||1, c=o.c||0xd9c4a0, doors=o.doors||{}, wins=o.wins||{};
      const op = s => [...(doors[s]||[]).map(q=>[q[0], q[1], 0, q[2]||2.55]), ...(wins[s]||[]).map(q=>[q[0], q[1], q[2]||1.05, q[3]||2.15])];
      A.wall('x', x-w/2, x+w/2, z-d/2+t/2, t, h, 0, m, c, op('n'));
      A.wall('x', x-w/2, x+w/2, z+d/2-t/2, t, h, 0, m, c, op('s'));
      A.wall('z', z-d/2+t, z+d/2-t, x-w/2+t/2, t, h, 0, m, c, op('w'));
      A.wall('z', z-d/2+t, z+d/2-t, x+w/2-t/2, t, h, 0, m, c, op('e'));
      if(o.roof!==false){
        A.box(x, z, w+0.3, d+0.3, 0.25, h, o.rm||5, o.rc||0x8f877c);
        if(o.par){ const ph=o.par.h||0.9, gp=o.par.gaps||{}, Y=h+0.25, pt=0.3, g=s=>(gp[s]||[]).map(q=>[q[0], q[1], 0, ph]);
          A.wall('x', x-w/2-0.15, x+w/2+0.15, z-d/2-0.15+pt/2, pt, ph, Y, m, c, g('n'));
          A.wall('x', x-w/2-0.15, x+w/2+0.15, z+d/2+0.15-pt/2, pt, ph, Y, m, c, g('s'));
          A.wall('z', z-d/2-0.15+pt, z+d/2+0.15-pt, x-w/2-0.15+pt/2, pt, ph, Y, m, c, g('w'));
          A.wall('z', z-d/2-0.15+pt, z+d/2+0.15-pt, x+w/2+0.15-pt/2, pt, ph, Y, m, c, g('e'));
        }
      }
      // floor tiles inside (visual)
      A.box(x, z, w-2*t, d-2*t, 0.03, 0, 5, o.fc||0x9c8f80, {nc:1});
    },
    // solid steps. dir: 'n' (-z) 's' (+z) 'e' (+x) 'w' (-x); (x,z) = bottom edge center
    stairs(x, z, dir, width, n, top, run, m, c){
      const rise=top/n;
      for(let i=0;i<n;i++){ const k=(i+0.5)*run, hh=(i+1)*rise;
        if(dir==='n') A.box(x, z-k, width, run, hh, 0, m, c); else if(dir==='s') A.box(x, z+k, width, run, hh, 0, m, c);
        else if(dir==='e') A.box(x+k, z, run, width, hh, 0, m, c); else A.box(x-k, z, run, width, hh, 0, m, c); }
    },
    crate(x, z, s, lv, c){ for(let i=0;i<(lv||1);i++){ A.box(x, z, s, s, s, i*s, 4, c||0x9a6b3c); } },
    barrel(x, z, c){ A.box(x, z, 0.7, 0.7, 1.0, 0, 6, c||0xb03a2e); A.box(x, z, 0.74, 0.74, 0.06, 0.3, 6, 0x333333, {nc:1}); A.box(x, z, 0.74, 0.74, 0.06, 0.7, 6, 0x333333, {nc:1}); },
    palm(x, z, h){ h=h||5.5; A.box(x, z, 0.38, 0.38, h, 0, 4, 0x8a6a45);
      for(let i=0;i<7;i++){ const a=i/7*Math.PI*2; A.deco(x+Math.sin(a)*1.1, h+0.15, z+Math.cos(a)*1.1, 0.55, 0.07, 2.4, a, 0.42, 9, i%2?0x4f8a3a:0x3f7a30); }
      A.box(x, z, 0.6, 0.6, 0.5, h-0.2, 9, 0x5a7a2a, {nc:1}); },
    tree(x, z){ A.box(x, z, 0.4, 0.4, 2.6, 0, 4, 0x6b4a2e); A.deco(x, 3.3, z, 2.6, 1.8, 2.6, 0.3, 0, 9, 0x4c8a3a); A.deco(x, 4.4, z, 1.7, 1.3, 1.7, 1.1, 0, 9, 0x5a9a44); },
    container(x, z, ori, c, lv){ const L=6.1, S=2.44, H=2.6, y=(lv||0)*H, w=ori==='x'?L:S, d=ori==='x'?S:L;
      A.box(x, z, w, d, H, y, 3, c);
      // door frame bars on the short ends
      for(const s of [-1,1]){ if(ori==='x') A.box(x+s*(L/2+0.02), z, 0.05, S*0.9, H*0.9, y+0.12, 6, 0x2a2a2a, {nc:1}); else A.box(x, z+s*(L/2+0.02), S*0.9, 0.05, H*0.9, y+0.12, 6, 0x2a2a2a, {nc:1}); } },
    car(x, z, ori, c){ const L=4.2, W=1.8, ax=ori==='x', w=ax?L:W, d=ax?W:L;
      A.box(x, z, w, d, 1.0, 0, 6, c);
      A.box(x, z, ax?2.2:1.62, ax?1.62:2.2, 0.68, 1.0, 14, 0x2c3a48);
      A.box(x, z, w+0.04, d+0.04, 0.28, 0, 6, 0x1c1c1c, {nc:1});
      for(const a of [-1,1]) for(const b of [-1,1]) A.box(x+(ax?a*1.35:b*0.92), z+(ax?b*0.92:a*1.35), ax?0.7:0.26, ax?0.26:0.7, 0.7, 0, 6, 0x151515, {nc:1});
      A.box(x+(ax?L/2:0), z+(ax?0:L/2), ax?0.04:1.2, ax?1.2:0.04, 0.18, 0.6, 15, 0xfff2c0, {nc:1}); },
    lamp(x, z){ A.box(x, z, 0.16, 0.16, 4.2, 0, 6, 0x555a60); A.box(x, z, 0.5, 0.5, 0.2, 4.2, 15, 0xfff0b0, {nc:1}); },
  };
  return A;
}
function themeFrom(t){ const n=Math.hypot(...t.sun); return {sun:t.sun.map(v=>v/n), sunCol:hex(t.sunCol), sky:hex(t.sky), gnd:hex(t.gnd), fog:hex(t.fog), fogR:t.fogR, top:hex(t.top), hor:hex(t.hor), cloud:t.cloud}; }

// ---------------- MAP 0: السوق القديم ----------------
function mapSouq(){
  const A=builder(), P=0xc9a477, P2=0xb8956a, W=0x7a5230;
  A.box(0, 0, 70, 70, 0.2, -0.2, 7, 0xd8b98c, {nc:1, nj:1});
  A.box(0, 0, 26, 26, 0.012, 0, 5, 0xc4ab86, {nc:1, nj:1});           // plaza stones
  // perimeter walls with battlements
  A.box(0, -30.6, 62.4, 1.2, 5, 0, 1, P2); A.box(0, 30.6, 62.4, 1.2, 5, 0, 1, P2);
  A.box(-30.6, 0, 1.2, 60, 5, 0, 1, P2); A.box(30.6, 0, 1.2, 60, 5, 0, 1, P2);
  for(let i=-30;i<=30;i+=2.5){ A.box(i, -30.6, 1.1, 1.2, 0.6, 5, 1, P2, {nc:1}); A.box(i, 30.6, 1.1, 1.2, 0.6, 5, 1, P2, {nc:1}); A.box(-30.6, i, 1.2, 1.1, 0.6, 5, 1, P2, {nc:1}); A.box(30.6, i, 1.2, 1.1, 0.6, 5, 1, P2, {nc:1}); }
  // well in the middle
  A.box(0, 0, 2.4, 2.4, 0.9, 0, 5, 0x9e9384); A.box(0, 0, 1.8, 1.8, 0.02, 0.9, 15, 0x2a5a8a, {nc:1});
  for(const a of [-1,1]) for(const b of [-1,1]) A.box(a*1.05, b*1.05, 0.2, 0.2, 2.6, 0, 4, 0x6b4a2a);
  A.box(0, 0, 3.0, 3.0, 0.2, 2.6, 4, W);
  // market stalls (counter faces the plaza)
  const stall = (x, z, face, cloth) => {
    const ax = face==='n'||face==='s'; const w=ax?3.2:2.2, d=ax?2.2:3.2;
    for(const a of [-1,1]) for(const b of [-1,1]) A.box(x+a*(w/2-0.1), z+b*(d/2-0.1), 0.16, 0.16, 2.4, 0, 4, 0x6b4a2a);
    A.box(x, z, w+0.3, d+0.3, 0.1, 2.4, 0, cloth);
    const fx = face==='e'?1:face==='w'?-1:0, fz = face==='s'?1:face==='n'?-1:0;
    A.box(x+fx*(w/2-0.35), z+fz*(d/2-0.35), ax?3.0:0.6, ax?0.6:3.0, 0.9, 0, 4, 0x8a5a32);
    for(let i=-1;i<=1;i++) A.box(x+fx*(w/2-0.35)+(ax?i*0.9:0), z+fz*(d/2-0.35)+(ax?0:i*0.9), 0.4, 0.4, 0.25, 0.9, 0, [0xd9a02e,0x8fbf3a,0xc0392b][i+1], {nc:1});
  };
  stall(-6,-9,'s',0xb33a2e); stall(6,-9,'s',0x2e5fb3); stall(-6,9,'n',0x3d8a4a); stall(6,9,'n',0xd9a02e); stall(-10.5,0,'e',0x8e44ad); stall(10.5,0,'w',0xc0392b);
  // north khan with roof access (stairs on the west side)
  A.room(0, -23, 20, 9, 4.2, {c:P, doors:{s:[[-5,2,2.7],[5,2,2.7]]}, wins:{s:[[0,2.2]], e:[[0,1.6]]}, par:{h:0.9, gaps:{w:[[-1.3,2]]}}, fc:0x8c7b66});
  A.stairs(-11.2, -18, 'n', 2.2, 11, 4.45, 0.6, 1, P2);
  A.crate(-6,-25,1.1,2); A.crate(-4.8,-25,1.1,1); A.crate(6,-21,1.1,1);
  // west house
  A.room(-20, -5, 10, 12, 3.6, {c:0xd2b48c, doors:{e:[[-3,1.6]], s:[[2,1.6]]}, wins:{e:[[3,1.6]], n:[[-2,1.8]], w:[[0,1.8]]}, fc:0x8c7b66});
  // east house
  A.room(20, -3, 10, 10, 3.6, {c:0xccab7e, doors:{w:[[2,1.6]], n:[[2,1.6]]}, wins:{w:[[-2.5,1.6]], s:[[-2,1.8]], e:[[0,1.6]]}, fc:0x8c7b66});
  // south-west building with roof (stairs on the east side)
  A.room(-17, 19, 12, 9, 3.8, {c:0xd6b88e, doors:{n:[[-3,1.8]], e:[[3.2,1.4]]}, wins:{n:[[3,1.8]], w:[[0,1.8]]}, par:{h:0.9, gaps:{e:[[1.2,1.6]]}}, fc:0x8c7b66});
  A.stairs(-9.9, 14.5, 's', 2.2, 10, 4.05, 0.6, 1, P2);
  // south-east blocks + alley
  A.box(15, 22, 10, 7, 5, 0, 1, 0xbf9b6e); A.box(25, 12, 7, 8, 4.5, 0, 1, 0xc7a375);
  // arch gate
  A.box(-2.3, 20, 0.8, 0.8, 4, 0, 1, P2); A.box(2.3, 20, 0.8, 0.8, 4, 0, 1, P2); A.box(0, 20, 5.4, 0.8, 0.8, 4, 1, P2);
  // cover
  A.box(-6, 16, 4, 0.5, 1.1, 0, 1, P2); A.box(7, 15, 0.5, 4, 1.1, 0, 1, P2); A.box(-20, 9, 5, 0.5, 1.2, 0, 1, P2); A.box(20, 10, 0.5, 5, 1.2, 0, 1, P2);
  A.box(-3, -15, 3, 0.7, 0.9, 0, 1, 0xa89466); A.box(4, -14, 0.7, 3, 0.9, 0, 1, 0xa89466);
  A.box(-14, -13, 0.7, 3, 0.9, 0, 1, 0xa89466); A.box(14, -14, 3, 0.7, 0.9, 0, 1, 0xa89466);
  A.crate(12,-11,1.2,2); A.crate(13.3,-11,1.2,1); A.crate(-12,-9,1.2,1); A.crate(26,-14,1.2,2); A.crate(-26,10,1.2,2); A.crate(13,7,1.2,1); A.crate(-4,25,1.2,1); A.crate(-2.7,25,1.2,2); A.crate(24,24,1.2,1);
  A.barrel(16.5,-9.5,0xb03a2e); A.barrel(-14,4,0x2e5fb3); A.barrel(26,-26,0xb03a2e); A.barrel(-26,-26,0x3d8a4a); A.barrel(-27,15,0xb03a2e); A.barrel(9,26,0x2e5fb3);
  A.palm(-14,-17); A.palm(14,12.5); A.palm(-24,26); A.palm(25,-22); A.palm(-7,13); A.palm(9,-17.5); A.palm(-27,-14); A.palm(27,27);
  return {
    name:'السوق القديم', e:'🏜️', d:'سوق صحراوي قديم: أزقة، بيوت طين، وسطوح تطل على الساحة', sz:'متوسطة',
    boxes:A.B, bounds:[-30,-30,30,30],
    spawns:{a:[[-6,27],[0,27],[6,27],[-0.5,23],[4,24],[-26,27],[24,27.5]], b:[[-6,-15],[0,-15.5],[6,-16],[-24,-20],[24,-19],[14,-22],[-14,-21]]},
    extra:[[0,-6],[-27,4],[27,6],[-1,13],[12,-4],[-13,6]],
    theme:themeFrom({top:0x5d9be0, hor:0xf2dcb4, fog:0xe9d4ae, fogR:[40,110], sun:[0.45,0.75,0.35], sunCol:0xfff1d6, sky:0xbfd7f0, gnd:0xa58a62, cloud:0.45}),
    col:'#d9a35a',
  };
}

// ---------------- MAP 1: الميناء ----------------
function mapPort(){
  const A=builder(), CW=0x7d7f80;
  A.box(0, 0, 60, 60, 0.2, -0.2, 5, 0x8f8f8a, {nc:1, nj:1});
  for(let i=-20;i<=20;i+=4){ A.box(i, -19, 2.2, 0.15, 0.012, 0, 10, 0xd9b52a, {nc:1, nj:1}); A.box(i, 19, 2.2, 0.15, 0.012, 0, 10, 0xd9b52a, {nc:1, nj:1}); }
  A.box(0, -22.6, 46.4, 1.2, 3.4, 0, 5, CW); A.box(0, 22.6, 46.4, 1.2, 3.4, 0, 5, CW);
  A.box(-22.6, 0, 1.2, 44, 3.4, 0, 5, CW); A.box(22.6, 0, 1.2, 44, 3.4, 0, 5, CW);
  const R=0xb0392b, BL=0x2c5d9e, G=0x3f7d4a, O=0xd9822b, T=0x2b8a8a, GR=0x6e747a, Y=0xc9a227;
  A.container(0, 0, 'x', R); A.stairs(-3.0, 1.92, 'e', 1.4, 6, 2.64, 0.5, 4, 0x8a6a40);
  A.container(-9, -9, 'z', BL); A.container(-9, -9, 'z', GR, 1);
  A.container(0, -10, 'x', G); A.container(9, -9, 'z', O);
  A.container(-10, 0, 'z', T); A.container(10, 0, 'z', Y);
  A.container(-9, 9, 'z', GR); A.container(0, 10, 'x', BL); A.container(9, 9, 'z', R); A.container(9, 9, 'z', G, 1);
  A.container(-17, -14.5, 'x', O); A.container(17, 14.5, 'x', T); A.container(-17, 15.5, 'x', R); A.container(17, -15.5, 'x', BL);
  A.crate(-5,-5,1.2,2); A.crate(-3.8,-5,1.2,1); A.crate(5,5,1.2,2); A.crate(3.8,5,1.2,1); A.crate(-14.5,5,1.2,1); A.crate(14.5,-5,1.2,1); A.crate(5,-16,1.2,2); A.crate(-5,16,1.2,2);
  A.barrel(-14,-4,0x2c5d9e); A.barrel(14,4,0xb0392b); A.barrel(-4,-15,0xd9822b); A.barrel(4,15,0x3f7d4a);
  // forklift
  A.box(13.5,-11.5,1.3,2.2,1.5,0,6,0xd9a42a); A.box(13.5,-12.9,1.2,0.12,2.6,0,6,0x333333,{nc:1});
  // cranes outside the walls (scenery)
  for(const s of [-1,1]){ const x=s*30; A.box(x,-6,1,1,24,0,6,0xe0a82e,{nc:1}); A.box(x,6,1,1,24,0,6,0xe0a82e,{nc:1}); A.box(x-s*8,0,22,1.2,1.4,24,6,0xe0a82e,{nc:1}); A.box(x+s*3,0,4,4,2.5,22.5,6,0xe0a82e,{nc:1}); }
  A.lamp(-20,-20); A.lamp(20,20); A.lamp(-20,20); A.lamp(20,-20);
  return {
    name:'الميناء', e:'⚓', d:'حاويات وممرات ضيقة — اشتباكات سريعة وقريبة', sz:'صغيرة',
    boxes:A.B, bounds:[-22,-22,22,22],
    spawns:{a:[[-19.5,-8],[-19.5,-3],[-19.5,2],[-19.5,7],[-15,0],[-14,-9],[-14,10]], b:[[19.5,8],[19.5,3],[19.5,-2],[19.5,-7],[15,0],[14,9],[15.6,-8.6]]},
    extra:[[0,-15],[0,15],[-5,0.5],[5,-1],[-12,-19],[12,19]],
    theme:themeFrom({top:0x6f9fd0, hor:0xd6e3ec, fog:0xc5d2dc, fogR:[30,85], sun:[-0.4,0.7,0.55], sunCol:0xfff6e6, sky:0xc4d6e8, gnd:0x6d6a66, cloud:0.75}),
    col:'#4e8fd1',
  };
}

// ---------------- MAP 2: الحارة ----------------
function mapHara(){
  const A=builder(), H=0xe8dcc4, F=0xf0ebe0, BR=0x9a5b45;
  A.box(0, 0, 66, 50, 0.2, -0.2, 9, 0x6e9a48, {nc:1, nj:1});
  A.box(0, 0, 58, 8, 0.03, 0, 8, 0x3b3b40, {nc:1, nj:1});
  for(let i=-26;i<=26;i+=4) A.box(i, 0, 2, 0.15, 0.012, 0.03, 10, 0xeeeeee, {nc:1, nj:1});
  A.box(0, -4.75, 58, 1.5, 0.15, 0, 5, 0xb5b0a6); A.box(0, 4.75, 58, 1.5, 0.15, 0, 5, 0xb5b0a6);
  A.box(0, -20.6, 58.4, 1.2, 3, 0, 2, BR); A.box(0, 20.6, 58.4, 1.2, 3, 0, 2, BR);
  A.box(-28.6, 0, 1.2, 40, 3, 0, 2, BR); A.box(28.6, 0, 1.2, 40, 3, 0, 2, BR);
  // houses facing each other
  A.room(0, -12.5, 13, 8, 3.3, {c:H, doors:{s:[[-3,1.6]], n:[[4,1.4]]}, wins:{s:[[2.5,2.2]], w:[[0,1.8]], e:[[-3,1.2]], n:[[-2.5,1.8]]}, par:{h:0.9, gaps:{e:[[-1.1,1.6]]}}, rc:0x8a8580, fc:0xb08a64});
  A.stairs(7.6, -8.5, 'n', 2.2, 9, 3.55, 0.6, 5, 0xa9a49a);
  A.room(0, 12.5, 13, 8, 3.3, {c:0xd9e2e8, doors:{n:[[3,1.6]], s:[[-4,1.4]]}, wins:{n:[[-2.5,2.2]], e:[[0,1.8]], w:[[3,1.2]], s:[[2.5,1.8]]}, par:{h:0.9, gaps:{w:[[1.1,1.6]]}}, rc:0x8a8580, fc:0xb08a64});
  A.stairs(-7.6, 8.5, 's', 2.2, 9, 3.55, 0.6, 5, 0xa9a49a);
  // furniture inside (cover)
  A.box(-2, -14.8, 2.4, 0.9, 0.85, 0, 12, 0x7a3b3b); A.box(2.5, -12, 1.4, 1.4, 0.75, 0, 4, 0x8a6a40);
  A.box(2, 14.8, 2.4, 0.9, 0.85, 0, 12, 0x3b5a7a); A.box(-2.5, 12, 1.4, 1.4, 0.75, 0, 4, 0x8a6a40);
  // garages
  A.box(-17, -13, 7, 6, 3, 0, 2, BR); A.box(-17, -9.98, 4, 0.05, 2.4, 0, 6, 0xcfd3d6, {nc:1});
  A.box(18, -14, 6, 5, 3, 0, 2, 0x8a5040); A.box(18, -11.48, 4, 0.05, 2.4, 0, 6, 0xcfd3d6, {nc:1});
  A.box(-18, 13, 6, 5, 3, 0, 2, 0x8a5040); A.box(-18, 10.48, 4, 0.05, 2.4, 0, 6, 0xcfd3d6, {nc:1});
  A.box(17, 13, 7, 6, 3, 0, 2, BR); A.box(17, 9.98, 4, 0.05, 2.4, 0, 6, 0xcfd3d6, {nc:1});
  // yard fences (jump over them)
  const fence = (z, gaps) => A.wall('x', -27.9, 27.9, z, 0.18, 1.0, 0, 4, F, gaps.map(g=>[g, 2.4]));
  fence(-6.2, [-3, -13, 13, -22, 22]); fence(6.2, [3, -13, 13, -22, 22]);
  // street: bus + cars
  A.box(0, 0, 9, 2.5, 2.6, 0, 6, 0xe0b12a); A.box(0, 0, 9.04, 2.54, 0.7, 1.4, 14, 0x2c3a48, {nc:1});
  for(const a of [-1,1]) for(const b of [-1,1]) A.box(a*3.2, b*1.2, 0.9, 0.3, 0.9, 0, 6, 0x151515, {nc:1});
  A.car(-14, -1.8, 'x', 0xb3262e); A.car(13, 1.8, 'x', 0x2b5291); A.car(-22, 2, 'x', 0xe8e8e8); A.car(22, -2, 'x', 0x3f7d4a); A.car(-7.2, 2.1, 'x', 0x222222);
  A.tree(-12,-17); A.tree(12,-17.5); A.tree(-12,17); A.tree(12,17.5); A.tree(-24,-10); A.tree(24,10);
  A.box(-9,-5.9,0.6,0.6,1.1,0,6,0x2f6b3a); A.box(9,5.9,0.6,0.6,1.1,0,6,0x2f6b3a); A.box(24,-5.9,0.6,0.6,1.1,0,6,0x2f6b3a); A.box(-24,5.9,0.6,0.6,1.1,0,6,0x2f6b3a);
  A.lamp(-18,-4.2); A.lamp(18,4.2); A.lamp(0,-4.2); A.lamp(0,4.2);
  return {
    name:'الحارة', e:'🏘️', d:'بيتين متقابلين وشارع في النص — تقدر تطلع السطوح', sz:'متوسطة',
    boxes:A.B, bounds:[-28,-20,28,20],
    spawns:{a:[[-20,17.5],[-9,18.5],[9,18.5],[20,17.5],[0,18.6],[-25,15],[25,16]], b:[[-20,-17.5],[-9,-18.5],[9,-18.5],[20,-17.5],[0,-18.6],[-25,-15],[25,-16]]},
    extra:[[-26,0],[26,0],[-14,-9],[14,9],[-10,8.5],[10,-8.5]],
    theme:themeFrom({top:0x5f9de6, hor:0xdcecf5, fog:0xcfe2ee, fogR:[35,100], sun:[0.35,0.8,-0.45], sunCol:0xfff4e0, sky:0xc9def2, gnd:0x6d7a52, cloud:0.65}),
    col:'#5fae5a',
  };
}

export const MAPS = [mapSouq, mapPort, mapHara];
export const MAPINFO = MAPS.map(f => { const m=f(); return {name:m.name, e:m.e, d:m.d, sz:m.sz, col:m.col}; });
