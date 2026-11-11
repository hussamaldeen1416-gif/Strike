// ضربة الديرة — tiny WebGL2 engine for a world made of boxes.
// Static world = one merged mesh with procedural materials; moving things = instanced boxes.

// ---------------- math (column-major 4x4 like WebGL) ----------------
export const M4 = {
  create(){ const m = new Float32Array(16); m[0]=m[5]=m[10]=m[15]=1; return m; },
  ident(m){ m.fill(0); m[0]=m[5]=m[10]=m[15]=1; return m; },
  copy(o, a){ o.set(a); return o; },
  mul(o, a, b){
    const a00=a[0],a01=a[1],a02=a[2],a03=a[3],a10=a[4],a11=a[5],a12=a[6],a13=a[7],a20=a[8],a21=a[9],a22=a[10],a23=a[11],a30=a[12],a31=a[13],a32=a[14],a33=a[15];
    for(let i=0;i<4;i++){
      const b0=b[i*4],b1=b[i*4+1],b2=b[i*4+2],b3=b[i*4+3];
      o[i*4]=b0*a00+b1*a10+b2*a20+b3*a30; o[i*4+1]=b0*a01+b1*a11+b2*a21+b3*a31;
      o[i*4+2]=b0*a02+b1*a12+b2*a22+b3*a32; o[i*4+3]=b0*a03+b1*a13+b2*a23+b3*a33;
    }
    return o;
  },
  persp(o, fovy, asp, n, f){ const t=1/Math.tan(fovy/2), nf=1/(n-f); o.fill(0); o[0]=t/asp; o[5]=t; o[10]=(f+n)*nf; o[11]=-1; o[14]=2*f*n*nf; return o; },
  // view matrix from eye + yaw/pitch (yaw 0 looks toward -Z, positive yaw turns left)
  view(o, ex, ey, ez, yaw, pitch){
    const cp=Math.cos(pitch), sp=Math.sin(pitch), cy=Math.cos(yaw), sy=Math.sin(yaw);
    const fx=-sy*cp, fy=sp, fz=-cy*cp, rx=cy, ry=0, rz=-sy;
    const ux=ry*fz-rz*fy, uy=rz*fx-rx*fz, uz=rx*fy-ry*fx;
    o[0]=rx; o[1]=ux; o[2]=-fx; o[3]=0; o[4]=ry; o[5]=uy; o[6]=-fy; o[7]=0; o[8]=rz; o[9]=uz; o[10]=-fz; o[11]=0;
    o[12]=-(rx*ex+ry*ey+rz*ez); o[13]=-(ux*ex+uy*ey+uz*ez); o[14]=fx*ex+fy*ey+fz*ez; o[15]=1; return o;
  },
  invert(o, m){
    const a00=m[0],a01=m[1],a02=m[2],a03=m[3],a10=m[4],a11=m[5],a12=m[6],a13=m[7],a20=m[8],a21=m[9],a22=m[10],a23=m[11],a30=m[12],a31=m[13],a32=m[14],a33=m[15];
    const b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,b03=a01*a12-a02*a11,b04=a01*a13-a03*a11,b05=a02*a13-a03*a12,b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,b08=a20*a33-a23*a30,b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
    let d=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06; if(!d) return null; d=1/d;
    o[0]=(a11*b11-a12*b10+a13*b09)*d; o[1]=(a02*b10-a01*b11-a03*b09)*d; o[2]=(a31*b05-a32*b04+a33*b03)*d; o[3]=(a22*b04-a21*b05-a23*b03)*d;
    o[4]=(a12*b08-a10*b11-a13*b07)*d; o[5]=(a00*b11-a02*b08+a03*b07)*d; o[6]=(a32*b02-a30*b05-a33*b01)*d; o[7]=(a20*b05-a22*b02+a23*b01)*d;
    o[8]=(a10*b10-a11*b08+a13*b06)*d; o[9]=(a01*b08-a00*b10-a03*b06)*d; o[10]=(a30*b04-a31*b02+a33*b00)*d; o[11]=(a21*b02-a20*b04-a23*b00)*d;
    o[12]=(a11*b07-a10*b09-a12*b06)*d; o[13]=(a00*b09-a01*b07+a02*b06)*d; o[14]=(a31*b01-a30*b03-a32*b00)*d; o[15]=(a20*b03-a21*b01+a22*b00)*d; return o;
  },
  // post-multiply helpers: m = m * X
  tr(m, x, y, z){ m[12]+=m[0]*x+m[4]*y+m[8]*z; m[13]+=m[1]*x+m[5]*y+m[9]*z; m[14]+=m[2]*x+m[6]*y+m[10]*z; m[15]+=m[3]*x+m[7]*y+m[11]*z; return m; },
  sc(m, x, y, z){ for(let i=0;i<4;i++){ m[i]*=x; m[4+i]*=y; m[8+i]*=z; } return m; },
  ry(m, a){ const c=Math.cos(a), s=Math.sin(a); for(let i=0;i<4;i++){ const x=m[i], z=m[8+i]; m[i]=x*c-z*s; m[8+i]=x*s+z*c; } return m; },
  rx(m, a){ const c=Math.cos(a), s=Math.sin(a); for(let i=0;i<4;i++){ const y=m[4+i], z=m[8+i]; m[4+i]=y*c+z*s; m[8+i]=z*c-y*s; } return m; },
  rz(m, a){ const c=Math.cos(a), s=Math.sin(a); for(let i=0;i<4;i++){ const x=m[i], y=m[4+i]; m[i]=x*c+y*s; m[4+i]=y*c-x*s; } return m; },
};
export const hex = h => [((h>>16)&255)/255, ((h>>8)&255)/255, (h&255)/255];

// ---------------- unit cube (24 verts) ----------------
const FACES = [ // normal, then the 4 corner signs
  [[1,0,0],  [[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]]],
  [[-1,0,0], [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]]],
  [[0,1,0],  [[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]]],
  [[0,-1,0], [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]],
  [[0,0,1],  [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]],
  [[0,0,-1], [[-1,-1,-1],[-1,1,-1],[1,1,-1],[1,-1,-1]]],
];
// make every face counter-clockwise when seen from outside
for(const f of FACES){
  const [n, c] = f; const a=c[0], b=c[1], d=c[2];
  const ux=b[0]-a[0], uy=b[1]-a[1], uz=b[2]-a[2], vx=d[0]-a[0], vy=d[1]-a[1], vz=d[2]-a[2];
  const cx=uy*vz-uz*vy, cy=uz*vx-ux*vz, cz=ux*vy-uy*vx;
  if(cx*n[0]+cy*n[1]+cz*n[2] < 0) c.reverse();
}
function cubeGeo(){
  const pos=[], nrm=[], idx=[];
  FACES.forEach(([n, c], fi) => { c.forEach(v => { pos.push(v[0]*0.5, v[1]*0.5, v[2]*0.5); nrm.push(...n); }); const o=fi*4; idx.push(o,o+1,o+2, o,o+2,o+3); });
  return {pos:new Float32Array(pos), nrm:new Float32Array(nrm), idx:new Uint16Array(idx)};
}

// ---------------- static mesh from boxes ----------------
// box: {x0,y0,z0,x1,y1,z1, m, c:[r,g,b]}  or rotated decor {rot:1, cx,cy,cz, sx,sy,sz, yaw, pitch, roll, m, c}
export function buildStatic(boxes){
  let nv=0; for(const b of boxes) nv += 24;
  const pos=new Float32Array(nv*3), nrm=new Float32Array(nv*3), col=new Float32Array(nv*4), mat=new Float32Array(nv), idx=new Uint32Array(nv/4*6);
  let v=0, ii=0; const M=M4.create();
  for(const b of boxes){
    const c=b.c || [1,1,1]; const jit = b.nj ? 1 : 0.94 + 0.12*((Math.sin((b.x0||b.cx||0)*12.9898 + (b.z0||b.cz||0)*78.233)*43758.5453)%1+1)%1;
    let cx, cy, cz, sx, sy, sz, rot=false;
    if(b.rot){ cx=b.cx; cy=b.cy; cz=b.cz; sx=b.sx; sy=b.sy; sz=b.sz; rot=true; M4.ident(M); M4.tr(M,cx,cy,cz); M4.ry(M,b.yaw||0); M4.rx(M,b.pitch||0); M4.rz(M,b.roll||0); M4.sc(M,sx,sy,sz); }
    else { cx=(b.x0+b.x1)/2; cy=(b.y0+b.y1)/2; cz=(b.z0+b.z1)/2; sx=b.x1-b.x0; sy=b.y1-b.y0; sz=b.z1-b.z0; }
    const ground = !rot && b.y0 < 0.06;
    for(let f=0; f<6; f++){
      const [n, cs] = FACES[f];
      let nx=n[0], ny=n[1], nz=n[2];
      if(rot){ const tx=M[0]*nx+M[4]*ny+M[8]*nz, ty=M[1]*nx+M[5]*ny+M[9]*nz, tz=M[2]*nx+M[6]*ny+M[10]*nz; const l=Math.hypot(tx,ty,tz)||1; nx=tx/l; ny=ty/l; nz=tz/l; }
      for(const s of cs){
        let x, y, z;
        if(rot){ const lx=s[0]*0.5, ly=s[1]*0.5, lz=s[2]*0.5; x=M[0]*lx+M[4]*ly+M[8]*lz+M[12]; y=M[1]*lx+M[5]*ly+M[9]*lz+M[13]; z=M[2]*lx+M[6]*ly+M[10]*lz+M[14]; }
        else { x=cx+s[0]*sx/2; y=cy+s[1]*sy/2; z=cz+s[2]*sz/2; }
        // baked ambient occlusion: darker toward the floor
        let ao = 1;
        if(!rot && n[1]===0){ if(s[1]<0) ao = ground ? 0.62 : 0.82; else ao = 1; if(ground && sy>1.2) ao *= 1; }
        if(!rot && n[1]<0) ao = 0.7;
        pos[v*3]=x; pos[v*3+1]=y; pos[v*3+2]=z; nrm[v*3]=nx; nrm[v*3+1]=ny; nrm[v*3+2]=nz;
        col[v*4]=c[0]*ao*jit; col[v*4+1]=c[1]*ao*jit; col[v*4+2]=c[2]*ao*jit; col[v*4+3]=1; mat[v]=b.m||0; v++;
      }
      const o=v-4; idx[ii++]=o; idx[ii++]=o+1; idx[ii++]=o+2; idx[ii++]=o; idx[ii++]=o+2; idx[ii++]=o+3;
    }
  }
  return {pos, nrm, col, mat, idx, count:ii};
}

// ---------------- shaders ----------------
const FRAG_COMMON = `
precision highp float;
uniform vec3 u_eye, u_sun, u_sunCol, u_sky, u_gnd, u_fog; uniform vec2 u_fogR; uniform float u_time;
in vec3 v_wp; in vec3 v_pp; in vec3 v_lp; in vec3 v_n; in vec4 v_c; flat in int v_m;
out vec4 o;
float h13(vec3 p){ p=fract(p*0.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vn(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h13(i),h13(i+vec3(1,0,0)),f.x),mix(h13(i+vec3(0,1,0)),h13(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h13(i+vec3(0,0,1)),h13(i+vec3(1,0,1)),f.x),mix(h13(i+vec3(0,1,1)),h13(i+vec3(1,1,1)),f.x),f.y),f.z); }
vec2 fuv(vec3 p, vec3 n){ vec3 a=abs(n); return a.y>0.5 ? p.xz : (a.x>0.5 ? p.zy : p.xy); }
float pat(int m, vec3 p, vec3 n){
  vec2 uv=fuv(p,n);
  if(m==1) return 0.84+0.1*vn(p*3.1)+0.08*vn(p*0.55);                                     // plaster / mud brick
  if(m==2){ vec2 b=uv*vec2(2.2,4.4); b.x+=step(1.0,mod(b.y,2.0))*0.5; vec2 f=fract(b);       // brick
    float l=step(0.05,f.x)*step(0.08,f.y); return mix(0.62,0.92+0.1*h13(vec3(floor(b),2.0)),l); }
  if(m==3){ float s = abs(n.y)>0.5 ? 0.95 : 0.8+0.2*abs(sin((abs(n.x)>0.5 ? p.z : p.x)*10.0));    // corrugated steel
    return s*(0.9+0.1*vn(p*2.3)); }
  if(m==4){ float pl=fract(uv.y*3.2); return (0.78+0.18*vn(vec3(uv.x*0.7,uv.y*14.0,0.0)))*mix(0.68,1.0,step(0.08,pl)); } // wood
  if(m==5){ vec2 f=fract(uv*0.5); float g=step(0.025,f.x)*step(0.025,f.y); return (0.84+0.14*vn(p*1.6))*mix(0.8,1.0,g); } // concrete
  if(m==6) return 0.88+0.12*vn(vec3(uv.x*0.6,uv.y*26.0,0.0));                               // metal
  if(m==7) return 0.82+0.12*vn(p*0.8)+0.07*vn(p*6.5);                                         // sand
  if(m==8) return 0.78+0.18*vn(p*5.0);                                                        // asphalt
  if(m==9) return 0.72+0.2*vn(p*2.3)+0.08*vn(p*9.0);                                          // grass / leaves
  if(m==13) return mix(0.68,1.0,step(0.48,vn(p*5.0+3.7)))*mix(0.85,1.0,step(0.5,vn(p*11.0)));  // camo
  if(m==14){ vec2 f=fract(uv*vec2(1.0,1.6)); return mix(0.45,1.0,step(0.12,f.x)*step(0.12,f.y)); } // windows grid
  return 1.0;
}
void main(){
  if(v_m==10){ o=v_c; return; }                                                   // unlit
  if(v_m==11){ float r=length(v_lp.xz)*2.0; o=vec4(v_c.rgb, v_c.a*(1.0-smoothstep(0.35,1.0,r))); return; } // soft disc
  vec3 n=normalize(v_n);
  vec3 base=v_c.rgb*pat(v_m, v_pp, n);
  float dif=max(dot(n,u_sun),0.0);
  vec3 hemi=mix(u_gnd,u_sky,n.y*0.5+0.5);
  vec3 col=base*(hemi*0.66+u_sunCol*dif*0.82);
  if(v_m==15){ col += v_c.rgb*0.6; }                                              // glowing glass / lamps
  float d=distance(v_wp,u_eye);
  col=mix(col,u_fog,smoothstep(u_fogR.x,u_fogR.y,d));
  o=vec4(col, v_c.a);
}`;
const VS_STATIC = `#version 300 es
layout(location=0) in vec3 a_pos; layout(location=1) in vec3 a_nrm; layout(location=2) in vec4 a_col; layout(location=3) in float a_mat;
uniform mat4 u_vp; out vec3 v_wp; out vec3 v_pp; out vec3 v_lp; out vec3 v_n; out vec4 v_c; flat out int v_m;
void main(){ v_wp=a_pos; v_pp=a_pos; v_lp=vec3(0.0); v_n=a_nrm; v_c=a_col; v_m=int(a_mat+0.5); gl_Position=u_vp*vec4(a_pos,1.0); }`;
const VS_INST = `#version 300 es
layout(location=0) in vec3 a_pos; layout(location=1) in vec3 a_nrm;
layout(location=4) in vec4 i0; layout(location=5) in vec4 i1; layout(location=6) in vec4 i2; layout(location=7) in vec4 i3;
layout(location=8) in vec4 i_col; layout(location=9) in float i_mat;
uniform mat4 u_vp; out vec3 v_wp; out vec3 v_pp; out vec3 v_lp; out vec3 v_n; out vec4 v_c; flat out int v_m;
void main(){ mat4 M=mat4(i0,i1,i2,i3); vec4 w=M*vec4(a_pos,1.0); v_wp=w.xyz; v_pp=mat3(M)*a_pos; v_lp=a_pos;
  v_n=normalize(mat3(M)*a_nrm); v_c=i_col; v_m=int(i_mat+0.5); gl_Position=u_vp*w; }`;
const VS_SKY = `#version 300 es
out vec2 v_ndc; void main(){ vec2 p=vec2(float((gl_VertexID<<1)&2), float(gl_VertexID&2)); v_ndc=p*2.0-1.0; gl_Position=vec4(v_ndc,1.0,1.0); }`;
const FS_SKY = `#version 300 es
precision highp float; in vec2 v_ndc; out vec4 o;
uniform mat4 u_ivp; uniform vec3 u_eye, u_sun, u_top, u_hor, u_fog; uniform float u_time, u_cloud;
float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
void main(){
  vec4 w=u_ivp*vec4(v_ndc,1.0,1.0); vec3 d=normalize(w.xyz/w.w-u_eye);
  float t=clamp(d.y,0.0,1.0); vec3 c=mix(u_hor,u_top,pow(t,0.55));
  if(d.y<0.0) c=mix(u_hor,u_fog,clamp(-d.y*5.0,0.0,1.0));
  float s=max(dot(d,u_sun),0.0); c+=vec3(1.0,0.92,0.75)*(pow(s,900.0)*3.0+pow(s,14.0)*0.22);
  if(d.y>0.02){ vec2 cp=d.xz/d.y*1.6+vec2(u_time*0.02,0.0); float cl=n2(cp)*0.6+n2(cp*2.3)*0.3+n2(cp*5.1)*0.1;
    c=mix(c,vec3(1.0),smoothstep(0.55,0.85,cl)*u_cloud*smoothstep(0.02,0.25,d.y)); }
  o=vec4(c,1.0);
}`;

// ---------------- renderer ----------------
export const STRIDE = 21; // floats per instance: mat4 + rgba + material
export class Batch {
  constructor(cap){ this.cap=cap; this.d=new Float32Array(cap*STRIDE); this.n=0; }
  clear(){ this.n=0; }
  push(m, r, g, b, a, mat){ if(this.n>=this.cap) return; const o=this.n*STRIDE, d=this.d; d.set(m, o); d[o+16]=r; d[o+17]=g; d[o+18]=b; d[o+19]=a; d[o+20]=mat; this.n++; }
  // axis box with yaw only: center, size
  box(x, y, z, sx, sy, sz, yaw, r, g, b, a, mat){
    if(this.n>=this.cap) return; const o=this.n*STRIDE, d=this.d; const c=Math.cos(yaw||0), s=Math.sin(yaw||0);
    d[o]=c*sx; d[o+1]=0; d[o+2]=-s*sx; d[o+3]=0; d[o+4]=0; d[o+5]=sy; d[o+6]=0; d[o+7]=0;
    d[o+8]=s*sz; d[o+9]=0; d[o+10]=c*sz; d[o+11]=0; d[o+12]=x; d[o+13]=y; d[o+14]=z; d[o+15]=1;
    d[o+16]=r; d[o+17]=g; d[o+18]=b; d[o+19]=a; d[o+20]=mat; this.n++;
  }
}
export function createRenderer(canvas, opts={}){
  const gl = canvas.getContext('webgl2', {antialias:!!opts.aa, alpha:false, depth:true, stencil:false, powerPreference:'high-performance', preserveDrawingBuffer:!!opts.keep});
  if(!gl) return null;
  function prog(vs, fs){
    const mk=(t,s)=>{ const sh=gl.createShader(t); gl.shaderSource(sh,s); gl.compileShader(sh); if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
    const p=gl.createProgram(); gl.attachShader(p,mk(gl.VERTEX_SHADER,vs)); gl.attachShader(p,mk(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u={}; const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS); for(let i=0;i<n;i++){ const nm=gl.getActiveUniform(p,i).name; u[nm]=gl.getUniformLocation(p,nm); }
    return {p,u};
  }
  const FS = '#version 300 es\n'+FRAG_COMMON;
  const PS = prog(VS_STATIC, FS), PI = prog(VS_INST, FS), PK = prog(VS_SKY, FS_SKY);
  // cube + instance buffers
  const cube=cubeGeo();
  const instVAO=gl.createVertexArray(); gl.bindVertexArray(instVAO);
  const cb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,cb); gl.bufferData(gl.ARRAY_BUFFER,cube.pos,gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
  const nb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,nb); gl.bufferData(gl.ARRAY_BUFFER,cube.nrm,gl.STATIC_DRAW); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);
  const ib=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,cube.idx,gl.STATIC_DRAW);
  const instBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,instBuf); gl.bufferData(gl.ARRAY_BUFFER, 4096*STRIDE*4, gl.DYNAMIC_DRAW);
  for(let k=0;k<4;k++){ gl.enableVertexAttribArray(4+k); gl.vertexAttribPointer(4+k,4,gl.FLOAT,false,STRIDE*4,k*16); gl.vertexAttribDivisor(4+k,1); }
  gl.enableVertexAttribArray(8); gl.vertexAttribPointer(8,4,gl.FLOAT,false,STRIDE*4,64); gl.vertexAttribDivisor(8,1);
  gl.enableVertexAttribArray(9); gl.vertexAttribPointer(9,1,gl.FLOAT,false,STRIDE*4,80); gl.vertexAttribDivisor(9,1);
  gl.bindVertexArray(null);
  let instCap=4096;
  const skyVAO=gl.createVertexArray();
  let stat=null;
  const R = {
    gl, canvas,
    opaque:new Batch(6000), trans:new Batch(3000), vm:new Batch(400), vmT:new Batch(100),
    env:{sun:[0.5,0.8,0.3], sunCol:[1,0.95,0.85], sky:[0.75,0.85,1], gnd:[0.55,0.47,0.38], fog:[0.9,0.85,0.75], fogR:[30,90], top:[0.35,0.6,0.92], hor:[0.95,0.88,0.75], cloud:0.6},
    vp:M4.create(), proj:M4.create(), view:M4.create(), ivp:M4.create(), vmProj:M4.create(), tmp:M4.create(),
    eye:[0,0,0], time:0, fov:1.2, triCount:0,
    setStatic(mesh){
      if(stat){ gl.deleteVertexArray(stat.vao); stat.bufs.forEach(b=>gl.deleteBuffer(b)); }
      const vao=gl.createVertexArray(); gl.bindVertexArray(vao); const bufs=[];
      const ab=(data,loc,size)=>{ const b=gl.createBuffer(); bufs.push(b); gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0); };
      ab(mesh.pos,0,3); ab(mesh.nrm,1,3); ab(mesh.col,2,4); ab(mesh.mat,3,1);
      const eb=gl.createBuffer(); bufs.push(eb); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,eb); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.idx,gl.STATIC_DRAW);
      gl.bindVertexArray(null);
      stat={vao,bufs,count:mesh.count};
    },
    resize(scale){
      const w=Math.max(1,Math.floor(canvas.clientWidth*scale)), h=Math.max(1,Math.floor(canvas.clientHeight*scale));
      if(canvas.width!==w || canvas.height!==h){ canvas.width=w; canvas.height=h; }
    },
    camera(ex,ey,ez,yaw,pitch,fov){
      const asp=canvas.width/canvas.height; R.fov=fov; R.eye[0]=ex; R.eye[1]=ey; R.eye[2]=ez;
      M4.persp(R.proj, fov, asp, 0.05, 260); M4.view(R.view, ex,ey,ez, yaw,pitch); M4.mul(R.vp, R.proj, R.view); M4.invert(R.ivp, R.vp);
      M4.persp(R.vmProj, 1.0, asp, 0.01, 10);
      R.yaw=yaw; R.pitch=pitch;
    },
    // world point -> screen px (or null when behind)
    project(x,y,z, out){
      const m=R.vp; const cx=m[0]*x+m[4]*y+m[8]*z+m[12], cy=m[1]*x+m[5]*y+m[9]*z+m[13], cw=m[3]*x+m[7]*y+m[11]*z+m[15];
      if(cw<0.05) return null; out[0]=(cx/cw*0.5+0.5)*canvas.clientWidth; out[1]=(1-(cy/cw*0.5+0.5))*canvas.clientHeight; out[2]=cw; return out;
    },
    uniforms(P, vmMode){
      const e=R.env, u=P.u;
      gl.uniformMatrix4fv(u.u_vp,false, vmMode ? R.vmProj : R.vp);
      let sx=e.sun[0], sy=e.sun[1], sz=e.sun[2];
      if(vmMode){ const v=R.view; const tx=v[0]*sx+v[4]*sy+v[8]*sz, ty=v[1]*sx+v[5]*sy+v[9]*sz, tz=v[2]*sx+v[6]*sy+v[10]*sz; sx=tx; sy=ty; sz=tz; }
      gl.uniform3f(u.u_sun,sx,sy,sz); gl.uniform3fv(u.u_sunCol,e.sunCol);
      if(vmMode){ // view space: "up" for hemisphere lighting is the camera's up
        gl.uniform3fv(u.u_sky,e.sky); gl.uniform3fv(u.u_gnd,e.gnd); gl.uniform3f(u.u_eye,0,0,0); gl.uniform2f(u.u_fogR,500,600);
      } else { gl.uniform3fv(u.u_sky,e.sky); gl.uniform3fv(u.u_gnd,e.gnd); gl.uniform3fv(u.u_eye,R.eye); gl.uniform2fv(u.u_fogR,e.fogR); }
      gl.uniform3fv(u.u_fog,e.fog); gl.uniform1f(u.u_time,R.time);
    },
    drawBatch(B){
      if(!B.n) return;
      gl.bindBuffer(gl.ARRAY_BUFFER,instBuf);
      if(B.n>instCap){ instCap=B.n; gl.bufferData(gl.ARRAY_BUFFER, instCap*STRIDE*4, gl.DYNAMIC_DRAW); }
      gl.bufferSubData(gl.ARRAY_BUFFER,0,B.d,0,B.n*STRIDE);
      gl.bindVertexArray(instVAO); gl.drawElementsInstanced(gl.TRIANGLES,36,gl.UNSIGNED_SHORT,0,B.n); R.triCount+=12*B.n;
    },
    render(){
      R.triCount=0;
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(R.env.fog[0],R.env.fog[1],R.env.fog[2],1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      // sky
      gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.disable(gl.CULL_FACE);
      gl.useProgram(PK.p); const e=R.env;
      gl.uniformMatrix4fv(PK.u.u_ivp,false,R.ivp); gl.uniform3fv(PK.u.u_eye,R.eye); gl.uniform3fv(PK.u.u_sun,e.sun); gl.uniform3fv(PK.u.u_top,e.top); gl.uniform3fv(PK.u.u_hor,e.hor); gl.uniform3fv(PK.u.u_fog,e.fog); gl.uniform1f(PK.u.u_time,R.time); gl.uniform1f(PK.u.u_cloud,e.cloud);
      gl.bindVertexArray(skyVAO); gl.drawArrays(gl.TRIANGLES,0,3);
      // world
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      if(stat){ gl.useProgram(PS.p); R.uniforms(PS,false); gl.bindVertexArray(stat.vao); gl.drawElements(gl.TRIANGLES,stat.count,gl.UNSIGNED_INT,0); R.triCount+=stat.count/3; }
      gl.useProgram(PI.p); R.uniforms(PI,false);
      gl.disable(gl.CULL_FACE);
      R.drawBatch(R.opaque);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      R.drawBatch(R.trans);
      gl.depthMask(true); gl.disable(gl.BLEND);
      // first-person weapon (own depth range)
      if(R.vm.n || R.vmT.n){
        gl.clear(gl.DEPTH_BUFFER_BIT); R.uniforms(PI,true);
        R.drawBatch(R.vm);
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE); gl.depthMask(false); R.drawBatch(R.vmT); gl.depthMask(true); gl.disable(gl.BLEND);
      }
      gl.bindVertexArray(null);
      R.opaque.clear(); R.trans.clear(); R.vm.clear(); R.vmT.clear();
    },
  };
  return R;
}

// ---------------- collision world ----------------
export const STEP = 0.45, GRAV = 22;
export class World {
  constructor(boxes, bounds){
    const s=boxes.filter(b=>!b.nc && !b.rot); this.n=s.length;
    const A=this.a=new Float32Array(s.length*6);
    s.forEach((b,i)=>{ A[i*6]=b.x0; A[i*6+1]=b.y0; A[i*6+2]=b.z0; A[i*6+3]=b.x1; A[i*6+4]=b.y1; A[i*6+5]=b.z1; });
    this.list=s; this.bounds=bounds; this.hn=[0,1,0]; this.hitBox=-1;
  }
  // highest floor top under a circle that is not above maxY
  groundAt(x, z, r, maxY){
    let g=0; const A=this.a;
    for(let i=0;i<this.n;i++){ const o=i*6; const top=A[o+4]; if(top>maxY || top<=g) continue;
      if(x+r<A[o] || x-r>A[o+3] || z+r<A[o+2] || z-r>A[o+5]) continue; g=top; }
    return g;
  }
  ceilAt(x, z, r, fromY){
    let c=Infinity; const A=this.a;
    for(let i=0;i<this.n;i++){ const o=i*6; const bot=A[o+1]; if(bot<fromY-0.05 || bot>=c) continue;
      if(x+r<A[o] || x-r>A[o+3] || z+r<A[o+2] || z-r>A[o+5]) continue; c=bot; }
    return c;
  }
  // push a vertical capsule (circle in xz) out of walls
  pushOut(b){
    const A=this.a, lo=b.y+STEP, hi=b.y+b.h, r=b.r; let hit=false;
    for(let it=0; it<2; it++){
      for(let i=0;i<this.n;i++){
        const o=i*6; if(A[o+4]<=lo || A[o+1]>=hi) continue;
        const x0=A[o], z0=A[o+2], x1=A[o+3], z1=A[o+5];
        if(b.x+r<=x0 || b.x-r>=x1 || b.z+r<=z0 || b.z-r>=z1) continue;
        const cx=b.x<x0?x0:b.x>x1?x1:b.x, cz=b.z<z0?z0:b.z>z1?z1:b.z;
        let dx=b.x-cx, dz=b.z-cz; const d2=dx*dx+dz*dz;
        if(d2>=r*r) continue;
        hit=true;
        if(d2>1e-9){ const d=Math.sqrt(d2), p=(r-d)/d; b.x+=dx*p; b.z+=dz*p; }
        else { const l=b.x-x0, rr=x1-b.x, f=b.z-z0, k=z1-b.z; const m=Math.min(l,rr,f,k);
          if(m===l) b.x=x0-r; else if(m===rr) b.x=x1+r; else if(m===f) b.z=z0-r; else b.z=z1+r; }
      }
    }
    const B=this.bounds; if(B){ b.x=Math.max(B[0]+r, Math.min(B[2]-r, b.x)); b.z=Math.max(B[1]+r, Math.min(B[3]-r, b.z)); }
    return hit;
  }
  // nearest hit distance along a ray (Infinity if none); this.hn = surface normal
  ray(ox, oy, oz, dx, dy, dz, maxT){
    const A=this.a; let best=maxT, bi=-1, ba=0;
    const ix=1/(dx||1e-9), iy=1/(dy||1e-9), iz=1/(dz||1e-9);
    for(let i=0;i<this.n;i++){
      const o=i*6;
      let t1=(A[o]-ox)*ix, t2=(A[o+3]-ox)*ix, tmin=Math.min(t1,t2), tmax=Math.max(t1,t2), ax=0;
      t1=(A[o+1]-oy)*iy; t2=(A[o+4]-oy)*iy; let a=Math.min(t1,t2), b=Math.max(t1,t2); if(a>tmin){ tmin=a; ax=1; } if(b<tmax) tmax=b;
      if(tmax<tmin) continue;
      t1=(A[o+2]-oz)*iz; t2=(A[o+5]-oz)*iz; a=Math.min(t1,t2); b=Math.max(t1,t2); if(a>tmin){ tmin=a; ax=2; } if(b<tmax) tmax=b;
      if(tmax<tmin || tmax<0 || tmin>=best) continue;
      if(tmin<0) continue; // started inside
      best=tmin; bi=i; ba=ax;
    }
    if(bi<0){ this.hitBox=-1; return Infinity; }
    this.hitBox=bi; const n=this.hn; n[0]=n[1]=n[2]=0;
    n[ba] = (ba===0?dx:ba===1?dy:dz) > 0 ? -1 : 1;
    if(best<maxT && oy+dy*best<0.001 && dy<0){ n[0]=0; n[1]=1; n[2]=0; }
    return best;
  }
  rayG(ox,oy,oz,dx,dy,dz,maxT){ // includes the ground plane y=0
    let t=this.ray(ox,oy,oz,dx,dy,dz,maxT);
    if(dy<0){ const tg=-oy/dy; if(tg>=0 && tg<t){ t=tg; this.hn[0]=0; this.hn[1]=1; this.hn[2]=0; this.hitBox=-2; } }
    return t;
  }
  clear(ax,ay,az,bx,by,bz){ const dx=bx-ax, dy=by-ay, dz=bz-az, L=Math.hypot(dx,dy,dz); if(L<1e-6) return true; return this.ray(ax,ay,az,dx/L,dy/L,dz/L,L)===Infinity; }
  freeAt(x, z, r, y=0, h=1.75){ const A=this.a; for(let i=0;i<this.n;i++){ const o=i*6; if(A[o+4]<=y+0.05 || A[o+1]>=y+h) continue; if(x+r<=A[o]||x-r>=A[o+3]||z+r<=A[o+2]||z-r>=A[o+5]) continue; return false; } return true; }
}
// one physics step for a walking body {x,y,z,vx,vy,vz,r,h,onG}
export function moveBody(W, b, dt){
  const dist=Math.hypot(b.vx,b.vz)*dt, n=Math.max(1,Math.ceil(dist/0.2));
  for(let i=0;i<n;i++){ b.x+=b.vx*dt/n; b.z+=b.vz*dt/n; W.pushOut(b); }
  b.vy-=GRAV*dt; if(b.vy<-40) b.vy=-40;
  const ny=b.y+b.vy*dt;
  const g=W.groundAt(b.x,b.z,b.r*0.7,b.y+STEP);
  if(b.vy<=0 && ny<=g){ b.y=g; b.vy=0; b.onG=true; }
  else {
    if(b.vy>0){ const c=W.ceilAt(b.x,b.z,b.r*0.7,b.y+b.h); if(ny+b.h>c){ b.y=Math.max(g, c-b.h); b.vy=0; } else b.y=ny; }
    else b.y=ny;
    b.onG=false;
  }
}
