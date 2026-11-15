(()=>{
const D=window.DATA,P=D.projects,F=D.photos,NAME='Pál A. Tóth',IG='https://www.instagram.com/pali.tiff/',MAIL='palattilatoth@gmail.com';
const $=(t,a={},...k)=>{const e=document.createElement(t);for(const[x,y]of Object.entries(a)){if(x==='class')e.className=y;else if(x.startsWith('on'))e.addEventListener(x.slice(2),y);else e.setAttribute(x,y)}k.flat().forEach(c=>c!=null&&e.append(c));return e};
const url=(f,w)=>`/img/${f.s}-${w}.jpg`;
const img=(f,sizes,lazy)=>$('img',{src:url(f,f.ws[0]),srcset:f.ws.map(w=>`${url(f,w)} ${Math.min(w,f.w)}w`).join(', '),sizes,width:f.w,height:f.h,alt:`${P[f.p].title}, photograph by ${NAME}`,decoding:'async',...(lazy?{loading:'lazy'}:{})});
const pad=n=>String(n).padStart(2,'0');
const lk=(t,h,cur)=>$('a',{class:'lk'+(cur?' cur':''),href:h},t);
const TITLES={home:NAME+' | Photographer in Berlin: portrait, still life and fashion',index:'Index',gallery:'Gallery',about:'About',radio:'Radio'};

/* ---------- radio player (persists across pages) ---------- */
const EPS=(D.eps||[]).slice().sort((a,b)=>b.n-a.n).map(e=>{const sub=e.t.replace(/^Episode \d+\s*-?\s*/,'');return{...e,full:`Music for Ironing Episode ${e.n}${sub?': '+sub:''}`}});
const audio=new Audio();audio.preload='none';audio.crossOrigin='anonymous';
let actx=null,analyser=null;
// ---- sound effects: pitch (key only, tempo unchanged), delay, room ----
const FXD={pitch:0,dTime:350,dFb:35,dMix:0,rSize:2.5,rMix:0,tape:0,crush:0,ring:0,flange:0};
const FX=(()=>{try{return Object.assign({},FXD,JSON.parse(localStorage.getItem('rfx')||'{}'))}catch(e){return Object.assign({},FXD)}})();
let fxN=null,irT=0;
const makeIR=(c,sec)=>{const len=Math.floor(c.sampleRate*sec),b=c.createBuffer(2,len,c.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);let lp=0;for(let i=0;i<len;i++){const t=i/len;lp+=((Math.random()*2-1)-lp)*(0.35+0.6*(1-t));d[i]=lp*Math.pow(1-t,2.6)*(i<c.sampleRate*0.004?i/(c.sampleRate*0.004):1)}}return b};
const crushCurve=bits=>{const n=4096,st=Math.pow(2,bits)/2,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.round(x*st)/st}return c};
const applyFX=()=>{try{localStorage.setItem('rfx',JSON.stringify(FX))}catch(e){}if(!fxN)return;const t=actx.currentTime,S=(p,v)=>p.setTargetAtTime(v,t,0.03);
 if(fxN.pitch)S(fxN.pitch.parameters.get('ratio'),Math.pow(2,FX.pitch/12));
 S(fxN.delay.delayTime,FX.dTime/1000);S(fxN.fb.gain,FX.dFb/100*0.92);S(fxN.dWet.gain,FX.dMix/100);S(fxN.rWet.gain,FX.rMix/100*1.6);
 S(fxN.dry.gain,1-0.35*Math.max(FX.dMix,FX.rMix)/100);
 const W=fxN.w;if(W){const tp=FX.tape/100,cm=Math.min(1,FX.crush/100*1.6),rm=FX.ring/100;S(W.tWet.gain,tp);S(W.tDry.gain,1-tp);S(W.tDep.gain,tp*0.004);S(W.tDep2.gain,tp*0.0007);S(W.tLp.frequency,18000-tp*14500);
  S(W.cWet.gain,cm*0.85);S(W.cDry.gain,1-cm);const bits=Math.max(2,Math.round(10-FX.crush/100*8));if(W.bits!==bits){W.bits=bits;W.cr.curve=crushCurve(bits)}S(W.qWet.gain,rm);S(W.qDry.gain,1-rm*0.85);const fl=FX.flange/100;S(W.fWet.gain,fl*0.75);S(W.fFb.gain,fl*0.72)}
 if(fxN.size!==FX.rSize){clearTimeout(irT);irT=setTimeout(()=>{fxN.conv.buffer=makeIR(actx,FX.rSize);fxN.size=FX.rSize},120)}};
const buildFX=(src,dest)=>{const c=actx,inp=c.createGain(),out=c.createGain(),dry=c.createGain(),delay=c.createDelay(2.5),fb=c.createGain(),lp=c.createBiquadFilter(),dWet=c.createGain(),conv=c.createConvolver(),rWet=c.createGain();
 lp.type='lowpass';lp.frequency.value=4200;dWet.gain.value=0;rWet.gain.value=0;fb.gain.value=0;
 // weird effects first: tape warble, bit crush, ring modulator
 const wIn=c.createGain(),G=v=>{const g=c.createGain();g.gain.value=v;return g},osc=f=>{const o=c.createOscillator();o.frequency.value=f;o.start();return o};
 const tD=c.createDelay(0.1);tD.delayTime.value=0.012;const tDep=G(0),tDep2=G(0);osc(0.55).connect(tDep);osc(6.5).connect(tDep2);tDep.connect(tD.delayTime);tDep2.connect(tD.delayTime);
 const tLp=c.createBiquadFilter();tLp.type='lowpass';tLp.frequency.value=18000;const tDry=G(1),tWet=G(0),t1=G(1);wIn.connect(tDry);wIn.connect(tD);tD.connect(tLp);tLp.connect(tWet);tDry.connect(t1);tWet.connect(t1);
 const cr=c.createWaveShaper(),cDry=G(1),cWet=G(0),t2=G(1);t1.connect(cDry);t1.connect(cr);cr.connect(cWet);cDry.connect(t2);cWet.connect(t2);
 const rg=G(0),ro=osc(170),roD=G(120);osc(0.13).connect(roD);roD.connect(ro.frequency);ro.connect(rg.gain);const qDry=G(1),qWet=G(0);t2.connect(qDry);t2.connect(rg);rg.connect(qWet);const t3=G(1);qDry.connect(t3);qWet.connect(t3);
 const fD=c.createDelay(0.05);fD.delayTime.value=0.0035;const fDep=G(0.0025);osc(0.22).connect(fDep);fDep.connect(fD.delayTime);const fFb=G(0),fWet=G(0);t3.connect(inp);t3.connect(fD);fD.connect(fFb);fFb.connect(fD);fD.connect(fWet);fWet.connect(inp);
 src.connect(wIn);delay.connect(lp);lp.connect(fb);fb.connect(delay);lp.connect(dWet);dWet.connect(out);conv.connect(rWet);rWet.connect(out);dry.connect(out);out.connect(dest);
 const feed=n=>{n.connect(dry);n.connect(delay);n.connect(conv)};feed(inp);
 conv.buffer=makeIR(c,FX.rSize);fxN={dry,delay,fb,dWet,conv,rWet,size:FX.rSize,pitch:null,w:{tDep,tDep2,tLp,tDry,tWet,cr,cDry,cWet,qDry,qWet,fFb,fWet,bits:0}};
 if(c.audioWorklet)c.audioWorklet.addModule('/js/pitch-worklet.js').then(()=>{const p=new AudioWorkletNode(c,'pitch-shift',{outputChannelCount:[2]});inp.disconnect();inp.connect(p);feed(p);fxN.pitch=p;applyFX()}).catch(()=>{});
 applyFX()};
const ensureGraph=()=>{try{if(!analyser){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;actx=new C();const src=actx.createMediaElementSource(audio);analyser=actx.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=0.15;buildFX(src,analyser);analyser.connect(actx.destination)}if(actx&&actx.state==='suspended')actx.resume()}catch(e){}};

const FXROWS=[['pitch','Pitch',-12,12,0.01,v=>(v>0?'+':v<0?'−':'')+Math.abs(v).toFixed(2)+' st'],
 ['dTime','Delay time',20,1200,1,v=>Math.round(v)+' ms'],['dFb','Delay repeats',0,95,1,v=>Math.round(v)+'%'],['dMix','Delay amount',0,100,1,v=>Math.round(v)+'%'],
 ['rSize','Room size',0.2,9,0.1,v=>v<1?'small room':v<2.5?'room':v<5?'hall':'cathedral'],['rMix','Room amount',0,100,1,v=>Math.round(v)+'%']];
/* "Don't press here": scrambles the page and turns the colours inside out; press again to put it back */
let chaos=false;const origText=new Map();
const rnd=(a,b)=>a+Math.random()*(b-a);
const shuffleWord=w=>{if(w.length<3)return w;const a=w.split('');for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a.join('')};
const scramble=()=>{const app=document.querySelector('.app');if(!app)return;document.documentElement.classList.add('chaos');
 const tw=document.createTreeWalker(app,NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){if(n.parentElement.closest('.dont')||!n.nodeValue.trim())continue;if(!origText.has(n))origText.set(n,n.nodeValue);n.nodeValue=origText.get(n).replace(/\S+/g,shuffleWord)}
 app.querySelectorAll('a,h1,p,li,img,.rp,.rplayer,.rknob,.fxrow,.r3d,.stage img,.projs,.links,.name').forEach(el=>{if(el.closest('.dont'))return;el.style.transform=`translate(${rnd(-36,36)}px,${rnd(-28,28)}px) rotate(${rnd(-24,24)}deg)`})};
const unscramble=()=>{document.documentElement.classList.remove('chaos');origText.forEach((v,n)=>{n.nodeValue=v});origText.clear();document.querySelectorAll('.app [style*="rotate"]').forEach(el=>el.style.transform='')};
const dontBtn=()=>{const b=$('button',{type:'button',class:'dont'},chaos?'Okay, put it back':"Don't press here");
 b.onclick=()=>{chaos=!chaos;b.textContent=chaos?'Okay, put it back':"Don't press here";chaos?scramble():unscramble()};return b};
const knobSync=new Set();
const KNOBS=[['tape','Tape','wobbly old cassette'],['crush','Crush','lo-fi bit crusher'],['ring','Ring','metallic ring modulator'],['flange','Flanger','jet-plane whoosh']];
const knobs=()=>$('div',{class:'rknobs'},...KNOBS.map(([k,l,tip])=>{const dial=$('span',{class:'k'}),lab=$('span',{class:'kl'},l);
 const el=$('div',{class:'rknob',role:'slider',tabindex:'0','aria-label':l+', '+tip,'aria-valuemin':'0','aria-valuemax':'100',title:l+': '+tip+' (drag, scroll, double-click to reset)'},dial,lab);
 const show=()=>{dial.style.transform='rotate('+(-135+FX[k]*2.7)+'deg)';dial.classList.toggle('on',FX[k]>0);lab.textContent=FX[k]>0?l+' '+Math.round(FX[k]):l;el.setAttribute('aria-valuenow',Math.round(FX[k]))};
 const set=v=>{FX[k]=Math.max(0,Math.min(100,v));show();applyFX()};
 let y0=null,v0=0;el.addEventListener('pointerdown',e=>{y0=e.clientY-e.clientX;v0=FX[k];el.setPointerCapture(e.pointerId);e.preventDefault()});
 el.addEventListener('pointermove',e=>{if(y0!==null)set(v0+(y0-(e.clientY-e.clientX))*0.6)});['pointerup','pointercancel'].forEach(t=>el.addEventListener(t,()=>y0=null));
 el.addEventListener('wheel',e=>{e.preventDefault();set(FX[k]-Math.sign(e.deltaY)*5)},{passive:false});
 el.addEventListener('dblclick',()=>set(0));el.addEventListener('keydown',e=>{if(e.key==='ArrowUp'||e.key==='ArrowRight'){set(FX[k]+5);e.preventDefault()}if(e.key==='ArrowDown'||e.key==='ArrowLeft'){set(FX[k]-5);e.preventDefault()}});
 knobSync.add(show);show();return el}));
let ASPD=(()=>{try{const v=parseFloat(localStorage.getItem('rspd'));return isFinite(v)?v:1}catch(e){return 1}})();
const speedRow=()=>{const f=v=>v.toFixed(2)+'×',val=$('span',{class:'fxv'},f(ASPD));
 const setS=v=>{ASPD=v;val.textContent=f(v);try{localStorage.setItem('rspd',String(v))}catch(e){}if(ap)ap.setSpeed(v)};
 const inp=$('input',{type:'range',min:'0.25',max:'2',step:'0.05',value:ASPD,'aria-label':'Apple speed',oninput:e=>setS(+e.target.value),ondblclick:e=>{e.target.value=1;setS(1)}});
 return $('label',{class:'fxrow rspd'},$('span',{class:'fxl'},'Apple speed'),inp,val)};
const fxPanel=()=>{const rows=FXROWS.map(([k,l,mn,mx,st,f])=>{const val=$('span',{class:'fxv'},f(FX[k]));
  const inp=$('input',{type:'range',min:mn,max:mx,step:st,value:FX[k],'aria-label':l,oninput:e=>{FX[k]=+e.target.value;val.textContent=f(FX[k]);applyFX()},ondblclick:e=>{FX[k]=FXD[k];e.target.value=FXD[k];val.textContent=f(FX[k]);applyFX()}});
  return $('label',{class:'fxrow'},$('span',{class:'fxl'},l),inp,val)});
 const reset=$('button',{type:'button',class:'fxreset',onclick:()=>{Object.assign(FX,FXD);knobSync.forEach(f=>f());rows.forEach((r,i)=>{const k=FXROWS[i][0];r.querySelector('input').value=FX[k];r.querySelector('.fxv').textContent=FXROWS[i][5](FX[k])});applyFX()}},'Reset');
 return $('details',{class:'rfx'},$('summary',{},'Effects / Speed',reset),...rows,knobs(),speedRow(),dontBtn())};
const playNow=()=>{ensureGraph();return audio.play().catch(()=>{})};
const hooks=new Set();
let ep=null;
const fmt=s=>{if(!isFinite(s))return'';s=Math.floor(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return(h?h+':'+pad(m):m)+':'+pad(x)};
const playBtn=$('button',{type:'button',class:'rp-play','aria-label':'Play'});
const label=$('span',{class:'rp-label'});
const listBtn=$('button',{type:'button',class:'rp-list','aria-label':'Show all episodes',title:'All episodes','aria-expanded':'false'});listBtn.innerHTML='<svg viewBox="0 0 16 14" width="15" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M1 2h14M1 7h9M1 12h7"/><path d="M12 8.6v4.8l3.6-2.4z" fill="currentColor" stroke-linejoin="round" stroke-width="1"/></svg>';
const bar=$('span',{class:'rp-bar',role:'slider',tabindex:'0','aria-label':'Seek','aria-valuemin':'0','aria-valuemax':'100','aria-valuenow':'0'},$('span',{class:'rp-fill'}));
const seekTo=x=>{if(!audio.duration)return;const r=bar.getBoundingClientRect();const p=Math.min(1,Math.max(0,(x-r.left)/r.width));audio.currentTime=p*audio.duration;sync()};
let dragging=false;
bar.addEventListener('pointerdown',e=>{dragging=true;bar.setPointerCapture(e.pointerId);seekTo(e.clientX)});
bar.addEventListener('pointermove',e=>{if(dragging)seekTo(e.clientX)});
['pointerup','pointercancel'].forEach(t=>bar.addEventListener(t,()=>dragging=false));
bar.addEventListener('keydown',e=>{if(!audio.duration)return;if(e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();audio.currentTime=Math.min(audio.duration,audio.currentTime+30)}if(e.key==='ArrowLeft'){e.preventDefault();e.stopPropagation();audio.currentTime=Math.max(0,audio.currentTime-30)}});
const panel=$('div',{class:'rp-panel',hidden:''});
const player=$('div',{class:'rp'},panel,playBtn,label,listBtn,bar);
const setLabel=()=>{if(!ep){label.replaceChildren($('span',{class:'rp-x'},'Listen to '),$('em',{},'Music for Ironing'),$('span',{class:'rp-x'},' on ',$('a',{href:'https://radio.90mil.berlin/',target:'_blank',rel:'noopener'},'90mil Radio')));return}
 label.replaceChildren($('em',{},ep.full),$('span',{class:'rp-t'},audio.currentTime?`${fmt(audio.currentTime)}${audio.duration?' / '+fmt(audio.duration):''}`:''))};
const sync=()=>{const on=!audio.paused;player.classList.toggle('on',on);playBtn.setAttribute('aria-label',on?'Pause':'Play');
 const pc=audio.duration?audio.currentTime/audio.duration*100:0;bar.firstChild.style.width=pc+'%';bar.setAttribute('aria-valuenow',String(Math.round(pc)));bar.setAttribute('aria-valuetext',fmt(audio.currentTime));player.classList.toggle('loaded',!!ep);setLabel();
 panel.querySelectorAll('button').forEach(b=>b.classList.toggle('cur',ep&&+b.dataset.n===ep.n));hooks.forEach(f=>f())};
const load=(e,go=true)=>{ep=e;audio.src=(D.ab||'').replace(/\/?$/,'/')+encodeURIComponent(e.f);if(go)playNow();sync()};
const nextEp=()=>{const i=ep?EPS.indexOf(ep):-1;load(EPS[i+1]||EPS[0])};
/* keep playing when the phone is locked or the browser is in the background */
try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
const msMeta=()=>{try{if(!('mediaSession' in navigator)||!ep)return;navigator.mediaSession.metadata=new MediaMetadata({title:ep.full,artist:'Pál A. Tóth',album:'Music for Ironing, 90mil Radio',artwork:[{src:'/apple-touch-icon.png',sizes:'180x180',type:'image/png'}]})}catch(e){}};
try{if('mediaSession' in navigator){const M=navigator.mediaSession,h=(k,f)=>{try{M.setActionHandler(k,f)}catch(e){}};
 h('play',()=>playNow());h('pause',()=>audio.pause());h('nexttrack',()=>nextEp());h('stop',()=>audio.pause());
 h('seekto',d=>{if(d&&isFinite(d.seekTime))audio.currentTime=d.seekTime});h('seekbackward',d=>{audio.currentTime=Math.max(0,audio.currentTime-((d&&d.seekOffset)||15))});h('seekforward',d=>{audio.currentTime+=((d&&d.seekOffset)||15)});}}catch(e){}
audio.addEventListener('play',()=>{msMeta();try{navigator.mediaSession.playbackState='playing'}catch(e){}});
audio.addEventListener('pause',()=>{try{navigator.mediaSession.playbackState='paused'}catch(e){}});
// the browser may pause the sound engine in the background; wake it again while music should be playing
const wake=()=>{if(actx&&actx.state!=='running'&&!audio.paused)actx.resume().catch(()=>{})};
document.addEventListener('visibilitychange',wake);
try{setInterval(wake,1000)}catch(e){}

const stopEp=()=>{audio.pause();if(audio.duration)audio.currentTime=0;sync()};
playBtn.onclick=()=>{if(!D.ab)return;if(!ep)return load(EPS[0]);audio.paused?playNow():audio.pause()};
listBtn.onclick=()=>{const open=panel.hidden;panel.hidden=!open;listBtn.setAttribute('aria-expanded',String(open))};
document.addEventListener('click',e=>{if(!panel.hidden&&!player.contains(e.target)){panel.hidden=true;listBtn.setAttribute('aria-expanded','false')}});
panel.append($('p',{class:'rp-head'},'Music for Ironing, a bi-weekly hour on ',$('a',{href:'https://radio.90mil.berlin/',target:'_blank',rel:'noopener'},'90mil Radio')),
 $('ol',{},EPS.map(e=>$('li',{},$('button',{type:'button','data-n':e.n,onclick:()=>{load(e);}},e.full)))));
['play','pause','timeupdate','loadedmetadata','ended'].forEach(t=>audio.addEventListener(t,sync));
if(!D.ab||!EPS.length)player.hidden=true;
setLabel();

/* player "swims" between the footer and the radio panel when entering or leaving /radio/ */
const grab=(app)=>{if(!app)return null;const radio=app.classList.contains('v-radio'),el=app.querySelector(radio?'.rplayer':'.rp');if(!el||!el.getClientRects().length)return null;
 const g=el.cloneNode(true);g.querySelectorAll('.rp-panel').forEach(x=>x.remove());return{radio,r:el.getBoundingClientRect(),g}};
const swim=(src,app)=>{if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 const dst=app.querySelector(src.radio?'.rp':'.rplayer');if(!dst||!dst.getClientRects().length)return;
 const b=dst.getBoundingClientRect(),a=src.r,host=$('div',{class:src.radio?'rside':'','aria-hidden':'true'});
 host.style.cssText=`position:fixed;left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px;margin:0;padding:0;max-height:none;z-index:40;pointer-events:none;display:block;will-change:transform`;
 src.g.style.cssText+=';position:relative;left:0;top:0;right:auto;bottom:auto;translate:none;margin:0';host.append(src.g);document.body.append(host);
 const dx=(b.left+b.width/2)-(a.left+a.width/2),dy=(b.top+b.height/2)-(a.top+a.height/2);
 const k=[{transform:'translate(0,0)',opacity:1},{transform:`translate(${dx*.7}px,${dy*.7}px)`,opacity:1,offset:.7},{transform:`translate(${dx}px,${dy}px)`,opacity:0}];
 const D=1300;dst.animate([{opacity:0},{opacity:0,offset:.7},{opacity:1}],{duration:D,easing:'ease-out'});
 host.animate(k,{duration:D,easing:'cubic-bezier(.45,0,.2,1)'}).finished.then(()=>host.remove(),()=>host.remove())};
/* ---------- views ---------- */
const parse=p=>{p=p.replace(/\/+$/,'/');let m=p.match(/^\/projects\/([^/]+)\/$/);if(m){const k=P.findIndex(x=>x.slug===m[1]);if(k>=0)return{v:'project',k}}
 if(p==='/index/'||p==='/projects/')return{v:'index'};if(p==='/gallery/')return{v:'gallery'};if(p==='/about/')return{v:'about'};if(p==='/radio/')return{v:'radio'};return{v:'home'}};
let keyH=null,r3=null,rf=null,ap=null;
const render=()=>{
 const {v:V,k:PI=-1}=parse(location.pathname);
 const src=grab(document.querySelector('.app'));
 if(keyH){removeEventListener('keydown',keyH);keyH=null}
 if(r3){r3.destroy();r3=null}if(rf){rf.destroy();rf=null}if(ap){ap.destroy();ap=null}hooks.clear();
 const mid=$('div',{class:'mid'});
 const top=$('header',{class:'bar top'},$('a',{class:'name',href:'/'},NAME),mid,$('nav',{class:'links'},lk('Index','/index/',V==='index'),lk('Gallery','/gallery/',V==='gallery'),lk('Radio','/radio/',V==='radio'),lk('About','/about/',V==='about')));
 const projs=$('nav',{class:'projs','aria-label':'Projects'}),nav2=$('div',{class:'nav2'});
 const bot=$('footer',{class:'bar bot'},projs,V==='radio'?$('div',{}):player,nav2);
 const contact=()=>nav2.replaceChildren(lk('Instagram',IG),lk('Email','mailto:'+MAIL));
 let main;
 if(V==='home'||V==='project'){
  let set=PI>=0?[...Array(P[PI].n)].map((_,i)=>P[PI].start+i):F.map((_,i)=>i);
  if(PI<0){const lv=P.find(p=>p.slug==='levitating');const k=lv?lv.start+Math.min(7,lv.n-1):0;set=[...set.slice(k),...set.slice(0,k)]}
  document.title=PI>=0?`${P[PI].title} | ${NAME}, photographer`:TITLES.home;
  projs.append($('a',{href:'/',class:PI<0?'on':''},'All'),...P.map((p,k)=>$('a',{href:`/projects/${p.slug}/`,class:k===PI?'on':''},p.title)));
  const fr=[];for(let k=0;k<set.length;k++){const a=F[set[k]],b=F[set[k+1]];if(b&&a.h>a.w&&b.h>b.w&&a.p===b.p){fr.push([k,k+1]);k++}else fr.push([k])}
  const frameOf=k=>Math.max(0,fr.findIndex(x=>x.includes(k)));
  main=$('main',{class:'stage'});let cur=0;
  const pre=n=>fr[(n+fr.length)%fr.length].forEach(k=>{const f=F[set[k]];const i=new Image();i.sizes=fr.length>1?'38vw':'76vw';i.srcset=f.ws.map(w=>`${url(f,w)} ${Math.min(w,f.w)}w`).join(', ')});
  const show=n=>{cur=(n+fr.length)%fr.length;const ks=fr[cur];main.className='stage'+(ks.length>1?' two':'');
   main.replaceChildren($('button',{class:'hit p','aria-label':'Previous photograph',onclick:()=>show(cur-1)}),$('button',{class:'hit n','aria-label':'Next photograph',onclick:()=>show(cur+1)}),...ks.map(k=>{const e=img(F[set[k]],ks.length>1?'38vw':'76vw');e.classList.add('fade');return e}));
   const f=F[set[ks[0]]];mid.replaceChildren($('b',{},P[f.p].title),`${pad(ks[0]+1)}${ks.length>1?'–'+pad(ks[1]+1):''} / ${pad(set.length)}`);
   history.replaceState(history.state,'',`${location.pathname}#${ks[0]+1}`);pre(cur+1);pre(cur-1)};
  nav2.classList.add('pj-nav');nav2.append($('button',{type:'button',class:'lk',onclick:()=>show(cur-1)},'Previous'),$('button',{type:'button',class:'lk',onclick:()=>show(cur+1)},'Next'));
  keyH=e=>{if(e.target.closest&&e.target.closest('.rp'))return;if(e.key==='ArrowRight'){e.preventDefault();show(cur+1)}if(e.key==='ArrowLeft'){e.preventDefault();show(cur-1)}};addEventListener('keydown',keyH);
  let sx=null;main.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});main.addEventListener('touchend',e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40)show(cur+(dx<0?1:-1));sx=null});
  const h=parseInt(location.hash.slice(1));show(frameOf(h>0&&h<=set.length?h-1:0));
 }else{
  contact();document.title=V==='radio'?`Radio | ${NAME}`:V==='about'?`About | ${NAME}, photographer in Berlin`:`${TITLES[V]} | ${NAME}, photographer`;
  if(V==='index'){
   P.forEach(p=>projs.append($('a',{href:`/projects/${p.slug}/`},p.title)));
   const pv=$('div',{class:'pv'});const cover=p=>F[p.start+(p.slug==='levitating'?7:0)]||F[p.start];const prev=p=>pv.replaceChildren(img(cover(p),'45vw'));
   main=$('main',{class:'list'},$('ol',{},P.map(p=>$('li',{},$('a',{href:`/projects/${p.slug}/`,onmouseenter:()=>prev(p),onfocus:()=>prev(p)},$('span',{class:'t'},p.title),$('span',{class:'k'},`${pad(p.n)} photographs`))))),pv);prev(P.find(p=>p.slug==='levitating')||P[0]);
  }else if(V==='gallery'){
   const lvP=P.find(p=>p.slug==='levitating'),K=lvP?lvP.start+Math.min(7,lvP.n-1):0,N=F.length;
   const ord=[...(lvP?[...Array(lvP.n)].map((_,i)=>lvP.start+((i+7)%lvP.n)):[]),...F.map((_,i)=>i).filter(i=>!lvP||F[i].p!==P.indexOf(lvP))];
   const cols=$('div',{class:'cols'},ord.map((i,r)=>{const f=F[i];return $('a',{href:`/#${(i-K+N)%N+1}`,'data-p':f.p},img(f,'(max-width:760px) 50vw, 20vw',r>9))}));
   const btns=[$('button',{type:'button',class:'on'},'All'),...P.map(p=>$('button',{type:'button'},p.title))];
   btns.forEach((b,k)=>b.addEventListener('click',()=>{btns.forEach(x=>x.classList.toggle('on',x===b));cols.querySelectorAll('a').forEach(a=>a.classList.toggle('off',!(k===0||+a.dataset.p===k-1)))}));
   projs.append(...btns);main=$('main',{class:'gal'},cols);
  }else if(V==='radio'){
   P.forEach(p=>projs.append($('a',{href:`/projects/${p.slug}/`},p.title)));
   const KIND=['apple','milk','veg','pomegranate','coffee','pie','tomato','tulip','bread','lemonade','fly'];const kindFor=e=>KIND[e.n%KIND.length];
   const stage=$('div',{class:'r3d'});
   const icon=d=>{const s=$('span',{class:'ico'});s.innerHTML=`<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">${d}</svg>`;return s};
   const rPlay=$('button',{type:'button',class:'rc-play','aria-label':'Play',onclick:()=>{if(!ep)load(EPS[0]);else audio.paused?playNow():audio.pause()}});
   const rStop=$('button',{type:'button',class:'rc-btn','aria-label':'Stop',title:'Stop',onclick:stopEp},icon('<rect x="3.5" y="3.5" width="9" height="9" fill="currentColor"/>'));
   const rNext=$('button',{type:'button',class:'rc-btn','aria-label':'Next episode',title:'Next episode',onclick:nextEp},icon('<path d="M3 3l7 5-7 5z" fill="currentColor"/><rect x="11.2" y="3" width="1.8" height="10" fill="currentColor"/>'));
   const rName=$('p',{class:'rnow'}),rTime=$('span',{class:'rtime'});
   const rBar=$('span',{class:'rp-bar rbar',role:'slider',tabindex:'0','aria-label':'Seek'},$('span',{class:'rp-fill'}));
   const rSeek=x=>{if(!audio.duration)return;const r=rBar.getBoundingClientRect();audio.currentTime=Math.min(1,Math.max(0,(x-r.left)/r.width))*audio.duration;sync()};
   let rd=false;rBar.addEventListener('pointerdown',e=>{rd=true;rBar.setPointerCapture(e.pointerId);rSeek(e.clientX)});rBar.addEventListener('pointermove',e=>{if(rd)rSeek(e.clientX)});['pointerup','pointercancel'].forEach(t=>rBar.addEventListener(t,()=>rd=false));
   const rList=$('ol',{class:'rlist'},EPS.map(e=>$('li',{},$('button',{type:'button','data-n':e.n,onclick:()=>load(e)},e.full))));
   const side=$('aside',{class:'rside'},$('h1',{},'Music for Ironing'),$('p',{class:'rsub'},'A bi-weekly hour on ',$('a',{href:'https://radio.90mil.berlin/',target:'_blank',rel:'noopener'},'90mil Radio')),$('div',{class:'rbox rlbox'},rList),fxPanel(),$('div',{class:'rplayer'},rName,rBar,$('div',{class:'rctl'},rPlay,rStop,rNext,rTime)));
   main=$('main',{class:'radio'},stage,side);
   { let st=0;rList.addEventListener('scroll',()=>{rList.classList.add('scrolling');clearTimeout(st);st=setTimeout(()=>rList.classList.remove('scrolling'),900)},{passive:true}) }
   // episode list: always show whole titles, scroll exactly one title per step
   const rowH=()=>{const li=rList.querySelector('li');return li?li.getBoundingClientRect().height:0};
   const fitList=()=>{const h=rowH();if(!h)return;rList.style.maxHeight='';const avail=rList.clientHeight;if(rList.scrollHeight>avail+1){const bd=rList.offsetHeight-rList.clientHeight;rList.style.maxHeight=(Math.max(h,Math.floor(avail/h+0.01)*h)+bd)+'px'}rList.scrollTop=Math.round(rList.scrollTop/h)*h};
   requestAnimationFrame(fitList);addEventListener('resize',fitList);
   { const fx=side.querySelector('.rfx');if(fx)fx.addEventListener('toggle',()=>requestAnimationFrame(fitList)) }
   let wheelLock=0;
   rList.addEventListener('wheel',e=>{if(rList.scrollHeight<=rList.clientHeight)return;e.preventDefault();const now=performance.now();if(now-wheelLock<70&&Math.abs(e.deltaY)<40)return;wheelLock=now;
    const h=rowH();rList.scrollTo({top:Math.max(0,(Math.round(rList.scrollTop/h)+Math.sign(e.deltaY)))*h,behavior:'smooth'})},{passive:false});
   let lastN=null;
   const rSync=()=>{const on=!audio.paused;rPlay.classList.toggle('on',on);rPlay.setAttribute('aria-label',on?'Pause':'Play');
    rName.textContent=ep?ep.full:'Press play to start the latest episode';
    rTime.textContent=ep&&audio.duration?`${fmt(audio.currentTime)} / ${fmt(audio.duration)}`:'';
    rBar.firstChild.style.width=(audio.duration?audio.currentTime/audio.duration*100:0)+'%';rBar.classList.toggle('show',!!ep);
    rList.querySelectorAll('button').forEach(b=>b.classList.toggle('cur',!!ep&&+b.dataset.n===ep.n));
    if(ep&&ep.n!==lastN){lastN=ep.n;r3&&r3.setObject(kindFor(ep));window.__sync3&&window.__sync3()}};
   hooks.add(rSync);rSync();
   const k0=ep?kindFor(ep):KIND[Math.floor(Math.random()*KIND.length)];
   let sty='toy',mode='apples';
   const GA=()=>(!audio.paused&&analyser)||null;
   const wait=()=>new Promise(r=>setTimeout(r,src&&!src.radio?1350:0));
   const bA=$('button',{type:'button',onclick:()=>setMode('apples')},'Apples'),bO=$('button',{type:'button',onclick:()=>setMode('objects')},'Objects');
   stage.append($('div',{class:'r3sw'},bA,bO));
   const startObjects=()=>Promise.all([wait().then(()=>import('/js/radio3d.js')),fetch('/models/list.json').then(r=>r.ok?r.json():[]).catch(()=>[])]).then(([m,models])=>{if(!stage.isConnected||mode!=='objects'||r3)return;
    const FR={};
    const sync3=()=>{if(!r3)return;const k=r3.kind,use=r3.style==='real'&&FR[k];
     if(use){if(!rf)import('/js/radioframes.js').then(F=>{if(!stage.isConnected||rf)return;rf=F.mountFrames(stage,{...FR[k],getAnalyser:GA,onNext:()=>{r3.next();sync3()}});sync3()}).catch(()=>{});else{rf.show(true);r3.setPaused(true)}}
     else{if(rf)rf.show(false);r3.setPaused(false)}};
    window.__sync3=sync3;
    r3=m.mountRadio3D(stage,{kind:'apple',style:sty,models,getAnalyser:GA,onChange:()=>sync3()});sync3();
   }).catch(()=>{});
   const startApples=()=>wait().then(()=>import('/js/apples.js')).then(A=>{if(!stage.isConnected||mode!=='apples'||ap)return;ap=A.mountApples(stage,{getAnalyser:GA});ap.setSpeed(ASPD)}).catch(()=>{});
   const setMode=m=>{mode=m;stage.classList.toggle('ap',m==='apples');bA.setAttribute('aria-pressed',m==='apples');bO.setAttribute('aria-pressed',m==='objects');
    if(m==='apples'){if(r3){r3.destroy();r3=null}if(rf){rf.destroy();rf=null}window.__sync3=null;startApples()}
    else{if(ap){ap.destroy();ap=null}startObjects()}};
   setMode('apples');
  }else{
   P.forEach(p=>projs.append($('a',{href:`/projects/${p.slug}/`},p.title)));
   main=$('main',{class:'ab'},$('div',{class:'pic'},img(F[P[1].start+7]||F[0],'(max-width:760px) 100vw, 40vw')),$('div',{class:'tx'},D.about.map(t=>$('p',{},t))),$('div',{class:'side'},lk(MAIL,'mailto:'+MAIL),lk('Instagram',IG),lk('Music for Ironing on Mixcloud','https://www.mixcloud.com/paliisdead/')));
  }
 }
 const app=$('div',{class:'app v-'+V},top,main,bot);
 const old=document.querySelector('.app')||document.getElementById('app');old.replaceWith(app);
 if(src&&src.radio!==(V==='radio'))requestAnimationFrame(()=>swim(src,app));
 if(chaos){origText.clear();requestAnimationFrame(scramble)}
};
/* client-side navigation so the radio keeps playing */
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a');if(!a||a.target||e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;
 const u=new URL(a.href,location.href);if(u.origin!==location.origin||u.pathname.startsWith('/img/'))return;e.preventDefault();
 if(u.pathname===location.pathname&&u.hash){history.pushState(null,'',u.pathname+u.hash);render();return}
 history.pushState(null,'',u.pathname+u.hash);render();scrollTo(0,0)});
addEventListener('popstate',render);
render();
})();
