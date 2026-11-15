// Photo-real object for the Radio page: a pre-rendered turning loop (frames rendered in Blender)
// drawn through a small WebGL shader that adds real-looking heat shimmer, a soft floor shadow,
// a gentle float, and a pulse on every kick drum.
const VS = `attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0,1);}`;
const FS = `precision mediump float;varying vec2 uv;
uniform sampler2D A,B;uniform float mixAB;uniform vec2 res,isz;uniform float t,level,kick,lift,ready,bgOn;uniform vec3 page;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int k=0;k<4;k++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
vec4 obj(vec2 q){
  vec2 c=vec2(.5,.56+lift);vec2 sz=isz/res*(1.+kick*.025);vec2 r=(q-c)/sz+.5;r.y=1.-r.y;
  if(r.x<0.||r.y<0.||r.x>1.||r.y>1.)return vec4(0);
  return mix(texture2D(A,r),texture2D(B,r),mixAB)*ready;}
void main(){
  vec2 q=uv;float asp=res.x/res.y;
  float aura=0.;
  for(int i=0;i<8;i++){float an=float(i)*.785;aura+=obj(q+vec2(cos(an)/asp,sin(an))*.035).a;}
  aura/=8.;
  float plume=0.;
  for(int k=1;k<7;k++){float fk=float(k);plume+=obj(q-vec2(0.,.035*fk)).a*(1.-fk/7.);}
  plume=clamp(plume/2.2,0.,1.);
  float inside=obj(q).a;
  float src=clamp(max(aura,plume)*(1.-inside*.85),0.,1.);
  vec2 w=vec2(q.x*asp*26.,q.y*11.);float rise=t*(1.6+level*1.6);
  vec2 off=vec2(fbm(w+vec2(0.,-rise*3.))-.5,(fbm(w*1.4+vec2(4.1,-rise*3.6))-.5)*.5);
  vec2 d=off*(.0018+.007*level+.012*kick)*src;
  float br=(.0002+.0008*level)*src;
  vec4 col=vec4(0);
  for(int i=0;i<6;i++){float a=float(i)*1.047+t;col+=obj(q+d+vec2(cos(a),sin(a))*br);}
  col/=6.;
  // soft studio backdrop that fades into the page colour at the edges, bent by the haze
  vec2 qb=q+d*1.4;
  vec3 top=vec3(.955,.925,.895),bot=vec3(.985,.97,.955);
  vec3 tint=mix(vec3(1.,.9,.86),vec3(.9,.93,1.),qb.x);
  vec3 studio=mix(bot,top,smoothstep(.15,1.,qb.y))*mix(vec3(1.),tint,.35);
  studio+=(h(floor(qb*res*.6)+floor(t*24.))-.5)*.016;
  vec2 vq=(q-vec2(.5,.5))*vec2(asp*.9,1.);float vig=exp(-dot(vq,vq)*3.2)*bgOn;
  vec3 bg=mix(page,studio,vig);
  vec2 sp=(qb-vec2(.5,.27))*vec2(asp*3.4,11.)*(1.+lift*2.);float sh=exp(-dot(sp,sp)*2.)*(.36-kick*.08-lift*1.5)*ready;
  bg-=sh*vec3(.5,.48,.46);
  vec3 c=mix(bg,col.rgb,col.a);
  float glow=(.03+.08*level+.05*kick)*src*(1.-col.a*.85);
  c=mix(c,c*vec3(1.,.93,.82)+vec3(.05,.02,0.),glow);
  gl_FragColor=vec4(c,1.);}`;

export function mountFrames(el, { base, count, fps = 12, getAnalyser, onNext, pageColor = [0.984, 0.984, 0.976] } = {}) {
  const cv = document.createElement('canvas');
  cv.className = 'rframes';
  el.appendChild(cv);
  const gl = cv.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
  if (!gl) { cv.remove(); return null; }
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  const mkTex = unit => { const tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); return tx; };
  const texA = mkTex(0), texB = mkTex(1);
  gl.uniform1i(U('A'), 0); gl.uniform1i(U('B'), 1);
  gl.uniform3f(U('page'), ...pageColor);

  // load frames progressively (first one first, so something shows quickly)
  const imgs = new Array(count); let loaded = 0, firstReady = false, iw = 340, ih = 320, alive = true;
  const load = i => new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => { imgs[i] = im; loaded++; if (i === 0) { iw = im.naturalWidth; ih = im.naturalHeight; firstReady = true; } res(); }; im.onerror = res; im.src = `${base}${String(i).padStart(3, '0')}.webp`; });
  (async () => { await load(0); for (let i = 1; i < count && alive; i += 6) await Promise.all([...Array(6)].map((_, k) => i + k < count ? load(i + k) : 0)); })();
  const upload = (tx, unit, im) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tx); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); };

  let dpr = 1;
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 1.5); cv.width = Math.max(1, el.clientWidth * dpr); cv.height = Math.max(1, el.clientHeight * dpr); gl.viewport(0, 0, cv.width, cv.height); };
  const ro = new ResizeObserver(resize); ro.observe(el); resize();

  // click on the object -> next object
  const onClick = ev => { const r = cv.getBoundingClientRect(); const x = (ev.clientX - r.left) / r.width - .5, y = (ev.clientY - r.top) / r.height - .44;
    const sw = drawW / r.width / dpr * dpr, shh = drawH / r.height; if (Math.abs(x) < sw * .45 && Math.abs(y) < shh * .5 && onNext) onNext(); };
  const onMove = ev => { const r = cv.getBoundingClientRect(); const x = (ev.clientX - r.left) / r.width - .5, y = (ev.clientY - r.top) / r.height - .44;
    cv.style.cursor = Math.abs(x) < drawW / r.width * .45 && Math.abs(y) < drawH / r.height * .5 ? 'pointer' : ''; };
  cv.addEventListener('click', onClick); cv.addEventListener('pointermove', onMove);

  let freq = null, level = 0, pulse = 0, lastKick = -1; const win = [];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let readyAt = 0, raf = 0, t0 = -1, prev = t0, shown = -1, shownB = -1, visible = true, drawW = 0, drawH = 0, fade = 0;
  const loop = now => {
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    if (t0 < 0) { t0 = now; prev = now; }
    const t = Math.max(0, (now - t0) / 1000), dt = Math.min(.05, Math.max(0, (now - prev) / 1000)); prev = now;
    const an = getAnalyser && getAnalyser();
    if (an) {
      if (!freq || freq.length !== an.frequencyBinCount) freq = new Uint8Array(an.frequencyBinCount);
      an.getByteFrequencyData(freq);
      const hz = an.context.sampleRate / an.fftSize, a = Math.max(1, Math.floor(35 / hz)), b = Math.ceil(130 / hz);
      let e = 0; for (let i = a; i <= b; i++) e += freq[i]; e /= (b - a + 1) * 255;
      let all = 0; for (let i = 0; i < 200; i++) all += freq[i]; all /= 200 * 255;
      level += (Math.min(1, all * 2.2) - level) * Math.min(1, dt * 4);
      win.push(t, e); while (win.length > 2 && t - win[0] > .09) win.splice(0, 2);
      let mn = 1; for (let i = 1; i < win.length; i += 2) mn = Math.min(mn, win[i]);
      if (e > .3 && e - mn > .14 && t - lastKick > .2) { pulse = Math.min(1, pulse + .85); lastKick = t; }
    } else level *= .96;
    pulse *= Math.exp(-dt * 9);
    // which frame (and how far towards the next) — blending two frames keeps the slow turn smooth
    const pos = reduce ? 0 : (t * fps) % count, i0 = Math.floor(pos), i1 = (i0 + 1) % count;
    const f0 = imgs[i0] ? i0 : (imgs[shown] ? shown : 0), f1 = imgs[i1] ? i1 : f0;
    if (imgs[f0] && f0 !== shown) { upload(texA, 0, imgs[f0]); shown = f0; }
    if (imgs[f1] && f1 !== shownB) { upload(texB, 1, imgs[f1]); shownB = f1; }
    if (firstReady) { if (!readyAt) readyAt = now; fade = Math.min(1, (now - readyAt) / 500); }
    const scale = Math.min(cv.height * 0.44 / ih, cv.width * 0.6 / iw);
    drawW = iw * scale; drawH = ih * scale;
    const bob = reduce ? 0 : Math.sin(t * .7) * .012;
    gl.uniform1f(U('mixAB'), f1 === i1 && f0 === i0 ? pos - i0 : 0);
    gl.uniform2f(U('res'), cv.width, cv.height); gl.uniform2f(U('isz'), drawW, drawH);
    gl.uniform1f(U('t'), t); gl.uniform1f(U('level'), reduce ? 0 : level); gl.uniform1f(U('kick'), reduce ? 0 : pulse);
    gl.uniform1f(U('lift'), bob + pulse * .008); gl.uniform1f(U('ready'), fade); gl.uniform1f(U('bgOn'), 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  raf = requestAnimationFrame(loop);
  return {
    show(v) { visible = v; cv.style.display = v ? '' : 'none'; },
    destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); cv.removeEventListener('click', onClick); cv.removeEventListener('pointermove', onMove); cv.remove(); const x = gl.getExtension('WEBGL_lose_context'); x && x.loseContext(); }
  };
}
