/*! LUNAR LANDER: AFTERBURN v1.0.0 BETA — © 2026 Rainwater Games (Jeff Rainwater). All rights reserved. */
(()=>{'use strict';
const VER='0.1';
const Q=new URLSearchParams(location.search);
const $=id=>document.getElementById(id);
const cv=$('c'),ctx=cv.getContext('2d');
let W=0,H=0,DPR=1;
function resize(){DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px';mkScan();}
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, TAU=Math.PI*2;
function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

/* ---------------- worlds & campaign ---------------- */
const WORLDS=[
 {name:'LUNA',sub:"Earth's Moon",g:16,col:'#7df9ff',wind:0,gust:0,drag:0,hz:'Low gravity. Learn the ropes.',planet:'earth'},
 {name:'MARS',sub:'The Red Planet',g:22,col:'#ff7a59',wind:3.5,gust:4,drag:0,hz:'Heavier gravity and gusty wind.',planet:'moons'},
 {name:'EUROPA',sub:'Ice moon of Jupiter',g:13,col:'#9fd8ff',wind:0,gust:0,drag:0,ice:true,hz:'Ice pads are slick. Kill your drift.',planet:'jupiter'},
 {name:'IO',sub:'Volcanic moon of Jupiter',g:19,col:'#ffc23d',wind:0,gust:0,drag:0,lava:true,hz:'Lava pools and erupting geysers.',planet:'jupiter2'},
 {name:'TITAN',sub:'Hazy moon of Saturn',g:11,col:'#c792ff',wind:4,gust:4.5,drag:0.12,hz:'Storm winds and thick air.',planet:'saturn'},
];
// pad kinds: goal, fuel, rescue, pick, drop. fl = floating platform height, mv = moving {dx,dy,per}
const LEVELS=[
 {w:0,n:'First Touch',width:1500,seed:3,rough:.8,sx:260,sy:230,fuel:80,par:30,fs:45,pads:[{x:1050,w:90,k:'goal'}],route:[0],tip:'Hold anywhere to fire the engine. Slide left or right to tilt. Let go and the ship levels itself. Touch down slow on the green pad.'},
 {w:0,n:'Refuel Run',width:2700,seed:8,rough:1,sx:220,sy:230,fuel:55,par:70,fs:55,pads:[{x:1300,w:80,k:'fuel'},{x:2400,w:80,k:'goal'}],route:[0,1],tip:"You won't make it on one tank. Land on the yellow FUEL pad and wait for the tank to fill."},
 {w:0,n:'Stranded',width:2000,seed:14,rough:1.1,sx:300,sy:240,fuel:100,par:75,fs:35,pads:[{x:1600,w:80,k:'rescue',n:1},{x:500,w:90,k:'goal'}],route:[0,1],tip:'An astronaut is stuck at the SOS pad. Land next to them, wait for them to climb aboard, then fly home.'},
 {w:1,n:'Dust Devil',width:1800,seed:21,rough:1.1,sx:260,sy:240,fuel:80,par:30,fs:35,pads:[{x:1300,w:80,k:'goal'}],route:[0],tip:'Mars has stronger gravity and gusting wind. Watch the wind meter and lean into it.'},
 {w:1,n:'Supply Drop',width:2250,seed:27,rough:1.2,sx:240,sy:250,fuel:100,par:90,fs:5,pads:[{x:800,w:80,k:'pick'},{x:1550,w:80,k:'drop'},{x:1950,w:90,k:'goal'}],route:[0,1,2],tip:'Grab the cargo crate and haul it to the DROP pad. Cargo makes the ship heavier, so give yourself room.'},
 {w:1,n:'Red Rescue',width:2600,seed:33,rough:1.2,sx:1250,sy:260,fuel:100,par:115,fs:25,pads:[{x:450,w:80,k:'rescue',n:1},{x:1300,w:90,k:'fuel'},{x:2250,w:80,k:'rescue',n:2},{x:1700,w:80,k:'goal'}],route:[0,1,2,3],tip:'Three astronauts at two sites. Refuel in the middle if you need it.'},
 {w:2,n:'Glass Pad',width:1800,seed:41,rough:.9,sx:250,sy:230,fuel:80,par:35,fs:45,pads:[{x:1250,w:90,k:'goal',ice:1}],route:[0],tip:'Europa pads are sheet ice. Any sideways drift keeps sliding, so stop moving sideways before you touch down.'},
 {w:2,n:'Moving Floe',width:1900,seed:46,rough:1,sx:260,sy:260,fuel:100,par:45,fs:55,pads:[{x:1150,w:90,k:'goal',fl:130,mv:{dx:55,per:20}}],route:[0],tip:'The landing platform floats and drifts. Match its speed, then settle onto it.'},
 {w:2,n:'Frozen Freight',width:2600,seed:52,rough:1.1,sx:240,sy:260,fuel:100,par:110,fs:45,pads:[{x:700,w:80,k:'pick',ice:1},{x:1250,w:80,k:'fuel',ice:1},{x:1800,w:90,k:'drop',fl:120,mv:{dx:55,per:20}},{x:2300,w:80,k:'goal',ice:1}],route:[0,1,2,3],tip:'Pick up cargo on the ice, drop it on the moving platform, then land on the goal.'},
 {w:3,n:'Hot Feet',width:1900,seed:61,rough:1,sx:250,sy:250,fuel:80,par:40,fs:35,lavaR:[[520,760],[880,1080]],gey:[{x:640,per:4.2,ph:0,h:150},{x:980,per:4.6,ph:2,h:170}],pads:[{x:1400,w:80,k:'goal'}],route:[0],tip:'Orange ground is lava. Never touch it. Geysers rumble before they blow, so cross after they fall.'},
 {w:3,n:'Geyser Alley',width:2200,seed:66,rough:1.1,sx:260,sy:260,fuel:100,par:75,fs:25,lavaR:[[650,820],[1080,1250],[1550,1700]],gey:[{x:735,per:4,ph:0,h:160},{x:1165,per:3.6,ph:1.5,h:180},{x:1625,per:4.4,ph:3,h:170}],pads:[{x:1420,w:80,k:'rescue',n:1},{x:420,w:90,k:'goal'}],route:[0,1],tip:'Rescue the astronaut between the geysers and bring them back.'},
 {w:3,n:'Magma Courier',width:2700,seed:71,rough:1.2,sx:240,sy:260,fuel:80,par:115,fs:35,lavaR:[[900,1080],[1500,1650],[2050,2200]],gey:[{x:990,per:4.4,ph:0,h:170},{x:1575,per:3.8,ph:2,h:170}],pads:[{x:550,w:80,k:'pick'},{x:1300,w:90,k:'fuel'},{x:1900,w:80,k:'drop'},{x:2450,w:80,k:'goal'}],route:[0,1,2,3],tip:'Haul cargo past the geysers. Refuel halfway.'},
 {w:4,n:'Storm Front',width:2000,seed:81,rough:1,sx:260,sy:260,fuel:85,par:95,fs:25,pads:[{x:1250,w:90,k:'goal',fl:140,mv:{dx:55,per:20}}],route:[0],tip:'Titan has thick air and strong winds. The air slows you down, but the wind keeps pushing.'},
 {w:4,n:'Deep Haze',width:2700,seed:86,rough:1.2,sx:250,sy:260,fuel:100,par:125,fs:50,pads:[{x:750,w:80,k:'rescue',n:1},{x:1300,w:90,k:'fuel'},{x:1850,w:80,k:'rescue',n:1},{x:2350,w:80,k:'goal'}],route:[0,1,2,3],tip:'Two stranded crew in the storm. Refuel between pickups.'},
 {w:4,n:'Afterburn',width:3000,seed:93,rough:1.3,sx:240,sy:270,fuel:100,par:205,fs:30,lavaR:[[1100,1250]],gey:[{x:1175,per:4,ph:0,h:170}],pads:[{x:600,w:80,k:'pick',ice:1},{x:1500,w:80,k:'rescue',n:1},{x:1920,w:90,k:'fuel'},{x:2350,w:110,k:'drop',fl:130,mv:{dx:45,per:20}},{x:2750,w:80,k:'goal'}],route:[0,1,2,3,4],tip:'Everything at once: cargo, ice, a geyser, a rescue and a moving drop. Two fingers (or Shift) fires the afterburner.'},
];
const NL=LEVELS.length;
const PADC={goal:'#39ff88',fuel:'#ffd23f',rescue:'#ff5ea8',pick:'#5ab0ff',drop:'#5ab0ff'};
const PADL={goal:'GOAL',fuel:'FUEL',rescue:'SOS',pick:'CARGO',drop:'DROP'};
const UPG=[
 {id:'tank',n:'FUEL TANK',d:'+15% fuel each level',max:3},
 {id:'thr',n:'THRUSTERS',d:'+8% engine power each level',max:3},
 {id:'gear',n:'LANDING GEAR',d:'Survives harder, more tilted touchdowns',max:3},
 {id:'rcs',n:'RCS JETS',d:'Tilts the ship faster',max:3},
];
const UCOST=[2,3,5];

/* ---------------- save ---------------- */
const SK='lla_save_v1';
let SV;
function defSave(){return {best:{},spent:0,upg:{tank:0,thr:0,gear:0,rcs:0},set:{mus:.7,sfx:.8,ghost:true,level:true,shake:true,bloom:true,vib:true}};}
try{SV=JSON.parse(localStorage.getItem(SK))||defSave();}catch(e){SV=defSave();}
if(Q.get('fresh')==='1'){SV=defSave();try{for(let i=0;i<NL;i++)localStorage.removeItem('lla_ghost_'+i);}catch(e){}}
SV=Object.assign(defSave(),SV);SV.set=Object.assign(defSave().set,SV.set);SV.upg=Object.assign(defSave().upg,SV.upg);
function save(){try{localStorage.setItem(SK,JSON.stringify(SV));}catch(e){}}
const starsOf=i=>{const b=SV.best[i];return b?b.st.filter(Boolean).length:0;};
const totalStars=()=>{let t=0;for(let i=0;i<NL;i++)t+=starsOf(i);return t;};
const chips=()=>totalStars()-SV.spent;
const unlocked=i=>Q.get('unlock')==='1'||i===0||!!SV.best[i-1];
if(Q.get('ghost')==='0')SV.set.ghost=false;

/* ---------------- audio ---------------- */
const AU={c:null,int:0,next:0,step:0};
const BPM=92, S16=60/BPM/4;
const PROG=[[45,[0,3,7]],[41,[0,4,7]],[48,[0,4,7]],[43,[0,4,7]]]; // Am F C G
const mtof=m=>440*Math.pow(2,(m-69)/12);
function buildGraph(A,c,dest){
 const comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=8;comp.ratio.value=14;comp.attack.value=.002;comp.release.value=.22;
 const out=c.createGain();out.gain.value=.8;comp.connect(out);out.connect(dest);A.comp=comp;A.out=out;
 A.mus=c.createGain();A.mus.gain.value=SV.set.mus*.55;A.mus.connect(comp);
 A.sfx=c.createGain();A.sfx.gain.value=SV.set.sfx*.7;A.sfx.connect(comp);
 A.padF=c.createBiquadFilter();A.padF.type='lowpass';A.padF.frequency.value=650;A.padF.Q.value=3;
 A.padG=c.createGain();A.padG.gain.value=.5;A.padF.connect(A.padG);A.padG.connect(A.mus);
 A.bassF=c.createBiquadFilter();A.bassF.type='lowpass';A.bassF.frequency.value=420;A.bassG=c.createGain();A.bassG.gain.value=.5;A.bassF.connect(A.bassG);A.bassG.connect(A.mus);
 A.arpG=c.createGain();A.arpG.gain.value=0;A.arpG.connect(A.mus);
 const dl=c.createDelay(1);dl.delayTime.value=S16*3;const fb=c.createGain();fb.gain.value=.38;const dlf=c.createBiquadFilter();dlf.type='lowpass';dlf.frequency.value=1800;
 A.arpG.connect(dl);dl.connect(dlf);dlf.connect(fb);fb.connect(dl);const wet=c.createGain();wet.gain.value=.5;dlf.connect(wet);wet.connect(A.mus);
 A.drG=c.createGain();A.drG.gain.value=.55;A.drG.connect(A.mus);
 A.hatG=c.createGain();A.hatG.gain.value=0;A.hatG.connect(A.drG);
 const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;A.nb=nb;
 // thrust loop
 const ns=c.createBufferSource();ns.buffer=nb;ns.loop=true;A.thrF=c.createBiquadFilter();A.thrF.type='lowpass';A.thrF.frequency.value=700;A.thrF.Q.value=1;
 A.thrG=c.createGain();A.thrG.gain.value=0;ns.connect(A.thrF);A.thrF.connect(A.thrG);A.thrG.connect(A.sfx);ns.start();
 A.c=c;
}
function setInt(A,i,t){const c=A.c;t=t||c.currentTime;
 A.padF.frequency.setTargetAtTime(520+i*2600,t,.4);A.arpG.gain.setTargetAtTime(i*.16,t,.4);A.hatG.gain.setTargetAtTime(.15+i*.55,t,.4);
 A.padG.gain.setTargetAtTime(.42+i*.18,t,.5);A.bassF.frequency.setTargetAtTime(380+i*500,t,.4);}
function note(A,dest,type,f,t,dur,g,att,det){const c=A.c,o=c.createOscillator(),e=c.createGain();o.type=type;o.frequency.value=f;if(det)o.detune.value=det;
 e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(g,t+(att||.005));e.gain.setTargetAtTime(0,t+Math.max(att||.005,dur*.5),dur*.35);o.connect(e);e.connect(dest);o.start(t);o.stop(t+dur*2.2+.1);}
function noiseHit(A,dest,t,dur,g,ftype,f){const c=A.c,s=c.createBufferSource(),fl=c.createBiquadFilter(),e=c.createGain();s.buffer=A.nb;fl.type=ftype;fl.frequency.value=f;
 e.gain.setValueAtTime(g,t);e.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(fl);fl.connect(e);e.connect(dest);s.start(t,Math.random()*1.5);s.stop(t+dur+.05);}
function kick(A,t){const c=A.c,o=c.createOscillator(),e=c.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.22);
 e.gain.setValueAtTime(.85,t);e.gain.exponentialRampToValueAtTime(.001,t+.4);o.connect(e);e.connect(A.drG);o.start(t);o.stop(t+.45);}
function schedStep(A,s,t){ // one 16th
 const bar=Math.floor(s/16)%4,k=s%16,[root,ch]=PROG[bar];
 if(k===0){for(const iv of ch){const f=mtof(root+24+iv);note(A,A.padF,'sawtooth',f,t,S16*16,.05,.5,-8);note(A,A.padF,'sawtooth',f,t,S16*16,.05,.5,8);}
  note(A,A.padF,'triangle',mtof(root+12),t,S16*16,.08,.6);}
 if(k%2===0)note(A,A.bassF,'sawtooth',mtof(root+(k%8===6?12:0)),t,S16*1.6,k%4===0?.3:.2,.004);
 const ap=[0,1,2,1,2,3,2,1][k%8],arpN=root+36+(ap===3?12:ch[ap]);note(A,A.arpG,'square',mtof(arpN),t,S16*.9,.07,.003);
 if(k===0||k===8||(k===10&&bar===3))kick(A,t);
 if(k===4||k===12)noiseHit(A,A.drG,t,.18,.32,'bandpass',1900);
 if(k%2===0)noiseHit(A,A.hatG,t,.05,k%4===2?.22:.12,'highpass',7500);
}
function audioInit(){
 if(AU.c){if(AU.c.state==='suspended')AU.c.resume();return;}
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC||Q.get('mute')==='1')return;
 try{const c=new AC();buildGraph(AU,c,c.destination);AU.next=c.currentTime+.15;AU.step=0;
  setInterval(()=>{const c=AU.c;if(!c||c.state!=='running')return;if(AU.next<c.currentTime)AU.next=c.currentTime+.05;
   while(AU.next<c.currentTime+.25){schedStep(AU,AU.step++,AU.next);AU.next+=S16;}},60);}catch(e){}
}
function sfxDing(A,t,big){const c=A.c;t=t||c.currentTime;const fs=big?[1568,2093,3136]:[1047,1568];
 fs.forEach((f,i)=>{note(A,A.sfx,i?'sine':'triangle',f,t+i*.07,1.1,(big?.22:.14)/(i+1),.003);});note(A,A.sfx,'square',fs[0]*2,t,.06,.05,.002);}
function sfxCrash(A,t){t=t||A.c.currentTime;const c=A.c,s=c.createBufferSource(),fl=c.createBiquadFilter(),e=c.createGain();s.buffer=A.nb;fl.type='lowpass';fl.frequency.setValueAtTime(3000,t);fl.frequency.exponentialRampToValueAtTime(150,t+1.2);
 e.gain.setValueAtTime(.7,t);e.gain.exponentialRampToValueAtTime(.001,t+1.4);s.connect(fl);fl.connect(e);e.connect(A.sfx);s.start(t);s.stop(t+1.5);
 const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(30,t+.6);g.gain.setValueAtTime(.6,t);g.gain.exponentialRampToValueAtTime(.001,t+.7);o.connect(g);g.connect(A.sfx);o.start(t);o.stop(t+.75);}
function sfxBlip(A,f,t,g){t=t||A.c.currentTime;note(A,A.sfx,'square',f,t,.07,g||.06,.002);}
function sfxChime(A){const t=A.c.currentTime;[784,988,1175,1568].forEach((f,i)=>note(A,A.sfx,'triangle',f,t+i*.08,.35,.1,.003));}
function sfxThud(A){const c=A.c,t=c.currentTime;noiseHit(A,A.sfx,t,.15,.35,'lowpass',500);note(A,A.sfx,'sine',110,t,.15,.3,.002);}
const au=fn=>{if(AU.c&&AU.c.state==='running')try{fn(AU);}catch(e){}};
function applyVol(){if(!AU.c)return;AU.mus.gain.setTargetAtTime(SV.set.mus*.55,AU.c.currentTime,.05);AU.sfx.gain.setTargetAtTime(SV.set.sfx*.7,AU.c.currentTime,.05);}
async function audioTest(){ // renders worst case (max volume, full swell, thrust, ding, crash) offline and reports the peak
 const sr=44100,c=new OfflineAudioContext(2,sr*12,sr),A={};const m=SV.set.mus,s=SV.set.sfx;SV.set.mus=1;SV.set.sfx=1;buildGraph(A,c,c.destination);SV.set.mus=m;SV.set.sfx=s;
 setInt(A,0,0);A.padF.frequency.setValueAtTime(520,0);setInt(A,1,4);
 let t=.05,st=0;while(t<11.5){schedStep(A,st++,t);t+=S16;}
 A.thrG.gain.setValueAtTime(.4,2);A.thrG.gain.setValueAtTime(0,6);sfxDing(A,6.5,true);sfxDing(A,7.2,false);sfxChime2(A,8);sfxCrash(A,9.5);
 const buf=await c.startRendering();let pk=0,ss=0,n=0;for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);for(let i=0;i<d.length;i++){const v=Math.abs(d[i]);if(v>pk)pk=v;ss+=v*v;n++;}}
 return {peak:+pk.toFixed(4),rmsDb:+(10*Math.log10(ss/n)).toFixed(1),clipped:pk>=1};
}
function sfxChime2(A,t){[784,988,1175,1568].forEach((f,i)=>note(A,A.sfx,'triangle',f,t+i*.08,.35,.1,.003));}

/* ---------------- game state ---------------- */
const S={mode:'boot',set:SV.set,t:0,ps:[],deb:[],txt:[],shake:0,cam:{x:0,y:0,s:.6},bot:Q.get('bot')==='1',speed:+(Q.get('speed')||1)};
const IN={thr:false,tgt:0,touch:null,keys:{},ab:false,pts:new Set(),thrB:false,tgtB:0};
const STARS=[];{const r=rng(99);for(let i=0;i<220;i++)STARS.push([r(),r(),r()*1.4+.3,r()]);}
let ter=null;const STEP=8;
function th(x){if(!ter)return 0;const f=clamp(x/STEP,0,ter.length-1.001),i=f|0;return ter[i]+(ter[i+1]-ter[i])*(f-i);}

function loadLevel(i){
 const L=LEVELS[i],Wd=WORLDS[L.w];S.li=i;S.L=L;S.Wd=Wd;S.g=Wd.g;
 const r=rng(L.seed*7919+13),n=Math.ceil(L.width/STEP)+2,ph=[r()*TAU,r()*TAU,r()*TAU,r()*TAU],ro=L.rough||1;
 ter=new Float32Array(n);
 for(let k=0;k<n;k++){const x=k*STEP;let y=130+ro*(62*Math.sin(x*.0039+ph[0])+38*Math.sin(x*.0107+ph[1])+17*Math.sin(x*.026+ph[2])+6*Math.sin(x*.071+ph[3]))+(r()-.5)*5*ro;
  if(x<140)y+=(140-x)*2.6;if(x>L.width-140)y+=(x-(L.width-140))*2.6;ter[k]=y;}
 S.lava=(L.lavaR||[]).map(a=>a.slice());
 for(const [a,b] of S.lava){const lv=Math.min(...Array.from({length:Math.ceil((b-a)/STEP)},(_,j)=>th(a+j*STEP)))+4;for(let k=Math.ceil(a/STEP);k<=b/STEP;k++)ter[k]=Math.min(ter[k],lv+Math.sin(k)*1.5);}
 S.pads=L.pads.map((p,idx)=>{const o={...p,idx,cx:p.x,vx:0,vy:0,astro:p.k==='rescue'?(p.n||1):0,crates:p.k==='pick'?1:0,walk:0,blink:r()*3};
  if(p.fl){let m=-1e9;const dx=p.mv?p.mv.dx:0;for(let x=p.x-dx-p.w;x<=p.x+dx+p.w;x+=8)m=Math.max(m,th(x));o.y0=m+p.fl;o.top=o.y0;}
  else{const a=p.x-p.w/2,b=p.x+p.w/2;let s=0,c=0;for(let x=a;x<=b;x+=STEP){s+=th(x);c++;}const py=s/c;
   for(let k=Math.floor((a-30)/STEP);k<=Math.ceil((b+30)/STEP);k++){if(k<0||k>=n)continue;const x=k*STEP;if(x>=a-4&&x<=b+4)ter[k]=py;else{const d=x<a?a-x:x-b;ter[k]=lerp(py,ter[k],clamp(d/30,0,1));}}
   o.top=py;}
  return o;});
 S.gey=(L.gey||[]).map(g=>({...g,hh:0}));
 S.need={rescue:S.pads.reduce((a,p)=>a+p.astro,0),cargo:S.pads.filter(p=>p.k==='pick').length};
 S.rescued=0;S.delivered=0;S.cargo=false;S.aboard=0;
 const U=SV.upg;S.cap=100*(1+.15*U.tank);
 const sh={x:L.sx,y:th(L.sx)+L.sy,vx:L.svx||0,vy:0,a:0,landed:null,ox:0,svx:0,fuel:Math.min(S.cap,L.fuel*(1+.15*U.tank)),thr:0};
 if(Q.get('fuel'))sh.fuel=Math.min(S.cap,+Q.get('fuel'));
 S.ship=sh;S.t=0;S.dead=false;S.done=false;S.ps.length=0;S.deb.length=0;S.txt.length=0;S.rec=[];S.recN=0;S.lastTouch=null;S.minV=99;S.padT=0;S.blip=0;S.botI=0;S.botAcc=0;S.endT=0;
 S.cam.x=sh.x;S.cam.y=sh.y-60;S.cam.s=.55*viewK();
 IN.tgt=0;IN.touch=null;IN.thrB=false;IN.tgtB=0;
 S.ghost=null;if(SV.set.ghost&&S.mode!=='demo'){try{const g=localStorage.getItem('lla_ghost_'+i);if(g)S.ghost=JSON.parse(g);}catch(e){}}
 S.windNow=0;S.wph=r()*100;S.crashWhy=null;S.toT=-9;S.bumpT=0;
}
const viewK=()=>clamp(Math.min(W,H)/412,.8,2.2);
const thrustAcc=()=>42*(1+.08*SV.upg.thr)/(1+(S.cargo?.22:0)+.06*S.aboard)*(IN.ab?1.6:1);
const tasksDone=()=>S.rescued>=S.need.rescue&&S.delivered>=S.need.cargo;
function windAt(t){const Wd=S.Wd;if(!Wd.wind&&!Wd.gust)return 0;const ph=S.wph;return Wd.wind*Math.sin(t*.11+ph)+Wd.gust*Math.sin(t*.63+Math.sin(t*.29+ph)*2.2)*Math.max(0,Math.sin(t*.37+ph*2));}
function lim(){const g=SV.upg.gear;return {vy:17+g*3,vx:9+g*2,a:.21+g*.04};}
function shipPt(lx,ly){const sh=S.ship,c=Math.cos(sh.a),s=Math.sin(sh.a);return [sh.x+lx*c+ly*s,sh.y-lx*s+ly*c];}
const FEET=[[-9,-6],[9,-6]],HULL=[[0,13],[-7,3],[7,3],[-7,-1],[7,-1],[-5,9],[5,9]];
function padAt(x,fy){for(const p of S.pads){if(Math.abs(x-p.cx)<=p.w/2+1){if(!p.fl)return p;if(fy>=p.top-3&&fy<=p.top+8)return p;}}return null;}
function inLava(x){for(const [a,b] of S.lava)if(x>=a&&x<=b)return true;return false;}
function surface(x,y){let s=th(x),pad=null;for(const p of S.pads){if(p.fl&&Math.abs(x-p.cx)<=p.w/2+1&&y>=p.top-8&&p.top>s){s=p.top;pad=p;}}
 if(!pad){for(const p of S.pads)if(!p.fl&&Math.abs(x-p.cx)<=p.w/2+1)pad=p;}return {y:s,pad,lava:!pad&&inLava(x)};}

function crash(why,tip){
 if(S.dead||S.done)return;const sh=S.ship;S.dead=true;S.endT=S.t;S.crashWhy=why;S.crashOn=S.li;S.crashTip=tip||'';sh.landed=null;
 for(let i=0;i<14;i++){const a=Math.random()*TAU,sp=20+Math.random()*80;S.deb.push({x:sh.x,y:sh.y,vx:sh.vx*.3+Math.cos(a)*sp,vy:Math.abs(sh.vy)*.1+Math.sin(a)*sp+30,a:Math.random()*TAU,va:(Math.random()-.5)*12,l:6+Math.random()*8,life:3});}
 for(let i=0;i<120;i++){const a=Math.random()*TAU,sp=Math.random()*140;S.ps.push({x:sh.x,y:sh.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp+20,life:.6+Math.random()*1.2,max:1.8,c:i%3?'#ffb347':'#fff',g:1});}
 shake(16);au(A=>sfxCrash(A));vib([60,40,120]);
 if(S.mode==='play')setTimeout(()=>{if(S.mode==='play'&&S.dead)showCrash();},1300);
 else setTimeout(()=>{if(S.mode!=='play')loadLevel(0);},2500);
}
const shake=v=>{if(SV.set.shake)S.shake=Math.max(S.shake,v);};
const vib=p=>{if(SV.set.vib&&navigator.vibrate&&S.mode==='play')try{navigator.vibrate(p);}catch(e){}};
function ftxt(s,c,big){S.txt.push({s,c:c||'#fff',t:0,big:!!big});}

function step(dt){if(S.bumpT)S.bumpT=Math.max(0,S.bumpT-dt);
 S.t+=dt;const sh=S.ship,L=S.L;
 for(const p of S.pads){p.blink+=dt;if(p.mv){const w=TAU/p.mv.per,k=Math.sin(S.t*w);p.cx=p.x+k*p.mv.dx;p.vx=Math.cos(S.t*w)*w*p.mv.dx;}}
 for(const g of S.gey){const c=(S.t+g.ph)%g.per;g.rum=c>g.per-1;g.on=c<1.9;g.hh=g.on?g.h*Math.min(1,c/.25)*(c>1.6?(1.9-c)/.3:1):0;
  if(g.on&&Math.random()<.9)S.ps.push({x:g.x+(Math.random()-.5)*10,y:th(g.x),vx:(Math.random()-.5)*20,vy:g.h*1.6+Math.random()*60,life:.8,max:.8,c:Math.random()<.5?'#ff6a3d':'#ffd23f',gr:S.g*6});
  if(g.rum&&Math.random()<.3)S.ps.push({x:g.x+(Math.random()-.5)*14,y:th(g.x)+2,vx:(Math.random()-.5)*30,vy:20+Math.random()*30,life:.5,max:.5,c:'#ff8a3d',gr:S.g*4});}
 for(const [a,b] of S.lava)if(Math.random()<.08){const x=a+Math.random()*(b-a);S.ps.push({x,y:th(x),vx:0,vy:10+Math.random()*20,life:.6,max:.6,c:'#ff6a3d',gr:30});}
 S.windNow=windAt(S.t);
 if(S.dead||S.done){upParts(dt);return;}
 if(S.bot||S.mode==='demo')botControl(dt);
 const useBot=S.bot||S.mode==='demo';
 const wantThr=useBot?IN.thrB:(IN.thr||IN.keys.thr);
 IN.ab=!useBot&&(IN.keys.ab||IN.pts.size>=2);
 let tgt=useBot?IN.tgtB:IN.tgt;
 if(!useBot){const R=3+.7*SV.upg.rcs;if(IN.keys.l)IN.tgt=clamp(IN.tgt-R*dt,-1.5,1.5);if(IN.keys.r)IN.tgt=clamp(IN.tgt+R*dt,-1.5,1.5);if(IN.keys.lv)IN.tgt=0;tgt=IN.tgt;}
 const R=3.4+.8*SV.upg.rcs,da=clamp(tgt-sh.a,-R*dt,R*dt);
 const thr=wantThr&&sh.fuel>0;sh.thr=thr?(IN.ab?2:1):0;
 if(thr)sh.fuel=Math.max(0,sh.fuel-(IN.ab?7:1.9)*dt);
 // record ghost
 if((S.recN++&3)===0)S.rec.push(Math.round(sh.x),Math.round(sh.y),Math.round(sh.a*100),sh.thr);
 if(sh.landed){
  const p=sh.landed;
  if(thr){sh.landed=null;sh.vx=p.vx;sh.vy=(p.vy||0)+6;sh.y+=1.5;S.padT=0;S.toT=S.t;S.lastPad=p;}
  else{
   if(p.ice){sh.ox+=sh.svx*dt;sh.svx*=Math.max(0,1-.35*dt);if(Math.abs(sh.svx)<.3)sh.svx=0;}
   sh.x=p.cx+sh.ox;sh.y=p.top+6;sh.vx=p.vx;sh.vy=0;sh.a=0;
   if(Math.abs(sh.ox)>p.w/2+2){sh.landed=null;crash('You slid off the edge of the ice pad.','Stop drifting sideways before your feet touch the ice.');}
   else padAction(p,dt);
  }
 }
 if(!sh.landed&&!S.dead){
  sh.a+=da;
  const T=thrustAcc();let ax=S.windNow,ay=-S.g;
  if(thr){ax+=Math.sin(sh.a)*T;ay+=Math.cos(sh.a)*T;}
  if(S.Wd.drag){ax-=S.Wd.drag*sh.vx;ay-=S.Wd.drag*sh.vy;}
  sh.vx+=ax*dt;sh.vy+=ay*dt;sh.x+=sh.vx*dt;sh.y+=sh.vy*dt;
  if(sh.x<16){sh.x=16;sh.vx=Math.abs(sh.vx)*.3;}if(sh.x>L.width-16){sh.x=L.width-16;sh.vx=-Math.abs(sh.vx)*.3;}
  if(sh.y>th(sh.x)+1400){sh.vy=Math.min(sh.vy,0);}
  collide();
 }
 // thrust particles
 if(sh.thr&&!sh.landed&&!S.dead){const n=sh.thr===2?4:2,c=Math.cos(sh.a),s=Math.sin(sh.a);
  for(let i=0;i<n;i++){const [nx,ny]=shipPt((Math.random()-.5)*5,-5),sp=70+Math.random()*60,sp2=(Math.random()-.5)*28;
   S.ps.push({x:nx,y:ny,vx:sh.vx-s*sp+c*sp2,vy:sh.vy-c*sp-s*sp2,life:.25+Math.random()*.35,max:.6,c:sh.thr===2?(i%2?'#7df9ff':'#fff'):(i%2?'#ffb347':'#fff3c4'),g:1});}
  const gy=th(sh.x),alt=sh.y-gy;if(alt<70&&Math.abs(sh.a)<.6&&Math.random()<.7){for(const d of[-1,1])S.ps.push({x:sh.x+d*4,y:gy+1,vx:d*(40+Math.random()*60)*(1-alt/80),vy:4+Math.random()*8,life:.5,max:.5,c:S.Wd.col,g:1});}}
 upParts(dt);
 if(S.shake>0)S.shake=Math.max(0,S.shake-30*dt);
}
function upParts(dt){
 for(let i=S.ps.length-1;i>=0;i--){const p=S.ps[i];p.life-=dt;if(p.life<=0){S.ps.splice(i,1);continue;}if(p.gr)p.vy-=p.gr*dt;p.vx*=1-1.5*dt;p.vy*=1-1.5*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
  if(!p.gr){const gy=th(p.x);if(p.y<gy){p.y=gy;p.vy=Math.abs(p.vy)*.3;}}}
 if(S.ps.length>700)S.ps.splice(0,S.ps.length-700);
 for(const d of S.deb){if(d.rest)continue;d.vy-=S.g*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.a+=d.va*dt;const gy=th(d.x);if(d.y<gy){d.y=gy;d.vy=Math.abs(d.vy)*.35;d.vx*=.6;d.va*=.6;if(Math.abs(d.vy)<4)d.rest=1;}}
 for(let i=S.txt.length-1;i>=0;i--){S.txt[i].t+=dt;if(S.txt[i].t>1.8)S.txt.splice(i,1);}
}
function collide(){
 const sh=S.ship;
 for(const [lx,ly] of HULL){const [x,y]=shipPt(lx,ly);if(y<th(x)){crash(inLava(x)?'The hull hit lava.':'The hull hit the ground.','Keep your feet down and the ship upright when you get close.');return;}
  for(const p of S.pads)if(p.fl&&Math.abs(x-p.cx)<p.w/2&&y<p.top&&y>p.top-7){crash('You clipped the floating platform.','Come down onto it from above.');return;}
  for(const g of S.gey)if(g.hh>5&&Math.abs(x-g.x)<11&&y<th(g.x)+g.hh){crash('Caught in a lava geyser!','Geysers rumble and spark just before they erupt. Cross right after one falls.');return;}}
 const f=FEET.map(([lx,ly])=>{const [x,y]=shipPt(lx,ly);return {x,y,s:surface(x,y)};});
 for(const ft of f)for(const g of S.gey)if(g.hh>5&&Math.abs(ft.x-g.x)<11&&ft.y<th(g.x)+g.hh){crash('Caught in a lava geyser!','Geysers rumble and spark just before they erupt. Cross right after one falls.');return;}
 const hit=f.filter(ft=>ft.y<=ft.s.y);if(!hit.length)return;
 const pad=hit[0].s.pad,rvx=sh.vx-(pad?pad.vx:0),rvy=sh.vy-(pad?pad.vy:0),Lm=lim(),sp=(v)=>(Math.abs(v)/4).toFixed(1);
 if(pad&&rvy>-2&&Math.abs(sh.a)<.7&&S.t-S.toT<1.5&&pad===S.lastPad){const dy=Math.max(...hit.map(h=>h.s.y-h.y));sh.y+=dy;sh.vy=Math.max(sh.vy,0);return;}
 if(hit.some(h=>h.s.lava)){crash('Your landing legs touched lava.','Never touch the glowing orange ground on Io.');return;}
 if(!hit.some(h=>h.s.pad)&&-sh.vy<6&&Math.abs(sh.a)<.5&&!S.bumpT){const dy=Math.max(...hit.map(h=>h.s.y-h.y));sh.y+=dy+.5;sh.vy=4;sh.vx*=.5;S.bumpT=1.2;ftxt('ROUGH GROUND · LIFT OFF','#ffb347');au(A=>sfxThud(A));shake(3);vib(20);return;}
 if(!pad||Math.abs(sh.x-pad.cx)>pad.w/2+2){crash('You missed the landing pad.','You can only land on flat, lit pads. Rough ground tips the ship over.');return;}
 if(Math.abs(sh.a)>Lm.a){crash('You came in tilted ('+Math.round(Math.abs(sh.a)*57.3)+'°).','Let go of the screen to auto-level before touchdown.');return;}
 if(-rvy>Lm.vy){crash('You hit too hard ('+sp(rvy)+' m/s down).','Keep the ↓ speed green, under '+sp(Lm.vy)+' m/s, when you touch down.');return;}
 if(Math.abs(rvx)>Lm.vx){crash('Too much sideways drift ('+sp(rvx)+' m/s).','Keep the ↔ speed green, under '+sp(Lm.vx)+' m/s.');return;}
 // landed!
 sh.landed=pad;sh.ox=sh.x-pad.cx;sh.svx=pad.ice?rvx:0;sh.y=pad.top+6;
 const tv=-rvy;S.lastTouch={v:tv,vx:Math.abs(rvx),a:Math.abs(sh.a)};S.padT=0;
 if(tv<5&&Math.abs(rvx)<3&&Math.abs(sh.a)<.06){ftxt('PERFECT LANDING','#ffd18a',true);au(A=>sfxDing(A,0,true));vib(25);S.perfects=(S.perfects||0)+1;}
 else if(tv<8){ftxt('SMOOTH','#7dffb0');au(A=>sfxDing(A,0,false));vib(20);}
 else{ftxt('HARD LANDING','#ffb347');au(A=>sfxThud(A));shake(5);vib(40);}
 sh.a=0;
 for(let i=0;i<24;i++){const d=i%2?1:-1;S.ps.push({x:sh.x+d*8,y:pad.top+1,vx:d*(30+Math.random()*70),vy:Math.random()*15,life:.6,max:.6,c:PADC[pad.k],g:1});}
}
function padAction(p,dt){
 S.padT+=dt;const sh=S.ship;
 if(p.k==='fuel'&&sh.fuel<S.cap){sh.fuel=Math.min(S.cap,sh.fuel+32*dt);S.blip-=dt;if(S.blip<=0){S.blip=.12;au(A=>sfxBlip(A,600+sh.fuel/S.cap*900,0,.04));}if(sh.fuel>=S.cap){ftxt('TANK FULL','#ffd23f');au(A=>sfxDing(A,0,false));}}
 if(p.k==='rescue'&&p.astro>0&&S.padT>.3){p.walk+=dt/1.3;if(p.walk>=1){p.walk=0;p.astro--;S.rescued++;S.aboard++;ftxt('ASTRONAUT ABOARD '+S.rescued+'/'+S.need.rescue,'#ff5ea8');au(A=>sfxChime(A));vib(30);}}
 if(p.k==='pick'&&p.crates>0&&!S.cargo&&S.padT>.9){p.crates--;S.cargo=true;ftxt('CARGO LOADED','#5ab0ff');au(A=>sfxChime(A));vib(30);}
 if(p.k==='drop'&&S.cargo&&S.padT>.9){S.cargo=false;S.delivered++;ftxt('CARGO DELIVERED '+S.delivered+'/'+S.need.cargo,'#5ab0ff');au(A=>sfxChime(A));vib(30);}
 if(p.k==='goal'&&tasksDone()&&S.padT>.6)complete();
 else if(sh.fuel<=0&&p.k!=='fuel'&&S.padT>2.5)crash('You ran out of fuel.','Plan a stop at a FUEL pad, or ease off the engine on the way.');
}
function complete(){
 if(S.done)return;S.done=true;S.endT=S.t;
 if(S.mode==='demo'){setTimeout(()=>{if(S.mode!=='play')loadLevel(0);},2500);return;}
 const L=S.L,sh=S.ship,lt=S.lastTouch||{v:99};
 const st=[sh.fuel>=L.fs,lt.v<7,S.t<=L.par];
 const score=Math.round(sh.fuel*10+Math.max(0,L.par*1.6-S.t)*25+Math.max(0,12-lt.v)*60+(st.filter(Boolean).length*250));
 const prev=SV.best[S.li],before=starsOf(S.li);let newBest=false;
 if(!prev||score>prev.score){newBest=!!prev||true;}
 const merged=prev?prev.st.map((v,i)=>v||st[i]):st;
 SV.best[S.li]={st:merged,score:Math.max(score,prev?prev.score:0),time:Math.min(S.t,prev?prev.time:1e9)};
 const gained=starsOf(S.li)-before;
 if(!prev||score>prev.score){try{localStorage.setItem('lla_ghost_'+S.li,JSON.stringify({d:S.rec,s:score}));}catch(e){}}
 save();
 S.res={st,score,newBest:!prev||score>prev.score,first:!prev,gained,fuel:sh.fuel,v:lt.v,t:S.t};
 setTimeout(()=>{if(S.mode==='play')showResult();},1100);
}

/* ---------------- autopilot (test bot + title demo) ---------------- */
function padDone(p){const sh=S.ship;if(p.k==='fuel')return sh.fuel>=S.cap-.5;if(p.k==='rescue')return p.astro===0;if(p.k==='pick')return S.cargo||p.crates===0;if(p.k==='drop')return !S.cargo;return tasksDone();}
function botControl(dt){
 const sh=S.ship,route=S.L.route;
 while(S.botI<route.length-1&&padDone(S.pads[route[S.botI]])&&S.pads[route[S.botI]].k!=='goal')S.botI++;
 const tp=S.pads[route[S.botI]];
 if(sh.landed===tp&&(!padDone(tp)||tp.k==='goal')){IN.thrB=false;IN.tgtB=0;return;}
 if(S.t-S.toT<.7){IN.tgtB=0;IN.thrB=true;return;}
 const g=S.g,T=thrustAcc(),px=tp.cx,py=tp.top,pvx=tp.vx||0,dx=px-sh.x;
 const x0=Math.min(sh.x,px)-40,x1=Math.max(sh.x,px)+40;let hm=-1e9;
 for(let x=x0;x<=x1;x+=8)hm=Math.max(hm,th(x));
 for(const ge of S.gey)if(ge.x>x0&&ge.x<x1)hm=Math.max(hm,th(ge.x)+ge.h+30);
 for(const p of S.pads)if(p!==tp&&p.fl&&p.cx+p.w/2+60>x0&&p.cx-p.w/2-60<x1)hm=Math.max(hm,p.top+20);
 const cruise=Math.max(hm+60,py+(tp.mv?80:50)),h=sh.y-6-py;let dvx,dvy,fine=false;
 const half=tp.w/2;if(S.botFP!==tp){S.botFP=tp;S.botFine=false;}
 if(!S.botFine&&Math.abs(dx)<(tp.mv?half*.8:half*.35)&&h<200)S.botFine=true;
 if(S.botFine&&(Math.abs(dx)>half*1.3+20||h>230))S.botFine=false;
 if(!S.botFine){
  const adec=Math.min(6,T*.16),vmax=Math.min(60,Math.sqrt(2*adec*Math.max(0,Math.abs(dx)-6)));
  dvx=Math.sign(dx)*vmax+pvx;const yE=cruise-sh.y;dvy=clamp(yE*1.1,-22,30);
  if(yE>30)dvx*=.25; if(Math.abs(dx)<60&&h<cruise-py)dvy=Math.max(dvy,0);
 }else{fine=true;const ok=Math.abs(dx)<half-(tp.mv?8:12);dvx=pvx+clamp(dx*.6,-20,20);const calm=Math.abs(sh.vx-pvx)<(h<25?(tp.mv?6:4):9);const hl=sh.y-6-Math.max(py,th(sh.x-12),th(sh.x+12),th(sh.x));dvy=ok&&calm?-clamp(h*.42,3.2,20):(hl<30?8:0);}
 const pax=tp.mv?-Math.sin(S.t*TAU/tp.mv.per)*(TAU/tp.mv.per)**2*tp.mv.dx:0;
 let ax=(dvx-sh.vx)*(fine?1.5:2.4)+(fine?pax:0)-S.windNow+S.Wd.drag*sh.vx,ay=(dvy-sh.vy)*2.4+g+S.Wd.drag*sh.vy;
 ay=clamp(ay,0,T*.97);{const am=Math.sqrt(Math.max(0,T*T*.94-ay*ay));ax=clamp(ax,-am,am);}const raw=Math.atan2(ax,Math.max(ay,.01));const lm=fine&&h<12?.15:(fine?.6:.95);const ang=clamp(raw,-lm,lm);
 IN.tgtB=ang;
 const need=clamp((raw===ang?Math.hypot(ax,ay):ay/Math.cos(ang))/T,0,1)*(Math.abs(ang-sh.a)>.5?.3:1);
 S.botAcc+=need;if(S.botAcc>=1){S.botAcc-=1;IN.thrB=true;}else IN.thrB=false;
}

/* ---------------- render ---------------- */
let scan=null;
function mkScan(){scan=document.createElement('canvas');scan.width=4;scan.height=4;const s=scan.getContext('2d');s.fillStyle='rgba(0,0,0,.22)';s.fillRect(0,0,4,1);scan.pat=null;}
function glow(col,w,a){ctx.strokeStyle=col;ctx.lineJoin='round';ctx.lineCap='round';const k=1/S.cam.s;
 if(SV.set.bloom){ctx.globalAlpha=.09*(a||1);ctx.lineWidth=w*7*k;ctx.stroke();ctx.globalAlpha=.2*(a||1);ctx.lineWidth=w*3*k;ctx.stroke();}
 ctx.globalAlpha=a||1;ctx.lineWidth=w*k;ctx.stroke();ctx.globalAlpha=1;}
function shipPath(x,y,a,scale){ctx.save();ctx.translate(x,y);ctx.rotate(-a);if(scale)ctx.scale(scale,scale);ctx.beginPath();
 // cabin
 const cab=[[-3,4],[-5,6],[-5,10],[-3,12.5],[3,12.5],[5,10],[5,6],[3,4]];cab.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();
 ctx.moveTo(-7,-1);ctx.lineTo(7,-1);ctx.lineTo(7,4);ctx.lineTo(-7,4);ctx.closePath();
 ctx.moveTo(-6,-1);ctx.lineTo(-9,-6);ctx.moveTo(-11,-6);ctx.lineTo(-7,-6);ctx.moveTo(6,-1);ctx.lineTo(9,-6);ctx.moveTo(7,-6);ctx.lineTo(11,-6);
 ctx.moveTo(-2.5,-1);ctx.lineTo(-4,-4.5);ctx.lineTo(4,-4.5);ctx.lineTo(2.5,-1);
 ctx.restore();}
function w2s(x,y){const c=S.cam;return [W/2+(x-c.x)*c.s,H/2-(y-c.y)*c.s];}
function updCam(dt){
 const sh=S.ship,c=S.cam,k=viewK();let gy=th(sh.x);for(const p of S.pads)if(p.fl&&Math.abs(sh.x-p.cx)<p.w&&p.top<sh.y)gy=Math.max(gy,p.top);
 const alt=Math.max(0,sh.y-gy),far=Math.min(W,H)<500?.46:.6;
 let ts=lerp(1.3,far,clamp((alt-25)/360,0,1))*k;if(S.dead)ts=Math.max(ts,.9*k);
 c.s=lerp(c.s,ts,1-Math.exp(-2.2*dt));
 const tx=sh.x+sh.vx*.45;let ty=lerp(sh.y,gy,.42);ty=Math.max(ty,sh.y-(H/2-120)/c.s);ty=Math.min(ty,sh.y+(H/2-130)/c.s);
 c.x=lerp(c.x,tx,1-Math.exp(-4*dt));c.y=lerp(c.y,ty,1-Math.exp(-4*dt));
}
function drawPlanet(){
 const Wd=S.Wd,c=S.cam,px=W*.78-(c.x*.02)%W*0,py=H*.2+c.y*.01;ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineWidth=1.5;
 const cir=(x,y,r,col,a)=>{ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.strokeStyle=col;ctx.globalAlpha=a;ctx.stroke();};
 const P=Wd.planet,R=Math.min(W,H)*.13;
 if(P==='earth'){cir(px,py,R,'#3be3ff',.55);ctx.beginPath();ctx.moveTo(px-R*.6,py-R*.3);ctx.quadraticCurveTo(px-R*.1,py-R*.6,px+R*.3,py-R*.2);ctx.moveTo(px-R*.4,py+R*.4);ctx.quadraticCurveTo(px+R*.1,py+R*.1,px+R*.6,py+R*.45);ctx.globalAlpha=.35;ctx.stroke();}
 else if(P==='moons'){cir(px,py,R*.25,'#ffb3a0',.5);cir(px-R*1.2,py+R*.6,R*.15,'#ffb3a0',.4);}
 else if(P==='jupiter'||P==='jupiter2'){const r=R*1.6;cir(px,py,r,'#ffd18a',.45);for(let i=-3;i<=3;i++){const yy=py+i*r*.24,hw=Math.sqrt(Math.max(0,r*r-(i*r*.24)**2));ctx.beginPath();ctx.moveTo(px-hw,yy);ctx.lineTo(px+hw,yy);ctx.globalAlpha=.18;ctx.stroke();}cir(px+r*.3,py+r*.3,r*.12,'#ff7a59',.4);}
 else if(P==='saturn'){cir(px,py,R,'#e6c9ff',.5);ctx.beginPath();ctx.ellipse(px,py,R*2,R*.45,-.3,0,TAU);ctx.globalAlpha=.4;ctx.strokeStyle='#c792ff';ctx.stroke();ctx.beginPath();ctx.ellipse(px,py,R*1.6,R*.33,-.3,0,TAU);ctx.globalAlpha=.25;ctx.stroke();}
 ctx.restore();}
function render(dt){
 ctx.setTransform(DPR,0,0,DPR,0,0);ctx.globalCompositeOperation='source-over';ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
 if(!S.L)return;
 const c=S.cam,Wd=S.Wd,sh=S.ship;
 // stars
 ctx.fillStyle='#fff';for(const [a,b,sz,tw] of STARS){const x=((a*W*1.5-c.x*.04*c.s)%(W*1.5)+W*1.5)%(W*1.5)-W*.25,y=((b*H*1.3+c.y*.03*c.s)%(H*1.3)+H*1.3)%(H*1.3)-H*.15;ctx.globalAlpha=.35+.45*Math.abs(Math.sin(S.t*.7+tw*9));ctx.fillRect(x,y,sz,sz);}
 ctx.globalAlpha=1;drawPlanet();
 if(Wd.drag){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(120,60,200,.0)');g.addColorStop(1,'rgba(120,60,200,.16)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
 // wind streaks
 if(Math.abs(S.windNow)>.5){ctx.strokeStyle=Wd.col;ctx.lineWidth=1;const n=Math.min(40,Math.abs(S.windNow)*3);for(let i=0;i<n;i++){const r=STARS[i];const sp=S.windNow*40;const x=((r[0]*W*1.4+S.t*sp)%(W*1.4)+W*1.4)%(W*1.4)-W*.2,y=r[1]*H;ctx.globalAlpha=.12+.1*r[3];ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.sign(sp)*(14+r[2]*16),y);ctx.stroke();}ctx.globalAlpha=1;}
 let sx=0,sy=0;if(S.shake>0){sx=(Math.random()-.5)*S.shake;sy=(Math.random()-.5)*S.shake;}
 ctx.setTransform(DPR*c.s,0,0,-DPR*c.s,DPR*(W/2-c.x*c.s+sx),DPR*(H/2+c.y*c.s+sy));
 const vx0=c.x-W/2/c.s-20,vx1=c.x+W/2/c.s+20,yb=c.y-H/2/c.s-50;
 const i0=Math.max(0,Math.floor(vx0/STEP)),i1=Math.min(ter.length-1,Math.ceil(vx1/STEP));
 // terrain fill
 ctx.beginPath();ctx.moveTo(i0*STEP,yb);for(let i=i0;i<=i1;i++)ctx.lineTo(i*STEP,ter[i]);ctx.lineTo(i1*STEP,yb);ctx.closePath();ctx.fillStyle='#000';ctx.fill();
 ctx.globalCompositeOperation='lighter';
 // faint terrain grid hatching for depth
 ctx.beginPath();for(let i=i0-(i0%6);i<=i1;i+=6){ctx.moveTo(i*STEP,ter[i]-14);ctx.lineTo(i*STEP,ter[i]-60);}glow(Wd.col,1,.12);
 ctx.beginPath();for(let i=i0;i<=i1;i++)i===i0?ctx.moveTo(i*STEP,ter[i]):ctx.lineTo(i*STEP,ter[i]);glow(Wd.col,1.6);
 for(const [a,b] of S.lava){ctx.beginPath();for(let x=a;x<=b;x+=STEP)x===a?ctx.moveTo(x,th(x)):ctx.lineTo(x,th(x)+Math.sin(S.t*3+x*.1)*1.2);glow('#ff5a2a',2.6,.8+.2*Math.sin(S.t*5));}
 // geysers
 for(const g of S.gey){const gy=th(g.x);ctx.beginPath();ctx.moveTo(g.x-9,gy);ctx.lineTo(g.x-4,gy+5);ctx.lineTo(g.x+4,gy+5);ctx.lineTo(g.x+9,gy);glow(g.rum?'#fff':'#ff8a3d',1.6);
  if(g.hh>2){ctx.beginPath();for(let k=-1;k<=1;k++){ctx.moveTo(g.x+k*5,gy);ctx.lineTo(g.x+k*6+Math.sin(S.t*20+k)*3,gy+g.hh);}glow('#ff6a3d',2.4);}}
 // pads
 for(const p of S.pads){const col=PADC[p.k],a=p.cx-p.w/2,b=p.cx+p.w/2,lock=p.k==='goal'&&!tasksDone(),done=(p.k==='rescue'&&!p.astro)||(p.k==='pick'&&!p.crates);
  const al=lock||done?.45:1;ctx.beginPath();ctx.moveTo(a,p.top);ctx.lineTo(b,p.top);glow(p.ice?'#e8fbff':col,3,al);
  if(p.fl){ctx.beginPath();ctx.moveTo(a+4,p.top);ctx.lineTo(a+10,p.top-6);ctx.lineTo(b-10,p.top-6);ctx.lineTo(b-4,p.top);glow(col,1.2,al);
   for(const s of[-1,1]){ctx.beginPath();const fx=p.cx+s*p.w*.3,fl=6+Math.random()*6;ctx.moveTo(fx-2,p.top-7);ctx.lineTo(fx,p.top-7-fl);ctx.lineTo(fx+2,p.top-7);glow('#ffb347',1.2,.8);}}
  for(const s of[0,1]){const lx=s?b:a,on=Math.sin(p.blink*4+s*1.5)>0;ctx.beginPath();ctx.moveTo(lx,p.top);ctx.lineTo(lx,p.top+5);glow(on?'#fff':col,on?2.2:1.2,al);}
  if(p.ice){ctx.beginPath();for(let x=a+8;x<b-4;x+=14){ctx.moveTo(x,p.top-2);ctx.lineTo(x+6,p.top-2);}glow('#bfe9ff',1,.5);}
  if(p.k==='rescue')for(let j=0;j<p.astro;j++){const side=j%2?-1:1,base=p.cx+side*(p.w/2-8-j*6);let ax=base;if(j===0&&p.walk>0&&S.ship.landed===p)ax=lerp(base,S.ship.x,p.walk);
   astro(ax,p.top,S.t*6+j,S.ship.landed!==p);}
  if(p.k==='pick'&&p.crates)crate(b-12,p.top+1);
  if(p.k==='drop'&&S.delivered)crate(a+12,p.top+1);}
 // ghost
 if(S.ghost&&S.ghost.d&&S.mode==='play'){const d=S.ghost.d,fi=Math.min(d.length/4-1,Math.floor(S.t*30))*4;if(fi>=0){shipPath(d[fi],d[fi+1],d[fi+2]/100);ctx.setLineDash([3/c.s,3/c.s]);glow('#ffffff',1,.35);ctx.setLineDash([]);}}
 // particles
 for(const p of S.ps){const k=p.life/p.max;ctx.globalAlpha=Math.min(1,k*1.5);ctx.fillStyle=p.c;const s=(p.g?1.6:2)/c.s*(1+k);ctx.fillRect(p.x-s/2,p.y-s/2,s,s);}
 ctx.globalAlpha=1;
 // ship
 if(!S.dead){
  if(sh.thr&&!sh.landed){ctx.save();ctx.translate(sh.x,sh.y);ctx.rotate(-sh.a);ctx.beginPath();const fl=(sh.thr===2?20:12)+Math.random()*6;ctx.moveTo(-3,-5);ctx.lineTo(0,-5-fl);ctx.lineTo(3,-5);ctx.restore();glow(sh.thr===2?'#7df9ff':'#ffb347',1.8);}
  if(S.cargo){const [cx,cy]=shipPt(0,-6);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,cy-9);glow('#5ab0ff',1);crate(cx,cy-17,true);}
  shipPath(sh.x,sh.y,sh.a);glow('#ffffff',1.5);
 }
 for(const d of S.deb){ctx.beginPath();const cx=Math.cos(d.a)*d.l/2,sy2=Math.sin(d.a)*d.l/2;ctx.moveTo(d.x-cx,d.y-sy2);ctx.lineTo(d.x+cx,d.y+sy2);glow('#fff',1.4,.9);}
 // screen space
 ctx.setTransform(DPR,0,0,DPR,0,0);ctx.globalCompositeOperation='source-over';
 for(const p of S.pads){const [x,y]=w2s(p.cx,p.top);if(x<-40||x>W+40||y<-20||y>H+40)continue;const lock=p.k==='goal'&&!tasksDone();
  let lab=PADL[p.k];if(p.k==='rescue'&&!p.astro)lab='CLEAR';if(p.k==='pick'&&!p.crates)lab='EMPTY';if(lock)lab='GOAL · LOCKED';if(p.mv)lab+=' ⇄';if(p.ice)lab+=' · ICE';
  ctx.font='700 11px ui-monospace,Menlo,monospace';ctx.textAlign='center';ctx.fillStyle=PADC[p.k];ctx.globalAlpha=lock?.6:.95;ctx.fillText(lab,x,y+18+(p.fl?8:0));}
 ctx.globalAlpha=1;
 if(S.mode==='play')hud();
 // floating texts
 for(const t of S.txt){const a=t.t<.2?t.t/.2:Math.max(0,1-(t.t-1.2)/.6);ctx.globalAlpha=a;ctx.textAlign='center';ctx.font=(t.big?'900 26px':'800 17px')+' ui-monospace,Menlo,monospace';ctx.fillStyle=t.c;ctx.shadowColor=t.c;ctx.shadowBlur=14;ctx.fillText(t.s,W/2,H*.36-t.t*24);ctx.shadowBlur=0;}
 ctx.globalAlpha=1;
 // vignette + scanlines
 const vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
 if(scan){if(!scan.pat)scan.pat=ctx.createPattern(scan,'repeat');ctx.fillStyle=scan.pat;ctx.fillRect(0,0,W,H);}
}
function astro(x,y,t,wave){ctx.beginPath();ctx.arc(x,y+11,2.2,0,TAU);ctx.moveTo(x,y+8.8);ctx.lineTo(x,y+4);ctx.lineTo(x-2,y);ctx.moveTo(x,y+4);ctx.lineTo(x+2,y);
 const w=wave?Math.sin(t)*2.5:0;ctx.moveTo(x,y+7.5);ctx.lineTo(x-3,y+9.5+w);ctx.moveTo(x,y+7.5);ctx.lineTo(x+3,y+5.5);glow('#ff5ea8',1.2);}
function crate(x,y,hang){ctx.beginPath();ctx.rect(x-5,y,10,9);ctx.moveTo(x-5,y);ctx.lineTo(x+5,y+9);ctx.moveTo(x+5,y);ctx.lineTo(x-5,y+9);glow('#5ab0ff',1.2);}
function nextObj(){const sh=S.ship;let best=null,bd=1e9;
 for(const p of S.pads){let want=false;if(p.k==='rescue'&&p.astro)want=true;if(p.k==='pick'&&p.crates&&!S.cargo)want=true;if(p.k==='drop'&&S.cargo)want=true;if(want){const d=Math.abs(p.cx-sh.x);if(d<bd){bd=d;best=p;}}}
 if(!best&&tasksDone())best=S.pads.find(p=>p.k==='goal');return best;}
function hud(){
 const sh=S.ship,L=S.L,Lm=lim(),top=Math.max(10,(window.visualViewport?0:0))+8;
 ctx.textAlign='left';ctx.font='700 11px ui-monospace,Menlo,monospace';
 const fx=12,fy=top+4,fw=Math.min(130,W*.32),fr=sh.fuel/S.cap;
 ctx.fillStyle='#9ab';ctx.fillText('FUEL',fx,fy+9);ctx.strokeStyle='#3be3ff88';ctx.lineWidth=1;ctx.strokeRect(fx+36,fy,fw,10);
 const low=fr<.2;ctx.fillStyle=low?(Math.sin(S.t*10)>0?'#ff5a5a':'#661111'):'#ffd23f';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=8;ctx.fillRect(fx+37,fy+1,(fw-2)*fr,8);ctx.shadowBlur=0;
 const fsx=fx+37+(fw-2)*clamp(L.fs/S.cap,0,1);ctx.fillStyle='#fff';ctx.fillRect(fsx,fy-2,1,14);
 ctx.fillStyle='#e8fbff';ctx.fillText(Math.round(sh.fuel),fx+42+fw,fy+9);
 // telemetry row
 const gy=surface(sh.x,sh.y-6).y,alt=Math.max(0,(sh.y-6-gy)/4),vxr=(sh.vx-(sh.landed?sh.landed.vx:0))/4,vyr=sh.landed?0:sh.vy/4;
 const okX=Math.abs(vxr)*4<=Lm.vx,okY=-vyr*4<=Lm.vy,okA=Math.abs(sh.a)<=Lm.a;
 const ry=fy+30;ctx.font='700 12px ui-monospace,Menlo,monospace';
 const it=[['ALT',alt.toFixed(0)+'m','#e8fbff'],['↓',(-vyr).toFixed(1),okY?'#7dffb0':'#ff6a6a'],['↔',Math.abs(vxr).toFixed(1),okX?'#7dffb0':'#ff6a6a'],['∠',Math.round(Math.abs(sh.a)*57.3)+'°',okA?'#7dffb0':'#ff6a6a']];
 let x=fx;for(const [k,v,col] of it){ctx.fillStyle='#9ab';ctx.fillText(k,x,ry);const kw=ctx.measureText(k+' ').width;ctx.fillStyle=col;ctx.fillText(v,x+kw,ry);x+=kw+ctx.measureText(v).width+14;}
 // time + objective
 ctx.font='700 11px ui-monospace,Menlo,monospace';ctx.fillStyle='#9ab';
 const parts=[];if(S.need.rescue)parts.push('SOS '+S.rescued+'/'+S.need.rescue);if(S.need.cargo)parts.push('CARGO '+S.delivered+'/'+S.need.cargo+(S.cargo?' (on board)':''));parts.push(tasksDone()?'→ LAND ON GOAL':'then GOAL');
 ctx.fillText(parts.join(' · '),fx,ry+20);
 ctx.textAlign='right';ctx.fillStyle=S.t<=L.par?'#e8fbff':'#ff9a6a';ctx.fillText('⏱ '+S.t.toFixed(1)+'s / '+L.par+'s',W-58,fy+9);
 if(S.Wd.wind||S.Wd.gust){const wv=S.windNow;ctx.fillStyle=S.Wd.col;const ar=Math.abs(wv)<.5?'calm':(wv<0?'◀':'')+'◀▶'.slice(0,0)+('■'.repeat(Math.min(5,Math.ceil(Math.abs(wv)/3))))+(wv>0?'▶':'');ctx.fillText('WIND '+ar,W-58,ry);}
 if(sh.fuel<=0&&!sh.landed){ctx.textAlign='center';ctx.font='900 18px ui-monospace,Menlo,monospace';ctx.fillStyle=Math.sin(S.t*8)>0?'#ff5a5a':'#ffb347';ctx.fillText('OUT OF FUEL',W/2,H*.5);}
 if(IN.ab&&sh.thr){ctx.textAlign='center';ctx.font='900 14px ui-monospace,Menlo,monospace';ctx.fillStyle='#7df9ff';ctx.shadowColor='#7df9ff';ctx.shadowBlur=12;ctx.fillText('AFTERBURN',W/2,ry+46);ctx.shadowBlur=0;}
 if(sh.landed){const p=sh.landed;let m='';if(p.k==='fuel'&&sh.fuel<S.cap)m='REFUELING…';else if(p.k==='rescue'&&p.astro)m='BOARDING…';else if(p.k==='pick'&&p.crates&&!S.cargo)m='LOADING CARGO…';else if(p.k==='drop'&&S.cargo)m='UNLOADING…';else if(p.k==='goal'&&!tasksDone())m='FINISH THE JOB FIRST';else if(!S.done)m='HOLD TO LIFT OFF';
  if(m){ctx.textAlign='center';ctx.font='800 14px ui-monospace,Menlo,monospace';ctx.fillStyle='#e8fbff';ctx.fillText(m,W/2,H-60);}}
 // objective arrow
 const o=nextObj();if(o){const [x,y]=w2s(o.cx,o.top);if(x<20||x>W-20||y<90||y>H-30){const cx=W/2,cy=H/2,a=Math.atan2(y-cy,x-cx),r=Math.min(W/2-26,H/2-70),ex=cx+Math.cos(a)*r,ey=cy+Math.sin(a)*r*((H/2-70)/r>1?1:1);
  const px=clamp(ex,24,W-24),py=clamp(ey,110,H-40);ctx.save();ctx.translate(px,py);ctx.rotate(a);ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-6,-8);ctx.lineTo(-2,0);ctx.lineTo(-6,8);ctx.closePath();ctx.fillStyle=PADC[o.k];ctx.shadowColor=PADC[o.k];ctx.shadowBlur=12;ctx.fill();ctx.restore();ctx.shadowBlur=0;
  ctx.textAlign='center';ctx.font='700 10px ui-monospace,Menlo,monospace';ctx.fillStyle=PADC[o.k];ctx.fillText(Math.round(Math.abs(o.cx-sh.x)/4)+'m',clamp(px-Math.cos(a)*22,24,W-24),clamp(py-Math.sin(a)*22+4,100,H-30));}}
 // touch tilt indicator
 if(IN.touch){ctx.beginPath();ctx.arc(IN.touch.x0,IN.touch.y,26,0,TAU);ctx.strokeStyle='rgba(125,249,255,.35)';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(IN.touch.x,IN.touch.y,8,0,TAU);ctx.fillStyle='rgba(125,249,255,.5)';ctx.fill();}
 if(S.t<4&&!S.bot){ctx.textAlign='center';ctx.font='700 12px ui-monospace,Menlo,monospace';ctx.fillStyle='rgba(232,251,255,'+(1-S.t/4)+')';ctx.fillText('HOLD = THRUST   ·   SLIDE = TILT',W/2,H-30);}
}

/* ---------------- music intensity ---------------- */
function updMusic(){if(!AU.c)return;const sh=S.ship;let i=.15;
 if(S.L&&(S.mode==='play'||S.mode==='demo')&&!S.dead){const alt=sh.y-surface(sh.x,sh.y-6).y;i=sh.landed?.35:clamp(1-(alt-20)/280,0.1,1);if(S.done)i=.6;}
 if(S.dead)i=.05;if(S.mode==='demo')i*=.7;
 AU.int=lerp(AU.int,i,.05);setInt(AU,AU.int);
 const tg=(S.mode==='play'&&!S.dead&&!S.paused&&sh&&sh.thr&&!sh.landed)?(sh.thr===2?.42:.3):0;AU.thrG.gain.setTargetAtTime(tg,AU.c.currentTime,.04);AU.thrF.frequency.setTargetAtTime(sh&&sh.thr===2?1600:700,AU.c.currentTime,.05);}

/* ---------------- UI ---------------- */
const OVS=['title','map','hangar','settings','intro','pause','result','crash'];
function show(id){for(const o of OVS)$(o).classList.toggle('hide',o!==id);$('hud').classList.toggle('hide',!(S.mode==='play'&&!id));}
function toTitle(){S.mode='demo';loadLevel(0);S.mode='title';S.demo=true;show('title');}
function toMap(){S.mode='map';S.demo=true;if(!S.L)loadLevel(0);buildMap();show('map');}
function buildMap(){
 $('mChips').textContent='✦ '+chips()+'  ★ '+totalStars()+'/'+NL*3;
 const box=$('worlds');box.innerHTML='';
 WORLDS.forEach((Wd,wi)=>{const ls=LEVELS.map((l,i)=>[l,i]).filter(([l])=>l.w===wi),wl=!unlocked(ls[0][1]);
  const d=document.createElement('div');d.className='world'+(wl?' lock':'');d.style.setProperty('--c',Wd.col);
  d.innerHTML='<div class="wn">'+(wi+1)+' · '+Wd.name+'</div><div class="ws">'+Wd.sub+' · gravity '+(Wd.g/16*0.165).toFixed(2)+'g · '+Wd.hz+'</div><div class="lvls"></div>';
  const g=d.querySelector('.lvls');
  for(const [l,i] of ls){const b=document.createElement('button');b.className='lb';b.style.setProperty('--c',Wd.col);b.disabled=!unlocked(i);const st=SV.best[i]?SV.best[i].st:[0,0,0];
   b.innerHTML='<b>'+(i+1)+'</b><i>'+l.n+'</i><span>'+(unlocked(i)?st.map(v=>v?'★':'☆').join(''):'LOCKED')+'</span>';b.onclick=()=>startLevel(i);g.appendChild(b);}
  box.appendChild(d);});
}
function buildHangar(){
 $('hChips').textContent='✦ '+chips();const box=$('ups');box.innerHTML='';
 for(const u of UPG){const lv=SV.upg[u.id],cost=UCOST[lv],d=document.createElement('div');d.className='up';
  d.innerHTML='<div class="t"><b>'+u.n+'</b><div>'+u.d+'</div><div class="pips">'+'■'.repeat(lv)+'□'.repeat(u.max-lv)+'</div></div>';
  const b=document.createElement('button');if(lv>=u.max){b.textContent='MAX';b.disabled=true;}else{b.textContent='✦ '+cost;b.disabled=chips()<cost;}
  b.onclick=()=>{if(chips()>=cost&&SV.upg[u.id]<u.max){SV.spent+=cost;SV.upg[u.id]++;save();au(A=>sfxChime(A));buildHangar();}};d.appendChild(b);box.appendChild(d);}
}
let hangBack='title',setBack='title';
function startLevel(i){audioInit();S.mode='play';S.demo=false;S.paused=false;loadLevel(i);
 const L=S.L,Wd=S.Wd,card=$('introCard');card.style.setProperty('--c',Wd.col);
 const obj=[];if(S.need.rescue)obj.push('Rescue '+S.need.rescue+' astronaut'+(S.need.rescue>1?'s':''));if(S.need.cargo)obj.push('deliver '+S.need.cargo+' crate');obj.push('land on the GOAL pad');
 const o=obj.join(', ');
 card.innerHTML='<div class="k">WORLD '+(L.w+1)+' · '+Wd.name+' · LEVEL '+(i+1)+'/'+NL+'</div><div class="n">'+L.n+'</div><div class="o">'+o.charAt(0).toUpperCase()+o.slice(1)+'.</div><div class="h">'+L.tip+'</div><div class="h">★ Fuel ≥ '+L.fs+'  ·  ★ Touchdown under 1.7 m/s  ·  ★ Under '+L.par+'s'+(S.ghost?'<br>Your best run flies with you as a ghost.':'')+'</div><div class="tap">TAP TO LAUNCH</div>';
 S.frozen=true;show('intro');
 if(S.bot||Q.get('test'))setTimeout(()=>{if(S.frozen)launch();},300);
}
function launch(){S.frozen=false;show(null);}
function showResult(){const r=S.res,L=S.L;S.mode='play';
 $('rName').textContent='Level '+(S.li+1)+' · '+L.n;show('result');$('hud').classList.add('hide');
 const sv=[...document.querySelectorAll('#result .stars i')];sv.forEach(e=>e.classList.remove('on'));
 r.st.forEach((on,k)=>{if(on)setTimeout(()=>{sv[k].classList.add('on');au(A=>sfxDing(A,0,k===2));},350+k*380);});
 const row=(ok,a,b)=>'<div class="'+(ok?'y':'n')+'"><span>'+(ok?'★ ':'☆ ')+a+'</span><span>'+b+'</span></div>';
 $('rList').innerHTML=row(r.st[0],'Fuel left',Math.round(r.fuel)+' / need '+L.fs)+row(r.st[1],'Touchdown',(r.v/4).toFixed(2)+' m/s / need <1.75')+row(r.st[2],'Time',r.t.toFixed(1)+'s / par '+L.par+'s')+'<div><span>SCORE</span><span>'+r.score.toLocaleString()+'</span></div>';
 $('rNote').textContent=(r.newBest?(r.first?'First clear! Ghost saved. ':'New best! Ghost updated. '):'Best: '+SV.best[S.li].score.toLocaleString()+'. ')+(r.gained?'+'+r.gained+' ✦ Star Chip'+(r.gained>1?'s':''):'');
 $('rNext').style.display=S.li<NL-1?'':'none';
 if(S.li===NL-1)$('rNote').textContent+=' Campaign complete!';
}
function showCrash(){$('cWhy').textContent=S.crashWhy;$('cTip').textContent=S.crashTip;show('crash');$('hud').classList.add('hide');}
function bind(id,fn){$(id).addEventListener('click',e=>{e.stopPropagation();audioInit();au(A=>sfxBlip(A,880,0,.04));fn();});}
bind('bPlay',toMap);bind('mBack',toTitle);
bind('bHangar',()=>{hangBack='title';buildHangar();show('hangar');});bind('mHangar',()=>{hangBack='map';buildHangar();show('hangar');});
bind('hBack',()=>hangBack==='map'?toMap():toTitle());
function openSet(back){setBack=back;$('sMus').value=SV.set.mus;$('sSfx').value=SV.set.sfx;$('sGhost').checked=SV.set.ghost;$('sLevel').checked=SV.set.level;$('sShake').checked=SV.set.shake;$('sBloom').checked=SV.set.bloom;$('sVib').checked=SV.set.vib;show('settings');}
bind('bSet',()=>openSet('title'));bind('pSet',()=>openSet('pause'));
bind('setDone',()=>{if(setBack==='pause')show('pause');else toTitle();});
$('sMus').oninput=e=>{SV.set.mus=+e.target.value;applyVol();save();};$('sSfx').oninput=e=>{SV.set.sfx=+e.target.value;applyVol();save();};
for(const [id,k] of [['sGhost','ghost'],['sLevel','level'],['sShake','shake'],['sBloom','bloom'],['sVib','vib']])$(id).onchange=e=>{SV.set[k]=e.target.checked;save();};
bind('bReset',()=>{if(confirm('Reset all progress, stars, upgrades and ghosts? This cannot be undone.')){const st=SV.set;SV=defSave();SV.set=st;S.set=st;save();for(let i=0;i<NL;i++)try{localStorage.removeItem('lla_ghost_'+i);}catch(e){}}});
bind('bPause',()=>{if(S.mode!=='play'||S.dead||S.done)return;S.paused=true;show('pause');$('hud').classList.add('hide');});
bind('pResume',()=>{S.paused=false;show(null);});bind('pRetry',()=>startLevel(S.li));bind('pMap',toMap);
bind('rNext',()=>startLevel(Math.min(NL-1,S.li+1)));bind('rRetry',()=>startLevel(S.li));bind('rMap',toMap);
bind('cRetry',()=>startLevel(S.li));bind('cMap',toMap);
$('intro').addEventListener('pointerdown',e=>{e.preventDefault();audioInit();launch();});

/* ---------------- input ---------------- */
cv.addEventListener('pointerdown',e=>{audioInit();IN.pts.add(e.pointerId);if(S.mode!=='play'||S.paused||S.frozen)return;
 if(!IN.touch){IN.touch={id:e.pointerId,x0:e.clientX,a0:IN.tgt,x:e.clientX,y:e.clientY};IN.thr=true;}try{cv.setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();});
cv.addEventListener('pointermove',e=>{const t=IN.touch;if(!t||t.id!==e.pointerId)return;t.x=e.clientX;t.y=e.clientY;IN.tgt=clamp(t.a0+(t.x-t.x0)*.012,-1.5,1.5);});
function up(e){IN.pts.delete(e.pointerId);const t=IN.touch;if(t&&t.id===e.pointerId){IN.touch=null;IN.thr=false;if(SV.set.level)IN.tgt=0;}}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
const KM={ArrowUp:'thr',KeyW:'thr',Space:'thr',ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r',ArrowDown:'lv',KeyS:'lv',ShiftLeft:'ab',ShiftRight:'ab'};
addEventListener('keydown',e=>{audioInit();if(S.mode==='play'&&S.frozen&&!$('intro').classList.contains('hide')&&(e.code==='Space'||e.code==='Enter'||e.code==='ArrowUp')){launch();e.preventDefault();return;}
 if((e.code==='Escape'||e.code==='KeyP')&&S.mode==='play'&&!S.dead&&!S.done){S.paused=!S.paused;S.paused?show('pause'):show(null);if(S.paused)$('hud').classList.add('hide');}
 const k=KM[e.code];if(k){IN.keys[k]=true;e.preventDefault();}});
addEventListener('keyup',e=>{const k=KM[e.code];if(k)IN.keys[k]=false;});
addEventListener('blur',()=>{IN.keys={};IN.thr=false;IN.touch=null;IN.pts.clear();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S.mode==='play'&&!S.dead&&!S.done&&!S.frozen&&!S.paused){S.paused=true;show('pause');$('hud').classList.add('hide');}
 if(AU.c){document.hidden?AU.c.suspend():AU.c.resume();}});

/* ---------------- loop ---------------- */
let last=performance.now(),acc=0;const DT=1/120;
function frame(now){requestAnimationFrame(frame);let dt=Math.min(.05,(now-last)/1000);last=now;
 if(S.L){const running=(S.mode==='demo'||S.mode==='title'||S.mode==='map'||(S.mode==='play'&&!S.paused&&!S.frozen));
  if(running){if(S.mode!=='play'){if(S.mode!=='demo'){const m=S.mode;S.mode='demo';acc+=dt;while(acc>=DT){step(DT);acc-=DT;}S.mode=m;}}else{acc+=dt*S.speed;let n=0;while(acc>=DT&&n<60){step(DT);acc-=DT;n++;}}}
  updCam(dt);}
 render(dt);updMusic();}
resize();addEventListener('resize',resize);
window.__LL={get mode(){return S.mode==='demo'?'title':S.mode;},S,SV,IN,LEVELS,WORLDS,startLevel,toMap,audioTest,step,loadLevel,launch,tasksDone,ver:VER,
 info(){const sh=S.ship;return {mode:S.mode,lvl:S.li,t:+S.t.toFixed(2),x:Math.round(sh.x),y:Math.round(sh.y),fuel:+sh.fuel.toFixed(1),landed:sh.landed?sh.landed.k:null,dead:S.dead,why:S.crashWhy||null,done:S.done,rescued:S.rescued,delivered:S.delivered,res:S.res||null,touch:S.lastTouch};}};
setTimeout(()=>$('splash').classList.add('gone'),Q.get('test')||Q.get('level')?50:900);
// routing / test hooks
const lvQ=+Q.get('level'),tq=Q.get('test');
if(lvQ>=1&&lvQ<=NL){toTitle();startLevel(lvQ-1);}
else if(tq==='map'){toMap();}
else if(tq==='hangar'){toTitle();buildHangar();show('hangar');}
else if(tq==='settings'){toTitle();openSet('title');}
else toTitle();
if(Q.get('audiotest')==='1')audioTest().then(r=>{console.log('AUDIOTEST '+JSON.stringify(r));window.__AT=r;});
requestAnimationFrame(frame);
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
