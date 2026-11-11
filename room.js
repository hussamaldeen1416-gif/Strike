// ضربة الديرة — online rooms on Firebase Realtime Database.
// Every room lives in its own node r/{code}, so players only download the traffic of their own room.
// Each player owns r/{code}/{uid}_{tab}. Values are stored as JSON strings (RTDB can't mangle them);
// a top-level object value is stored one level deeper so only the changed parts are sent.
(function(){
  'use strict';
  const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const J = v => JSON.stringify(v === undefined ? null : v);
  function enc(v){ if(isObj(v)){ const ks=Object.keys(v).filter(c=>v[c]!==undefined); if(ks.length){ const o={}; ks.forEach(c=>{ o[c]=J(v[c]); }); return o; } } return J(v); }
  function parse(s, cache, key){ if(typeof s!=='string') return s; const c=cache.get(key); if(c && c.s===s) return c.v; let v; try{ v=JSON.parse(s); }catch(_){ v=s; } cache.set(key,{s,v}); return v; }
  function dec(raw, cache){ const out={}; if(!isObj(raw)) return out; for(const k in raw){ const r=raw[k]; if(isObj(r)){ const o={}; for(const c in r) o[c]=parse(r[c], cache, k+'/'+c); out[k]=o; } else out[k]=parse(r, cache, k); } return out; }

  function roomCore(me, writer){
    let my = Object.freeze({}), myEnc = {};
    const others = new Map(); let snap = Object.freeze([]); const ls = new Set(); let sched = false;
    const rebuild = () => { const a=[Object.freeze({peer:me, sameTab:true, presence:my})]; for(const [p,o] of others) a.push(Object.freeze({peer:p, sameTab:false, presence:o.presence, at:o.at})); snap=Object.freeze(a); };
    const notify = () => { if(sched) return; sched=true; setTimeout(()=>{ sched=false; rebuild(); ls.forEach(f=>{ try{ f(snap); }catch(e){ console.error(e); } }); }, 16); };
    const core = {
      me, others, notify,
      put(key, v){ if(key===me) return; if(!v){ others.delete(key); notify(); return; } const prev=others.get(key); const cache=prev?prev.cache:new Map(); others.set(key,{presence:Object.freeze(dec(v,cache)), at:Date.now(), cache}); notify(); },
      encoded(){ return myEnc; },
      presence(patch){
        const np={...my}; for(const k in patch){ if(patch[k]===null||patch[k]===undefined) delete np[k]; else np[k]=JSON.parse(J(patch[k])); }
        const upd={}, ne={...myEnc};
        for(const k in patch){
          const pe=myEnc[k];
          if(np[k]===undefined){ if(pe!==undefined){ upd[k]=null; delete ne[k]; } continue; }
          const e=enc(np[k]); ne[k]=e;
          if(isObj(pe) && isObj(e)){ for(const c in pe) if(!(c in e)) upd[k+'/'+c]=null; for(const c in e) if(pe[c]!==e[c]) upd[k+'/'+c]=e[c]; }
          else if(J(pe)!==J(e)) upd[k]=e;
        }
        my=Object.freeze(np); myEnc=ne; notify();
        return Object.keys(upd).length ? writer(upd) : Promise.resolve();
      },
      peers(){ return snap; },
      onPeers(fn){ ls.add(fn); setTimeout(()=>{ rebuild(); fn(snap); },0); return ()=>ls.delete(fn); },
    };
    rebuild();
    return core;
  }

  window.makeNet = async function(api, cfg){
    const app = api.initializeApp(cfg);
    const auth = api.getAuth(app);
    const cred = await api.signInAnonymously(auth);
    const uid = cred.user.uid;
    const db = api.getDatabase(app);
    let connected = false, cur = null; const connLs = new Set();
    api.onValue(api.ref(db, '.info/connected'), s => {
      const c = !!s.val();
      if(c && !connected && cur) cur._rejoin();
      connected = c; connLs.forEach(f=>{ try{ f(c); }catch(_){} });
    });
    function join(code){
      if(cur) cur.leave();
      const me = uid + '_' + Math.random().toString(36).slice(2,7);
      const path = 'r/' + code, root = api.ref(db, path), myRef = api.ref(db, path + '/' + me);
      let failed = null, alive = true; const errLs = new Set();
      const fail = e => { if(failed) return; failed = e || {code:'x'}; errLs.forEach(f=>{ try{ f(failed); }catch(_){} }); };
      const core = roomCore(me, upd => api.update(myRef, upd).catch(e => { console.warn('firebase', e); if(/permission/i.test(String((e&&(e.code||e.message))||''))) fail(e); }));
      const un = [];
      const put = s => core.put(s.key, s.val());
      un.push(api.onChildAdded(root, put, fail));
      un.push(api.onChildChanged(root, put, fail));
      un.push(api.onChildRemoved(root, s => { if(s.key===me) return; core.others.delete(s.key); core.notify(); }, fail));
      api.onDisconnect(myRef).remove().catch(()=>{});
      const room = {
        code, id:me,
        presence: p => alive ? core.presence(p) : Promise.resolve(),
        peers: () => core.peers(), onPeers: fn => core.onPeers(fn),
        onError(fn){ errLs.add(fn); if(failed) setTimeout(()=>fn(failed),0); },
        connected: () => connected,
        _rejoin(){ api.onDisconnect(myRef).remove().catch(()=>{}); const e=core.encoded(); if(Object.keys(e).length) api.set(myRef, e).catch(fail); },
        leave(){ if(!alive) return; alive=false; un.forEach(u=>{ try{ u&&u(); }catch(_){} }); try{ api.set(myRef, null); }catch(_){} if(cur===room) cur=null; },
      };
      addEventListener('pagehide', () => { if(alive) try{ api.set(myRef, null); }catch(_){} });
      cur = room; return room;
    };
    return { uid, join, connected:()=>connected, onConnection(fn){ connLs.add(fn); setTimeout(()=>fn(connected),0); } };
  };

  // offline room for solo practice (no network at all)
  window.makeLocalRoom = function(){
    const me = 'solo_' + Math.random().toString(36).slice(2,7);
    const core = roomCore(me, () => Promise.resolve());
    return { code:'0000', id:me, local:true, presence:p=>core.presence(p), peers:()=>core.peers(), onPeers:fn=>core.onPeers(fn), onError(){}, connected:()=>true, leave(){} };
  };
})();
