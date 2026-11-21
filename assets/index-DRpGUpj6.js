(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function e(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=e(i);fetch(i.href,r)}})();function gc(s,t,e){return s<t?t:s>e?e:s}function vc(s,t={}){if(!Array.isArray(s)||s.length===0)return[];const e=gc(Number(t.sensitivity??1)||1,.4,2.5),n=Math.max(.04,(Number(t.minIntervalMs??85)||85)/1e3),i=t.includeRolls!==!1,r=1/e,a=.42*r,o=.55*r,c=Math.max(.2,.48*Math.sqrt(r)),l=.58*r,h=1.4*r,u=.72*r,f=.65*r,p=[];for(let v=0;v<s.length;v++){const m=s[v];m.kind==="BEAT"?m.sub>=a&&m.flux>=o&&m.sim>=c&&m.tot>=l&&p.push(m):i&&m.flux>=h&&m.pTok>=u&&m.pHi>=f&&m.sub<.48&&m.sPrevSub<.65&&p.push(m)}const g=[];for(let v=0;v<p.length;v++){const m=p[v];if(g.length===0){g.push(m);continue}const d=g[g.length-1];m.t-d.t>=n?g.push(m):m.kind==="BEAT"&&d.kind!=="BEAT"&&(g[g.length-1]=m)}return g}class _c{constructor(t={}){this.subMinFreq=t.subMinFreq??35,this.subMaxFreq=t.subMaxFreq??105,this.tokMinFreq=t.tokMinFreq??350,this.tokMaxFreq=t.tokMaxFreq??1800,this.clickMinFreq=t.clickMinFreq??1800,this.clickMaxFreq=t.clickMaxFreq??5200,this.bpm=t.bpm??140,this.refractoryMs=t.refractoryMs??85,this.fallbackRefractoryMs=Math.round(6e4/this.bpm*.7),this.latencyOffsetMs=t.latencyOffsetMs??0,this.sensitivity=t.sensitivity??1,this.includeRolls=t.includeRolls??!0,this.syncMode=t.syncMode??"hybrid",this.kickZones=[],this.analysis=null,this.dspReady=!1,this.analysisStatus="idle",this.activeKicks=[],this.nextKickIdx=0,this.prevEffectiveTime=-1,this.prevSubEnergy=0,this.prevTokEnergy=0,this.prevClickEnergy=0,this.runningAverage=.08,this.adaptiveThreshold=.16,this.lastKickTime=0,this.isKick=!1,this.kickIntensity=0,this.kickCount=0,this.isDrop=!1,this.dropIntensity=0,this.bpmEstimate=this.bpm,this.activeZone=null}setAnalysisStatus(t){["idle","analyzing","ready","fallback"].includes(t)&&(this.analysisStatus=t,(t==="analyzing"||t==="fallback")&&(this.dspReady=!1))}setAnalysis(t,e={}){const{applyAutoZones:n=!0}=e;if(!t)return;this.analysis=t,this.dspReady=!0,this.analysisStatus="ready",this.bpm=t.bpm||this.bpm,this.bpmEstimate=this.bpm,this.fallbackRefractoryMs=Math.round(6e4/this.bpm*.7),this._rebuildActiveKicks(),n&&Array.isArray(t.autoZones)&&t.autoZones.length>0&&this.setKickZones(t.autoZones);const i=this.prevEffectiveTime>0?Math.max(0,this.prevEffectiveTime-this.latencyOffsetMs/1e3):0;this.onSeek(i)}setSensitivity(t){this.sensitivity=Math.max(.4,Math.min(2.5,Number(t)||1)),this.dspReady&&this._rebuildActiveKicks()}setBpm(t){this.bpm=Math.max(60,Math.min(240,Number(t)||140)),this.bpmEstimate=this.bpm,this.fallbackRefractoryMs=Math.round(6e4/this.bpm*.7)}setRefractoryMs(t){this.refractoryMs=Math.max(40,Math.min(500,Math.round(Number(t)||85))),this.dspReady&&this._rebuildActiveKicks()}setIncludeRolls(t){this.includeRolls=!!t,this.dspReady&&this._rebuildActiveKicks()}setLatencyOffsetMs(t){this.latencyOffsetMs=Math.max(-150,Math.min(150,Number(t)||0)),this.dspReady&&this.prevEffectiveTime>=0&&(this.nextKickIdx=this._findKickIndex(this.prevEffectiveTime))}setSyncMode(t){["hybrid","zones_only","auto"].includes(t)&&(this.syncMode=t)}setKickZones(t){Array.isArray(t)&&(this.kickZones=t.map((e,n)=>({id:e.id||`zone-${n}-${Date.now()}`,name:e.name||`Kick Zone #${n+1}`,start:Math.max(0,Number(e.start)||0),end:Math.max(0,Number(e.end)||0),machineIndex:typeof e.machineIndex=="number"?e.machineIndex:0,active:e.active!==!1})))}resetZonesToAuto(){this.analysis&&Array.isArray(this.analysis.autoZones)&&this.setKickZones(this.analysis.autoZones)}addKickZone(t,e,n=0,i=null){const r=Math.min(t,e),a=Math.max(t,e),c={id:`zone-${Date.now()}-${Math.floor(Math.random()*1e3)}`,name:i||`Drop Zone (${r.toFixed(1)}s - ${a.toFixed(1)}s)`,start:Math.max(0,r),end:Math.max(0,a),machineIndex:(n%5+5)%5,active:!0};return this.kickZones.push(c),c}removeKickZone(t){this.kickZones=this.kickZones.filter(e=>e.id!==t)}toggleKickZone(t,e=null){const n=this.kickZones.find(i=>i.id===t);n&&(n.active=e!==null?!!e:!n.active)}isInsideKickZone(t){for(let e=0;e<this.kickZones.length;e++){const n=this.kickZones[e];if(n.active&&t>=n.start&&t<=n.end)return n}return null}_findKickIndex(t){const e=this.activeKicks,n=t-.01;let i=0,r=e.length;for(;i<r;){const a=i+r>>1;e[a].t<n?i=a+1:r=a}return i}_rebuildActiveKicks(){if(!this.analysis||!Array.isArray(this.analysis.candidates)){this.activeKicks=[],this.nextKickIdx=0;return}this.activeKicks=vc(this.analysis.candidates,{sensitivity:this.sensitivity,minIntervalMs:this.refractoryMs,includeRolls:this.includeRolls}),this.prevEffectiveTime>=0?this.nextKickIdx=this._findKickIndex(this.prevEffectiveTime):this.nextKickIdx=0}onSeek(t){const e=Math.max(0,(Number(t)||0)+this.latencyOffsetMs/1e3);this.nextKickIdx=this._findKickIndex(e),this.prevEffectiveTime=e,this.lastKickTime=0}update(t,e=44100,n=0){const i=Math.max(0,n+this.latencyOffsetMs/1e3);this.activeZone=this.isInsideKickZone(i);const r=this.activeZone!==null;if(this.dspReady){(this.prevEffectiveTime<0||i<this.prevEffectiveTime-.05||i>this.prevEffectiveTime+.5)&&this.onSeek(n);let D=null;const S=i-.15;for(;this.nextKickIdx<this.activeKicks.length&&this.activeKicks[this.nextKickIdx].t<=i;){const R=this.activeKicks[this.nextKickIdx];this.nextKickIdx++,R.t>=S&&(!D||R.strength>D.strength)&&(D=R)}let x=!1;if(D&&(this.syncMode==="zones_only"?x=r:this.syncMode==="hybrid"?x=r||D.strength>=.95&&D.sub>=.6:x=!0),D&&x?(this.isKick=!0,this.lastKickTime=i*1e3,this.kickCount++,this.kickIntensity=Math.max(.75,Math.min(2,D.strength*1.15))):(this.isKick=!1,this.kickIntensity*=.82),r)this.isDrop=!0,this.dropIntensity=1;else if(this.syncMode==="zones_only")this.isDrop=!1,this.dropIntensity=0;else{const R=this.lastKickTime>0?i*1e3-this.lastKickTime:1/0;this.isDrop=R<650&&this.kickIntensity>.35,this.dropIntensity=this.isDrop?Math.min(1,this.dropIntensity+.08):Math.max(0,this.dropIntensity-.06)}return this.prevEffectiveTime=i,this._getState()}if(this.analysisStatus==="analyzing"||this.analysisStatus==="idle")return this.isKick=!1,this.kickIntensity*=.82,this.isDrop=r,this.dropIntensity=r?1:0,this.prevEffectiveTime=i,this._getState();const a=i*1e3;if(a<this.lastKickTime-50&&(this.lastKickTime=0),!t||t.length===0)return this.isKick=!1,this.kickIntensity*=.82,this.isDrop=r,this.dropIntensity=r?1:0,this.prevEffectiveTime=i,this._getState();const o=t.length,c=e*.5/o,l=(D,S,x=1)=>{const R=Math.max(x,Math.floor(D/c)),O=Math.min(o-1,Math.ceil(S/c));let N=0,G=0;for(let q=R;q<=O;q++)N+=t[q],G++;return G>0?N/G/255:0},h=l(this.subMinFreq,this.subMaxFreq,1),u=l(this.tokMinFreq,this.tokMaxFreq,1),f=l(this.clickMinFreq,this.clickMaxFreq,1),p=Math.max(0,h-this.prevSubEnergy),g=Math.max(0,u-this.prevTokEnergy),v=Math.max(0,f-this.prevClickEnergy);this.prevSubEnergy=h,this.prevTokEnergy=u,this.prevClickEnergy=f;const m=p*1.15+g*1.35+v*1.1;this.runningAverage=this.runningAverage*.93+m*.07;const d=Math.max(.09/this.sensitivity,this.runningAverage*(2.1/this.sensitivity));this.adaptiveThreshold=Math.max(d,this.adaptiveThreshold*.86);const b=Math.max(this.fallbackRefractoryMs,this.refractoryMs),w=a-this.lastKickTime,_=w>=b,P=m>this.adaptiveThreshold&&m>.08/this.sensitivity,A=h>.25/this.sensitivity||u>.3/this.sensitivity;let C=!1;return this.syncMode==="zones_only"?C=r&&_&&P&&A:this.syncMode==="hybrid"?r?C=_&&P&&A:C=_&&P&&h>.42/this.sensitivity:C=_&&P&&A,C?(this.isKick=!0,this.lastKickTime=a,this.kickCount++,this.kickIntensity=Math.min(2,Math.max(.75,h*1.1+m*1.8)),this.adaptiveThreshold=Math.max(this.adaptiveThreshold,m*1.45)):(this.isKick=!1,this.kickIntensity*=.82),r?(this.isDrop=!0,this.dropIntensity=1):this.syncMode==="zones_only"?(this.isDrop=!1,this.dropIntensity=0):(this.isDrop=w<650&&h>.38,this.dropIntensity=this.isDrop?Math.min(1,this.dropIntensity+.06):Math.max(0,this.dropIntensity-.05)),this.prevEffectiveTime=i,this._getState()}_getState(){return{kick:this.isKick,kickIntensity:this.kickIntensity,isDrop:this.isDrop,dropIntensity:this.dropIntensity,bpmEstimate:this.bpmEstimate,kickCount:this.kickCount,activeZone:this.activeZone,inZone:this.activeZone!==null,syncMode:this.syncMode,zones:this.kickZones,dspReady:this.dspReady,analysisStatus:this.analysisStatus,activeKicks:this.activeKicks,waveform:this.analysis?this.analysis.waveform:null,subProfile:this.analysis?this.analysis.subProfile:null,includeRolls:this.includeRolls,refractoryMs:this.refractoryMs,latencyOffsetMs:this.latencyOffsetMs,stats:this.analysis?this.analysis.stats:null}}reset(t={}){const{keepAnalysis:e=!1}=t;this.prevSubEnergy=0,this.prevTokEnergy=0,this.prevClickEnergy=0,this.runningAverage=.08,this.adaptiveThreshold=.16,this.lastKickTime=0,this.prevEffectiveTime=-1,this.nextKickIdx=0,this.isKick=!1,this.kickIntensity=0,this.kickCount=0,this.isDrop=!1,this.dropIntensity=0,this.activeZone=null,e||(this.analysis=null,this.dspReady=!1,this.analysisStatus="idle",this.activeKicks=[],this.kickZones=[])}}const Fe=[{index:0,id:"hydraulic-press",name:"Hydraulic Press",type:"Heavy Compressive Stamper",action:"STAMP",description:"1000-ton hydraulic forging press delivering devastating downstrokes on beat"},{index:1,id:"guillotine-shear",name:"Guillotine Shear",type:"High-Velocity Slicing Blade",action:"SLICE",description:"Hardened carbide shear blade dropping at high speed with showers of cutting sparks"},{index:2,id:"column-drill",name:"Column Drill",type:"Spindle Boring System",action:"BORE",description:"Massive heavy-duty column drill plunging into thick armor plates with glowing shavings"},{index:3,id:"blast-furnace",name:"Blast Furnace",type:"Molten Slag Crucible",action:"BURST",description:"Infernal crucible releasing boiling orange-red molten metal and billowing heat exhaust"},{index:4,id:"roll-former",name:"Roll Former",type:"High-Torque Rolling Mill",action:"EXTRUDE",description:"Cascading steel cylinders shaping red-hot structural I-beams with grinding friction"}];class xc{constructor(t={}){this.activeIndex=t.initialMachine??0,this.previousIndex=this.activeIndex,this.baseCadence=t.cadence??16,this.autoSwitch=t.autoSwitch??!0,this.kicksInCurrentMachine=0,this.totalKicks=0,this.switchCount=0,this.transitionDuration=.6,this.transitionTime=this.transitionDuration,this.changeListeners=[]}getMachine(t){const e=(t%Fe.length+Fe.length)%Fe.length;return Fe[e]}get activeMachine(){return Fe[this.activeIndex]}get activeMachineName(){return Fe[this.activeIndex].name}get activeMachineIndex(){return this.activeIndex}onMachineChange(t){typeof t=="function"&&this.changeListeners.push(t)}setActiveMachine(t,e=!0){const n=(t%Fe.length+Fe.length)%Fe.length;if(n!==this.activeIndex){this.previousIndex=this.activeIndex,this.activeIndex=n,this.kicksInCurrentMachine=0,this.transitionTime=0;const i=Fe[this.activeIndex],r=Fe[this.previousIndex];for(const a of this.changeListeners)try{a(i,r)}catch(o){console.error("Error in machine change listener:",o)}}e!==void 0&&(this.autoSwitch=e)}nextMachine(){this.setActiveMachine(this.activeIndex+1,this.autoSwitch)}prevMachine(){this.setActiveMachine(this.activeIndex-1,this.autoSwitch)}setAutoSwitch(t){this.autoSwitch=!!t}onKick(t,e=!1,n=!1){if(this.totalKicks++,this.kicksInCurrentMachine++,n)return;const i=e&&this.baseCadence===16?32:this.baseCadence;this.autoSwitch&&this.kicksInCurrentMachine>=i&&(this.switchCount++,this.nextMachine())}update(t=.016){this.transitionTime<this.transitionDuration&&(this.transitionTime=Math.min(this.transitionDuration,this.transitionTime+t))}getTransitionProgress(){if(this.transitionDuration<=0)return 1;const t=Math.min(1,this.transitionTime/this.transitionDuration);return t*t*(3-2*t)}getState(){return{activeMachineIndex:this.activeIndex,machineName:this.activeMachineName,previousIndex:this.previousIndex,transitionProgress:this.getTransitionProgress(),isTransitioning:this.transitionTime<this.transitionDuration,kicksInCurrentMachine:this.kicksInCurrentMachine,totalKicks:this.totalKicks,autoSwitch:this.autoSwitch,machines:Fe}}reset(){this.activeIndex=0,this.previousIndex=0,this.kicksInCurrentMachine=0,this.totalKicks=0,this.switchCount=0,this.transitionTime=this.transitionDuration}}class Mc{constructor(){this.audioContext=null,this.sourceNode=null,this.analyser=null,this.gainNode=null,this.audio=null,this.fftSize=2048,this.frequencyData=new Uint8Array(this.fftSize/2),this.timeData=new Uint8Array(this.fftSize/2),this.bassEnergy=0,this.midEnergy=0,this.trebleEnergy=0,this.kickDetector=new _c({sensitivity:1}),this.machineDirector=new xc({cadence:16,autoSwitch:!0}),this.isInitialized=!1,this.isPlaying=!1,this.hasLoadedTrack=!1,this.currentTrackName="Detonated",this.currentObjectURL=null,this.lastFrameTime=performance.now(),this._lastAudioElTime=0,this._smoothTime=0,this._dspWorker=null,this._analysisJobId=0,this._lastDecodedMono=null,this.cachedState=this._createDefaultState()}async init(){if(this.isInitialized)return;const t=window.AudioContext||window.webkitAudioContext;if(!t){console.warn("Web Audio API is not supported in this browser environment.");return}this.audioContext=new t,this.audio=new Audio,this.audio.crossOrigin="anonymous",this.audio.preload="auto",this.audio.loop=!0,this.audio.addEventListener("play",()=>{this.isPlaying=!0;const n=this.audio&&this.audio.currentTime||0;this._smoothTime=n,this._lastAudioElTime=n}),this.audio.addEventListener("pause",()=>{this.isPlaying=!1}),this.audio.addEventListener("ended",()=>{this.isPlaying=!1});try{this.sourceNode=this.audioContext.createMediaElementSource(this.audio)}catch(n){console.error("Error creating MediaElementSource:",n)}this.analyser=this.audioContext.createAnalyser(),this.analyser.fftSize=this.fftSize,this.analyser.smoothingTimeConstant=.08,this.gainNode=this.audioContext.createGain(),this.gainNode.gain.value=.85,this.sourceNode&&(this.sourceNode.connect(this.analyser),this.analyser.connect(this.gainNode),this.gainNode.connect(this.audioContext.destination));const e=async()=>{if(this.audioContext&&this.audioContext.state==="suspended")try{await this.audioContext.resume()}catch{}window.removeEventListener("click",e),window.removeEventListener("keydown",e),window.removeEventListener("pointerdown",e)};window.addEventListener("click",e),window.addEventListener("keydown",e),window.addEventListener("pointerdown",e),this.isInitialized=!0}_ensureWorker(){return!this._dspWorker&&typeof Worker<"u"&&(this._dspWorker=new Worker(new URL(""+new URL("dspWorker-BNsMMsh8.js",import.meta.url).href,import.meta.url),{type:"module"}),this._dspWorker.onerror=t=>{console.warn("[AudioEngine] DSP Worker error, keeping real-time fallback:",t),this.kickDetector.setAnalysisStatus("fallback")}),this._dspWorker}async _analyzeTrackBuffer(t,e){try{if(e!==this._analysisJobId)return;const n=window.OfflineAudioContext||window.webkitOfflineAudioContext,i=n?new n(1,1,44100):this.audioContext;if(!i)throw new Error("No AudioContext available for decodeAudioData");const r=await i.decodeAudioData(t);if(e!==this._analysisJobId)return;const a=r.length,o=r.numberOfChannels,c=new Float32Array(a);if(o===1)c.set(r.getChannelData(0));else{const l=1/o;for(let h=0;h<o;h++){const u=r.getChannelData(h);for(let f=0;f<a;f++)c[f]+=u[f]*l}}this._lastDecodedMono={mono:c,sampleRate:r.sampleRate},this._dispatchWorkerAnalysis(e,{overrideBpm:null},!0)}catch(n){e===this._analysisJobId&&(console.warn("[AudioEngine] Offline DSP decode failed, using real-time fallback:",n),this.kickDetector.setAnalysisStatus("fallback"))}}_dispatchWorkerAnalysis(t,e={},n=!0){if(!this._lastDecodedMono)return;const i=this._ensureWorker();if(!i){this.kickDetector.setAnalysisStatus("fallback");return}const{mono:r,sampleRate:a}=this._lastDecodedMono,o=new Float32Array(r),c=l=>{const h=l.data;if(!(!h||h.id!==t)&&(i.removeEventListener("message",c),t===this._analysisJobId))if(h.ok&&h.analysis){this.kickDetector.setAnalysis(h.analysis,{applyAutoZones:n});const u=h.analysis;console.log(`[AudioEngine] DSP Analysis Complete: ${u.bpm.toFixed(2)} BPM, ${u.kicks.length} kicks (${u.stats.beatKicks} beat, ${u.stats.rollKicks} roll), ${u.autoZones.length} auto-zones (${u.stats.analysisTimeMs}ms)`)}else console.warn("[AudioEngine] DSP Worker reported failure:",h.error),this.kickDetector.setAnalysisStatus("fallback")};i.addEventListener("message",c),i.postMessage({id:t,monoSamples:o,sampleRate:a,options:e},[o.buffer])}reanalyzeWithBpm(t=null){if(!this._lastDecodedMono)return!1;const e=++this._analysisJobId;this.kickDetector.setAnalysisStatus("analyzing");const n=this.kickDetector.kickZones.length===0;return this._dispatchWorkerAnalysis(e,{overrideBpm:t},n),!0}async loadTrack(t){this.isInitialized||await this.init(),t||(t="./detonated.mp3"),this.currentObjectURL&&(URL.revokeObjectURL(this.currentObjectURL),this.currentObjectURL=null);const e=++this._analysisJobId;this.kickDetector.reset(),this.machineDirector.reset(),this.kickDetector.setAnalysisStatus("analyzing"),this._lastDecodedMono=null,this._lastAudioElTime=0,this._smoothTime=0;let n="";if(typeof t=="string"){let i=t.trim();i.startsWith("public/")&&(i=`./${i.slice(7)}`);const r=i.split("/");this.currentTrackName=decodeURIComponent(r[r.length-1].replace(/\.[^/.]+$/,""));try{const a=await fetch(i);if(!a.ok)throw new Error(`HTTP ${a.status} fetching ${i}`);const o=await a.arrayBuffer();if(e!==this._analysisJobId)return!1;const c=a.headers.get("content-type")||"audio/mpeg",l=new Blob([o],{type:c});this.currentObjectURL=URL.createObjectURL(l),n=this.currentObjectURL,this._analyzeTrackBuffer(o.slice(0),e)}catch(a){console.warn("[AudioEngine] Single-fetch fallback to direct URL:",a),n=i,this.kickDetector.setAnalysisStatus("fallback")}}else(t instanceof Blob||t instanceof File)&&(this.currentObjectURL=URL.createObjectURL(t),n=this.currentObjectURL,this.currentTrackName=t.name?t.name.replace(/\.[^/.]+$/,""):"Custom Track",t.arrayBuffer().then(i=>this._analyzeTrackBuffer(i,e)).catch(()=>{e===this._analysisJobId&&this.kickDetector.setAnalysisStatus("fallback")}));return this.audio.src=n,this.audio.load(),this.hasLoadedTrack=!0,new Promise(i=>{const r=()=>{c(),i(!0)},a=l=>{c(),console.warn(`Could not load audio track "${n}".`,l),i(!1)},o=setTimeout(()=>{c(),i(!0)},4e3),c=()=>{clearTimeout(o),this.audio.removeEventListener("canplay",r),this.audio.removeEventListener("loadeddata",r),this.audio.removeEventListener("error",a)};this.audio.addEventListener("canplay",r,{once:!0}),this.audio.addEventListener("loadeddata",r,{once:!0}),this.audio.addEventListener("error",a,{once:!0})})}async play(){if(this.isInitialized||await this.init(),this.audioContext&&this.audioContext.state==="suspended"&&await this.audioContext.resume(),this.audio)try{await this.audio.play(),this.isPlaying=!0}catch(t){console.warn("Playback prevented by browser autoplay policy until user gesture:",t)}}pause(){this.audio&&(this.audio.pause(),this.isPlaying=!1)}async togglePlay(){this.isPlaying?this.pause():await this.play()}setVolume(t){const e=Math.max(0,Math.min(1,Number(t)||0));this.gainNode&&this.gainNode.gain.setTargetAtTime(e,this.audioContext?this.audioContext.currentTime:0,.02),this.audio&&(this.audio.volume=e)}setSensitivity(t){this.kickDetector.setSensitivity(t)}seek(t){if(this.audio&&Number.isFinite(t)){const e=Math.max(0,Math.min(this.audio.duration||0,t));this.audio.currentTime=e,this._smoothTime=e,this._lastAudioElTime=e,this.kickDetector.onSeek(e)}}setActiveMachine(t,e=!0){this.machineDirector.setActiveMachine(t,e)}setBpm(t){this.kickDetector.setBpm(t)}setRefractoryMs(t){this.kickDetector.setRefractoryMs(t)}setIncludeRolls(t){this.kickDetector.setIncludeRolls(t)}setSyncMode(t){this.kickDetector.setSyncMode(t)}setLatencyOffsetMs(t){this.kickDetector.setLatencyOffsetMs(t)}setKickZones(t){this.kickDetector.setKickZones(t)}resetZonesToAuto(){this.kickDetector.resetZonesToAuto()}addKickZone(t,e,n=0,i=null){return this.kickDetector.addKickZone(t,e,n,i)}removeKickZone(t){this.kickDetector.removeKickZone(t)}toggleKickZone(t,e=null){this.kickDetector.toggleKickZone(t,e)}getKickZones(){return this.kickDetector.kickZones}setAutoSwitch(t){this.machineDirector.setAutoSwitch(t)}update(){const t=performance.now(),e=Math.max(.001,Math.min(.1,(t-this.lastFrameTime)/1e3));this.lastFrameTime=t;const n=this.audioContext&&this.audioContext.sampleRate?this.audioContext.sampleRate:44100,i=this.audio&&this.audio.currentTime||0,r=this.audio&&this.audio.duration||0;if(this.analyser&&this.isPlaying){this.analyser.getByteFrequencyData(this.frequencyData),this.analyser.getByteTimeDomainData(this.timeData);const a=this.frequencyData.length,o=n*.5/a,c=Math.min(a-1,Math.ceil(250/o)),l=Math.min(a-1,Math.ceil(2500/o)),h=Math.min(a-1,Math.ceil(16e3/o));let u=0;for(let P=1;P<=c;P++)u+=this.frequencyData[P];const f=c>0?u/c/255:0;let p=0,g=0;for(let P=c+1;P<=l;P++)p+=this.frequencyData[P],g++;const v=g>0?p/g/255:0;let m=0,d=0;for(let P=l+1;P<=h;P++)m+=this.frequencyData[P],d++;const b=d>0?m/d/255:0,w=(P,A,C=18)=>{const D=Math.min(1,e*C);return P+(A-P)*D};this.bassEnergy=w(this.bassEnergy,f,24),this.midEnergy=w(this.midEnergy,v,16),this.trebleEnergy=w(this.trebleEnergy,b,16),Math.abs(i-this._lastAudioElTime)>5e-4||i<this._lastAudioElTime-.1?(this._smoothTime=i,this._lastAudioElTime=i):this._smoothTime=Math.min(i+.045,this._smoothTime+e);const _=this.kickDetector.update(this.frequencyData,n,this._smoothTime);_.activeZone&&typeof _.activeZone.machineIndex=="number"&&this.machineDirector.autoSwitch&&this.machineDirector.activeIndex!==_.activeZone.machineIndex&&this.machineDirector.setActiveMachine(_.activeZone.machineIndex,!0),_.kick&&this.machineDirector.onKick(_.kickIntensity,_.isDrop,_.inZone),this.machineDirector.update(e),this.cachedState={..._,activeMachineIndex:this.machineDirector.activeMachineIndex,machineName:this.machineDirector.activeMachineName,transitionProgress:this.machineDirector.getTransitionProgress(),bassEnergy:this.bassEnergy,midEnergy:this.midEnergy,trebleEnergy:this.trebleEnergy,frequencyData:this.frequencyData,timeData:this.timeData,isPlaying:this.isPlaying,currentTime:i,duration:r,trackName:this.currentTrackName}}else{this._smoothTime=i,this._lastAudioElTime=i,this.bassEnergy*=Math.max(0,1-e*5),this.midEnergy*=Math.max(0,1-e*5),this.trebleEnergy*=Math.max(0,1-e*5),this.machineDirector.update(e);const a=this.kickDetector._getState(),o=this.kickDetector.isInsideKickZone(i);this.cachedState={...a,kick:!1,kickIntensity:0,isDrop:!1,dropIntensity:0,activeZone:o,inZone:o!==null,activeMachineIndex:this.machineDirector.activeMachineIndex,machineName:this.machineDirector.activeMachineName,transitionProgress:this.machineDirector.getTransitionProgress(),bassEnergy:this.bassEnergy,midEnergy:this.midEnergy,trebleEnergy:this.trebleEnergy,frequencyData:this.frequencyData,timeData:this.timeData,isPlaying:!1,currentTime:i,duration:r,trackName:this.currentTrackName}}return this.cachedState}getState(){return this.cachedState}_createDefaultState(){return{...this.kickDetector._getState(),kick:!1,kickIntensity:0,isDrop:!1,dropIntensity:0,activeMachineIndex:0,machineName:Fe[0].name,transitionProgress:1,bassEnergy:0,midEnergy:0,trebleEnergy:0,frequencyData:this.frequencyData,timeData:this.timeData,isPlaying:!1,currentTime:0,duration:0,trackName:this.currentTrackName}}getAudioElement(){return this.audio}getKickDetector(){return this.kickDetector}getMachineDirector(){return this.machineDirector}}/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Zr="170",Sc=0,xa=1,yc=2,Kr=1,bc=2,ln=3,En=0,Pe=1,Ne=2,dn=0,On=1,oi=2,Ma=3,Sa=4,wc=5,kn=100,Ec=101,Tc=102,Ac=103,Cc=104,Rc=200,Pc=201,Ic=202,Dc=203,cr=204,lr=205,Lc=206,Uc=207,Fc=208,kc=209,Nc=210,Bc=211,Oc=212,zc=213,Gc=214,hr=0,ur=1,dr=2,ci=3,fr=4,pr=5,mr=6,gr=7,Ao=0,Hc=1,Vc=2,wn=0,Co=1,Ro=2,Po=3,$r=4,Wc=5,Io=6,Do=7,Lo=300,li=301,hi=302,vr=303,_r=304,ws=306,te=1e3,Bn=1001,xr=1002,Ke=1003,Xc=1004,Hi=1005,Te=1006,Ds=1007,Qe=1008,pn=1009,Uo=1010,Fo=1011,Fi=1012,jr=1013,zn=1014,hn=1015,tn=1016,Jr=1017,Qr=1018,ui=1020,ko=35902,No=1021,Bo=1022,Ge=1023,Oo=1024,zo=1025,ri=1026,di=1027,Go=1028,ta=1029,Ho=1030,ea=1031,na=1033,ms=33776,gs=33777,vs=33778,_s=33779,Mr=35840,Sr=35841,yr=35842,br=35843,wr=36196,Er=37492,Tr=37496,Ar=37808,Cr=37809,Rr=37810,Pr=37811,Ir=37812,Dr=37813,Lr=37814,Ur=37815,Fr=37816,kr=37817,Nr=37818,Br=37819,Or=37820,zr=37821,xs=36492,Gr=36494,Hr=36495,Vo=36283,Vr=36284,Wr=36285,Xr=36286,Yc=3200,qc=3201,Wo=0,Zc=1,bn="",ke="srgb",vi="srgb-linear",Es="linear",Jt="srgb",Vn=7680,ya=519,Kc=512,$c=513,jc=514,Xo=515,Jc=516,Qc=517,tl=518,el=519,ba=35044,Vi=35048,wa="300 es",un=2e3,Ss=2001;class _i{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const i=this._listeners[t];if(i!==void 0){const r=i.indexOf(e);r!==-1&&i.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const i=n.slice(0);for(let r=0,a=i.length;r<a;r++)i[r].call(this,t);t.target=null}}}const Me=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Ea=1234567;const Di=Math.PI/180,fi=180/Math.PI;function xi(){const s=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Me[s&255]+Me[s>>8&255]+Me[s>>16&255]+Me[s>>24&255]+"-"+Me[t&255]+Me[t>>8&255]+"-"+Me[t>>16&15|64]+Me[t>>24&255]+"-"+Me[e&63|128]+Me[e>>8&255]+"-"+Me[e>>16&255]+Me[e>>24&255]+Me[n&255]+Me[n>>8&255]+Me[n>>16&255]+Me[n>>24&255]).toLowerCase()}function Ee(s,t,e){return Math.max(t,Math.min(e,s))}function ia(s,t){return(s%t+t)%t}function nl(s,t,e,n,i){return n+(s-t)*(i-n)/(e-t)}function il(s,t,e){return s!==t?(e-s)/(t-s):0}function Li(s,t,e){return(1-e)*s+e*t}function sl(s,t,e,n){return Li(s,t,1-Math.exp(-e*n))}function rl(s,t=1){return t-Math.abs(ia(s,t*2)-t)}function al(s,t,e){return s<=t?0:s>=e?1:(s=(s-t)/(e-t),s*s*(3-2*s))}function ol(s,t,e){return s<=t?0:s>=e?1:(s=(s-t)/(e-t),s*s*s*(s*(s*6-15)+10))}function cl(s,t){return s+Math.floor(Math.random()*(t-s+1))}function ll(s,t){return s+Math.random()*(t-s)}function hl(s){return s*(.5-Math.random())}function ul(s){s!==void 0&&(Ea=s);let t=Ea+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function dl(s){return s*Di}function fl(s){return s*fi}function pl(s){return(s&s-1)===0&&s!==0}function ml(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function gl(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function vl(s,t,e,n,i){const r=Math.cos,a=Math.sin,o=r(e/2),c=a(e/2),l=r((t+n)/2),h=a((t+n)/2),u=r((t-n)/2),f=a((t-n)/2),p=r((n-t)/2),g=a((n-t)/2);switch(i){case"XYX":s.set(o*h,c*u,c*f,o*l);break;case"YZY":s.set(c*f,o*h,c*u,o*l);break;case"ZXZ":s.set(c*u,c*f,o*h,o*l);break;case"XZX":s.set(o*h,c*g,c*p,o*l);break;case"YXY":s.set(c*p,o*h,c*g,o*l);break;case"ZYZ":s.set(c*g,c*p,o*h,o*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function ii(s,t){switch(t.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function be(s,t){switch(t.constructor){case Float32Array:return s;case Uint32Array:return Math.round(s*4294967295);case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int32Array:return Math.round(s*2147483647);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("Invalid component type.")}}const Ui={DEG2RAD:Di,RAD2DEG:fi,generateUUID:xi,clamp:Ee,euclideanModulo:ia,mapLinear:nl,inverseLerp:il,lerp:Li,damp:sl,pingpong:rl,smoothstep:al,smootherstep:ol,randInt:cl,randFloat:ll,randFloatSpread:hl,seededRandom:ul,degToRad:dl,radToDeg:fl,isPowerOfTwo:pl,ceilPowerOfTwo:ml,floorPowerOfTwo:gl,setQuaternionFromProperEuler:vl,normalize:be,denormalize:ii};class Rt{constructor(t=0,e=0){Rt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Ee(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),i=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*i+t.x,this.y=r*i+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class kt{constructor(t,e,n,i,r,a,o,c,l){kt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,r,a,o,c,l)}set(t,e,n,i,r,a,o,c,l){const h=this.elements;return h[0]=t,h[1]=i,h[2]=o,h[3]=e,h[4]=r,h[5]=c,h[6]=n,h[7]=a,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,r=this.elements,a=n[0],o=n[3],c=n[6],l=n[1],h=n[4],u=n[7],f=n[2],p=n[5],g=n[8],v=i[0],m=i[3],d=i[6],b=i[1],w=i[4],_=i[7],P=i[2],A=i[5],C=i[8];return r[0]=a*v+o*b+c*P,r[3]=a*m+o*w+c*A,r[6]=a*d+o*_+c*C,r[1]=l*v+h*b+u*P,r[4]=l*m+h*w+u*A,r[7]=l*d+h*_+u*C,r[2]=f*v+p*b+g*P,r[5]=f*m+p*w+g*A,r[8]=f*d+p*_+g*C,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],h=t[8];return e*a*h-e*o*l-n*r*h+n*o*c+i*r*l-i*a*c}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],h=t[8],u=h*a-o*l,f=o*c-h*r,p=l*r-a*c,g=e*u+n*f+i*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/g;return t[0]=u*v,t[1]=(i*l-h*n)*v,t[2]=(o*n-i*a)*v,t[3]=f*v,t[4]=(h*e-i*c)*v,t[5]=(i*r-o*e)*v,t[6]=p*v,t[7]=(n*c-l*e)*v,t[8]=(a*e-n*r)*v,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,r,a,o){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*a+l*o)+a+t,-i*l,i*c,-i*(-l*a+c*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(Ls.makeScale(t,e)),this}rotate(t){return this.premultiply(Ls.makeRotation(-t)),this}translate(t,e){return this.premultiply(Ls.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Ls=new kt;function Yo(s){for(let t=s.length-1;t>=0;--t)if(s[t]>=65535)return!0;return!1}function ys(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function _l(){const s=ys("canvas");return s.style.display="block",s}const Ta={};function Pi(s){s in Ta||(Ta[s]=!0,console.warn(s))}function xl(s,t,e){return new Promise(function(n,i){function r(){switch(s.clientWaitSync(t,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:i();break;case s.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function Ml(s){const t=s.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Sl(s){const t=s.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const Yt={enabled:!0,workingColorSpace:vi,spaces:{},convert:function(s,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===Jt&&(s.r=fn(s.r),s.g=fn(s.g),s.b=fn(s.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(s.applyMatrix3(this.spaces[t].toXYZ),s.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===Jt&&(s.r=ai(s.r),s.g=ai(s.g),s.b=ai(s.b))),s},fromWorkingColorSpace:function(s,t){return this.convert(s,this.workingColorSpace,t)},toWorkingColorSpace:function(s,t){return this.convert(s,t,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===bn?Es:this.spaces[s].transfer},getLuminanceCoefficients:function(s,t=this.workingColorSpace){return s.fromArray(this.spaces[t].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,t,e){return s.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}};function fn(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function ai(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}const Aa=[.64,.33,.3,.6,.15,.06],Ca=[.2126,.7152,.0722],Ra=[.3127,.329],Pa=new kt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Ia=new kt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Yt.define({[vi]:{primaries:Aa,whitePoint:Ra,transfer:Es,toXYZ:Pa,fromXYZ:Ia,luminanceCoefficients:Ca,workingColorSpaceConfig:{unpackColorSpace:ke},outputColorSpaceConfig:{drawingBufferColorSpace:ke}},[ke]:{primaries:Aa,whitePoint:Ra,transfer:Jt,toXYZ:Pa,fromXYZ:Ia,luminanceCoefficients:Ca,outputColorSpaceConfig:{drawingBufferColorSpace:ke}}});let Wn;class yl{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Wn===void 0&&(Wn=ys("canvas")),Wn.width=t.width,Wn.height=t.height;const n=Wn.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=Wn}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=ys("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const i=n.getImageData(0,0,t.width,t.height),r=i.data;for(let a=0;a<r.length;a++)r[a]=fn(r[a]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(fn(e[n]/255)*255):e[n]=fn(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let bl=0;class qo{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:bl++}),this.uuid=xi(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?r.push(Us(i[a].image)):r.push(Us(i[a]))}else r=Us(i);n.url=r}return e||(t.images[this.uuid]=n),n}}function Us(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?yl.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let wl=0;class Ae extends _i{constructor(t=Ae.DEFAULT_IMAGE,e=Ae.DEFAULT_MAPPING,n=Bn,i=Bn,r=Te,a=Qe,o=Ge,c=pn,l=Ae.DEFAULT_ANISOTROPY,h=bn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:wl++}),this.uuid=xi(),this.name="",this.source=new qo(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new Rt(0,0),this.repeat=new Rt(1,1),this.center=new Rt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new kt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Lo)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case te:t.x=t.x-Math.floor(t.x);break;case Bn:t.x=t.x<0?0:1;break;case xr:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case te:t.y=t.y-Math.floor(t.y);break;case Bn:t.y=t.y<0?0:1;break;case xr:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Ae.DEFAULT_IMAGE=null;Ae.DEFAULT_MAPPING=Lo;Ae.DEFAULT_ANISOTROPY=1;class Qt{constructor(t=0,e=0,n=0,i=1){Qt.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*i+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*i+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*i+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*i+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,r;const c=t.elements,l=c[0],h=c[4],u=c[8],f=c[1],p=c[5],g=c[9],v=c[2],m=c[6],d=c[10];if(Math.abs(h-f)<.01&&Math.abs(u-v)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+f)<.1&&Math.abs(u+v)<.1&&Math.abs(g+m)<.1&&Math.abs(l+p+d-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const w=(l+1)/2,_=(p+1)/2,P=(d+1)/2,A=(h+f)/4,C=(u+v)/4,D=(g+m)/4;return w>_&&w>P?w<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(w),i=A/n,r=C/n):_>P?_<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(_),n=A/i,r=D/i):P<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(P),n=C/r,i=D/r),this.set(n,i,r,e),this}let b=Math.sqrt((m-g)*(m-g)+(u-v)*(u-v)+(f-h)*(f-h));return Math.abs(b)<.001&&(b=1),this.x=(m-g)/b,this.y=(u-v)/b,this.z=(f-h)/b,this.w=Math.acos((l+p+d-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class El extends _i{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new Qt(0,0,t,e),this.scissorTest=!1,this.viewport=new Qt(0,0,t,e);const i={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Te,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const r=new Ae(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)this.textures[i].image.width=t,this.textures[i].image.height=e,this.textures[i].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new qo(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class He extends El{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Zo extends Ae{constructor(t=null,e=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=Ke,this.minFilter=Ke,this.wrapR=Bn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Tl extends Ae{constructor(t=null,e=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=Ke,this.minFilter=Ke,this.wrapR=Bn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Ni{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,r,a,o){let c=n[i+0],l=n[i+1],h=n[i+2],u=n[i+3];const f=r[a+0],p=r[a+1],g=r[a+2],v=r[a+3];if(o===0){t[e+0]=c,t[e+1]=l,t[e+2]=h,t[e+3]=u;return}if(o===1){t[e+0]=f,t[e+1]=p,t[e+2]=g,t[e+3]=v;return}if(u!==v||c!==f||l!==p||h!==g){let m=1-o;const d=c*f+l*p+h*g+u*v,b=d>=0?1:-1,w=1-d*d;if(w>Number.EPSILON){const P=Math.sqrt(w),A=Math.atan2(P,d*b);m=Math.sin(m*A)/P,o=Math.sin(o*A)/P}const _=o*b;if(c=c*m+f*_,l=l*m+p*_,h=h*m+g*_,u=u*m+v*_,m===1-o){const P=1/Math.sqrt(c*c+l*l+h*h+u*u);c*=P,l*=P,h*=P,u*=P}}t[e]=c,t[e+1]=l,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,i,r,a){const o=n[i],c=n[i+1],l=n[i+2],h=n[i+3],u=r[a],f=r[a+1],p=r[a+2],g=r[a+3];return t[e]=o*g+h*u+c*p-l*f,t[e+1]=c*g+h*f+l*u-o*p,t[e+2]=l*g+h*p+o*f-c*u,t[e+3]=h*g-o*u-c*f-l*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,i=t._y,r=t._z,a=t._order,o=Math.cos,c=Math.sin,l=o(n/2),h=o(i/2),u=o(r/2),f=c(n/2),p=c(i/2),g=c(r/2);switch(a){case"XYZ":this._x=f*h*u+l*p*g,this._y=l*p*u-f*h*g,this._z=l*h*g+f*p*u,this._w=l*h*u-f*p*g;break;case"YXZ":this._x=f*h*u+l*p*g,this._y=l*p*u-f*h*g,this._z=l*h*g-f*p*u,this._w=l*h*u+f*p*g;break;case"ZXY":this._x=f*h*u-l*p*g,this._y=l*p*u+f*h*g,this._z=l*h*g+f*p*u,this._w=l*h*u-f*p*g;break;case"ZYX":this._x=f*h*u-l*p*g,this._y=l*p*u+f*h*g,this._z=l*h*g-f*p*u,this._w=l*h*u+f*p*g;break;case"YZX":this._x=f*h*u+l*p*g,this._y=l*p*u+f*h*g,this._z=l*h*g-f*p*u,this._w=l*h*u-f*p*g;break;case"XZY":this._x=f*h*u-l*p*g,this._y=l*p*u-f*h*g,this._z=l*h*g+f*p*u,this._w=l*h*u+f*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],i=e[4],r=e[8],a=e[1],o=e[5],c=e[9],l=e[2],h=e[6],u=e[10],f=n+o+u;if(f>0){const p=.5/Math.sqrt(f+1);this._w=.25/p,this._x=(h-c)*p,this._y=(r-l)*p,this._z=(a-i)*p}else if(n>o&&n>u){const p=2*Math.sqrt(1+n-o-u);this._w=(h-c)/p,this._x=.25*p,this._y=(i+a)/p,this._z=(r+l)/p}else if(o>u){const p=2*Math.sqrt(1+o-n-u);this._w=(r-l)/p,this._x=(i+a)/p,this._y=.25*p,this._z=(c+h)/p}else{const p=2*Math.sqrt(1+u-n-o);this._w=(a-i)/p,this._x=(r+l)/p,this._y=(c+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Ee(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,i=t._y,r=t._z,a=t._w,o=e._x,c=e._y,l=e._z,h=e._w;return this._x=n*h+a*o+i*l-r*c,this._y=i*h+a*c+r*o-n*l,this._z=r*h+a*l+n*c-i*o,this._w=a*h-n*o-i*c-r*l,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,i=this._y,r=this._z,a=this._w;let o=a*t._w+n*t._x+i*t._y+r*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=a,this._x=n,this._y=i,this._z=r,this;const c=1-o*o;if(c<=Number.EPSILON){const p=1-e;return this._w=p*a+e*this._w,this._x=p*n+e*this._x,this._y=p*i+e*this._y,this._z=p*r+e*this._z,this.normalize(),this}const l=Math.sqrt(c),h=Math.atan2(l,o),u=Math.sin((1-e)*h)/l,f=Math.sin(e*h)/l;return this._w=a*u+this._w*f,this._x=n*u+this._x*f,this._y=i*u+this._y*f,this._z=r*u+this._z*f,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class E{constructor(t=0,e=0,n=0){E.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Da.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Da.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,i=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*i,this.y=r[1]*e+r[4]*n+r[7]*i,this.z=r[2]*e+r[5]*n+r[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*i+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*i+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*i+r[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,i=this.z,r=t.x,a=t.y,o=t.z,c=t.w,l=2*(a*i-o*n),h=2*(o*e-r*i),u=2*(r*n-a*e);return this.x=e+c*l+a*u-o*h,this.y=n+c*h+o*l-r*u,this.z=i+c*u+r*h-a*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,i=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*i,this.y=r[1]*e+r[5]*n+r[9]*i,this.z=r[2]*e+r[6]*n+r[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,i=t.y,r=t.z,a=e.x,o=e.y,c=e.z;return this.x=i*c-r*o,this.y=r*a-n*c,this.z=n*o-i*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Fs.copy(this).projectOnVector(t),this.sub(Fs)}reflect(t){return this.sub(Fs.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Ee(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Fs=new E,Da=new Ni;class Bi{constructor(t=new E(1/0,1/0,1/0),e=new E(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Xe.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Xe.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=Xe.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Xe):Xe.fromBufferAttribute(r,a),Xe.applyMatrix4(t.matrixWorld),this.expandByPoint(Xe);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Wi.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Wi.copy(n.boundingBox)),Wi.applyMatrix4(t.matrixWorld),this.union(Wi)}const i=t.children;for(let r=0,a=i.length;r<a;r++)this.expandByObject(i[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Xe),Xe.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Ei),Xi.subVectors(this.max,Ei),Xn.subVectors(t.a,Ei),Yn.subVectors(t.b,Ei),qn.subVectors(t.c,Ei),vn.subVectors(Yn,Xn),_n.subVectors(qn,Yn),Cn.subVectors(Xn,qn);let e=[0,-vn.z,vn.y,0,-_n.z,_n.y,0,-Cn.z,Cn.y,vn.z,0,-vn.x,_n.z,0,-_n.x,Cn.z,0,-Cn.x,-vn.y,vn.x,0,-_n.y,_n.x,0,-Cn.y,Cn.x,0];return!ks(e,Xn,Yn,qn,Xi)||(e=[1,0,0,0,1,0,0,0,1],!ks(e,Xn,Yn,qn,Xi))?!1:(Yi.crossVectors(vn,_n),e=[Yi.x,Yi.y,Yi.z],ks(e,Xn,Yn,qn,Xi))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Xe).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Xe).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(sn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),sn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),sn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),sn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),sn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),sn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),sn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),sn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(sn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const sn=[new E,new E,new E,new E,new E,new E,new E,new E],Xe=new E,Wi=new Bi,Xn=new E,Yn=new E,qn=new E,vn=new E,_n=new E,Cn=new E,Ei=new E,Xi=new E,Yi=new E,Rn=new E;function ks(s,t,e,n,i){for(let r=0,a=s.length-3;r<=a;r+=3){Rn.fromArray(s,r);const o=i.x*Math.abs(Rn.x)+i.y*Math.abs(Rn.y)+i.z*Math.abs(Rn.z),c=t.dot(Rn),l=e.dot(Rn),h=n.dot(Rn);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>o)return!1}return!0}const Al=new Bi,Ti=new E,Ns=new E;class Ts{constructor(t=new E,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Al.setFromPoints(t).getCenter(n);let i=0;for(let r=0,a=t.length;r<a;r++)i=Math.max(i,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Ti.subVectors(t,this.center);const e=Ti.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(Ti,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Ns.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Ti.copy(t.center).add(Ns)),this.expandByPoint(Ti.copy(t.center).sub(Ns))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const rn=new E,Bs=new E,qi=new E,xn=new E,Os=new E,Zi=new E,zs=new E;class Ko{constructor(t=new E,e=new E(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,rn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=rn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(rn.copy(this.origin).addScaledVector(this.direction,e),rn.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){Bs.copy(t).add(e).multiplyScalar(.5),qi.copy(e).sub(t).normalize(),xn.copy(this.origin).sub(Bs);const r=t.distanceTo(e)*.5,a=-this.direction.dot(qi),o=xn.dot(this.direction),c=-xn.dot(qi),l=xn.lengthSq(),h=Math.abs(1-a*a);let u,f,p,g;if(h>0)if(u=a*c-o,f=a*o-c,g=r*h,u>=0)if(f>=-g)if(f<=g){const v=1/h;u*=v,f*=v,p=u*(u+a*f+2*o)+f*(a*u+f+2*c)+l}else f=r,u=Math.max(0,-(a*f+o)),p=-u*u+f*(f+2*c)+l;else f=-r,u=Math.max(0,-(a*f+o)),p=-u*u+f*(f+2*c)+l;else f<=-g?(u=Math.max(0,-(-a*r+o)),f=u>0?-r:Math.min(Math.max(-r,-c),r),p=-u*u+f*(f+2*c)+l):f<=g?(u=0,f=Math.min(Math.max(-r,-c),r),p=f*(f+2*c)+l):(u=Math.max(0,-(a*r+o)),f=u>0?r:Math.min(Math.max(-r,-c),r),p=-u*u+f*(f+2*c)+l);else f=a>0?-r:r,u=Math.max(0,-(a*f+o)),p=-u*u+f*(f+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(Bs).addScaledVector(qi,f),p}intersectSphere(t,e){rn.subVectors(t.center,this.origin);const n=rn.dot(this.direction),i=rn.dot(rn)-n*n,r=t.radius*t.radius;if(i>r)return null;const a=Math.sqrt(r-i),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,r,a,o,c;const l=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,f=this.origin;return l>=0?(n=(t.min.x-f.x)*l,i=(t.max.x-f.x)*l):(n=(t.max.x-f.x)*l,i=(t.min.x-f.x)*l),h>=0?(r=(t.min.y-f.y)*h,a=(t.max.y-f.y)*h):(r=(t.max.y-f.y)*h,a=(t.min.y-f.y)*h),n>a||r>i||((r>n||isNaN(n))&&(n=r),(a<i||isNaN(i))&&(i=a),u>=0?(o=(t.min.z-f.z)*u,c=(t.max.z-f.z)*u):(o=(t.max.z-f.z)*u,c=(t.min.z-f.z)*u),n>c||o>i)||((o>n||n!==n)&&(n=o),(c<i||i!==i)&&(i=c),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,rn)!==null}intersectTriangle(t,e,n,i,r){Os.subVectors(e,t),Zi.subVectors(n,t),zs.crossVectors(Os,Zi);let a=this.direction.dot(zs),o;if(a>0){if(i)return null;o=1}else if(a<0)o=-1,a=-a;else return null;xn.subVectors(this.origin,t);const c=o*this.direction.dot(Zi.crossVectors(xn,Zi));if(c<0)return null;const l=o*this.direction.dot(Os.cross(xn));if(l<0||c+l>a)return null;const h=-o*xn.dot(zs);return h<0?null:this.at(h/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class ce{constructor(t,e,n,i,r,a,o,c,l,h,u,f,p,g,v,m){ce.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,r,a,o,c,l,h,u,f,p,g,v,m)}set(t,e,n,i,r,a,o,c,l,h,u,f,p,g,v,m){const d=this.elements;return d[0]=t,d[4]=e,d[8]=n,d[12]=i,d[1]=r,d[5]=a,d[9]=o,d[13]=c,d[2]=l,d[6]=h,d[10]=u,d[14]=f,d[3]=p,d[7]=g,d[11]=v,d[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ce().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,i=1/Zn.setFromMatrixColumn(t,0).length(),r=1/Zn.setFromMatrixColumn(t,1).length(),a=1/Zn.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,i=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(i),l=Math.sin(i),h=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){const f=a*h,p=a*u,g=o*h,v=o*u;e[0]=c*h,e[4]=-c*u,e[8]=l,e[1]=p+g*l,e[5]=f-v*l,e[9]=-o*c,e[2]=v-f*l,e[6]=g+p*l,e[10]=a*c}else if(t.order==="YXZ"){const f=c*h,p=c*u,g=l*h,v=l*u;e[0]=f+v*o,e[4]=g*o-p,e[8]=a*l,e[1]=a*u,e[5]=a*h,e[9]=-o,e[2]=p*o-g,e[6]=v+f*o,e[10]=a*c}else if(t.order==="ZXY"){const f=c*h,p=c*u,g=l*h,v=l*u;e[0]=f-v*o,e[4]=-a*u,e[8]=g+p*o,e[1]=p+g*o,e[5]=a*h,e[9]=v-f*o,e[2]=-a*l,e[6]=o,e[10]=a*c}else if(t.order==="ZYX"){const f=a*h,p=a*u,g=o*h,v=o*u;e[0]=c*h,e[4]=g*l-p,e[8]=f*l+v,e[1]=c*u,e[5]=v*l+f,e[9]=p*l-g,e[2]=-l,e[6]=o*c,e[10]=a*c}else if(t.order==="YZX"){const f=a*c,p=a*l,g=o*c,v=o*l;e[0]=c*h,e[4]=v-f*u,e[8]=g*u+p,e[1]=u,e[5]=a*h,e[9]=-o*h,e[2]=-l*h,e[6]=p*u+g,e[10]=f-v*u}else if(t.order==="XZY"){const f=a*c,p=a*l,g=o*c,v=o*l;e[0]=c*h,e[4]=-u,e[8]=l*h,e[1]=f*u+v,e[5]=a*h,e[9]=p*u-g,e[2]=g*u-p,e[6]=o*h,e[10]=v*u+f}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Cl,t,Rl)}lookAt(t,e,n){const i=this.elements;return Le.subVectors(t,e),Le.lengthSq()===0&&(Le.z=1),Le.normalize(),Mn.crossVectors(n,Le),Mn.lengthSq()===0&&(Math.abs(n.z)===1?Le.x+=1e-4:Le.z+=1e-4,Le.normalize(),Mn.crossVectors(n,Le)),Mn.normalize(),Ki.crossVectors(Le,Mn),i[0]=Mn.x,i[4]=Ki.x,i[8]=Le.x,i[1]=Mn.y,i[5]=Ki.y,i[9]=Le.y,i[2]=Mn.z,i[6]=Ki.z,i[10]=Le.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,r=this.elements,a=n[0],o=n[4],c=n[8],l=n[12],h=n[1],u=n[5],f=n[9],p=n[13],g=n[2],v=n[6],m=n[10],d=n[14],b=n[3],w=n[7],_=n[11],P=n[15],A=i[0],C=i[4],D=i[8],S=i[12],x=i[1],R=i[5],O=i[9],N=i[13],G=i[2],q=i[6],W=i[10],K=i[14],z=i[3],Q=i[7],nt=i[11],ot=i[15];return r[0]=a*A+o*x+c*G+l*z,r[4]=a*C+o*R+c*q+l*Q,r[8]=a*D+o*O+c*W+l*nt,r[12]=a*S+o*N+c*K+l*ot,r[1]=h*A+u*x+f*G+p*z,r[5]=h*C+u*R+f*q+p*Q,r[9]=h*D+u*O+f*W+p*nt,r[13]=h*S+u*N+f*K+p*ot,r[2]=g*A+v*x+m*G+d*z,r[6]=g*C+v*R+m*q+d*Q,r[10]=g*D+v*O+m*W+d*nt,r[14]=g*S+v*N+m*K+d*ot,r[3]=b*A+w*x+_*G+P*z,r[7]=b*C+w*R+_*q+P*Q,r[11]=b*D+w*O+_*W+P*nt,r[15]=b*S+w*N+_*K+P*ot,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],i=t[8],r=t[12],a=t[1],o=t[5],c=t[9],l=t[13],h=t[2],u=t[6],f=t[10],p=t[14],g=t[3],v=t[7],m=t[11],d=t[15];return g*(+r*c*u-i*l*u-r*o*f+n*l*f+i*o*p-n*c*p)+v*(+e*c*p-e*l*f+r*a*f-i*a*p+i*l*h-r*c*h)+m*(+e*l*u-e*o*p-r*a*u+n*a*p+r*o*h-n*l*h)+d*(-i*o*h-e*c*u+e*o*f+i*a*u-n*a*f+n*c*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],h=t[8],u=t[9],f=t[10],p=t[11],g=t[12],v=t[13],m=t[14],d=t[15],b=u*m*l-v*f*l+v*c*p-o*m*p-u*c*d+o*f*d,w=g*f*l-h*m*l-g*c*p+a*m*p+h*c*d-a*f*d,_=h*v*l-g*u*l+g*o*p-a*v*p-h*o*d+a*u*d,P=g*u*c-h*v*c-g*o*f+a*v*f+h*o*m-a*u*m,A=e*b+n*w+i*_+r*P;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const C=1/A;return t[0]=b*C,t[1]=(v*f*r-u*m*r-v*i*p+n*m*p+u*i*d-n*f*d)*C,t[2]=(o*m*r-v*c*r+v*i*l-n*m*l-o*i*d+n*c*d)*C,t[3]=(u*c*r-o*f*r-u*i*l+n*f*l+o*i*p-n*c*p)*C,t[4]=w*C,t[5]=(h*m*r-g*f*r+g*i*p-e*m*p-h*i*d+e*f*d)*C,t[6]=(g*c*r-a*m*r-g*i*l+e*m*l+a*i*d-e*c*d)*C,t[7]=(a*f*r-h*c*r+h*i*l-e*f*l-a*i*p+e*c*p)*C,t[8]=_*C,t[9]=(g*u*r-h*v*r-g*n*p+e*v*p+h*n*d-e*u*d)*C,t[10]=(a*v*r-g*o*r+g*n*l-e*v*l-a*n*d+e*o*d)*C,t[11]=(h*o*r-a*u*r-h*n*l+e*u*l+a*n*p-e*o*p)*C,t[12]=P*C,t[13]=(h*v*i-g*u*i+g*n*f-e*v*f-h*n*m+e*u*m)*C,t[14]=(g*o*i-a*v*i-g*n*c+e*v*c+a*n*m-e*o*m)*C,t[15]=(a*u*i-h*o*i+h*n*c-e*u*c-a*n*f+e*o*f)*C,this}scale(t){const e=this.elements,n=t.x,i=t.y,r=t.z;return e[0]*=n,e[4]*=i,e[8]*=r,e[1]*=n,e[5]*=i,e[9]*=r,e[2]*=n,e[6]*=i,e[10]*=r,e[3]*=n,e[7]*=i,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),i=Math.sin(e),r=1-n,a=t.x,o=t.y,c=t.z,l=r*a,h=r*o;return this.set(l*a+n,l*o-i*c,l*c+i*o,0,l*o+i*c,h*o+n,h*c-i*a,0,l*c-i*o,h*c+i*a,r*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,r,a){return this.set(1,n,r,0,t,1,a,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){const i=this.elements,r=e._x,a=e._y,o=e._z,c=e._w,l=r+r,h=a+a,u=o+o,f=r*l,p=r*h,g=r*u,v=a*h,m=a*u,d=o*u,b=c*l,w=c*h,_=c*u,P=n.x,A=n.y,C=n.z;return i[0]=(1-(v+d))*P,i[1]=(p+_)*P,i[2]=(g-w)*P,i[3]=0,i[4]=(p-_)*A,i[5]=(1-(f+d))*A,i[6]=(m+b)*A,i[7]=0,i[8]=(g+w)*C,i[9]=(m-b)*C,i[10]=(1-(f+v))*C,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){const i=this.elements;let r=Zn.set(i[0],i[1],i[2]).length();const a=Zn.set(i[4],i[5],i[6]).length(),o=Zn.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),t.x=i[12],t.y=i[13],t.z=i[14],Ye.copy(this);const l=1/r,h=1/a,u=1/o;return Ye.elements[0]*=l,Ye.elements[1]*=l,Ye.elements[2]*=l,Ye.elements[4]*=h,Ye.elements[5]*=h,Ye.elements[6]*=h,Ye.elements[8]*=u,Ye.elements[9]*=u,Ye.elements[10]*=u,e.setFromRotationMatrix(Ye),n.x=r,n.y=a,n.z=o,this}makePerspective(t,e,n,i,r,a,o=un){const c=this.elements,l=2*r/(e-t),h=2*r/(n-i),u=(e+t)/(e-t),f=(n+i)/(n-i);let p,g;if(o===un)p=-(a+r)/(a-r),g=-2*a*r/(a-r);else if(o===Ss)p=-a/(a-r),g=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=l,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=h,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=g,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,i,r,a,o=un){const c=this.elements,l=1/(e-t),h=1/(n-i),u=1/(a-r),f=(e+t)*l,p=(n+i)*h;let g,v;if(o===un)g=(a+r)*u,v=-2*u;else if(o===Ss)g=r*u,v=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=2*l,c[4]=0,c[8]=0,c[12]=-f,c[1]=0,c[5]=2*h,c[9]=0,c[13]=-p,c[2]=0,c[6]=0,c[10]=v,c[14]=-g,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Zn=new E,Ye=new ce,Cl=new E(0,0,0),Rl=new E(1,1,1),Mn=new E,Ki=new E,Le=new E,La=new ce,Ua=new Ni;class $e{constructor(t=0,e=0,n=0,i=$e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const i=t.elements,r=i[0],a=i[4],o=i[8],c=i[1],l=i[5],h=i[9],u=i[2],f=i[6],p=i[10];switch(e){case"XYZ":this._y=Math.asin(Ee(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(f,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Ee(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ee(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Ee(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,p),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(Ee(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Ee(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,l),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return La.makeRotationFromQuaternion(t),this.setFromRotationMatrix(La,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Ua.setFromEuler(this),this.setFromQuaternion(Ua,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}$e.DEFAULT_ORDER="XYZ";class $o{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Pl=0;const Fa=new E,Kn=new Ni,an=new ce,$i=new E,Ai=new E,Il=new E,Dl=new Ni,ka=new E(1,0,0),Na=new E(0,1,0),Ba=new E(0,0,1),Oa={type:"added"},Ll={type:"removed"},$n={type:"childadded",child:null},Gs={type:"childremoved",child:null};class de extends _i{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Pl++}),this.uuid=xi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=de.DEFAULT_UP.clone();const t=new E,e=new $e,n=new Ni,i=new E(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new ce},normalMatrix:{value:new kt}}),this.matrix=new ce,this.matrixWorld=new ce,this.matrixAutoUpdate=de.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=de.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new $o,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Kn.setFromAxisAngle(t,e),this.quaternion.multiply(Kn),this}rotateOnWorldAxis(t,e){return Kn.setFromAxisAngle(t,e),this.quaternion.premultiply(Kn),this}rotateX(t){return this.rotateOnAxis(ka,t)}rotateY(t){return this.rotateOnAxis(Na,t)}rotateZ(t){return this.rotateOnAxis(Ba,t)}translateOnAxis(t,e){return Fa.copy(t).applyQuaternion(this.quaternion),this.position.add(Fa.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(ka,t)}translateY(t){return this.translateOnAxis(Na,t)}translateZ(t){return this.translateOnAxis(Ba,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(an.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?$i.copy(t):$i.set(t,e,n);const i=this.parent;this.updateWorldMatrix(!0,!1),Ai.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?an.lookAt(Ai,$i,this.up):an.lookAt($i,Ai,this.up),this.quaternion.setFromRotationMatrix(an),i&&(an.extractRotation(i.matrixWorld),Kn.setFromRotationMatrix(an),this.quaternion.premultiply(Kn.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Oa),$n.child=t,this.dispatchEvent($n),$n.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Ll),Gs.child=t,this.dispatchEvent(Gs),Gs.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),an.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),an.multiply(t.parent.matrixWorld)),t.applyMatrix4(an),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Oa),$n.child=t,this.dispatchEvent($n),$n.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ai,t,Il),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ai,Dl,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.visibility=this._visibility,i.active=this._active,i.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.geometryCount=this._geometryCount,i.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere={center:i.boundingSphere.center.toArray(),radius:i.boundingSphere.radius}),this.boundingBox!==null&&(i.boundingBox={min:i.boundingBox.min.toArray(),max:i.boundingBox.max.toArray()}));function r(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){const u=c[l];r(t.shapes,u)}else r(t.shapes,c)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(r(t.materials,this.material[c]));i.material=o}else i.material=r(t.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];i.animations.push(r(t.animations,c))}}if(e){const o=a(t.geometries),c=a(t.materials),l=a(t.textures),h=a(t.images),u=a(t.shapes),f=a(t.skeletons),p=a(t.animations),g=a(t.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),f.length>0&&(n.skeletons=f),p.length>0&&(n.animations=p),g.length>0&&(n.nodes=g)}return n.object=i,n;function a(o){const c=[];for(const l in o){const h=o[l];delete h.metadata,c.push(h)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const i=t.children[n];this.add(i.clone())}return this}}de.DEFAULT_UP=new E(0,1,0);de.DEFAULT_MATRIX_AUTO_UPDATE=!0;de.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const qe=new E,on=new E,Hs=new E,cn=new E,jn=new E,Jn=new E,za=new E,Vs=new E,Ws=new E,Xs=new E,Ys=new Qt,qs=new Qt,Zs=new Qt;class Ze{constructor(t=new E,e=new E,n=new E){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),qe.subVectors(t,e),i.cross(qe);const r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(t,e,n,i,r){qe.subVectors(i,e),on.subVectors(n,e),Hs.subVectors(t,e);const a=qe.dot(qe),o=qe.dot(on),c=qe.dot(Hs),l=on.dot(on),h=on.dot(Hs),u=a*l-o*o;if(u===0)return r.set(0,0,0),null;const f=1/u,p=(l*c-o*h)*f,g=(a*h-o*c)*f;return r.set(1-p-g,g,p)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,cn)===null?!1:cn.x>=0&&cn.y>=0&&cn.x+cn.y<=1}static getInterpolation(t,e,n,i,r,a,o,c){return this.getBarycoord(t,e,n,i,cn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,cn.x),c.addScaledVector(a,cn.y),c.addScaledVector(o,cn.z),c)}static getInterpolatedAttribute(t,e,n,i,r,a){return Ys.setScalar(0),qs.setScalar(0),Zs.setScalar(0),Ys.fromBufferAttribute(t,e),qs.fromBufferAttribute(t,n),Zs.fromBufferAttribute(t,i),a.setScalar(0),a.addScaledVector(Ys,r.x),a.addScaledVector(qs,r.y),a.addScaledVector(Zs,r.z),a}static isFrontFacing(t,e,n,i){return qe.subVectors(n,e),on.subVectors(t,e),qe.cross(on).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return qe.subVectors(this.c,this.b),on.subVectors(this.a,this.b),qe.cross(on).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return Ze.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return Ze.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,r){return Ze.getInterpolation(t,this.a,this.b,this.c,e,n,i,r)}containsPoint(t){return Ze.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return Ze.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,i=this.b,r=this.c;let a,o;jn.subVectors(i,n),Jn.subVectors(r,n),Vs.subVectors(t,n);const c=jn.dot(Vs),l=Jn.dot(Vs);if(c<=0&&l<=0)return e.copy(n);Ws.subVectors(t,i);const h=jn.dot(Ws),u=Jn.dot(Ws);if(h>=0&&u<=h)return e.copy(i);const f=c*u-h*l;if(f<=0&&c>=0&&h<=0)return a=c/(c-h),e.copy(n).addScaledVector(jn,a);Xs.subVectors(t,r);const p=jn.dot(Xs),g=Jn.dot(Xs);if(g>=0&&p<=g)return e.copy(r);const v=p*l-c*g;if(v<=0&&l>=0&&g<=0)return o=l/(l-g),e.copy(n).addScaledVector(Jn,o);const m=h*g-p*u;if(m<=0&&u-h>=0&&p-g>=0)return za.subVectors(r,i),o=(u-h)/(u-h+(p-g)),e.copy(i).addScaledVector(za,o);const d=1/(m+v+f);return a=v*d,o=f*d,e.copy(n).addScaledVector(jn,a).addScaledVector(Jn,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const jo={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Sn={h:0,s:0,l:0},ji={h:0,s:0,l:0};function Ks(s,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?s+(t-s)*6*e:e<1/2?t:e<2/3?s+(t-s)*6*(2/3-e):s}class Ht{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=ke){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Yt.toWorkingColorSpace(this,e),this}setRGB(t,e,n,i=Yt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Yt.toWorkingColorSpace(this,i),this}setHSL(t,e,n,i=Yt.workingColorSpace){if(t=ia(t,1),e=Ee(e,0,1),n=Ee(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=Ks(a,r,t+1/3),this.g=Ks(a,r,t),this.b=Ks(a,r,t-1/3)}return Yt.toWorkingColorSpace(this,i),this}setStyle(t,e=ke){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=i[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=ke){const n=jo[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=fn(t.r),this.g=fn(t.g),this.b=fn(t.b),this}copyLinearToSRGB(t){return this.r=ai(t.r),this.g=ai(t.g),this.b=ai(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=ke){return Yt.fromWorkingColorSpace(Se.copy(this),t),Math.round(Ee(Se.r*255,0,255))*65536+Math.round(Ee(Se.g*255,0,255))*256+Math.round(Ee(Se.b*255,0,255))}getHexString(t=ke){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Yt.workingColorSpace){Yt.fromWorkingColorSpace(Se.copy(this),e);const n=Se.r,i=Se.g,r=Se.b,a=Math.max(n,i,r),o=Math.min(n,i,r);let c,l;const h=(o+a)/2;if(o===a)c=0,l=0;else{const u=a-o;switch(l=h<=.5?u/(a+o):u/(2-a-o),a){case n:c=(i-r)/u+(i<r?6:0);break;case i:c=(r-n)/u+2;break;case r:c=(n-i)/u+4;break}c/=6}return t.h=c,t.s=l,t.l=h,t}getRGB(t,e=Yt.workingColorSpace){return Yt.fromWorkingColorSpace(Se.copy(this),e),t.r=Se.r,t.g=Se.g,t.b=Se.b,t}getStyle(t=ke){Yt.fromWorkingColorSpace(Se.copy(this),t);const e=Se.r,n=Se.g,i=Se.b;return t!==ke?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(Sn),this.setHSL(Sn.h+t,Sn.s+e,Sn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Sn),t.getHSL(ji);const n=Li(Sn.h,ji.h,e),i=Li(Sn.s,ji.s,e),r=Li(Sn.l,ji.l,e);return this.setHSL(n,i,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,i=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*i,this.g=r[1]*e+r[4]*n+r[7]*i,this.b=r[2]*e+r[5]*n+r[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Se=new Ht;Ht.NAMES=jo;let Ul=0;class Mi extends _i{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ul++}),this.uuid=xi(),this.name="",this.blending=On,this.side=En,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=cr,this.blendDst=lr,this.blendEquation=kn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ht(0,0,0),this.blendAlpha=0,this.depthFunc=ci,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=ya,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Vn,this.stencilZFail=Vn,this.stencilZPass=Vn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const i=this[e];if(i===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==On&&(n.blending=this.blending),this.side!==En&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==cr&&(n.blendSrc=this.blendSrc),this.blendDst!==lr&&(n.blendDst=this.blendDst),this.blendEquation!==kn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==ci&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==ya&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Vn&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Vn&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Vn&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){const a=[];for(const o in r){const c=r[o];delete c.metadata,a.push(c)}return a}if(e){const r=i(t.textures),a=i(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const i=e.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class Tn extends Mi{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new Ht(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new $e,this.combine=Ao,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const fe=new E,Ji=new Rt;class ve{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=ba,this.updateRanges=[],this.gpuType=hn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Ji.fromBufferAttribute(this,e),Ji.applyMatrix3(t),this.setXY(e,Ji.x,Ji.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.applyMatrix3(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.applyMatrix4(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.applyNormalMatrix(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.transformDirection(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=ii(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=be(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=ii(e,this.array)),e}setX(t,e){return this.normalized&&(e=be(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=ii(e,this.array)),e}setY(t,e){return this.normalized&&(e=be(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=ii(e,this.array)),e}setZ(t,e){return this.normalized&&(e=be(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=ii(e,this.array)),e}setW(t,e){return this.normalized&&(e=be(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=be(e,this.array),n=be(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=be(e,this.array),n=be(n,this.array),i=be(i,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,r){return t*=this.itemSize,this.normalized&&(e=be(e,this.array),n=be(n,this.array),i=be(i,this.array),r=be(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==ba&&(t.usage=this.usage),t}}class Jo extends ve{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Qo extends ve{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class le extends ve{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Fl=0;const Oe=new ce,$s=new de,Qn=new E,Ue=new Bi,Ci=new Bi,ge=new E;class _e extends _i{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Fl++}),this.uuid=xi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Yo(t)?Qo:Jo)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new kt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return Oe.makeRotationFromQuaternion(t),this.applyMatrix4(Oe),this}rotateX(t){return Oe.makeRotationX(t),this.applyMatrix4(Oe),this}rotateY(t){return Oe.makeRotationY(t),this.applyMatrix4(Oe),this}rotateZ(t){return Oe.makeRotationZ(t),this.applyMatrix4(Oe),this}translate(t,e,n){return Oe.makeTranslation(t,e,n),this.applyMatrix4(Oe),this}scale(t,e,n){return Oe.makeScale(t,e,n),this.applyMatrix4(Oe),this}lookAt(t){return $s.lookAt(t),$s.updateMatrix(),this.applyMatrix4($s.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Qn).negate(),this.translate(Qn.x,Qn.y,Qn.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let i=0,r=t.length;i<r;i++){const a=t[i];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new le(n,3))}else{for(let n=0,i=e.count;n<i;n++){const r=t[n];e.setXYZ(n,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Bi);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new E(-1/0,-1/0,-1/0),new E(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){const r=e[n];Ue.setFromBufferAttribute(r),this.morphTargetsRelative?(ge.addVectors(this.boundingBox.min,Ue.min),this.boundingBox.expandByPoint(ge),ge.addVectors(this.boundingBox.max,Ue.max),this.boundingBox.expandByPoint(ge)):(this.boundingBox.expandByPoint(Ue.min),this.boundingBox.expandByPoint(Ue.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ts);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new E,1/0);return}if(t){const n=this.boundingSphere.center;if(Ue.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){const o=e[r];Ci.setFromBufferAttribute(o),this.morphTargetsRelative?(ge.addVectors(Ue.min,Ci.min),Ue.expandByPoint(ge),ge.addVectors(Ue.max,Ci.max),Ue.expandByPoint(ge)):(Ue.expandByPoint(Ci.min),Ue.expandByPoint(Ci.max))}Ue.getCenter(n);let i=0;for(let r=0,a=t.count;r<a;r++)ge.fromBufferAttribute(t,r),i=Math.max(i,n.distanceToSquared(ge));if(e)for(let r=0,a=e.length;r<a;r++){const o=e[r],c=this.morphTargetsRelative;for(let l=0,h=o.count;l<h;l++)ge.fromBufferAttribute(o,l),c&&(Qn.fromBufferAttribute(t,l),ge.add(Qn)),i=Math.max(i,n.distanceToSquared(ge))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,i=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new ve(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],c=[];for(let D=0;D<n.count;D++)o[D]=new E,c[D]=new E;const l=new E,h=new E,u=new E,f=new Rt,p=new Rt,g=new Rt,v=new E,m=new E;function d(D,S,x){l.fromBufferAttribute(n,D),h.fromBufferAttribute(n,S),u.fromBufferAttribute(n,x),f.fromBufferAttribute(r,D),p.fromBufferAttribute(r,S),g.fromBufferAttribute(r,x),h.sub(l),u.sub(l),p.sub(f),g.sub(f);const R=1/(p.x*g.y-g.x*p.y);isFinite(R)&&(v.copy(h).multiplyScalar(g.y).addScaledVector(u,-p.y).multiplyScalar(R),m.copy(u).multiplyScalar(p.x).addScaledVector(h,-g.x).multiplyScalar(R),o[D].add(v),o[S].add(v),o[x].add(v),c[D].add(m),c[S].add(m),c[x].add(m))}let b=this.groups;b.length===0&&(b=[{start:0,count:t.count}]);for(let D=0,S=b.length;D<S;++D){const x=b[D],R=x.start,O=x.count;for(let N=R,G=R+O;N<G;N+=3)d(t.getX(N+0),t.getX(N+1),t.getX(N+2))}const w=new E,_=new E,P=new E,A=new E;function C(D){P.fromBufferAttribute(i,D),A.copy(P);const S=o[D];w.copy(S),w.sub(P.multiplyScalar(P.dot(S))).normalize(),_.crossVectors(A,S);const R=_.dot(c[D])<0?-1:1;a.setXYZW(D,w.x,w.y,w.z,R)}for(let D=0,S=b.length;D<S;++D){const x=b[D],R=x.start,O=x.count;for(let N=R,G=R+O;N<G;N+=3)C(t.getX(N+0)),C(t.getX(N+1)),C(t.getX(N+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new ve(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let f=0,p=n.count;f<p;f++)n.setXYZ(f,0,0,0);const i=new E,r=new E,a=new E,o=new E,c=new E,l=new E,h=new E,u=new E;if(t)for(let f=0,p=t.count;f<p;f+=3){const g=t.getX(f+0),v=t.getX(f+1),m=t.getX(f+2);i.fromBufferAttribute(e,g),r.fromBufferAttribute(e,v),a.fromBufferAttribute(e,m),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),o.fromBufferAttribute(n,g),c.fromBufferAttribute(n,v),l.fromBufferAttribute(n,m),o.add(h),c.add(h),l.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(v,c.x,c.y,c.z),n.setXYZ(m,l.x,l.y,l.z)}else for(let f=0,p=e.count;f<p;f+=3)i.fromBufferAttribute(e,f+0),r.fromBufferAttribute(e,f+1),a.fromBufferAttribute(e,f+2),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)ge.fromBufferAttribute(t,e),ge.normalize(),t.setXYZ(e,ge.x,ge.y,ge.z)}toNonIndexed(){function t(o,c){const l=o.array,h=o.itemSize,u=o.normalized,f=new l.constructor(c.length*h);let p=0,g=0;for(let v=0,m=c.length;v<m;v++){o.isInterleavedBufferAttribute?p=c[v]*o.data.stride+o.offset:p=c[v]*h;for(let d=0;d<h;d++)f[g++]=l[p++]}return new ve(f,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new _e,n=this.index.array,i=this.attributes;for(const o in i){const c=i[o],l=t(c,n);e.setAttribute(o,l)}const r=this.morphAttributes;for(const o in r){const c=[],l=r[o];for(let h=0,u=l.length;h<u;h++){const f=l[h],p=t(f,n);c.push(p)}e.morphAttributes[o]=c}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,c=a.length;o<c;o++){const l=a[o];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const c in n){const l=n[c];t.data.attributes[c]=l.toJSON(t.data)}const i={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],h=[];for(let u=0,f=l.length;u<f;u++){const p=l[u];h.push(p.toJSON(t.data))}h.length>0&&(i[c]=h,r=!0)}r&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const i=t.attributes;for(const l in i){const h=i[l];this.setAttribute(l,h.clone(e))}const r=t.morphAttributes;for(const l in r){const h=[],u=r[l];for(let f=0,p=u.length;f<p;f++)h.push(u[f].clone(e));this.morphAttributes[l]=h}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let l=0,h=a.length;l<h;l++){const u=a[l];this.addGroup(u.start,u.count,u.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Ga=new ce,Pn=new Ko,Qi=new Ts,Ha=new E,ts=new E,es=new E,ns=new E,js=new E,is=new E,Va=new E,ss=new E;class I extends de{constructor(t=new _e,e=new Tn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){const n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(i,t);const o=this.morphTargetInfluences;if(r&&o){is.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const h=o[c],u=r[c];h!==0&&(js.fromBufferAttribute(u,t),a?is.addScaledVector(js,h):is.addScaledVector(js.sub(e),h))}e.add(is)}return e}raycast(t,e){const n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Qi.copy(n.boundingSphere),Qi.applyMatrix4(r),Pn.copy(t.ray).recast(t.near),!(Qi.containsPoint(Pn.origin)===!1&&(Pn.intersectSphere(Qi,Ha)===null||Pn.origin.distanceToSquared(Ha)>(t.far-t.near)**2))&&(Ga.copy(r).invert(),Pn.copy(t.ray).applyMatrix4(Ga),!(n.boundingBox!==null&&Pn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Pn)))}_computeIntersections(t,e,n){let i;const r=this.geometry,a=this.material,o=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,f=r.groups,p=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,v=f.length;g<v;g++){const m=f[g],d=a[m.materialIndex],b=Math.max(m.start,p.start),w=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let _=b,P=w;_<P;_+=3){const A=o.getX(_),C=o.getX(_+1),D=o.getX(_+2);i=rs(this,d,t,n,l,h,u,A,C,D),i&&(i.faceIndex=Math.floor(_/3),i.face.materialIndex=m.materialIndex,e.push(i))}}else{const g=Math.max(0,p.start),v=Math.min(o.count,p.start+p.count);for(let m=g,d=v;m<d;m+=3){const b=o.getX(m),w=o.getX(m+1),_=o.getX(m+2);i=rs(this,a,t,n,l,h,u,b,w,_),i&&(i.faceIndex=Math.floor(m/3),e.push(i))}}else if(c!==void 0)if(Array.isArray(a))for(let g=0,v=f.length;g<v;g++){const m=f[g],d=a[m.materialIndex],b=Math.max(m.start,p.start),w=Math.min(c.count,Math.min(m.start+m.count,p.start+p.count));for(let _=b,P=w;_<P;_+=3){const A=_,C=_+1,D=_+2;i=rs(this,d,t,n,l,h,u,A,C,D),i&&(i.faceIndex=Math.floor(_/3),i.face.materialIndex=m.materialIndex,e.push(i))}}else{const g=Math.max(0,p.start),v=Math.min(c.count,p.start+p.count);for(let m=g,d=v;m<d;m+=3){const b=m,w=m+1,_=m+2;i=rs(this,a,t,n,l,h,u,b,w,_),i&&(i.faceIndex=Math.floor(m/3),e.push(i))}}}}function kl(s,t,e,n,i,r,a,o){let c;if(t.side===Pe?c=n.intersectTriangle(a,r,i,!0,o):c=n.intersectTriangle(i,r,a,t.side===En,o),c===null)return null;ss.copy(o),ss.applyMatrix4(s.matrixWorld);const l=e.ray.origin.distanceTo(ss);return l<e.near||l>e.far?null:{distance:l,point:ss.clone(),object:s}}function rs(s,t,e,n,i,r,a,o,c,l){s.getVertexPosition(o,ts),s.getVertexPosition(c,es),s.getVertexPosition(l,ns);const h=kl(s,t,e,n,ts,es,ns,Va);if(h){const u=new E;Ze.getBarycoord(Va,ts,es,ns,u),i&&(h.uv=Ze.getInterpolatedAttribute(i,o,c,l,u,new Rt)),r&&(h.uv1=Ze.getInterpolatedAttribute(r,o,c,l,u,new Rt)),a&&(h.normal=Ze.getInterpolatedAttribute(a,o,c,l,u,new E),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const f={a:o,b:c,c:l,normal:new E,materialIndex:0};Ze.getNormal(ts,es,ns,f.normal),h.face=f,h.barycoord=u}return h}class et extends _e{constructor(t=1,e=1,n=1,i=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:r,depthSegments:a};const o=this;i=Math.floor(i),r=Math.floor(r),a=Math.floor(a);const c=[],l=[],h=[],u=[];let f=0,p=0;g("z","y","x",-1,-1,n,e,t,a,r,0),g("z","y","x",1,-1,n,e,-t,a,r,1),g("x","z","y",1,1,t,n,e,i,a,2),g("x","z","y",1,-1,t,n,-e,i,a,3),g("x","y","z",1,-1,t,e,n,i,r,4),g("x","y","z",-1,-1,t,e,-n,i,r,5),this.setIndex(c),this.setAttribute("position",new le(l,3)),this.setAttribute("normal",new le(h,3)),this.setAttribute("uv",new le(u,2));function g(v,m,d,b,w,_,P,A,C,D,S){const x=_/C,R=P/D,O=_/2,N=P/2,G=A/2,q=C+1,W=D+1;let K=0,z=0;const Q=new E;for(let nt=0;nt<W;nt++){const ot=nt*R-N;for(let _t=0;_t<q;_t++){const Lt=_t*x-O;Q[v]=Lt*b,Q[m]=ot*w,Q[d]=G,l.push(Q.x,Q.y,Q.z),Q[v]=0,Q[m]=0,Q[d]=A>0?1:-1,h.push(Q.x,Q.y,Q.z),u.push(_t/C),u.push(1-nt/D),K+=1}}for(let nt=0;nt<D;nt++)for(let ot=0;ot<C;ot++){const _t=f+ot+q*nt,Lt=f+ot+q*(nt+1),X=f+(ot+1)+q*(nt+1),tt=f+(ot+1)+q*nt;c.push(_t,Lt,tt),c.push(Lt,X,tt),z+=6}o.addGroup(p,z,S),p+=z,f+=K}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new et(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function pi(s){const t={};for(const e in s){t[e]={};for(const n in s[e]){const i=s[e][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone():Array.isArray(i)?t[e][n]=i.slice():t[e][n]=i}}return t}function we(s){const t={};for(let e=0;e<s.length;e++){const n=pi(s[e]);for(const i in n)t[i]=n[i]}return t}function Nl(s){const t=[];for(let e=0;e<s.length;e++)t.push(s[e].clone());return t}function tc(s){const t=s.getRenderTarget();return t===null?s.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Yt.workingColorSpace}const ki={clone:pi,merge:we};var Bl=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Ol=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class ye extends Mi{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Bl,this.fragmentShader=Ol,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=pi(t.uniforms),this.uniformsGroups=Nl(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const i in this.uniforms){const a=this.uniforms[i].value;a&&a.isTexture?e.uniforms[i]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[i]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[i]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[i]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[i]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[i]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[i]={type:"m4",value:a.toArray()}:e.uniforms[i]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class ec extends de{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ce,this.projectionMatrix=new ce,this.projectionMatrixInverse=new ce,this.coordinateSystem=un}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const yn=new E,Wa=new Rt,Xa=new Rt;class Re extends ec{constructor(t=50,e=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=fi*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Di*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return fi*2*Math.atan(Math.tan(Di*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){yn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(yn.x,yn.y).multiplyScalar(-t/yn.z),yn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(yn.x,yn.y).multiplyScalar(-t/yn.z)}getViewSize(t,e){return this.getViewBounds(t,Wa,Xa),e.subVectors(Xa,Wa)}setViewOffset(t,e,n,i,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Di*.5*this.fov)/this.zoom,n=2*e,i=this.aspect*n,r=-.5*i;const a=this.view;if(this.view!==null&&this.view.enabled){const c=a.fullWidth,l=a.fullHeight;r+=a.offsetX*i/c,e-=a.offsetY*n/l,i*=a.width/c,n*=a.height/l}const o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const ti=-90,ei=1;class zl extends de{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new Re(ti,ei,t,e);i.layers=this.layers,this.add(i);const r=new Re(ti,ei,t,e);r.layers=this.layers,this.add(r);const a=new Re(ti,ei,t,e);a.layers=this.layers,this.add(a);const o=new Re(ti,ei,t,e);o.layers=this.layers,this.add(o);const c=new Re(ti,ei,t,e);c.layers=this.layers,this.add(c);const l=new Re(ti,ei,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,i,r,a,o,c]=e;for(const l of e)this.remove(l);if(t===un)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===Ss)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,c,l,h]=this.children,u=t.getRenderTarget(),f=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,i),t.render(e,r),t.setRenderTarget(n,1,i),t.render(e,a),t.setRenderTarget(n,2,i),t.render(e,o),t.setRenderTarget(n,3,i),t.render(e,c),t.setRenderTarget(n,4,i),t.render(e,l),n.texture.generateMipmaps=v,t.setRenderTarget(n,5,i),t.render(e,h),t.setRenderTarget(u,f,p),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class nc extends Ae{constructor(t,e,n,i,r,a,o,c,l,h){t=t!==void 0?t:[],e=e!==void 0?e:li,super(t,e,n,i,r,a,o,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Gl extends He{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},i=[n,n,n,n,n,n];this.texture=new nc(i,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Te}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new et(5,5,5),r=new ye({name:"CubemapFromEquirect",uniforms:pi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Pe,blending:dn});r.uniforms.tEquirect.value=e;const a=new I(i,r),o=e.minFilter;return e.minFilter===Qe&&(e.minFilter=Te),new zl(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e,n,i){const r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,i);t.setRenderTarget(r)}}const Js=new E,Hl=new E,Vl=new kt;class Un{constructor(t=new E(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const i=Js.subVectors(n,e).cross(Hl.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(Js),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||Vl.getNormalMatrix(t),i=this.coplanarPoint(Js).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const In=new Ts,as=new E;class sa{constructor(t=new Un,e=new Un,n=new Un,i=new Un,r=new Un,a=new Un){this.planes=[t,e,n,i,r,a]}set(t,e,n,i,r,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(i),o[4].copy(r),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=un){const n=this.planes,i=t.elements,r=i[0],a=i[1],o=i[2],c=i[3],l=i[4],h=i[5],u=i[6],f=i[7],p=i[8],g=i[9],v=i[10],m=i[11],d=i[12],b=i[13],w=i[14],_=i[15];if(n[0].setComponents(c-r,f-l,m-p,_-d).normalize(),n[1].setComponents(c+r,f+l,m+p,_+d).normalize(),n[2].setComponents(c+a,f+h,m+g,_+b).normalize(),n[3].setComponents(c-a,f-h,m-g,_-b).normalize(),n[4].setComponents(c-o,f-u,m-v,_-w).normalize(),e===un)n[5].setComponents(c+o,f+u,m+v,_+w).normalize();else if(e===Ss)n[5].setComponents(o,u,v,w).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),In.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),In.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(In)}intersectsSprite(t){return In.center.set(0,0,0),In.radius=.7071067811865476,In.applyMatrix4(t.matrixWorld),this.intersectsSphere(In)}intersectsSphere(t){const e=this.planes,n=t.center,i=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const i=e[n];if(as.x=i.normal.x>0?t.max.x:t.min.x,as.y=i.normal.y>0?t.max.y:t.min.y,as.z=i.normal.z>0?t.max.z:t.min.z,i.distanceToPoint(as)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function ic(){let s=null,t=!1,e=null,n=null;function i(r,a){e(r,a),n=s.requestAnimationFrame(i)}return{start:function(){t!==!0&&e!==null&&(n=s.requestAnimationFrame(i),t=!0)},stop:function(){s.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){s=r}}}function Wl(s){const t=new WeakMap;function e(o,c){const l=o.array,h=o.usage,u=l.byteLength,f=s.createBuffer();s.bindBuffer(c,f),s.bufferData(c,l,h),o.onUploadCallback();let p;if(l instanceof Float32Array)p=s.FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?p=s.HALF_FLOAT:p=s.UNSIGNED_SHORT;else if(l instanceof Int16Array)p=s.SHORT;else if(l instanceof Uint32Array)p=s.UNSIGNED_INT;else if(l instanceof Int32Array)p=s.INT;else if(l instanceof Int8Array)p=s.BYTE;else if(l instanceof Uint8Array)p=s.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)p=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:f,type:p,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:u}}function n(o,c,l){const h=c.array,u=c.updateRanges;if(s.bindBuffer(l,o),u.length===0)s.bufferSubData(l,0,h);else{u.sort((p,g)=>p.start-g.start);let f=0;for(let p=1;p<u.length;p++){const g=u[f],v=u[p];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++f,u[f]=v)}u.length=f+1;for(let p=0,g=u.length;p<g;p++){const v=u[p];s.bufferSubData(l,v.start*h.BYTES_PER_ELEMENT,h,v.start,v.count)}c.clearUpdateRanges()}c.onUploadCallback()}function i(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const c=t.get(o);c&&(s.deleteBuffer(c.buffer),t.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const l=t.get(o);if(l===void 0)t.set(o,e(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return{get:i,remove:r,update:a}}class ze extends _e{constructor(t=1,e=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:i};const r=t/2,a=e/2,o=Math.floor(n),c=Math.floor(i),l=o+1,h=c+1,u=t/o,f=e/c,p=[],g=[],v=[],m=[];for(let d=0;d<h;d++){const b=d*f-a;for(let w=0;w<l;w++){const _=w*u-r;g.push(_,-b,0),v.push(0,0,1),m.push(w/o),m.push(1-d/c)}}for(let d=0;d<c;d++)for(let b=0;b<o;b++){const w=b+l*d,_=b+l*(d+1),P=b+1+l*(d+1),A=b+1+l*d;p.push(w,_,A),p.push(_,P,A)}this.setIndex(p),this.setAttribute("position",new le(g,3)),this.setAttribute("normal",new le(v,3)),this.setAttribute("uv",new le(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ze(t.width,t.height,t.widthSegments,t.heightSegments)}}var Xl=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Yl=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,ql=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Zl=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Kl=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,$l=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,jl=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Jl=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Ql=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,th=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,eh=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,nh=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,ih=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,sh=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,rh=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,ah=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,oh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,ch=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,lh=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,hh=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,uh=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,dh=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,fh=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,ph=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,mh=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,gh=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,vh=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,_h=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,xh=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Mh=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Sh="gl_FragColor = linearToOutputTexel( gl_FragColor );",yh=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,bh=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,wh=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Eh=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Th=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Ah=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Ch=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Rh=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Ph=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Ih=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Dh=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Lh=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Uh=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Fh=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,kh=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Nh=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Bh=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Oh=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,zh=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Gh=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Hh=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Vh=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Wh=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Xh=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Yh=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,qh=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Zh=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Kh=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,$h=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,jh=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Jh=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Qh=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,tu=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,eu=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,nu=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,iu=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,su=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,ru=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,au=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,ou=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,cu=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,lu=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,hu=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,uu=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,du=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,fu=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,pu=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,mu=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,gu=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,vu=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,_u=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,xu=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Mu=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Su=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,yu=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,bu=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,wu=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Eu=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Tu=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Au=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Cu=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Ru=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Pu=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Iu=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Du=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Lu=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Uu=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Fu=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,ku=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Nu=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Bu=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Ou=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,zu=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Gu=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Hu=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Vu=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Wu=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Xu=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Yu=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,qu=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zu=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ku=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,$u=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,ju=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Ju=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Qu=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,td=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,ed=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,nd=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,id=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sd=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,rd=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ad=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,od=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,cd=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,ld=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hd=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,ud=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,dd=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,fd=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pd=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,md=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gd=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,vd=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_d=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,xd=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Md=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Sd=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,yd=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,bd=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ot={alphahash_fragment:Xl,alphahash_pars_fragment:Yl,alphamap_fragment:ql,alphamap_pars_fragment:Zl,alphatest_fragment:Kl,alphatest_pars_fragment:$l,aomap_fragment:jl,aomap_pars_fragment:Jl,batching_pars_vertex:Ql,batching_vertex:th,begin_vertex:eh,beginnormal_vertex:nh,bsdfs:ih,iridescence_fragment:sh,bumpmap_pars_fragment:rh,clipping_planes_fragment:ah,clipping_planes_pars_fragment:oh,clipping_planes_pars_vertex:ch,clipping_planes_vertex:lh,color_fragment:hh,color_pars_fragment:uh,color_pars_vertex:dh,color_vertex:fh,common:ph,cube_uv_reflection_fragment:mh,defaultnormal_vertex:gh,displacementmap_pars_vertex:vh,displacementmap_vertex:_h,emissivemap_fragment:xh,emissivemap_pars_fragment:Mh,colorspace_fragment:Sh,colorspace_pars_fragment:yh,envmap_fragment:bh,envmap_common_pars_fragment:wh,envmap_pars_fragment:Eh,envmap_pars_vertex:Th,envmap_physical_pars_fragment:Nh,envmap_vertex:Ah,fog_vertex:Ch,fog_pars_vertex:Rh,fog_fragment:Ph,fog_pars_fragment:Ih,gradientmap_pars_fragment:Dh,lightmap_pars_fragment:Lh,lights_lambert_fragment:Uh,lights_lambert_pars_fragment:Fh,lights_pars_begin:kh,lights_toon_fragment:Bh,lights_toon_pars_fragment:Oh,lights_phong_fragment:zh,lights_phong_pars_fragment:Gh,lights_physical_fragment:Hh,lights_physical_pars_fragment:Vh,lights_fragment_begin:Wh,lights_fragment_maps:Xh,lights_fragment_end:Yh,logdepthbuf_fragment:qh,logdepthbuf_pars_fragment:Zh,logdepthbuf_pars_vertex:Kh,logdepthbuf_vertex:$h,map_fragment:jh,map_pars_fragment:Jh,map_particle_fragment:Qh,map_particle_pars_fragment:tu,metalnessmap_fragment:eu,metalnessmap_pars_fragment:nu,morphinstance_vertex:iu,morphcolor_vertex:su,morphnormal_vertex:ru,morphtarget_pars_vertex:au,morphtarget_vertex:ou,normal_fragment_begin:cu,normal_fragment_maps:lu,normal_pars_fragment:hu,normal_pars_vertex:uu,normal_vertex:du,normalmap_pars_fragment:fu,clearcoat_normal_fragment_begin:pu,clearcoat_normal_fragment_maps:mu,clearcoat_pars_fragment:gu,iridescence_pars_fragment:vu,opaque_fragment:_u,packing:xu,premultiplied_alpha_fragment:Mu,project_vertex:Su,dithering_fragment:yu,dithering_pars_fragment:bu,roughnessmap_fragment:wu,roughnessmap_pars_fragment:Eu,shadowmap_pars_fragment:Tu,shadowmap_pars_vertex:Au,shadowmap_vertex:Cu,shadowmask_pars_fragment:Ru,skinbase_vertex:Pu,skinning_pars_vertex:Iu,skinning_vertex:Du,skinnormal_vertex:Lu,specularmap_fragment:Uu,specularmap_pars_fragment:Fu,tonemapping_fragment:ku,tonemapping_pars_fragment:Nu,transmission_fragment:Bu,transmission_pars_fragment:Ou,uv_pars_fragment:zu,uv_pars_vertex:Gu,uv_vertex:Hu,worldpos_vertex:Vu,background_vert:Wu,background_frag:Xu,backgroundCube_vert:Yu,backgroundCube_frag:qu,cube_vert:Zu,cube_frag:Ku,depth_vert:$u,depth_frag:ju,distanceRGBA_vert:Ju,distanceRGBA_frag:Qu,equirect_vert:td,equirect_frag:ed,linedashed_vert:nd,linedashed_frag:id,meshbasic_vert:sd,meshbasic_frag:rd,meshlambert_vert:ad,meshlambert_frag:od,meshmatcap_vert:cd,meshmatcap_frag:ld,meshnormal_vert:hd,meshnormal_frag:ud,meshphong_vert:dd,meshphong_frag:fd,meshphysical_vert:pd,meshphysical_frag:md,meshtoon_vert:gd,meshtoon_frag:vd,points_vert:_d,points_frag:xd,shadow_vert:Md,shadow_frag:Sd,sprite_vert:yd,sprite_frag:bd},at={common:{diffuse:{value:new Ht(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new kt},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new kt}},envmap:{envMap:{value:null},envMapRotation:{value:new kt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new kt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new kt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new kt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new kt},normalScale:{value:new Rt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new kt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new kt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new kt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new kt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ht(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ht(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0},uvTransform:{value:new kt}},sprite:{diffuse:{value:new Ht(16777215)},opacity:{value:1},center:{value:new Rt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new kt},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0}}},Je={basic:{uniforms:we([at.common,at.specularmap,at.envmap,at.aomap,at.lightmap,at.fog]),vertexShader:Ot.meshbasic_vert,fragmentShader:Ot.meshbasic_frag},lambert:{uniforms:we([at.common,at.specularmap,at.envmap,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.fog,at.lights,{emissive:{value:new Ht(0)}}]),vertexShader:Ot.meshlambert_vert,fragmentShader:Ot.meshlambert_frag},phong:{uniforms:we([at.common,at.specularmap,at.envmap,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.fog,at.lights,{emissive:{value:new Ht(0)},specular:{value:new Ht(1118481)},shininess:{value:30}}]),vertexShader:Ot.meshphong_vert,fragmentShader:Ot.meshphong_frag},standard:{uniforms:we([at.common,at.envmap,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.roughnessmap,at.metalnessmap,at.fog,at.lights,{emissive:{value:new Ht(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ot.meshphysical_vert,fragmentShader:Ot.meshphysical_frag},toon:{uniforms:we([at.common,at.aomap,at.lightmap,at.emissivemap,at.bumpmap,at.normalmap,at.displacementmap,at.gradientmap,at.fog,at.lights,{emissive:{value:new Ht(0)}}]),vertexShader:Ot.meshtoon_vert,fragmentShader:Ot.meshtoon_frag},matcap:{uniforms:we([at.common,at.bumpmap,at.normalmap,at.displacementmap,at.fog,{matcap:{value:null}}]),vertexShader:Ot.meshmatcap_vert,fragmentShader:Ot.meshmatcap_frag},points:{uniforms:we([at.points,at.fog]),vertexShader:Ot.points_vert,fragmentShader:Ot.points_frag},dashed:{uniforms:we([at.common,at.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ot.linedashed_vert,fragmentShader:Ot.linedashed_frag},depth:{uniforms:we([at.common,at.displacementmap]),vertexShader:Ot.depth_vert,fragmentShader:Ot.depth_frag},normal:{uniforms:we([at.common,at.bumpmap,at.normalmap,at.displacementmap,{opacity:{value:1}}]),vertexShader:Ot.meshnormal_vert,fragmentShader:Ot.meshnormal_frag},sprite:{uniforms:we([at.sprite,at.fog]),vertexShader:Ot.sprite_vert,fragmentShader:Ot.sprite_frag},background:{uniforms:{uvTransform:{value:new kt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ot.background_vert,fragmentShader:Ot.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new kt}},vertexShader:Ot.backgroundCube_vert,fragmentShader:Ot.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ot.cube_vert,fragmentShader:Ot.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ot.equirect_vert,fragmentShader:Ot.equirect_frag},distanceRGBA:{uniforms:we([at.common,at.displacementmap,{referencePosition:{value:new E},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ot.distanceRGBA_vert,fragmentShader:Ot.distanceRGBA_frag},shadow:{uniforms:we([at.lights,at.fog,{color:{value:new Ht(0)},opacity:{value:1}}]),vertexShader:Ot.shadow_vert,fragmentShader:Ot.shadow_frag}};Je.physical={uniforms:we([Je.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new kt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new kt},clearcoatNormalScale:{value:new Rt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new kt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new kt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new kt},sheen:{value:0},sheenColor:{value:new Ht(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new kt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new kt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new kt},transmissionSamplerSize:{value:new Rt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new kt},attenuationDistance:{value:0},attenuationColor:{value:new Ht(0)},specularColor:{value:new Ht(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new kt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new kt},anisotropyVector:{value:new Rt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new kt}}]),vertexShader:Ot.meshphysical_vert,fragmentShader:Ot.meshphysical_frag};const os={r:0,b:0,g:0},Dn=new $e,wd=new ce;function Ed(s,t,e,n,i,r,a){const o=new Ht(0);let c=r===!0?0:1,l,h,u=null,f=0,p=null;function g(b){let w=b.isScene===!0?b.background:null;return w&&w.isTexture&&(w=(b.backgroundBlurriness>0?e:t).get(w)),w}function v(b){let w=!1;const _=g(b);_===null?d(o,c):_&&_.isColor&&(d(_,1),w=!0);const P=s.xr.getEnvironmentBlendMode();P==="additive"?n.buffers.color.setClear(0,0,0,1,a):P==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(s.autoClear||w)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function m(b,w){const _=g(w);_&&(_.isCubeTexture||_.mapping===ws)?(h===void 0&&(h=new I(new et(1,1,1),new ye({name:"BackgroundCubeMaterial",uniforms:pi(Je.backgroundCube.uniforms),vertexShader:Je.backgroundCube.vertexShader,fragmentShader:Je.backgroundCube.fragmentShader,side:Pe,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(P,A,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(h)),Dn.copy(w.backgroundRotation),Dn.x*=-1,Dn.y*=-1,Dn.z*=-1,_.isCubeTexture&&_.isRenderTargetTexture===!1&&(Dn.y*=-1,Dn.z*=-1),h.material.uniforms.envMap.value=_,h.material.uniforms.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(wd.makeRotationFromEuler(Dn)),h.material.toneMapped=Yt.getTransfer(_.colorSpace)!==Jt,(u!==_||f!==_.version||p!==s.toneMapping)&&(h.material.needsUpdate=!0,u=_,f=_.version,p=s.toneMapping),h.layers.enableAll(),b.unshift(h,h.geometry,h.material,0,0,null)):_&&_.isTexture&&(l===void 0&&(l=new I(new ze(2,2),new ye({name:"BackgroundMaterial",uniforms:pi(Je.background.uniforms),vertexShader:Je.background.vertexShader,fragmentShader:Je.background.fragmentShader,side:En,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=_,l.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,l.material.toneMapped=Yt.getTransfer(_.colorSpace)!==Jt,_.matrixAutoUpdate===!0&&_.updateMatrix(),l.material.uniforms.uvTransform.value.copy(_.matrix),(u!==_||f!==_.version||p!==s.toneMapping)&&(l.material.needsUpdate=!0,u=_,f=_.version,p=s.toneMapping),l.layers.enableAll(),b.unshift(l,l.geometry,l.material,0,0,null))}function d(b,w){b.getRGB(os,tc(s)),n.buffers.color.setClear(os.r,os.g,os.b,w,a)}return{getClearColor:function(){return o},setClearColor:function(b,w=1){o.set(b),c=w,d(o,c)},getClearAlpha:function(){return c},setClearAlpha:function(b){c=b,d(o,c)},render:v,addToRenderList:m}}function Td(s,t){const e=s.getParameter(s.MAX_VERTEX_ATTRIBS),n={},i=f(null);let r=i,a=!1;function o(x,R,O,N,G){let q=!1;const W=u(N,O,R);r!==W&&(r=W,l(r.object)),q=p(x,N,O,G),q&&g(x,N,O,G),G!==null&&t.update(G,s.ELEMENT_ARRAY_BUFFER),(q||a)&&(a=!1,_(x,R,O,N),G!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,t.get(G).buffer))}function c(){return s.createVertexArray()}function l(x){return s.bindVertexArray(x)}function h(x){return s.deleteVertexArray(x)}function u(x,R,O){const N=O.wireframe===!0;let G=n[x.id];G===void 0&&(G={},n[x.id]=G);let q=G[R.id];q===void 0&&(q={},G[R.id]=q);let W=q[N];return W===void 0&&(W=f(c()),q[N]=W),W}function f(x){const R=[],O=[],N=[];for(let G=0;G<e;G++)R[G]=0,O[G]=0,N[G]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:R,enabledAttributes:O,attributeDivisors:N,object:x,attributes:{},index:null}}function p(x,R,O,N){const G=r.attributes,q=R.attributes;let W=0;const K=O.getAttributes();for(const z in K)if(K[z].location>=0){const nt=G[z];let ot=q[z];if(ot===void 0&&(z==="instanceMatrix"&&x.instanceMatrix&&(ot=x.instanceMatrix),z==="instanceColor"&&x.instanceColor&&(ot=x.instanceColor)),nt===void 0||nt.attribute!==ot||ot&&nt.data!==ot.data)return!0;W++}return r.attributesNum!==W||r.index!==N}function g(x,R,O,N){const G={},q=R.attributes;let W=0;const K=O.getAttributes();for(const z in K)if(K[z].location>=0){let nt=q[z];nt===void 0&&(z==="instanceMatrix"&&x.instanceMatrix&&(nt=x.instanceMatrix),z==="instanceColor"&&x.instanceColor&&(nt=x.instanceColor));const ot={};ot.attribute=nt,nt&&nt.data&&(ot.data=nt.data),G[z]=ot,W++}r.attributes=G,r.attributesNum=W,r.index=N}function v(){const x=r.newAttributes;for(let R=0,O=x.length;R<O;R++)x[R]=0}function m(x){d(x,0)}function d(x,R){const O=r.newAttributes,N=r.enabledAttributes,G=r.attributeDivisors;O[x]=1,N[x]===0&&(s.enableVertexAttribArray(x),N[x]=1),G[x]!==R&&(s.vertexAttribDivisor(x,R),G[x]=R)}function b(){const x=r.newAttributes,R=r.enabledAttributes;for(let O=0,N=R.length;O<N;O++)R[O]!==x[O]&&(s.disableVertexAttribArray(O),R[O]=0)}function w(x,R,O,N,G,q,W){W===!0?s.vertexAttribIPointer(x,R,O,G,q):s.vertexAttribPointer(x,R,O,N,G,q)}function _(x,R,O,N){v();const G=N.attributes,q=O.getAttributes(),W=R.defaultAttributeValues;for(const K in q){const z=q[K];if(z.location>=0){let Q=G[K];if(Q===void 0&&(K==="instanceMatrix"&&x.instanceMatrix&&(Q=x.instanceMatrix),K==="instanceColor"&&x.instanceColor&&(Q=x.instanceColor)),Q!==void 0){const nt=Q.normalized,ot=Q.itemSize,_t=t.get(Q);if(_t===void 0)continue;const Lt=_t.buffer,X=_t.type,tt=_t.bytesPerElement,ut=X===s.INT||X===s.UNSIGNED_INT||Q.gpuType===jr;if(Q.isInterleavedBufferAttribute){const rt=Q.data,yt=rt.stride,Pt=Q.offset;if(rt.isInstancedInterleavedBuffer){for(let Nt=0;Nt<z.locationSize;Nt++)d(z.location+Nt,rt.meshPerAttribute);x.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=rt.meshPerAttribute*rt.count)}else for(let Nt=0;Nt<z.locationSize;Nt++)m(z.location+Nt);s.bindBuffer(s.ARRAY_BUFFER,Lt);for(let Nt=0;Nt<z.locationSize;Nt++)w(z.location+Nt,ot/z.locationSize,X,nt,yt*tt,(Pt+ot/z.locationSize*Nt)*tt,ut)}else{if(Q.isInstancedBufferAttribute){for(let rt=0;rt<z.locationSize;rt++)d(z.location+rt,Q.meshPerAttribute);x.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let rt=0;rt<z.locationSize;rt++)m(z.location+rt);s.bindBuffer(s.ARRAY_BUFFER,Lt);for(let rt=0;rt<z.locationSize;rt++)w(z.location+rt,ot/z.locationSize,X,nt,ot*tt,ot/z.locationSize*rt*tt,ut)}}else if(W!==void 0){const nt=W[K];if(nt!==void 0)switch(nt.length){case 2:s.vertexAttrib2fv(z.location,nt);break;case 3:s.vertexAttrib3fv(z.location,nt);break;case 4:s.vertexAttrib4fv(z.location,nt);break;default:s.vertexAttrib1fv(z.location,nt)}}}}b()}function P(){D();for(const x in n){const R=n[x];for(const O in R){const N=R[O];for(const G in N)h(N[G].object),delete N[G];delete R[O]}delete n[x]}}function A(x){if(n[x.id]===void 0)return;const R=n[x.id];for(const O in R){const N=R[O];for(const G in N)h(N[G].object),delete N[G];delete R[O]}delete n[x.id]}function C(x){for(const R in n){const O=n[R];if(O[x.id]===void 0)continue;const N=O[x.id];for(const G in N)h(N[G].object),delete N[G];delete O[x.id]}}function D(){S(),a=!0,r!==i&&(r=i,l(r.object))}function S(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:o,reset:D,resetDefaultState:S,dispose:P,releaseStatesOfGeometry:A,releaseStatesOfProgram:C,initAttributes:v,enableAttribute:m,disableUnusedAttributes:b}}function Ad(s,t,e){let n;function i(l){n=l}function r(l,h){s.drawArrays(n,l,h),e.update(h,n,1)}function a(l,h,u){u!==0&&(s.drawArraysInstanced(n,l,h,u),e.update(h,n,u))}function o(l,h,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,h,0,u);let p=0;for(let g=0;g<u;g++)p+=h[g];e.update(p,n,1)}function c(l,h,u,f){if(u===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<l.length;g++)a(l[g],h[g],f[g]);else{p.multiDrawArraysInstancedWEBGL(n,l,0,h,0,f,0,u);let g=0;for(let v=0;v<u;v++)g+=h[v]*f[v];e.update(g,n,1)}}this.setMode=i,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=c}function Cd(s,t,e,n){let i;function r(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){const C=t.get("EXT_texture_filter_anisotropic");i=s.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(C){return!(C!==Ge&&n.convert(C)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(C){const D=C===tn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(C!==pn&&n.convert(C)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==hn&&!D)}function c(C){if(C==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=e.precision!==void 0?e.precision:"highp";const h=c(l);h!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);const u=e.logarithmicDepthBuffer===!0,f=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),p=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),g=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=s.getParameter(s.MAX_TEXTURE_SIZE),m=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),d=s.getParameter(s.MAX_VERTEX_ATTRIBS),b=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),w=s.getParameter(s.MAX_VARYING_VECTORS),_=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),P=g>0,A=s.getParameter(s.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:u,reverseDepthBuffer:f,maxTextures:p,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:m,maxAttributes:d,maxVertexUniforms:b,maxVaryings:w,maxFragmentUniforms:_,vertexTextures:P,maxSamples:A}}function Rd(s){const t=this;let e=null,n=0,i=!1,r=!1;const a=new Un,o=new kt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){const p=u.length!==0||f||n!==0||i;return i=f,n=u.length,p},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,f){e=h(u,f,0)},this.setState=function(u,f,p){const g=u.clippingPlanes,v=u.clipIntersection,m=u.clipShadows,d=s.get(u);if(!i||g===null||g.length===0||r&&!m)r?h(null):l();else{const b=r?0:n,w=b*4;let _=d.clippingState||null;c.value=_,_=h(g,f,w,p);for(let P=0;P!==w;++P)_[P]=e[P];d.clippingState=_,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=b}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(u,f,p,g){const v=u!==null?u.length:0;let m=null;if(v!==0){if(m=c.value,g!==!0||m===null){const d=p+v*4,b=f.matrixWorldInverse;o.getNormalMatrix(b),(m===null||m.length<d)&&(m=new Float32Array(d));for(let w=0,_=p;w!==v;++w,_+=4)a.copy(u[w]).applyMatrix4(b,o),a.normal.toArray(m,_),m[_+3]=a.constant}c.value=m,c.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,m}}function Pd(s){let t=new WeakMap;function e(a,o){return o===vr?a.mapping=li:o===_r&&(a.mapping=hi),a}function n(a){if(a&&a.isTexture){const o=a.mapping;if(o===vr||o===_r)if(t.has(a)){const c=t.get(a).texture;return e(c,a.mapping)}else{const c=a.image;if(c&&c.height>0){const l=new Gl(c.height);return l.fromEquirectangularTexture(s,a),t.set(a,l),a.addEventListener("dispose",i),e(l.texture,a.mapping)}else return null}}return a}function i(a){const o=a.target;o.removeEventListener("dispose",i);const c=t.get(o);c!==void 0&&(t.delete(o),c.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}class ra extends ec{constructor(t=-1,e=1,n=1,i=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=i,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,i,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let r=n-t,a=n+t,o=i+e,c=i-e;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,a=r+l*this.view.width,o-=h*this.view.offsetY,c=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,c,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const si=4,Ya=[.125,.215,.35,.446,.526,.582],Nn=20,Qs=new ra,qa=new Ht;let tr=null,er=0,nr=0,ir=!1;const Fn=(1+Math.sqrt(5))/2,ni=1/Fn,Za=[new E(-Fn,ni,0),new E(Fn,ni,0),new E(-ni,0,Fn),new E(ni,0,Fn),new E(0,Fn,-ni),new E(0,Fn,ni),new E(-1,1,-1),new E(1,1,-1),new E(-1,1,1),new E(1,1,1)];class Ka{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,i=100){tr=this._renderer.getRenderTarget(),er=this._renderer.getActiveCubeFace(),nr=this._renderer.getActiveMipmapLevel(),ir=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,i,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ja(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ja(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(tr,er,nr),this._renderer.xr.enabled=ir,t.scissorTest=!1,cs(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===li||t.mapping===hi?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),tr=this._renderer.getRenderTarget(),er=this._renderer.getActiveCubeFace(),nr=this._renderer.getActiveMipmapLevel(),ir=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Te,minFilter:Te,generateMipmaps:!1,type:tn,format:Ge,colorSpace:vi,depthBuffer:!1},i=$a(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=$a(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Id(r)),this._blurMaterial=Dd(r,t,e)}return i}_compileMaterial(t){const e=new I(this._lodPlanes[0],t);this._renderer.compile(e,Qs)}_sceneToCubeUV(t,e,n,i){const o=new Re(90,1,e,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,f=h.toneMapping;h.getClearColor(qa),h.toneMapping=wn,h.autoClear=!1;const p=new Tn({name:"PMREM.Background",side:Pe,depthWrite:!1,depthTest:!1}),g=new I(new et,p);let v=!1;const m=t.background;m?m.isColor&&(p.color.copy(m),t.background=null,v=!0):(p.color.copy(qa),v=!0);for(let d=0;d<6;d++){const b=d%3;b===0?(o.up.set(0,c[d],0),o.lookAt(l[d],0,0)):b===1?(o.up.set(0,0,c[d]),o.lookAt(0,l[d],0)):(o.up.set(0,c[d],0),o.lookAt(0,0,l[d]));const w=this._cubeSize;cs(i,b*w,d>2?w:0,w,w),h.setRenderTarget(i),v&&h.render(g,o),h.render(t,o)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=f,h.autoClear=u,t.background=m}_textureToCubeUV(t,e){const n=this._renderer,i=t.mapping===li||t.mapping===hi;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ja()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ja());const r=i?this._cubemapMaterial:this._equirectMaterial,a=new I(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=t;const c=this._cubeSize;cs(e,0,0,3*c,2*c),n.setRenderTarget(e),n.render(a,Qs)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const i=this._lodPlanes.length;for(let r=1;r<i;r++){const a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=Za[(i-r-1)%Za.length];this._blur(t,r-1,r,a,o)}e.autoClear=n}_blur(t,e,n,i,r){const a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,i,"latitudinal",r),this._halfBlur(a,t,n,n,i,"longitudinal",r)}_halfBlur(t,e,n,i,r,a,o){const c=this._renderer,l=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,u=new I(this._lodPlanes[i],l),f=l.uniforms,p=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*p):2*Math.PI/(2*Nn-1),v=r/g,m=isFinite(r)?1+Math.floor(h*v):Nn;m>Nn&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Nn}`);const d=[];let b=0;for(let C=0;C<Nn;++C){const D=C/v,S=Math.exp(-D*D/2);d.push(S),C===0?b+=S:C<m&&(b+=2*S)}for(let C=0;C<d.length;C++)d[C]=d[C]/b;f.envMap.value=t.texture,f.samples.value=m,f.weights.value=d,f.latitudinal.value=a==="latitudinal",o&&(f.poleAxis.value=o);const{_lodMax:w}=this;f.dTheta.value=g,f.mipInt.value=w-n;const _=this._sizeLods[i],P=3*_*(i>w-si?i-w+si:0),A=4*(this._cubeSize-_);cs(e,P,A,3*_,2*_),c.setRenderTarget(e),c.render(u,Qs)}}function Id(s){const t=[],e=[],n=[];let i=s;const r=s-si+1+Ya.length;for(let a=0;a<r;a++){const o=Math.pow(2,i);e.push(o);let c=1/o;a>s-si?c=Ya[a-s+si-1]:a===0&&(c=0),n.push(c);const l=1/(o-2),h=-l,u=1+l,f=[h,h,u,h,u,u,h,h,u,u,h,u],p=6,g=6,v=3,m=2,d=1,b=new Float32Array(v*g*p),w=new Float32Array(m*g*p),_=new Float32Array(d*g*p);for(let A=0;A<p;A++){const C=A%3*2/3-1,D=A>2?0:-1,S=[C,D,0,C+2/3,D,0,C+2/3,D+1,0,C,D,0,C+2/3,D+1,0,C,D+1,0];b.set(S,v*g*A),w.set(f,m*g*A);const x=[A,A,A,A,A,A];_.set(x,d*g*A)}const P=new _e;P.setAttribute("position",new ve(b,v)),P.setAttribute("uv",new ve(w,m)),P.setAttribute("faceIndex",new ve(_,d)),t.push(P),i>si&&i--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function $a(s,t,e){const n=new He(s,t,e);return n.texture.mapping=ws,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function cs(s,t,e,n,i){s.viewport.set(t,e,n,i),s.scissor.set(t,e,n,i)}function Dd(s,t,e){const n=new Float32Array(Nn),i=new E(0,1,0);return new ye({name:"SphericalGaussianBlur",defines:{n:Nn,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:aa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:dn,depthTest:!1,depthWrite:!1})}function ja(){return new ye({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:aa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:dn,depthTest:!1,depthWrite:!1})}function Ja(){return new ye({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:aa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:dn,depthTest:!1,depthWrite:!1})}function aa(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Ld(s){let t=new WeakMap,e=null;function n(o){if(o&&o.isTexture){const c=o.mapping,l=c===vr||c===_r,h=c===li||c===hi;if(l||h){let u=t.get(o);const f=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==f)return e===null&&(e=new Ka(s)),u=l?e.fromEquirectangular(o,u):e.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,t.set(o,u),u.texture;if(u!==void 0)return u.texture;{const p=o.image;return l&&p&&p.height>0||h&&p&&i(p)?(e===null&&(e=new Ka(s)),u=l?e.fromEquirectangular(o):e.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,t.set(o,u),o.addEventListener("dispose",r),u.texture):null}}}return o}function i(o){let c=0;const l=6;for(let h=0;h<l;h++)o[h]!==void 0&&c++;return c===l}function r(o){const c=o.target;c.removeEventListener("dispose",r);const l=t.get(c);l!==void 0&&(t.delete(c),l.dispose())}function a(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:a}}function Ud(s){const t={};function e(n){if(t[n]!==void 0)return t[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return t[n]=i,i}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const i=e(n);return i===null&&Pi("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function Fd(s,t,e,n){const i={},r=new WeakMap;function a(u){const f=u.target;f.index!==null&&t.remove(f.index);for(const g in f.attributes)t.remove(f.attributes[g]);for(const g in f.morphAttributes){const v=f.morphAttributes[g];for(let m=0,d=v.length;m<d;m++)t.remove(v[m])}f.removeEventListener("dispose",a),delete i[f.id];const p=r.get(f);p&&(t.remove(p),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,e.memory.geometries--}function o(u,f){return i[f.id]===!0||(f.addEventListener("dispose",a),i[f.id]=!0,e.memory.geometries++),f}function c(u){const f=u.attributes;for(const g in f)t.update(f[g],s.ARRAY_BUFFER);const p=u.morphAttributes;for(const g in p){const v=p[g];for(let m=0,d=v.length;m<d;m++)t.update(v[m],s.ARRAY_BUFFER)}}function l(u){const f=[],p=u.index,g=u.attributes.position;let v=0;if(p!==null){const b=p.array;v=p.version;for(let w=0,_=b.length;w<_;w+=3){const P=b[w+0],A=b[w+1],C=b[w+2];f.push(P,A,A,C,C,P)}}else if(g!==void 0){const b=g.array;v=g.version;for(let w=0,_=b.length/3-1;w<_;w+=3){const P=w+0,A=w+1,C=w+2;f.push(P,A,A,C,C,P)}}else return;const m=new(Yo(f)?Qo:Jo)(f,1);m.version=v;const d=r.get(u);d&&t.remove(d),r.set(u,m)}function h(u){const f=r.get(u);if(f){const p=u.index;p!==null&&f.version<p.version&&l(u)}else l(u);return r.get(u)}return{get:o,update:c,getWireframeAttribute:h}}function kd(s,t,e){let n;function i(f){n=f}let r,a;function o(f){r=f.type,a=f.bytesPerElement}function c(f,p){s.drawElements(n,p,r,f*a),e.update(p,n,1)}function l(f,p,g){g!==0&&(s.drawElementsInstanced(n,p,r,f*a,g),e.update(p,n,g))}function h(f,p,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,p,0,r,f,0,g);let m=0;for(let d=0;d<g;d++)m+=p[d];e.update(m,n,1)}function u(f,p,g,v){if(g===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let d=0;d<f.length;d++)l(f[d]/a,p[d],v[d]);else{m.multiDrawElementsInstancedWEBGL(n,p,0,r,f,0,v,0,g);let d=0;for(let b=0;b<g;b++)d+=p[b]*v[b];e.update(d,n,1)}}this.setMode=i,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function Nd(s){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case s.TRIANGLES:e.triangles+=o*(r/3);break;case s.LINES:e.lines+=o*(r/2);break;case s.LINE_STRIP:e.lines+=o*(r-1);break;case s.LINE_LOOP:e.lines+=o*r;break;case s.POINTS:e.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function i(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:i,update:n}}function Bd(s,t,e){const n=new WeakMap,i=new Qt;function r(a,o,c){const l=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=h!==void 0?h.length:0;let f=n.get(o);if(f===void 0||f.count!==u){let S=function(){C.dispose(),n.delete(o),o.removeEventListener("dispose",S)};f!==void 0&&f.texture.dispose();const p=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,v=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],d=o.morphAttributes.normal||[],b=o.morphAttributes.color||[];let w=0;p===!0&&(w=1),g===!0&&(w=2),v===!0&&(w=3);let _=o.attributes.position.count*w,P=1;_>t.maxTextureSize&&(P=Math.ceil(_/t.maxTextureSize),_=t.maxTextureSize);const A=new Float32Array(_*P*4*u),C=new Zo(A,_,P,u);C.type=hn,C.needsUpdate=!0;const D=w*4;for(let x=0;x<u;x++){const R=m[x],O=d[x],N=b[x],G=_*P*4*x;for(let q=0;q<R.count;q++){const W=q*D;p===!0&&(i.fromBufferAttribute(R,q),A[G+W+0]=i.x,A[G+W+1]=i.y,A[G+W+2]=i.z,A[G+W+3]=0),g===!0&&(i.fromBufferAttribute(O,q),A[G+W+4]=i.x,A[G+W+5]=i.y,A[G+W+6]=i.z,A[G+W+7]=0),v===!0&&(i.fromBufferAttribute(N,q),A[G+W+8]=i.x,A[G+W+9]=i.y,A[G+W+10]=i.z,A[G+W+11]=N.itemSize===4?i.w:1)}}f={count:u,texture:C,size:new Rt(_,P)},n.set(o,f),o.addEventListener("dispose",S)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(s,"morphTexture",a.morphTexture,e);else{let p=0;for(let v=0;v<l.length;v++)p+=l[v];const g=o.morphTargetsRelative?1:1-p;c.getUniforms().setValue(s,"morphTargetBaseInfluence",g),c.getUniforms().setValue(s,"morphTargetInfluences",l)}c.getUniforms().setValue(s,"morphTargetsTexture",f.texture,e),c.getUniforms().setValue(s,"morphTargetsTextureSize",f.size)}return{update:r}}function Od(s,t,e,n){let i=new WeakMap;function r(c){const l=n.render.frame,h=c.geometry,u=t.get(c,h);if(i.get(u)!==l&&(t.update(u),i.set(u,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",o)===!1&&c.addEventListener("dispose",o),i.get(c)!==l&&(e.update(c.instanceMatrix,s.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,s.ARRAY_BUFFER),i.set(c,l))),c.isSkinnedMesh){const f=c.skeleton;i.get(f)!==l&&(f.update(),i.set(f,l))}return u}function a(){i=new WeakMap}function o(c){const l=c.target;l.removeEventListener("dispose",o),e.remove(l.instanceMatrix),l.instanceColor!==null&&e.remove(l.instanceColor)}return{update:r,dispose:a}}class sc extends Ae{constructor(t,e,n,i,r,a,o,c,l,h=ri){if(h!==ri&&h!==di)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===ri&&(n=zn),n===void 0&&h===di&&(n=ui),super(null,i,r,a,o,c,h,n,l),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:Ke,this.minFilter=c!==void 0?c:Ke,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const rc=new Ae,Qa=new sc(1,1),ac=new Zo,oc=new Tl,cc=new nc,to=[],eo=[],no=new Float32Array(16),io=new Float32Array(9),so=new Float32Array(4);function Si(s,t,e){const n=s[0];if(n<=0||n>0)return s;const i=t*e;let r=to[i];if(r===void 0&&(r=new Float32Array(i),to[i]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,s[a].toArray(r,o)}return r}function pe(s,t){if(s.length!==t.length)return!1;for(let e=0,n=s.length;e<n;e++)if(s[e]!==t[e])return!1;return!0}function me(s,t){for(let e=0,n=t.length;e<n;e++)s[e]=t[e]}function As(s,t){let e=eo[t];e===void 0&&(e=new Int32Array(t),eo[t]=e);for(let n=0;n!==t;++n)e[n]=s.allocateTextureUnit();return e}function zd(s,t){const e=this.cache;e[0]!==t&&(s.uniform1f(this.addr,t),e[0]=t)}function Gd(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(pe(e,t))return;s.uniform2fv(this.addr,t),me(e,t)}}function Hd(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(s.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(pe(e,t))return;s.uniform3fv(this.addr,t),me(e,t)}}function Vd(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(pe(e,t))return;s.uniform4fv(this.addr,t),me(e,t)}}function Wd(s,t){const e=this.cache,n=t.elements;if(n===void 0){if(pe(e,t))return;s.uniformMatrix2fv(this.addr,!1,t),me(e,t)}else{if(pe(e,n))return;so.set(n),s.uniformMatrix2fv(this.addr,!1,so),me(e,n)}}function Xd(s,t){const e=this.cache,n=t.elements;if(n===void 0){if(pe(e,t))return;s.uniformMatrix3fv(this.addr,!1,t),me(e,t)}else{if(pe(e,n))return;io.set(n),s.uniformMatrix3fv(this.addr,!1,io),me(e,n)}}function Yd(s,t){const e=this.cache,n=t.elements;if(n===void 0){if(pe(e,t))return;s.uniformMatrix4fv(this.addr,!1,t),me(e,t)}else{if(pe(e,n))return;no.set(n),s.uniformMatrix4fv(this.addr,!1,no),me(e,n)}}function qd(s,t){const e=this.cache;e[0]!==t&&(s.uniform1i(this.addr,t),e[0]=t)}function Zd(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(pe(e,t))return;s.uniform2iv(this.addr,t),me(e,t)}}function Kd(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(pe(e,t))return;s.uniform3iv(this.addr,t),me(e,t)}}function $d(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(pe(e,t))return;s.uniform4iv(this.addr,t),me(e,t)}}function jd(s,t){const e=this.cache;e[0]!==t&&(s.uniform1ui(this.addr,t),e[0]=t)}function Jd(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(pe(e,t))return;s.uniform2uiv(this.addr,t),me(e,t)}}function Qd(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(pe(e,t))return;s.uniform3uiv(this.addr,t),me(e,t)}}function tf(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(pe(e,t))return;s.uniform4uiv(this.addr,t),me(e,t)}}function ef(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_2D_SHADOW?(Qa.compareFunction=Xo,r=Qa):r=rc,e.setTexture2D(t||r,i)}function nf(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTexture3D(t||oc,i)}function sf(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTextureCube(t||cc,i)}function rf(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTexture2DArray(t||ac,i)}function af(s){switch(s){case 5126:return zd;case 35664:return Gd;case 35665:return Hd;case 35666:return Vd;case 35674:return Wd;case 35675:return Xd;case 35676:return Yd;case 5124:case 35670:return qd;case 35667:case 35671:return Zd;case 35668:case 35672:return Kd;case 35669:case 35673:return $d;case 5125:return jd;case 36294:return Jd;case 36295:return Qd;case 36296:return tf;case 35678:case 36198:case 36298:case 36306:case 35682:return ef;case 35679:case 36299:case 36307:return nf;case 35680:case 36300:case 36308:case 36293:return sf;case 36289:case 36303:case 36311:case 36292:return rf}}function of(s,t){s.uniform1fv(this.addr,t)}function cf(s,t){const e=Si(t,this.size,2);s.uniform2fv(this.addr,e)}function lf(s,t){const e=Si(t,this.size,3);s.uniform3fv(this.addr,e)}function hf(s,t){const e=Si(t,this.size,4);s.uniform4fv(this.addr,e)}function uf(s,t){const e=Si(t,this.size,4);s.uniformMatrix2fv(this.addr,!1,e)}function df(s,t){const e=Si(t,this.size,9);s.uniformMatrix3fv(this.addr,!1,e)}function ff(s,t){const e=Si(t,this.size,16);s.uniformMatrix4fv(this.addr,!1,e)}function pf(s,t){s.uniform1iv(this.addr,t)}function mf(s,t){s.uniform2iv(this.addr,t)}function gf(s,t){s.uniform3iv(this.addr,t)}function vf(s,t){s.uniform4iv(this.addr,t)}function _f(s,t){s.uniform1uiv(this.addr,t)}function xf(s,t){s.uniform2uiv(this.addr,t)}function Mf(s,t){s.uniform3uiv(this.addr,t)}function Sf(s,t){s.uniform4uiv(this.addr,t)}function yf(s,t,e){const n=this.cache,i=t.length,r=As(e,i);pe(n,r)||(s.uniform1iv(this.addr,r),me(n,r));for(let a=0;a!==i;++a)e.setTexture2D(t[a]||rc,r[a])}function bf(s,t,e){const n=this.cache,i=t.length,r=As(e,i);pe(n,r)||(s.uniform1iv(this.addr,r),me(n,r));for(let a=0;a!==i;++a)e.setTexture3D(t[a]||oc,r[a])}function wf(s,t,e){const n=this.cache,i=t.length,r=As(e,i);pe(n,r)||(s.uniform1iv(this.addr,r),me(n,r));for(let a=0;a!==i;++a)e.setTextureCube(t[a]||cc,r[a])}function Ef(s,t,e){const n=this.cache,i=t.length,r=As(e,i);pe(n,r)||(s.uniform1iv(this.addr,r),me(n,r));for(let a=0;a!==i;++a)e.setTexture2DArray(t[a]||ac,r[a])}function Tf(s){switch(s){case 5126:return of;case 35664:return cf;case 35665:return lf;case 35666:return hf;case 35674:return uf;case 35675:return df;case 35676:return ff;case 5124:case 35670:return pf;case 35667:case 35671:return mf;case 35668:case 35672:return gf;case 35669:case 35673:return vf;case 5125:return _f;case 36294:return xf;case 36295:return Mf;case 36296:return Sf;case 35678:case 36198:case 36298:case 36306:case 35682:return yf;case 35679:case 36299:case 36307:return bf;case 35680:case 36300:case 36308:case 36293:return wf;case 36289:case 36303:case 36311:case 36292:return Ef}}class Af{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=af(e.type)}}class Cf{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Tf(e.type)}}class Rf{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const i=this.seq;for(let r=0,a=i.length;r!==a;++r){const o=i[r];o.setValue(t,e[o.id],n)}}}const sr=/(\w+)(\])?(\[|\.)?/g;function ro(s,t){s.seq.push(t),s.map[t.id]=t}function Pf(s,t,e){const n=s.name,i=n.length;for(sr.lastIndex=0;;){const r=sr.exec(n),a=sr.lastIndex;let o=r[1];const c=r[2]==="]",l=r[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===i){ro(e,l===void 0?new Af(o,s,t):new Cf(o,s,t));break}else{let u=e.map[o];u===void 0&&(u=new Rf(o),ro(e,u)),e=u}}}class Ms{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){const r=t.getActiveUniform(e,i),a=t.getUniformLocation(e,r.name);Pf(r,a,this)}}setValue(t,e,n,i){const r=this.map[e];r!==void 0&&r.setValue(t,n,i)}setOptional(t,e,n){const i=e[n];i!==void 0&&this.setValue(t,n,i)}static upload(t,e,n,i){for(let r=0,a=e.length;r!==a;++r){const o=e[r],c=n[o.id];c.needsUpdate!==!1&&o.setValue(t,c.value,i)}}static seqWithValue(t,e){const n=[];for(let i=0,r=t.length;i!==r;++i){const a=t[i];a.id in e&&n.push(a)}return n}}function ao(s,t,e){const n=s.createShader(t);return s.shaderSource(n,e),s.compileShader(n),n}const If=37297;let Df=0;function Lf(s,t){const e=s.split(`
`),n=[],i=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=i;a<r;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}const oo=new kt;function Uf(s){Yt._getMatrix(oo,Yt.workingColorSpace,s);const t=`mat3( ${oo.elements.map(e=>e.toFixed(4))} )`;switch(Yt.getTransfer(s)){case Es:return[t,"LinearTransferOETF"];case Jt:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",s),[t,"LinearTransferOETF"]}}function co(s,t,e){const n=s.getShaderParameter(t,s.COMPILE_STATUS),i=s.getShaderInfoLog(t).trim();if(n&&i==="")return"";const r=/ERROR: 0:(\d+)/.exec(i);if(r){const a=parseInt(r[1]);return e.toUpperCase()+`

`+i+`

`+Lf(s.getShaderSource(t),a)}else return i}function Ff(s,t){const e=Uf(t);return[`vec4 ${s}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function kf(s,t){let e;switch(t){case Co:e="Linear";break;case Ro:e="Reinhard";break;case Po:e="Cineon";break;case $r:e="ACESFilmic";break;case Io:e="AgX";break;case Do:e="Neutral";break;case Wc:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+s+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const ls=new E;function Nf(){Yt.getLuminanceCoefficients(ls);const s=ls.x.toFixed(4),t=ls.y.toFixed(4),e=ls.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Bf(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ii).join(`
`)}function Of(s){const t=[];for(const e in s){const n=s[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function zf(s,t){const e={},n=s.getProgramParameter(t,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const r=s.getActiveAttrib(t,i),a=r.name;let o=1;r.type===s.FLOAT_MAT2&&(o=2),r.type===s.FLOAT_MAT3&&(o=3),r.type===s.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:s.getAttribLocation(t,a),locationSize:o}}return e}function Ii(s){return s!==""}function lo(s,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function ho(s,t){return s.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const Gf=/^[ \t]*#include +<([\w\d./]+)>/gm;function Yr(s){return s.replace(Gf,Vf)}const Hf=new Map;function Vf(s,t){let e=Ot[t];if(e===void 0){const n=Hf.get(t);if(n!==void 0)e=Ot[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return Yr(e)}const Wf=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function uo(s){return s.replace(Wf,Xf)}function Xf(s,t,e,n){let i="";for(let r=parseInt(t);r<parseInt(e);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function fo(s){let t=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?t+=`
#define HIGH_PRECISION`:s.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Yf(s){let t="SHADOWMAP_TYPE_BASIC";return s.shadowMapType===Kr?t="SHADOWMAP_TYPE_PCF":s.shadowMapType===bc?t="SHADOWMAP_TYPE_PCF_SOFT":s.shadowMapType===ln&&(t="SHADOWMAP_TYPE_VSM"),t}function qf(s){let t="ENVMAP_TYPE_CUBE";if(s.envMap)switch(s.envMapMode){case li:case hi:t="ENVMAP_TYPE_CUBE";break;case ws:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Zf(s){let t="ENVMAP_MODE_REFLECTION";if(s.envMap)switch(s.envMapMode){case hi:t="ENVMAP_MODE_REFRACTION";break}return t}function Kf(s){let t="ENVMAP_BLENDING_NONE";if(s.envMap)switch(s.combine){case Ao:t="ENVMAP_BLENDING_MULTIPLY";break;case Hc:t="ENVMAP_BLENDING_MIX";break;case Vc:t="ENVMAP_BLENDING_ADD";break}return t}function $f(s){const t=s.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function jf(s,t,e,n){const i=s.getContext(),r=e.defines;let a=e.vertexShader,o=e.fragmentShader;const c=Yf(e),l=qf(e),h=Zf(e),u=Kf(e),f=$f(e),p=Bf(e),g=Of(r),v=i.createProgram();let m,d,b=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Ii).join(`
`),m.length>0&&(m+=`
`),d=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Ii).join(`
`),d.length>0&&(d+=`
`)):(m=[fo(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ii).join(`
`),d=[fo(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==wn?"#define TONE_MAPPING":"",e.toneMapping!==wn?Ot.tonemapping_pars_fragment:"",e.toneMapping!==wn?kf("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Ot.colorspace_pars_fragment,Ff("linearToOutputTexel",e.outputColorSpace),Nf(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Ii).join(`
`)),a=Yr(a),a=lo(a,e),a=ho(a,e),o=Yr(o),o=lo(o,e),o=ho(o,e),a=uo(a),o=uo(o),e.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,d=["#define varying in",e.glslVersion===wa?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===wa?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+d);const w=b+m+a,_=b+d+o,P=ao(i,i.VERTEX_SHADER,w),A=ao(i,i.FRAGMENT_SHADER,_);i.attachShader(v,P),i.attachShader(v,A),e.index0AttributeName!==void 0?i.bindAttribLocation(v,0,e.index0AttributeName):e.morphTargets===!0&&i.bindAttribLocation(v,0,"position"),i.linkProgram(v);function C(R){if(s.debug.checkShaderErrors){const O=i.getProgramInfoLog(v).trim(),N=i.getShaderInfoLog(P).trim(),G=i.getShaderInfoLog(A).trim();let q=!0,W=!0;if(i.getProgramParameter(v,i.LINK_STATUS)===!1)if(q=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,v,P,A);else{const K=co(i,P,"vertex"),z=co(i,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(v,i.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+O+`
`+K+`
`+z)}else O!==""?console.warn("THREE.WebGLProgram: Program Info Log:",O):(N===""||G==="")&&(W=!1);W&&(R.diagnostics={runnable:q,programLog:O,vertexShader:{log:N,prefix:m},fragmentShader:{log:G,prefix:d}})}i.deleteShader(P),i.deleteShader(A),D=new Ms(i,v),S=zf(i,v)}let D;this.getUniforms=function(){return D===void 0&&C(this),D};let S;this.getAttributes=function(){return S===void 0&&C(this),S};let x=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return x===!1&&(x=i.getProgramParameter(v,If)),x},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(v),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Df++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=P,this.fragmentShader=A,this}let Jf=0;class Qf{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,i=this._getShaderStage(e),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(t);return a.has(i)===!1&&(a.add(i),i.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new tp(t),e.set(t,n)),n}}class tp{constructor(t){this.id=Jf++,this.code=t,this.usedTimes=0}}function ep(s,t,e,n,i,r,a){const o=new $o,c=new Qf,l=new Set,h=[],u=i.logarithmicDepthBuffer,f=i.vertexTextures;let p=i.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(S){return l.add(S),S===0?"uv":`uv${S}`}function m(S,x,R,O,N){const G=O.fog,q=N.geometry,W=S.isMeshStandardMaterial?O.environment:null,K=(S.isMeshStandardMaterial?e:t).get(S.envMap||W),z=K&&K.mapping===ws?K.image.height:null,Q=g[S.type];S.precision!==null&&(p=i.getMaxPrecision(S.precision),p!==S.precision&&console.warn("THREE.WebGLProgram.getParameters:",S.precision,"not supported, using",p,"instead."));const nt=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,ot=nt!==void 0?nt.length:0;let _t=0;q.morphAttributes.position!==void 0&&(_t=1),q.morphAttributes.normal!==void 0&&(_t=2),q.morphAttributes.color!==void 0&&(_t=3);let Lt,X,tt,ut;if(Q){const jt=Je[Q];Lt=jt.vertexShader,X=jt.fragmentShader}else Lt=S.vertexShader,X=S.fragmentShader,c.update(S),tt=c.getVertexShaderID(S),ut=c.getFragmentShaderID(S);const rt=s.getRenderTarget(),yt=s.state.buffers.depth.getReversed(),Pt=N.isInstancedMesh===!0,Nt=N.isBatchedMesh===!0,ie=!!S.map,Vt=!!S.matcap,oe=!!K,F=!!S.aoMap,he=!!S.lightMap,Dt=!!S.bumpMap,Gt=!!S.normalMap,Et=!!S.displacementMap,se=!!S.emissiveMap,Tt=!!S.metalnessMap,T=!!S.roughnessMap,M=S.anisotropy>0,B=S.clearcoat>0,$=S.dispersion>0,J=S.iridescence>0,Z=S.sheen>0,bt=S.transmission>0,ht=M&&!!S.anisotropyMap,mt=B&&!!S.clearcoatMap,qt=B&&!!S.clearcoatNormalMap,it=B&&!!S.clearcoatRoughnessMap,gt=J&&!!S.iridescenceMap,At=J&&!!S.iridescenceThicknessMap,Ct=Z&&!!S.sheenColorMap,vt=Z&&!!S.sheenRoughnessMap,Xt=!!S.specularMap,Bt=!!S.specularColorMap,ee=!!S.specularIntensityMap,L=bt&&!!S.transmissionMap,lt=bt&&!!S.thicknessMap,Y=!!S.gradientMap,j=!!S.alphaMap,pt=S.alphaTest>0,dt=!!S.alphaHash,Ut=!!S.extensions;let ue=wn;S.toneMapped&&(rt===null||rt.isXRRenderTarget===!0)&&(ue=s.toneMapping);const xe={shaderID:Q,shaderType:S.type,shaderName:S.name,vertexShader:Lt,fragmentShader:X,defines:S.defines,customVertexShaderID:tt,customFragmentShaderID:ut,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:p,batching:Nt,batchingColor:Nt&&N._colorsTexture!==null,instancing:Pt,instancingColor:Pt&&N.instanceColor!==null,instancingMorph:Pt&&N.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:rt===null?s.outputColorSpace:rt.isXRRenderTarget===!0?rt.texture.colorSpace:vi,alphaToCoverage:!!S.alphaToCoverage,map:ie,matcap:Vt,envMap:oe,envMapMode:oe&&K.mapping,envMapCubeUVHeight:z,aoMap:F,lightMap:he,bumpMap:Dt,normalMap:Gt,displacementMap:f&&Et,emissiveMap:se,normalMapObjectSpace:Gt&&S.normalMapType===Zc,normalMapTangentSpace:Gt&&S.normalMapType===Wo,metalnessMap:Tt,roughnessMap:T,anisotropy:M,anisotropyMap:ht,clearcoat:B,clearcoatMap:mt,clearcoatNormalMap:qt,clearcoatRoughnessMap:it,dispersion:$,iridescence:J,iridescenceMap:gt,iridescenceThicknessMap:At,sheen:Z,sheenColorMap:Ct,sheenRoughnessMap:vt,specularMap:Xt,specularColorMap:Bt,specularIntensityMap:ee,transmission:bt,transmissionMap:L,thicknessMap:lt,gradientMap:Y,opaque:S.transparent===!1&&S.blending===On&&S.alphaToCoverage===!1,alphaMap:j,alphaTest:pt,alphaHash:dt,combine:S.combine,mapUv:ie&&v(S.map.channel),aoMapUv:F&&v(S.aoMap.channel),lightMapUv:he&&v(S.lightMap.channel),bumpMapUv:Dt&&v(S.bumpMap.channel),normalMapUv:Gt&&v(S.normalMap.channel),displacementMapUv:Et&&v(S.displacementMap.channel),emissiveMapUv:se&&v(S.emissiveMap.channel),metalnessMapUv:Tt&&v(S.metalnessMap.channel),roughnessMapUv:T&&v(S.roughnessMap.channel),anisotropyMapUv:ht&&v(S.anisotropyMap.channel),clearcoatMapUv:mt&&v(S.clearcoatMap.channel),clearcoatNormalMapUv:qt&&v(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:it&&v(S.clearcoatRoughnessMap.channel),iridescenceMapUv:gt&&v(S.iridescenceMap.channel),iridescenceThicknessMapUv:At&&v(S.iridescenceThicknessMap.channel),sheenColorMapUv:Ct&&v(S.sheenColorMap.channel),sheenRoughnessMapUv:vt&&v(S.sheenRoughnessMap.channel),specularMapUv:Xt&&v(S.specularMap.channel),specularColorMapUv:Bt&&v(S.specularColorMap.channel),specularIntensityMapUv:ee&&v(S.specularIntensityMap.channel),transmissionMapUv:L&&v(S.transmissionMap.channel),thicknessMapUv:lt&&v(S.thicknessMap.channel),alphaMapUv:j&&v(S.alphaMap.channel),vertexTangents:!!q.attributes.tangent&&(Gt||M),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,pointsUvs:N.isPoints===!0&&!!q.attributes.uv&&(ie||j),fog:!!G,useFog:S.fog===!0,fogExp2:!!G&&G.isFogExp2,flatShading:S.flatShading===!0,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:yt,skinning:N.isSkinnedMesh===!0,morphTargets:q.morphAttributes.position!==void 0,morphNormals:q.morphAttributes.normal!==void 0,morphColors:q.morphAttributes.color!==void 0,morphTargetsCount:ot,morphTextureStride:_t,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:S.dithering,shadowMapEnabled:s.shadowMap.enabled&&R.length>0,shadowMapType:s.shadowMap.type,toneMapping:ue,decodeVideoTexture:ie&&S.map.isVideoTexture===!0&&Yt.getTransfer(S.map.colorSpace)===Jt,decodeVideoTextureEmissive:se&&S.emissiveMap.isVideoTexture===!0&&Yt.getTransfer(S.emissiveMap.colorSpace)===Jt,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===Ne,flipSided:S.side===Pe,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionClipCullDistance:Ut&&S.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ut&&S.extensions.multiDraw===!0||Nt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()};return xe.vertexUv1s=l.has(1),xe.vertexUv2s=l.has(2),xe.vertexUv3s=l.has(3),l.clear(),xe}function d(S){const x=[];if(S.shaderID?x.push(S.shaderID):(x.push(S.customVertexShaderID),x.push(S.customFragmentShaderID)),S.defines!==void 0)for(const R in S.defines)x.push(R),x.push(S.defines[R]);return S.isRawShaderMaterial===!1&&(b(x,S),w(x,S),x.push(s.outputColorSpace)),x.push(S.customProgramCacheKey),x.join()}function b(S,x){S.push(x.precision),S.push(x.outputColorSpace),S.push(x.envMapMode),S.push(x.envMapCubeUVHeight),S.push(x.mapUv),S.push(x.alphaMapUv),S.push(x.lightMapUv),S.push(x.aoMapUv),S.push(x.bumpMapUv),S.push(x.normalMapUv),S.push(x.displacementMapUv),S.push(x.emissiveMapUv),S.push(x.metalnessMapUv),S.push(x.roughnessMapUv),S.push(x.anisotropyMapUv),S.push(x.clearcoatMapUv),S.push(x.clearcoatNormalMapUv),S.push(x.clearcoatRoughnessMapUv),S.push(x.iridescenceMapUv),S.push(x.iridescenceThicknessMapUv),S.push(x.sheenColorMapUv),S.push(x.sheenRoughnessMapUv),S.push(x.specularMapUv),S.push(x.specularColorMapUv),S.push(x.specularIntensityMapUv),S.push(x.transmissionMapUv),S.push(x.thicknessMapUv),S.push(x.combine),S.push(x.fogExp2),S.push(x.sizeAttenuation),S.push(x.morphTargetsCount),S.push(x.morphAttributeCount),S.push(x.numDirLights),S.push(x.numPointLights),S.push(x.numSpotLights),S.push(x.numSpotLightMaps),S.push(x.numHemiLights),S.push(x.numRectAreaLights),S.push(x.numDirLightShadows),S.push(x.numPointLightShadows),S.push(x.numSpotLightShadows),S.push(x.numSpotLightShadowsWithMaps),S.push(x.numLightProbes),S.push(x.shadowMapType),S.push(x.toneMapping),S.push(x.numClippingPlanes),S.push(x.numClipIntersection),S.push(x.depthPacking)}function w(S,x){o.disableAll(),x.supportsVertexTextures&&o.enable(0),x.instancing&&o.enable(1),x.instancingColor&&o.enable(2),x.instancingMorph&&o.enable(3),x.matcap&&o.enable(4),x.envMap&&o.enable(5),x.normalMapObjectSpace&&o.enable(6),x.normalMapTangentSpace&&o.enable(7),x.clearcoat&&o.enable(8),x.iridescence&&o.enable(9),x.alphaTest&&o.enable(10),x.vertexColors&&o.enable(11),x.vertexAlphas&&o.enable(12),x.vertexUv1s&&o.enable(13),x.vertexUv2s&&o.enable(14),x.vertexUv3s&&o.enable(15),x.vertexTangents&&o.enable(16),x.anisotropy&&o.enable(17),x.alphaHash&&o.enable(18),x.batching&&o.enable(19),x.dispersion&&o.enable(20),x.batchingColor&&o.enable(21),S.push(o.mask),o.disableAll(),x.fog&&o.enable(0),x.useFog&&o.enable(1),x.flatShading&&o.enable(2),x.logarithmicDepthBuffer&&o.enable(3),x.reverseDepthBuffer&&o.enable(4),x.skinning&&o.enable(5),x.morphTargets&&o.enable(6),x.morphNormals&&o.enable(7),x.morphColors&&o.enable(8),x.premultipliedAlpha&&o.enable(9),x.shadowMapEnabled&&o.enable(10),x.doubleSided&&o.enable(11),x.flipSided&&o.enable(12),x.useDepthPacking&&o.enable(13),x.dithering&&o.enable(14),x.transmission&&o.enable(15),x.sheen&&o.enable(16),x.opaque&&o.enable(17),x.pointsUvs&&o.enable(18),x.decodeVideoTexture&&o.enable(19),x.decodeVideoTextureEmissive&&o.enable(20),x.alphaToCoverage&&o.enable(21),S.push(o.mask)}function _(S){const x=g[S.type];let R;if(x){const O=Je[x];R=ki.clone(O.uniforms)}else R=S.uniforms;return R}function P(S,x){let R;for(let O=0,N=h.length;O<N;O++){const G=h[O];if(G.cacheKey===x){R=G,++R.usedTimes;break}}return R===void 0&&(R=new jf(s,x,S,r),h.push(R)),R}function A(S){if(--S.usedTimes===0){const x=h.indexOf(S);h[x]=h[h.length-1],h.pop(),S.destroy()}}function C(S){c.remove(S)}function D(){c.dispose()}return{getParameters:m,getProgramCacheKey:d,getUniforms:_,acquireProgram:P,releaseProgram:A,releaseShaderCache:C,programs:h,dispose:D}}function np(){let s=new WeakMap;function t(a){return s.has(a)}function e(a){let o=s.get(a);return o===void 0&&(o={},s.set(a,o)),o}function n(a){s.delete(a)}function i(a,o,c){s.get(a)[o]=c}function r(){s=new WeakMap}return{has:t,get:e,remove:n,update:i,dispose:r}}function ip(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.material.id!==t.material.id?s.material.id-t.material.id:s.z!==t.z?s.z-t.z:s.id-t.id}function po(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.z!==t.z?t.z-s.z:s.id-t.id}function mo(){const s=[];let t=0;const e=[],n=[],i=[];function r(){t=0,e.length=0,n.length=0,i.length=0}function a(u,f,p,g,v,m){let d=s[t];return d===void 0?(d={id:u.id,object:u,geometry:f,material:p,groupOrder:g,renderOrder:u.renderOrder,z:v,group:m},s[t]=d):(d.id=u.id,d.object=u,d.geometry=f,d.material=p,d.groupOrder=g,d.renderOrder=u.renderOrder,d.z=v,d.group=m),t++,d}function o(u,f,p,g,v,m){const d=a(u,f,p,g,v,m);p.transmission>0?n.push(d):p.transparent===!0?i.push(d):e.push(d)}function c(u,f,p,g,v,m){const d=a(u,f,p,g,v,m);p.transmission>0?n.unshift(d):p.transparent===!0?i.unshift(d):e.unshift(d)}function l(u,f){e.length>1&&e.sort(u||ip),n.length>1&&n.sort(f||po),i.length>1&&i.sort(f||po)}function h(){for(let u=t,f=s.length;u<f;u++){const p=s[u];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:e,transmissive:n,transparent:i,init:r,push:o,unshift:c,finish:h,sort:l}}function sp(){let s=new WeakMap;function t(n,i){const r=s.get(n);let a;return r===void 0?(a=new mo,s.set(n,[a])):i>=r.length?(a=new mo,r.push(a)):a=r[i],a}function e(){s=new WeakMap}return{get:t,dispose:e}}function rp(){const s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new E,color:new Ht};break;case"SpotLight":e={position:new E,direction:new E,color:new Ht,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new E,color:new Ht,distance:0,decay:0};break;case"HemisphereLight":e={direction:new E,skyColor:new Ht,groundColor:new Ht};break;case"RectAreaLight":e={color:new Ht,position:new E,halfWidth:new E,halfHeight:new E};break}return s[t.id]=e,e}}}function ap(){const s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Rt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Rt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Rt,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[t.id]=e,e}}}let op=0;function cp(s,t){return(t.castShadow?2:0)-(s.castShadow?2:0)+(t.map?1:0)-(s.map?1:0)}function lp(s){const t=new rp,e=ap(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new E);const i=new E,r=new ce,a=new ce;function o(l){let h=0,u=0,f=0;for(let S=0;S<9;S++)n.probe[S].set(0,0,0);let p=0,g=0,v=0,m=0,d=0,b=0,w=0,_=0,P=0,A=0,C=0;l.sort(cp);for(let S=0,x=l.length;S<x;S++){const R=l[S],O=R.color,N=R.intensity,G=R.distance,q=R.shadow&&R.shadow.map?R.shadow.map.texture:null;if(R.isAmbientLight)h+=O.r*N,u+=O.g*N,f+=O.b*N;else if(R.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(R.sh.coefficients[W],N);C++}else if(R.isDirectionalLight){const W=t.get(R);if(W.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){const K=R.shadow,z=e.get(R);z.shadowIntensity=K.intensity,z.shadowBias=K.bias,z.shadowNormalBias=K.normalBias,z.shadowRadius=K.radius,z.shadowMapSize=K.mapSize,n.directionalShadow[p]=z,n.directionalShadowMap[p]=q,n.directionalShadowMatrix[p]=R.shadow.matrix,b++}n.directional[p]=W,p++}else if(R.isSpotLight){const W=t.get(R);W.position.setFromMatrixPosition(R.matrixWorld),W.color.copy(O).multiplyScalar(N),W.distance=G,W.coneCos=Math.cos(R.angle),W.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),W.decay=R.decay,n.spot[v]=W;const K=R.shadow;if(R.map&&(n.spotLightMap[P]=R.map,P++,K.updateMatrices(R),R.castShadow&&A++),n.spotLightMatrix[v]=K.matrix,R.castShadow){const z=e.get(R);z.shadowIntensity=K.intensity,z.shadowBias=K.bias,z.shadowNormalBias=K.normalBias,z.shadowRadius=K.radius,z.shadowMapSize=K.mapSize,n.spotShadow[v]=z,n.spotShadowMap[v]=q,_++}v++}else if(R.isRectAreaLight){const W=t.get(R);W.color.copy(O).multiplyScalar(N),W.halfWidth.set(R.width*.5,0,0),W.halfHeight.set(0,R.height*.5,0),n.rectArea[m]=W,m++}else if(R.isPointLight){const W=t.get(R);if(W.color.copy(R.color).multiplyScalar(R.intensity),W.distance=R.distance,W.decay=R.decay,R.castShadow){const K=R.shadow,z=e.get(R);z.shadowIntensity=K.intensity,z.shadowBias=K.bias,z.shadowNormalBias=K.normalBias,z.shadowRadius=K.radius,z.shadowMapSize=K.mapSize,z.shadowCameraNear=K.camera.near,z.shadowCameraFar=K.camera.far,n.pointShadow[g]=z,n.pointShadowMap[g]=q,n.pointShadowMatrix[g]=R.shadow.matrix,w++}n.point[g]=W,g++}else if(R.isHemisphereLight){const W=t.get(R);W.skyColor.copy(R.color).multiplyScalar(N),W.groundColor.copy(R.groundColor).multiplyScalar(N),n.hemi[d]=W,d++}}m>0&&(s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=at.LTC_FLOAT_1,n.rectAreaLTC2=at.LTC_FLOAT_2):(n.rectAreaLTC1=at.LTC_HALF_1,n.rectAreaLTC2=at.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=f;const D=n.hash;(D.directionalLength!==p||D.pointLength!==g||D.spotLength!==v||D.rectAreaLength!==m||D.hemiLength!==d||D.numDirectionalShadows!==b||D.numPointShadows!==w||D.numSpotShadows!==_||D.numSpotMaps!==P||D.numLightProbes!==C)&&(n.directional.length=p,n.spot.length=v,n.rectArea.length=m,n.point.length=g,n.hemi.length=d,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.pointShadow.length=w,n.pointShadowMap.length=w,n.spotShadow.length=_,n.spotShadowMap.length=_,n.directionalShadowMatrix.length=b,n.pointShadowMatrix.length=w,n.spotLightMatrix.length=_+P-A,n.spotLightMap.length=P,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=C,D.directionalLength=p,D.pointLength=g,D.spotLength=v,D.rectAreaLength=m,D.hemiLength=d,D.numDirectionalShadows=b,D.numPointShadows=w,D.numSpotShadows=_,D.numSpotMaps=P,D.numLightProbes=C,n.version=op++)}function c(l,h){let u=0,f=0,p=0,g=0,v=0;const m=h.matrixWorldInverse;for(let d=0,b=l.length;d<b;d++){const w=l[d];if(w.isDirectionalLight){const _=n.directional[u];_.direction.setFromMatrixPosition(w.matrixWorld),i.setFromMatrixPosition(w.target.matrixWorld),_.direction.sub(i),_.direction.transformDirection(m),u++}else if(w.isSpotLight){const _=n.spot[p];_.position.setFromMatrixPosition(w.matrixWorld),_.position.applyMatrix4(m),_.direction.setFromMatrixPosition(w.matrixWorld),i.setFromMatrixPosition(w.target.matrixWorld),_.direction.sub(i),_.direction.transformDirection(m),p++}else if(w.isRectAreaLight){const _=n.rectArea[g];_.position.setFromMatrixPosition(w.matrixWorld),_.position.applyMatrix4(m),a.identity(),r.copy(w.matrixWorld),r.premultiply(m),a.extractRotation(r),_.halfWidth.set(w.width*.5,0,0),_.halfHeight.set(0,w.height*.5,0),_.halfWidth.applyMatrix4(a),_.halfHeight.applyMatrix4(a),g++}else if(w.isPointLight){const _=n.point[f];_.position.setFromMatrixPosition(w.matrixWorld),_.position.applyMatrix4(m),f++}else if(w.isHemisphereLight){const _=n.hemi[v];_.direction.setFromMatrixPosition(w.matrixWorld),_.direction.transformDirection(m),v++}}}return{setup:o,setupView:c,state:n}}function go(s){const t=new lp(s),e=[],n=[];function i(h){l.camera=h,e.length=0,n.length=0}function r(h){e.push(h)}function a(h){n.push(h)}function o(){t.setup(e)}function c(h){t.setupView(e,h)}const l={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:i,state:l,setupLights:o,setupLightsView:c,pushLight:r,pushShadow:a}}function hp(s){let t=new WeakMap;function e(i,r=0){const a=t.get(i);let o;return a===void 0?(o=new go(s),t.set(i,[o])):r>=a.length?(o=new go(s),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}class up extends Mi{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=Yc,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class dp extends Mi{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const fp=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,pp=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function mp(s,t,e){let n=new sa;const i=new Rt,r=new Rt,a=new Qt,o=new up({depthPacking:qc}),c=new dp,l={},h=e.maxTextureSize,u={[En]:Pe,[Pe]:En,[Ne]:Ne},f=new ye({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Rt},radius:{value:4}},vertexShader:fp,fragmentShader:pp}),p=f.clone();p.defines.HORIZONTAL_PASS=1;const g=new _e;g.setAttribute("position",new ve(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new I(g,f),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Kr;let d=this.type;this.render=function(A,C,D){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||A.length===0)return;const S=s.getRenderTarget(),x=s.getActiveCubeFace(),R=s.getActiveMipmapLevel(),O=s.state;O.setBlending(dn),O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);const N=d!==ln&&this.type===ln,G=d===ln&&this.type!==ln;for(let q=0,W=A.length;q<W;q++){const K=A[q],z=K.shadow;if(z===void 0){console.warn("THREE.WebGLShadowMap:",K,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;i.copy(z.mapSize);const Q=z.getFrameExtents();if(i.multiply(Q),r.copy(z.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(r.x=Math.floor(h/Q.x),i.x=r.x*Q.x,z.mapSize.x=r.x),i.y>h&&(r.y=Math.floor(h/Q.y),i.y=r.y*Q.y,z.mapSize.y=r.y)),z.map===null||N===!0||G===!0){const ot=this.type!==ln?{minFilter:Ke,magFilter:Ke}:{};z.map!==null&&z.map.dispose(),z.map=new He(i.x,i.y,ot),z.map.texture.name=K.name+".shadowMap",z.camera.updateProjectionMatrix()}s.setRenderTarget(z.map),s.clear();const nt=z.getViewportCount();for(let ot=0;ot<nt;ot++){const _t=z.getViewport(ot);a.set(r.x*_t.x,r.y*_t.y,r.x*_t.z,r.y*_t.w),O.viewport(a),z.updateMatrices(K,ot),n=z.getFrustum(),_(C,D,z.camera,K,this.type)}z.isPointLightShadow!==!0&&this.type===ln&&b(z,D),z.needsUpdate=!1}d=this.type,m.needsUpdate=!1,s.setRenderTarget(S,x,R)};function b(A,C){const D=t.update(v);f.defines.VSM_SAMPLES!==A.blurSamples&&(f.defines.VSM_SAMPLES=A.blurSamples,p.defines.VSM_SAMPLES=A.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new He(i.x,i.y)),f.uniforms.shadow_pass.value=A.map.texture,f.uniforms.resolution.value=A.mapSize,f.uniforms.radius.value=A.radius,s.setRenderTarget(A.mapPass),s.clear(),s.renderBufferDirect(C,null,D,f,v,null),p.uniforms.shadow_pass.value=A.mapPass.texture,p.uniforms.resolution.value=A.mapSize,p.uniforms.radius.value=A.radius,s.setRenderTarget(A.map),s.clear(),s.renderBufferDirect(C,null,D,p,v,null)}function w(A,C,D,S){let x=null;const R=D.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(R!==void 0)x=R;else if(x=D.isPointLight===!0?c:o,s.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0){const O=x.uuid,N=C.uuid;let G=l[O];G===void 0&&(G={},l[O]=G);let q=G[N];q===void 0&&(q=x.clone(),G[N]=q,C.addEventListener("dispose",P)),x=q}if(x.visible=C.visible,x.wireframe=C.wireframe,S===ln?x.side=C.shadowSide!==null?C.shadowSide:C.side:x.side=C.shadowSide!==null?C.shadowSide:u[C.side],x.alphaMap=C.alphaMap,x.alphaTest=C.alphaTest,x.map=C.map,x.clipShadows=C.clipShadows,x.clippingPlanes=C.clippingPlanes,x.clipIntersection=C.clipIntersection,x.displacementMap=C.displacementMap,x.displacementScale=C.displacementScale,x.displacementBias=C.displacementBias,x.wireframeLinewidth=C.wireframeLinewidth,x.linewidth=C.linewidth,D.isPointLight===!0&&x.isMeshDistanceMaterial===!0){const O=s.properties.get(x);O.light=D}return x}function _(A,C,D,S,x){if(A.visible===!1)return;if(A.layers.test(C.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&x===ln)&&(!A.frustumCulled||n.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(D.matrixWorldInverse,A.matrixWorld);const N=t.update(A),G=A.material;if(Array.isArray(G)){const q=N.groups;for(let W=0,K=q.length;W<K;W++){const z=q[W],Q=G[z.materialIndex];if(Q&&Q.visible){const nt=w(A,Q,S,x);A.onBeforeShadow(s,A,C,D,N,nt,z),s.renderBufferDirect(D,null,N,nt,A,z),A.onAfterShadow(s,A,C,D,N,nt,z)}}}else if(G.visible){const q=w(A,G,S,x);A.onBeforeShadow(s,A,C,D,N,q,null),s.renderBufferDirect(D,null,N,q,A,null),A.onAfterShadow(s,A,C,D,N,q,null)}}const O=A.children;for(let N=0,G=O.length;N<G;N++)_(O[N],C,D,S,x)}function P(A){A.target.removeEventListener("dispose",P);for(const D in l){const S=l[D],x=A.target.uuid;x in S&&(S[x].dispose(),delete S[x])}}}const gp={[hr]:ur,[dr]:mr,[fr]:gr,[ci]:pr,[ur]:hr,[mr]:dr,[gr]:fr,[pr]:ci};function vp(s,t){function e(){let L=!1;const lt=new Qt;let Y=null;const j=new Qt(0,0,0,0);return{setMask:function(pt){Y!==pt&&!L&&(s.colorMask(pt,pt,pt,pt),Y=pt)},setLocked:function(pt){L=pt},setClear:function(pt,dt,Ut,ue,xe){xe===!0&&(pt*=ue,dt*=ue,Ut*=ue),lt.set(pt,dt,Ut,ue),j.equals(lt)===!1&&(s.clearColor(pt,dt,Ut,ue),j.copy(lt))},reset:function(){L=!1,Y=null,j.set(-1,0,0,0)}}}function n(){let L=!1,lt=!1,Y=null,j=null,pt=null;return{setReversed:function(dt){if(lt!==dt){const Ut=t.get("EXT_clip_control");lt?Ut.clipControlEXT(Ut.LOWER_LEFT_EXT,Ut.ZERO_TO_ONE_EXT):Ut.clipControlEXT(Ut.LOWER_LEFT_EXT,Ut.NEGATIVE_ONE_TO_ONE_EXT);const ue=pt;pt=null,this.setClear(ue)}lt=dt},getReversed:function(){return lt},setTest:function(dt){dt?rt(s.DEPTH_TEST):yt(s.DEPTH_TEST)},setMask:function(dt){Y!==dt&&!L&&(s.depthMask(dt),Y=dt)},setFunc:function(dt){if(lt&&(dt=gp[dt]),j!==dt){switch(dt){case hr:s.depthFunc(s.NEVER);break;case ur:s.depthFunc(s.ALWAYS);break;case dr:s.depthFunc(s.LESS);break;case ci:s.depthFunc(s.LEQUAL);break;case fr:s.depthFunc(s.EQUAL);break;case pr:s.depthFunc(s.GEQUAL);break;case mr:s.depthFunc(s.GREATER);break;case gr:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}j=dt}},setLocked:function(dt){L=dt},setClear:function(dt){pt!==dt&&(lt&&(dt=1-dt),s.clearDepth(dt),pt=dt)},reset:function(){L=!1,Y=null,j=null,pt=null,lt=!1}}}function i(){let L=!1,lt=null,Y=null,j=null,pt=null,dt=null,Ut=null,ue=null,xe=null;return{setTest:function(jt){L||(jt?rt(s.STENCIL_TEST):yt(s.STENCIL_TEST))},setMask:function(jt){lt!==jt&&!L&&(s.stencilMask(jt),lt=jt)},setFunc:function(jt,Ve,en){(Y!==jt||j!==Ve||pt!==en)&&(s.stencilFunc(jt,Ve,en),Y=jt,j=Ve,pt=en)},setOp:function(jt,Ve,en){(dt!==jt||Ut!==Ve||ue!==en)&&(s.stencilOp(jt,Ve,en),dt=jt,Ut=Ve,ue=en)},setLocked:function(jt){L=jt},setClear:function(jt){xe!==jt&&(s.clearStencil(jt),xe=jt)},reset:function(){L=!1,lt=null,Y=null,j=null,pt=null,dt=null,Ut=null,ue=null,xe=null}}}const r=new e,a=new n,o=new i,c=new WeakMap,l=new WeakMap;let h={},u={},f=new WeakMap,p=[],g=null,v=!1,m=null,d=null,b=null,w=null,_=null,P=null,A=null,C=new Ht(0,0,0),D=0,S=!1,x=null,R=null,O=null,N=null,G=null;const q=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let W=!1,K=0;const z=s.getParameter(s.VERSION);z.indexOf("WebGL")!==-1?(K=parseFloat(/^WebGL (\d)/.exec(z)[1]),W=K>=1):z.indexOf("OpenGL ES")!==-1&&(K=parseFloat(/^OpenGL ES (\d)/.exec(z)[1]),W=K>=2);let Q=null,nt={};const ot=s.getParameter(s.SCISSOR_BOX),_t=s.getParameter(s.VIEWPORT),Lt=new Qt().fromArray(ot),X=new Qt().fromArray(_t);function tt(L,lt,Y,j){const pt=new Uint8Array(4),dt=s.createTexture();s.bindTexture(L,dt),s.texParameteri(L,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(L,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let Ut=0;Ut<Y;Ut++)L===s.TEXTURE_3D||L===s.TEXTURE_2D_ARRAY?s.texImage3D(lt,0,s.RGBA,1,1,j,0,s.RGBA,s.UNSIGNED_BYTE,pt):s.texImage2D(lt+Ut,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,pt);return dt}const ut={};ut[s.TEXTURE_2D]=tt(s.TEXTURE_2D,s.TEXTURE_2D,1),ut[s.TEXTURE_CUBE_MAP]=tt(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),ut[s.TEXTURE_2D_ARRAY]=tt(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),ut[s.TEXTURE_3D]=tt(s.TEXTURE_3D,s.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),rt(s.DEPTH_TEST),a.setFunc(ci),Dt(!1),Gt(xa),rt(s.CULL_FACE),F(dn);function rt(L){h[L]!==!0&&(s.enable(L),h[L]=!0)}function yt(L){h[L]!==!1&&(s.disable(L),h[L]=!1)}function Pt(L,lt){return u[L]!==lt?(s.bindFramebuffer(L,lt),u[L]=lt,L===s.DRAW_FRAMEBUFFER&&(u[s.FRAMEBUFFER]=lt),L===s.FRAMEBUFFER&&(u[s.DRAW_FRAMEBUFFER]=lt),!0):!1}function Nt(L,lt){let Y=p,j=!1;if(L){Y=f.get(lt),Y===void 0&&(Y=[],f.set(lt,Y));const pt=L.textures;if(Y.length!==pt.length||Y[0]!==s.COLOR_ATTACHMENT0){for(let dt=0,Ut=pt.length;dt<Ut;dt++)Y[dt]=s.COLOR_ATTACHMENT0+dt;Y.length=pt.length,j=!0}}else Y[0]!==s.BACK&&(Y[0]=s.BACK,j=!0);j&&s.drawBuffers(Y)}function ie(L){return g!==L?(s.useProgram(L),g=L,!0):!1}const Vt={[kn]:s.FUNC_ADD,[Ec]:s.FUNC_SUBTRACT,[Tc]:s.FUNC_REVERSE_SUBTRACT};Vt[Ac]=s.MIN,Vt[Cc]=s.MAX;const oe={[Rc]:s.ZERO,[Pc]:s.ONE,[Ic]:s.SRC_COLOR,[cr]:s.SRC_ALPHA,[Nc]:s.SRC_ALPHA_SATURATE,[Fc]:s.DST_COLOR,[Lc]:s.DST_ALPHA,[Dc]:s.ONE_MINUS_SRC_COLOR,[lr]:s.ONE_MINUS_SRC_ALPHA,[kc]:s.ONE_MINUS_DST_COLOR,[Uc]:s.ONE_MINUS_DST_ALPHA,[Bc]:s.CONSTANT_COLOR,[Oc]:s.ONE_MINUS_CONSTANT_COLOR,[zc]:s.CONSTANT_ALPHA,[Gc]:s.ONE_MINUS_CONSTANT_ALPHA};function F(L,lt,Y,j,pt,dt,Ut,ue,xe,jt){if(L===dn){v===!0&&(yt(s.BLEND),v=!1);return}if(v===!1&&(rt(s.BLEND),v=!0),L!==wc){if(L!==m||jt!==S){if((d!==kn||_!==kn)&&(s.blendEquation(s.FUNC_ADD),d=kn,_=kn),jt)switch(L){case On:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case oi:s.blendFunc(s.ONE,s.ONE);break;case Ma:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case Sa:s.blendFuncSeparate(s.ZERO,s.SRC_COLOR,s.ZERO,s.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}else switch(L){case On:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case oi:s.blendFunc(s.SRC_ALPHA,s.ONE);break;case Ma:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case Sa:s.blendFunc(s.ZERO,s.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}b=null,w=null,P=null,A=null,C.set(0,0,0),D=0,m=L,S=jt}return}pt=pt||lt,dt=dt||Y,Ut=Ut||j,(lt!==d||pt!==_)&&(s.blendEquationSeparate(Vt[lt],Vt[pt]),d=lt,_=pt),(Y!==b||j!==w||dt!==P||Ut!==A)&&(s.blendFuncSeparate(oe[Y],oe[j],oe[dt],oe[Ut]),b=Y,w=j,P=dt,A=Ut),(ue.equals(C)===!1||xe!==D)&&(s.blendColor(ue.r,ue.g,ue.b,xe),C.copy(ue),D=xe),m=L,S=!1}function he(L,lt){L.side===Ne?yt(s.CULL_FACE):rt(s.CULL_FACE);let Y=L.side===Pe;lt&&(Y=!Y),Dt(Y),L.blending===On&&L.transparent===!1?F(dn):F(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),a.setFunc(L.depthFunc),a.setTest(L.depthTest),a.setMask(L.depthWrite),r.setMask(L.colorWrite);const j=L.stencilWrite;o.setTest(j),j&&(o.setMask(L.stencilWriteMask),o.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),o.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),se(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?rt(s.SAMPLE_ALPHA_TO_COVERAGE):yt(s.SAMPLE_ALPHA_TO_COVERAGE)}function Dt(L){x!==L&&(L?s.frontFace(s.CW):s.frontFace(s.CCW),x=L)}function Gt(L){L!==Sc?(rt(s.CULL_FACE),L!==R&&(L===xa?s.cullFace(s.BACK):L===yc?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):yt(s.CULL_FACE),R=L}function Et(L){L!==O&&(W&&s.lineWidth(L),O=L)}function se(L,lt,Y){L?(rt(s.POLYGON_OFFSET_FILL),(N!==lt||G!==Y)&&(s.polygonOffset(lt,Y),N=lt,G=Y)):yt(s.POLYGON_OFFSET_FILL)}function Tt(L){L?rt(s.SCISSOR_TEST):yt(s.SCISSOR_TEST)}function T(L){L===void 0&&(L=s.TEXTURE0+q-1),Q!==L&&(s.activeTexture(L),Q=L)}function M(L,lt,Y){Y===void 0&&(Q===null?Y=s.TEXTURE0+q-1:Y=Q);let j=nt[Y];j===void 0&&(j={type:void 0,texture:void 0},nt[Y]=j),(j.type!==L||j.texture!==lt)&&(Q!==Y&&(s.activeTexture(Y),Q=Y),s.bindTexture(L,lt||ut[L]),j.type=L,j.texture=lt)}function B(){const L=nt[Q];L!==void 0&&L.type!==void 0&&(s.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function $(){try{s.compressedTexImage2D.apply(s,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function J(){try{s.compressedTexImage3D.apply(s,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Z(){try{s.texSubImage2D.apply(s,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function bt(){try{s.texSubImage3D.apply(s,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ht(){try{s.compressedTexSubImage2D.apply(s,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function mt(){try{s.compressedTexSubImage3D.apply(s,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function qt(){try{s.texStorage2D.apply(s,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function it(){try{s.texStorage3D.apply(s,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function gt(){try{s.texImage2D.apply(s,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function At(){try{s.texImage3D.apply(s,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ct(L){Lt.equals(L)===!1&&(s.scissor(L.x,L.y,L.z,L.w),Lt.copy(L))}function vt(L){X.equals(L)===!1&&(s.viewport(L.x,L.y,L.z,L.w),X.copy(L))}function Xt(L,lt){let Y=l.get(lt);Y===void 0&&(Y=new WeakMap,l.set(lt,Y));let j=Y.get(L);j===void 0&&(j=s.getUniformBlockIndex(lt,L.name),Y.set(L,j))}function Bt(L,lt){const j=l.get(lt).get(L);c.get(lt)!==j&&(s.uniformBlockBinding(lt,j,L.__bindingPointIndex),c.set(lt,j))}function ee(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),a.setReversed(!1),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),h={},Q=null,nt={},u={},f=new WeakMap,p=[],g=null,v=!1,m=null,d=null,b=null,w=null,_=null,P=null,A=null,C=new Ht(0,0,0),D=0,S=!1,x=null,R=null,O=null,N=null,G=null,Lt.set(0,0,s.canvas.width,s.canvas.height),X.set(0,0,s.canvas.width,s.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:rt,disable:yt,bindFramebuffer:Pt,drawBuffers:Nt,useProgram:ie,setBlending:F,setMaterial:he,setFlipSided:Dt,setCullFace:Gt,setLineWidth:Et,setPolygonOffset:se,setScissorTest:Tt,activeTexture:T,bindTexture:M,unbindTexture:B,compressedTexImage2D:$,compressedTexImage3D:J,texImage2D:gt,texImage3D:At,updateUBOMapping:Xt,uniformBlockBinding:Bt,texStorage2D:qt,texStorage3D:it,texSubImage2D:Z,texSubImage3D:bt,compressedTexSubImage2D:ht,compressedTexSubImage3D:mt,scissor:Ct,viewport:vt,reset:ee}}function vo(s,t,e,n){const i=_p(n);switch(e){case No:return s*t;case Oo:return s*t;case zo:return s*t*2;case Go:return s*t/i.components*i.byteLength;case ta:return s*t/i.components*i.byteLength;case Ho:return s*t*2/i.components*i.byteLength;case ea:return s*t*2/i.components*i.byteLength;case Bo:return s*t*3/i.components*i.byteLength;case Ge:return s*t*4/i.components*i.byteLength;case na:return s*t*4/i.components*i.byteLength;case ms:case gs:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case vs:case _s:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case Sr:case br:return Math.max(s,16)*Math.max(t,8)/4;case Mr:case yr:return Math.max(s,8)*Math.max(t,8)/2;case wr:case Er:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case Tr:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case Ar:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case Cr:return Math.floor((s+4)/5)*Math.floor((t+3)/4)*16;case Rr:return Math.floor((s+4)/5)*Math.floor((t+4)/5)*16;case Pr:return Math.floor((s+5)/6)*Math.floor((t+4)/5)*16;case Ir:return Math.floor((s+5)/6)*Math.floor((t+5)/6)*16;case Dr:return Math.floor((s+7)/8)*Math.floor((t+4)/5)*16;case Lr:return Math.floor((s+7)/8)*Math.floor((t+5)/6)*16;case Ur:return Math.floor((s+7)/8)*Math.floor((t+7)/8)*16;case Fr:return Math.floor((s+9)/10)*Math.floor((t+4)/5)*16;case kr:return Math.floor((s+9)/10)*Math.floor((t+5)/6)*16;case Nr:return Math.floor((s+9)/10)*Math.floor((t+7)/8)*16;case Br:return Math.floor((s+9)/10)*Math.floor((t+9)/10)*16;case Or:return Math.floor((s+11)/12)*Math.floor((t+9)/10)*16;case zr:return Math.floor((s+11)/12)*Math.floor((t+11)/12)*16;case xs:case Gr:case Hr:return Math.ceil(s/4)*Math.ceil(t/4)*16;case Vo:case Vr:return Math.ceil(s/4)*Math.ceil(t/4)*8;case Wr:case Xr:return Math.ceil(s/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function _p(s){switch(s){case pn:case Uo:return{byteLength:1,components:1};case Fi:case Fo:case tn:return{byteLength:2,components:1};case Jr:case Qr:return{byteLength:2,components:4};case zn:case jr:case hn:return{byteLength:4,components:1};case ko:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${s}.`)}function xp(s,t,e,n,i,r,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Rt,h=new WeakMap;let u;const f=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(T,M){return p?new OffscreenCanvas(T,M):ys("canvas")}function v(T,M,B){let $=1;const J=Tt(T);if((J.width>B||J.height>B)&&($=B/Math.max(J.width,J.height)),$<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){const Z=Math.floor($*J.width),bt=Math.floor($*J.height);u===void 0&&(u=g(Z,bt));const ht=M?g(Z,bt):u;return ht.width=Z,ht.height=bt,ht.getContext("2d").drawImage(T,0,0,Z,bt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+Z+"x"+bt+")."),ht}else return"data"in T&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),T;return T}function m(T){return T.generateMipmaps}function d(T){s.generateMipmap(T)}function b(T){return T.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?s.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?s.TEXTURE_2D_ARRAY:s.TEXTURE_2D}function w(T,M,B,$,J=!1){if(T!==null){if(s[T]!==void 0)return s[T];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let Z=M;if(M===s.RED&&(B===s.FLOAT&&(Z=s.R32F),B===s.HALF_FLOAT&&(Z=s.R16F),B===s.UNSIGNED_BYTE&&(Z=s.R8)),M===s.RED_INTEGER&&(B===s.UNSIGNED_BYTE&&(Z=s.R8UI),B===s.UNSIGNED_SHORT&&(Z=s.R16UI),B===s.UNSIGNED_INT&&(Z=s.R32UI),B===s.BYTE&&(Z=s.R8I),B===s.SHORT&&(Z=s.R16I),B===s.INT&&(Z=s.R32I)),M===s.RG&&(B===s.FLOAT&&(Z=s.RG32F),B===s.HALF_FLOAT&&(Z=s.RG16F),B===s.UNSIGNED_BYTE&&(Z=s.RG8)),M===s.RG_INTEGER&&(B===s.UNSIGNED_BYTE&&(Z=s.RG8UI),B===s.UNSIGNED_SHORT&&(Z=s.RG16UI),B===s.UNSIGNED_INT&&(Z=s.RG32UI),B===s.BYTE&&(Z=s.RG8I),B===s.SHORT&&(Z=s.RG16I),B===s.INT&&(Z=s.RG32I)),M===s.RGB_INTEGER&&(B===s.UNSIGNED_BYTE&&(Z=s.RGB8UI),B===s.UNSIGNED_SHORT&&(Z=s.RGB16UI),B===s.UNSIGNED_INT&&(Z=s.RGB32UI),B===s.BYTE&&(Z=s.RGB8I),B===s.SHORT&&(Z=s.RGB16I),B===s.INT&&(Z=s.RGB32I)),M===s.RGBA_INTEGER&&(B===s.UNSIGNED_BYTE&&(Z=s.RGBA8UI),B===s.UNSIGNED_SHORT&&(Z=s.RGBA16UI),B===s.UNSIGNED_INT&&(Z=s.RGBA32UI),B===s.BYTE&&(Z=s.RGBA8I),B===s.SHORT&&(Z=s.RGBA16I),B===s.INT&&(Z=s.RGBA32I)),M===s.RGB&&B===s.UNSIGNED_INT_5_9_9_9_REV&&(Z=s.RGB9_E5),M===s.RGBA){const bt=J?Es:Yt.getTransfer($);B===s.FLOAT&&(Z=s.RGBA32F),B===s.HALF_FLOAT&&(Z=s.RGBA16F),B===s.UNSIGNED_BYTE&&(Z=bt===Jt?s.SRGB8_ALPHA8:s.RGBA8),B===s.UNSIGNED_SHORT_4_4_4_4&&(Z=s.RGBA4),B===s.UNSIGNED_SHORT_5_5_5_1&&(Z=s.RGB5_A1)}return(Z===s.R16F||Z===s.R32F||Z===s.RG16F||Z===s.RG32F||Z===s.RGBA16F||Z===s.RGBA32F)&&t.get("EXT_color_buffer_float"),Z}function _(T,M){let B;return T?M===null||M===zn||M===ui?B=s.DEPTH24_STENCIL8:M===hn?B=s.DEPTH32F_STENCIL8:M===Fi&&(B=s.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):M===null||M===zn||M===ui?B=s.DEPTH_COMPONENT24:M===hn?B=s.DEPTH_COMPONENT32F:M===Fi&&(B=s.DEPTH_COMPONENT16),B}function P(T,M){return m(T)===!0||T.isFramebufferTexture&&T.minFilter!==Ke&&T.minFilter!==Te?Math.log2(Math.max(M.width,M.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?M.mipmaps.length:1}function A(T){const M=T.target;M.removeEventListener("dispose",A),D(M),M.isVideoTexture&&h.delete(M)}function C(T){const M=T.target;M.removeEventListener("dispose",C),x(M)}function D(T){const M=n.get(T);if(M.__webglInit===void 0)return;const B=T.source,$=f.get(B);if($){const J=$[M.__cacheKey];J.usedTimes--,J.usedTimes===0&&S(T),Object.keys($).length===0&&f.delete(B)}n.remove(T)}function S(T){const M=n.get(T);s.deleteTexture(M.__webglTexture);const B=T.source,$=f.get(B);delete $[M.__cacheKey],a.memory.textures--}function x(T){const M=n.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),n.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let $=0;$<6;$++){if(Array.isArray(M.__webglFramebuffer[$]))for(let J=0;J<M.__webglFramebuffer[$].length;J++)s.deleteFramebuffer(M.__webglFramebuffer[$][J]);else s.deleteFramebuffer(M.__webglFramebuffer[$]);M.__webglDepthbuffer&&s.deleteRenderbuffer(M.__webglDepthbuffer[$])}else{if(Array.isArray(M.__webglFramebuffer))for(let $=0;$<M.__webglFramebuffer.length;$++)s.deleteFramebuffer(M.__webglFramebuffer[$]);else s.deleteFramebuffer(M.__webglFramebuffer);if(M.__webglDepthbuffer&&s.deleteRenderbuffer(M.__webglDepthbuffer),M.__webglMultisampledFramebuffer&&s.deleteFramebuffer(M.__webglMultisampledFramebuffer),M.__webglColorRenderbuffer)for(let $=0;$<M.__webglColorRenderbuffer.length;$++)M.__webglColorRenderbuffer[$]&&s.deleteRenderbuffer(M.__webglColorRenderbuffer[$]);M.__webglDepthRenderbuffer&&s.deleteRenderbuffer(M.__webglDepthRenderbuffer)}const B=T.textures;for(let $=0,J=B.length;$<J;$++){const Z=n.get(B[$]);Z.__webglTexture&&(s.deleteTexture(Z.__webglTexture),a.memory.textures--),n.remove(B[$])}n.remove(T)}let R=0;function O(){R=0}function N(){const T=R;return T>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+i.maxTextures),R+=1,T}function G(T){const M=[];return M.push(T.wrapS),M.push(T.wrapT),M.push(T.wrapR||0),M.push(T.magFilter),M.push(T.minFilter),M.push(T.anisotropy),M.push(T.internalFormat),M.push(T.format),M.push(T.type),M.push(T.generateMipmaps),M.push(T.premultiplyAlpha),M.push(T.flipY),M.push(T.unpackAlignment),M.push(T.colorSpace),M.join()}function q(T,M){const B=n.get(T);if(T.isVideoTexture&&Et(T),T.isRenderTargetTexture===!1&&T.version>0&&B.__version!==T.version){const $=T.image;if($===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if($.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{X(B,T,M);return}}e.bindTexture(s.TEXTURE_2D,B.__webglTexture,s.TEXTURE0+M)}function W(T,M){const B=n.get(T);if(T.version>0&&B.__version!==T.version){X(B,T,M);return}e.bindTexture(s.TEXTURE_2D_ARRAY,B.__webglTexture,s.TEXTURE0+M)}function K(T,M){const B=n.get(T);if(T.version>0&&B.__version!==T.version){X(B,T,M);return}e.bindTexture(s.TEXTURE_3D,B.__webglTexture,s.TEXTURE0+M)}function z(T,M){const B=n.get(T);if(T.version>0&&B.__version!==T.version){tt(B,T,M);return}e.bindTexture(s.TEXTURE_CUBE_MAP,B.__webglTexture,s.TEXTURE0+M)}const Q={[te]:s.REPEAT,[Bn]:s.CLAMP_TO_EDGE,[xr]:s.MIRRORED_REPEAT},nt={[Ke]:s.NEAREST,[Xc]:s.NEAREST_MIPMAP_NEAREST,[Hi]:s.NEAREST_MIPMAP_LINEAR,[Te]:s.LINEAR,[Ds]:s.LINEAR_MIPMAP_NEAREST,[Qe]:s.LINEAR_MIPMAP_LINEAR},ot={[Kc]:s.NEVER,[el]:s.ALWAYS,[$c]:s.LESS,[Xo]:s.LEQUAL,[jc]:s.EQUAL,[tl]:s.GEQUAL,[Jc]:s.GREATER,[Qc]:s.NOTEQUAL};function _t(T,M){if(M.type===hn&&t.has("OES_texture_float_linear")===!1&&(M.magFilter===Te||M.magFilter===Ds||M.magFilter===Hi||M.magFilter===Qe||M.minFilter===Te||M.minFilter===Ds||M.minFilter===Hi||M.minFilter===Qe)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(T,s.TEXTURE_WRAP_S,Q[M.wrapS]),s.texParameteri(T,s.TEXTURE_WRAP_T,Q[M.wrapT]),(T===s.TEXTURE_3D||T===s.TEXTURE_2D_ARRAY)&&s.texParameteri(T,s.TEXTURE_WRAP_R,Q[M.wrapR]),s.texParameteri(T,s.TEXTURE_MAG_FILTER,nt[M.magFilter]),s.texParameteri(T,s.TEXTURE_MIN_FILTER,nt[M.minFilter]),M.compareFunction&&(s.texParameteri(T,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(T,s.TEXTURE_COMPARE_FUNC,ot[M.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(M.magFilter===Ke||M.minFilter!==Hi&&M.minFilter!==Qe||M.type===hn&&t.has("OES_texture_float_linear")===!1)return;if(M.anisotropy>1||n.get(M).__currentAnisotropy){const B=t.get("EXT_texture_filter_anisotropic");s.texParameterf(T,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,i.getMaxAnisotropy())),n.get(M).__currentAnisotropy=M.anisotropy}}}function Lt(T,M){let B=!1;T.__webglInit===void 0&&(T.__webglInit=!0,M.addEventListener("dispose",A));const $=M.source;let J=f.get($);J===void 0&&(J={},f.set($,J));const Z=G(M);if(Z!==T.__cacheKey){J[Z]===void 0&&(J[Z]={texture:s.createTexture(),usedTimes:0},a.memory.textures++,B=!0),J[Z].usedTimes++;const bt=J[T.__cacheKey];bt!==void 0&&(J[T.__cacheKey].usedTimes--,bt.usedTimes===0&&S(M)),T.__cacheKey=Z,T.__webglTexture=J[Z].texture}return B}function X(T,M,B){let $=s.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&($=s.TEXTURE_2D_ARRAY),M.isData3DTexture&&($=s.TEXTURE_3D);const J=Lt(T,M),Z=M.source;e.bindTexture($,T.__webglTexture,s.TEXTURE0+B);const bt=n.get(Z);if(Z.version!==bt.__version||J===!0){e.activeTexture(s.TEXTURE0+B);const ht=Yt.getPrimaries(Yt.workingColorSpace),mt=M.colorSpace===bn?null:Yt.getPrimaries(M.colorSpace),qt=M.colorSpace===bn||ht===mt?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,M.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,M.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,qt);let it=v(M.image,!1,i.maxTextureSize);it=se(M,it);const gt=r.convert(M.format,M.colorSpace),At=r.convert(M.type);let Ct=w(M.internalFormat,gt,At,M.colorSpace,M.isVideoTexture);_t($,M);let vt;const Xt=M.mipmaps,Bt=M.isVideoTexture!==!0,ee=bt.__version===void 0||J===!0,L=Z.dataReady,lt=P(M,it);if(M.isDepthTexture)Ct=_(M.format===di,M.type),ee&&(Bt?e.texStorage2D(s.TEXTURE_2D,1,Ct,it.width,it.height):e.texImage2D(s.TEXTURE_2D,0,Ct,it.width,it.height,0,gt,At,null));else if(M.isDataTexture)if(Xt.length>0){Bt&&ee&&e.texStorage2D(s.TEXTURE_2D,lt,Ct,Xt[0].width,Xt[0].height);for(let Y=0,j=Xt.length;Y<j;Y++)vt=Xt[Y],Bt?L&&e.texSubImage2D(s.TEXTURE_2D,Y,0,0,vt.width,vt.height,gt,At,vt.data):e.texImage2D(s.TEXTURE_2D,Y,Ct,vt.width,vt.height,0,gt,At,vt.data);M.generateMipmaps=!1}else Bt?(ee&&e.texStorage2D(s.TEXTURE_2D,lt,Ct,it.width,it.height),L&&e.texSubImage2D(s.TEXTURE_2D,0,0,0,it.width,it.height,gt,At,it.data)):e.texImage2D(s.TEXTURE_2D,0,Ct,it.width,it.height,0,gt,At,it.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){Bt&&ee&&e.texStorage3D(s.TEXTURE_2D_ARRAY,lt,Ct,Xt[0].width,Xt[0].height,it.depth);for(let Y=0,j=Xt.length;Y<j;Y++)if(vt=Xt[Y],M.format!==Ge)if(gt!==null)if(Bt){if(L)if(M.layerUpdates.size>0){const pt=vo(vt.width,vt.height,M.format,M.type);for(const dt of M.layerUpdates){const Ut=vt.data.subarray(dt*pt/vt.data.BYTES_PER_ELEMENT,(dt+1)*pt/vt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,Y,0,0,dt,vt.width,vt.height,1,gt,Ut)}M.clearLayerUpdates()}else e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,Y,0,0,0,vt.width,vt.height,it.depth,gt,vt.data)}else e.compressedTexImage3D(s.TEXTURE_2D_ARRAY,Y,Ct,vt.width,vt.height,it.depth,0,vt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Bt?L&&e.texSubImage3D(s.TEXTURE_2D_ARRAY,Y,0,0,0,vt.width,vt.height,it.depth,gt,At,vt.data):e.texImage3D(s.TEXTURE_2D_ARRAY,Y,Ct,vt.width,vt.height,it.depth,0,gt,At,vt.data)}else{Bt&&ee&&e.texStorage2D(s.TEXTURE_2D,lt,Ct,Xt[0].width,Xt[0].height);for(let Y=0,j=Xt.length;Y<j;Y++)vt=Xt[Y],M.format!==Ge?gt!==null?Bt?L&&e.compressedTexSubImage2D(s.TEXTURE_2D,Y,0,0,vt.width,vt.height,gt,vt.data):e.compressedTexImage2D(s.TEXTURE_2D,Y,Ct,vt.width,vt.height,0,vt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Bt?L&&e.texSubImage2D(s.TEXTURE_2D,Y,0,0,vt.width,vt.height,gt,At,vt.data):e.texImage2D(s.TEXTURE_2D,Y,Ct,vt.width,vt.height,0,gt,At,vt.data)}else if(M.isDataArrayTexture)if(Bt){if(ee&&e.texStorage3D(s.TEXTURE_2D_ARRAY,lt,Ct,it.width,it.height,it.depth),L)if(M.layerUpdates.size>0){const Y=vo(it.width,it.height,M.format,M.type);for(const j of M.layerUpdates){const pt=it.data.subarray(j*Y/it.data.BYTES_PER_ELEMENT,(j+1)*Y/it.data.BYTES_PER_ELEMENT);e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,j,it.width,it.height,1,gt,At,pt)}M.clearLayerUpdates()}else e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,it.width,it.height,it.depth,gt,At,it.data)}else e.texImage3D(s.TEXTURE_2D_ARRAY,0,Ct,it.width,it.height,it.depth,0,gt,At,it.data);else if(M.isData3DTexture)Bt?(ee&&e.texStorage3D(s.TEXTURE_3D,lt,Ct,it.width,it.height,it.depth),L&&e.texSubImage3D(s.TEXTURE_3D,0,0,0,0,it.width,it.height,it.depth,gt,At,it.data)):e.texImage3D(s.TEXTURE_3D,0,Ct,it.width,it.height,it.depth,0,gt,At,it.data);else if(M.isFramebufferTexture){if(ee)if(Bt)e.texStorage2D(s.TEXTURE_2D,lt,Ct,it.width,it.height);else{let Y=it.width,j=it.height;for(let pt=0;pt<lt;pt++)e.texImage2D(s.TEXTURE_2D,pt,Ct,Y,j,0,gt,At,null),Y>>=1,j>>=1}}else if(Xt.length>0){if(Bt&&ee){const Y=Tt(Xt[0]);e.texStorage2D(s.TEXTURE_2D,lt,Ct,Y.width,Y.height)}for(let Y=0,j=Xt.length;Y<j;Y++)vt=Xt[Y],Bt?L&&e.texSubImage2D(s.TEXTURE_2D,Y,0,0,gt,At,vt):e.texImage2D(s.TEXTURE_2D,Y,Ct,gt,At,vt);M.generateMipmaps=!1}else if(Bt){if(ee){const Y=Tt(it);e.texStorage2D(s.TEXTURE_2D,lt,Ct,Y.width,Y.height)}L&&e.texSubImage2D(s.TEXTURE_2D,0,0,0,gt,At,it)}else e.texImage2D(s.TEXTURE_2D,0,Ct,gt,At,it);m(M)&&d($),bt.__version=Z.version,M.onUpdate&&M.onUpdate(M)}T.__version=M.version}function tt(T,M,B){if(M.image.length!==6)return;const $=Lt(T,M),J=M.source;e.bindTexture(s.TEXTURE_CUBE_MAP,T.__webglTexture,s.TEXTURE0+B);const Z=n.get(J);if(J.version!==Z.__version||$===!0){e.activeTexture(s.TEXTURE0+B);const bt=Yt.getPrimaries(Yt.workingColorSpace),ht=M.colorSpace===bn?null:Yt.getPrimaries(M.colorSpace),mt=M.colorSpace===bn||bt===ht?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,M.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,M.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,mt);const qt=M.isCompressedTexture||M.image[0].isCompressedTexture,it=M.image[0]&&M.image[0].isDataTexture,gt=[];for(let j=0;j<6;j++)!qt&&!it?gt[j]=v(M.image[j],!0,i.maxCubemapSize):gt[j]=it?M.image[j].image:M.image[j],gt[j]=se(M,gt[j]);const At=gt[0],Ct=r.convert(M.format,M.colorSpace),vt=r.convert(M.type),Xt=w(M.internalFormat,Ct,vt,M.colorSpace),Bt=M.isVideoTexture!==!0,ee=Z.__version===void 0||$===!0,L=J.dataReady;let lt=P(M,At);_t(s.TEXTURE_CUBE_MAP,M);let Y;if(qt){Bt&&ee&&e.texStorage2D(s.TEXTURE_CUBE_MAP,lt,Xt,At.width,At.height);for(let j=0;j<6;j++){Y=gt[j].mipmaps;for(let pt=0;pt<Y.length;pt++){const dt=Y[pt];M.format!==Ge?Ct!==null?Bt?L&&e.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,pt,0,0,dt.width,dt.height,Ct,dt.data):e.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,pt,Xt,dt.width,dt.height,0,dt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Bt?L&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,pt,0,0,dt.width,dt.height,Ct,vt,dt.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,pt,Xt,dt.width,dt.height,0,Ct,vt,dt.data)}}}else{if(Y=M.mipmaps,Bt&&ee){Y.length>0&&lt++;const j=Tt(gt[0]);e.texStorage2D(s.TEXTURE_CUBE_MAP,lt,Xt,j.width,j.height)}for(let j=0;j<6;j++)if(it){Bt?L&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,gt[j].width,gt[j].height,Ct,vt,gt[j].data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Xt,gt[j].width,gt[j].height,0,Ct,vt,gt[j].data);for(let pt=0;pt<Y.length;pt++){const Ut=Y[pt].image[j].image;Bt?L&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,pt+1,0,0,Ut.width,Ut.height,Ct,vt,Ut.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,pt+1,Xt,Ut.width,Ut.height,0,Ct,vt,Ut.data)}}else{Bt?L&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,Ct,vt,gt[j]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Xt,Ct,vt,gt[j]);for(let pt=0;pt<Y.length;pt++){const dt=Y[pt];Bt?L&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,pt+1,0,0,Ct,vt,dt.image[j]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,pt+1,Xt,Ct,vt,dt.image[j])}}}m(M)&&d(s.TEXTURE_CUBE_MAP),Z.__version=J.version,M.onUpdate&&M.onUpdate(M)}T.__version=M.version}function ut(T,M,B,$,J,Z){const bt=r.convert(B.format,B.colorSpace),ht=r.convert(B.type),mt=w(B.internalFormat,bt,ht,B.colorSpace),qt=n.get(M),it=n.get(B);if(it.__renderTarget=M,!qt.__hasExternalTextures){const gt=Math.max(1,M.width>>Z),At=Math.max(1,M.height>>Z);J===s.TEXTURE_3D||J===s.TEXTURE_2D_ARRAY?e.texImage3D(J,Z,mt,gt,At,M.depth,0,bt,ht,null):e.texImage2D(J,Z,mt,gt,At,0,bt,ht,null)}e.bindFramebuffer(s.FRAMEBUFFER,T),Gt(M)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,$,J,it.__webglTexture,0,Dt(M)):(J===s.TEXTURE_2D||J>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,$,J,it.__webglTexture,Z),e.bindFramebuffer(s.FRAMEBUFFER,null)}function rt(T,M,B){if(s.bindRenderbuffer(s.RENDERBUFFER,T),M.depthBuffer){const $=M.depthTexture,J=$&&$.isDepthTexture?$.type:null,Z=_(M.stencilBuffer,J),bt=M.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,ht=Dt(M);Gt(M)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,ht,Z,M.width,M.height):B?s.renderbufferStorageMultisample(s.RENDERBUFFER,ht,Z,M.width,M.height):s.renderbufferStorage(s.RENDERBUFFER,Z,M.width,M.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,bt,s.RENDERBUFFER,T)}else{const $=M.textures;for(let J=0;J<$.length;J++){const Z=$[J],bt=r.convert(Z.format,Z.colorSpace),ht=r.convert(Z.type),mt=w(Z.internalFormat,bt,ht,Z.colorSpace),qt=Dt(M);B&&Gt(M)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,qt,mt,M.width,M.height):Gt(M)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,qt,mt,M.width,M.height):s.renderbufferStorage(s.RENDERBUFFER,mt,M.width,M.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function yt(T,M){if(M&&M.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(s.FRAMEBUFFER,T),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const $=n.get(M.depthTexture);$.__renderTarget=M,(!$.__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),q(M.depthTexture,0);const J=$.__webglTexture,Z=Dt(M);if(M.depthTexture.format===ri)Gt(M)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,J,0,Z):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,J,0);else if(M.depthTexture.format===di)Gt(M)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,J,0,Z):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,J,0);else throw new Error("Unknown depthTexture format")}function Pt(T){const M=n.get(T),B=T.isWebGLCubeRenderTarget===!0;if(M.__boundDepthTexture!==T.depthTexture){const $=T.depthTexture;if(M.__depthDisposeCallback&&M.__depthDisposeCallback(),$){const J=()=>{delete M.__boundDepthTexture,delete M.__depthDisposeCallback,$.removeEventListener("dispose",J)};$.addEventListener("dispose",J),M.__depthDisposeCallback=J}M.__boundDepthTexture=$}if(T.depthTexture&&!M.__autoAllocateDepthBuffer){if(B)throw new Error("target.depthTexture not supported in Cube render targets");yt(M.__webglFramebuffer,T)}else if(B){M.__webglDepthbuffer=[];for(let $=0;$<6;$++)if(e.bindFramebuffer(s.FRAMEBUFFER,M.__webglFramebuffer[$]),M.__webglDepthbuffer[$]===void 0)M.__webglDepthbuffer[$]=s.createRenderbuffer(),rt(M.__webglDepthbuffer[$],T,!1);else{const J=T.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,Z=M.__webglDepthbuffer[$];s.bindRenderbuffer(s.RENDERBUFFER,Z),s.framebufferRenderbuffer(s.FRAMEBUFFER,J,s.RENDERBUFFER,Z)}}else if(e.bindFramebuffer(s.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer===void 0)M.__webglDepthbuffer=s.createRenderbuffer(),rt(M.__webglDepthbuffer,T,!1);else{const $=T.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,J=M.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,J),s.framebufferRenderbuffer(s.FRAMEBUFFER,$,s.RENDERBUFFER,J)}e.bindFramebuffer(s.FRAMEBUFFER,null)}function Nt(T,M,B){const $=n.get(T);M!==void 0&&ut($.__webglFramebuffer,T,T.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),B!==void 0&&Pt(T)}function ie(T){const M=T.texture,B=n.get(T),$=n.get(M);T.addEventListener("dispose",C);const J=T.textures,Z=T.isWebGLCubeRenderTarget===!0,bt=J.length>1;if(bt||($.__webglTexture===void 0&&($.__webglTexture=s.createTexture()),$.__version=M.version,a.memory.textures++),Z){B.__webglFramebuffer=[];for(let ht=0;ht<6;ht++)if(M.mipmaps&&M.mipmaps.length>0){B.__webglFramebuffer[ht]=[];for(let mt=0;mt<M.mipmaps.length;mt++)B.__webglFramebuffer[ht][mt]=s.createFramebuffer()}else B.__webglFramebuffer[ht]=s.createFramebuffer()}else{if(M.mipmaps&&M.mipmaps.length>0){B.__webglFramebuffer=[];for(let ht=0;ht<M.mipmaps.length;ht++)B.__webglFramebuffer[ht]=s.createFramebuffer()}else B.__webglFramebuffer=s.createFramebuffer();if(bt)for(let ht=0,mt=J.length;ht<mt;ht++){const qt=n.get(J[ht]);qt.__webglTexture===void 0&&(qt.__webglTexture=s.createTexture(),a.memory.textures++)}if(T.samples>0&&Gt(T)===!1){B.__webglMultisampledFramebuffer=s.createFramebuffer(),B.__webglColorRenderbuffer=[],e.bindFramebuffer(s.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let ht=0;ht<J.length;ht++){const mt=J[ht];B.__webglColorRenderbuffer[ht]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,B.__webglColorRenderbuffer[ht]);const qt=r.convert(mt.format,mt.colorSpace),it=r.convert(mt.type),gt=w(mt.internalFormat,qt,it,mt.colorSpace,T.isXRRenderTarget===!0),At=Dt(T);s.renderbufferStorageMultisample(s.RENDERBUFFER,At,gt,T.width,T.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+ht,s.RENDERBUFFER,B.__webglColorRenderbuffer[ht])}s.bindRenderbuffer(s.RENDERBUFFER,null),T.depthBuffer&&(B.__webglDepthRenderbuffer=s.createRenderbuffer(),rt(B.__webglDepthRenderbuffer,T,!0)),e.bindFramebuffer(s.FRAMEBUFFER,null)}}if(Z){e.bindTexture(s.TEXTURE_CUBE_MAP,$.__webglTexture),_t(s.TEXTURE_CUBE_MAP,M);for(let ht=0;ht<6;ht++)if(M.mipmaps&&M.mipmaps.length>0)for(let mt=0;mt<M.mipmaps.length;mt++)ut(B.__webglFramebuffer[ht][mt],T,M,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+ht,mt);else ut(B.__webglFramebuffer[ht],T,M,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+ht,0);m(M)&&d(s.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(bt){for(let ht=0,mt=J.length;ht<mt;ht++){const qt=J[ht],it=n.get(qt);e.bindTexture(s.TEXTURE_2D,it.__webglTexture),_t(s.TEXTURE_2D,qt),ut(B.__webglFramebuffer,T,qt,s.COLOR_ATTACHMENT0+ht,s.TEXTURE_2D,0),m(qt)&&d(s.TEXTURE_2D)}e.unbindTexture()}else{let ht=s.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(ht=T.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),e.bindTexture(ht,$.__webglTexture),_t(ht,M),M.mipmaps&&M.mipmaps.length>0)for(let mt=0;mt<M.mipmaps.length;mt++)ut(B.__webglFramebuffer[mt],T,M,s.COLOR_ATTACHMENT0,ht,mt);else ut(B.__webglFramebuffer,T,M,s.COLOR_ATTACHMENT0,ht,0);m(M)&&d(ht),e.unbindTexture()}T.depthBuffer&&Pt(T)}function Vt(T){const M=T.textures;for(let B=0,$=M.length;B<$;B++){const J=M[B];if(m(J)){const Z=b(T),bt=n.get(J).__webglTexture;e.bindTexture(Z,bt),d(Z),e.unbindTexture()}}}const oe=[],F=[];function he(T){if(T.samples>0){if(Gt(T)===!1){const M=T.textures,B=T.width,$=T.height;let J=s.COLOR_BUFFER_BIT;const Z=T.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,bt=n.get(T),ht=M.length>1;if(ht)for(let mt=0;mt<M.length;mt++)e.bindFramebuffer(s.FRAMEBUFFER,bt.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+mt,s.RENDERBUFFER,null),e.bindFramebuffer(s.FRAMEBUFFER,bt.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+mt,s.TEXTURE_2D,null,0);e.bindFramebuffer(s.READ_FRAMEBUFFER,bt.__webglMultisampledFramebuffer),e.bindFramebuffer(s.DRAW_FRAMEBUFFER,bt.__webglFramebuffer);for(let mt=0;mt<M.length;mt++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(J|=s.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(J|=s.STENCIL_BUFFER_BIT)),ht){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,bt.__webglColorRenderbuffer[mt]);const qt=n.get(M[mt]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,qt,0)}s.blitFramebuffer(0,0,B,$,0,0,B,$,J,s.NEAREST),c===!0&&(oe.length=0,F.length=0,oe.push(s.COLOR_ATTACHMENT0+mt),T.depthBuffer&&T.resolveDepthBuffer===!1&&(oe.push(Z),F.push(Z),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,F)),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,oe))}if(e.bindFramebuffer(s.READ_FRAMEBUFFER,null),e.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),ht)for(let mt=0;mt<M.length;mt++){e.bindFramebuffer(s.FRAMEBUFFER,bt.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+mt,s.RENDERBUFFER,bt.__webglColorRenderbuffer[mt]);const qt=n.get(M[mt]).__webglTexture;e.bindFramebuffer(s.FRAMEBUFFER,bt.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+mt,s.TEXTURE_2D,qt,0)}e.bindFramebuffer(s.DRAW_FRAMEBUFFER,bt.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&c){const M=T.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[M])}}}function Dt(T){return Math.min(i.maxSamples,T.samples)}function Gt(T){const M=n.get(T);return T.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function Et(T){const M=a.render.frame;h.get(T)!==M&&(h.set(T,M),T.update())}function se(T,M){const B=T.colorSpace,$=T.format,J=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||B!==vi&&B!==bn&&(Yt.getTransfer(B)===Jt?($!==Ge||J!==pn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",B)),M}function Tt(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(l.width=T.naturalWidth||T.width,l.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(l.width=T.displayWidth,l.height=T.displayHeight):(l.width=T.width,l.height=T.height),l}this.allocateTextureUnit=N,this.resetTextureUnits=O,this.setTexture2D=q,this.setTexture2DArray=W,this.setTexture3D=K,this.setTextureCube=z,this.rebindTextures=Nt,this.setupRenderTarget=ie,this.updateRenderTargetMipmap=Vt,this.updateMultisampleRenderTarget=he,this.setupDepthRenderbuffer=Pt,this.setupFrameBufferTexture=ut,this.useMultisampledRTT=Gt}function Mp(s,t){function e(n,i=bn){let r;const a=Yt.getTransfer(i);if(n===pn)return s.UNSIGNED_BYTE;if(n===Jr)return s.UNSIGNED_SHORT_4_4_4_4;if(n===Qr)return s.UNSIGNED_SHORT_5_5_5_1;if(n===ko)return s.UNSIGNED_INT_5_9_9_9_REV;if(n===Uo)return s.BYTE;if(n===Fo)return s.SHORT;if(n===Fi)return s.UNSIGNED_SHORT;if(n===jr)return s.INT;if(n===zn)return s.UNSIGNED_INT;if(n===hn)return s.FLOAT;if(n===tn)return s.HALF_FLOAT;if(n===No)return s.ALPHA;if(n===Bo)return s.RGB;if(n===Ge)return s.RGBA;if(n===Oo)return s.LUMINANCE;if(n===zo)return s.LUMINANCE_ALPHA;if(n===ri)return s.DEPTH_COMPONENT;if(n===di)return s.DEPTH_STENCIL;if(n===Go)return s.RED;if(n===ta)return s.RED_INTEGER;if(n===Ho)return s.RG;if(n===ea)return s.RG_INTEGER;if(n===na)return s.RGBA_INTEGER;if(n===ms||n===gs||n===vs||n===_s)if(a===Jt)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===ms)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===gs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===vs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===_s)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===ms)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===gs)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===vs)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===_s)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Mr||n===Sr||n===yr||n===br)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Mr)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Sr)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===yr)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===br)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===wr||n===Er||n===Tr)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===wr||n===Er)return a===Jt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Tr)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Ar||n===Cr||n===Rr||n===Pr||n===Ir||n===Dr||n===Lr||n===Ur||n===Fr||n===kr||n===Nr||n===Br||n===Or||n===zr)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Ar)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Cr)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Rr)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Pr)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ir)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Dr)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Lr)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Ur)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Fr)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===kr)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Nr)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Br)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Or)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===zr)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===xs||n===Gr||n===Hr)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===xs)return a===Jt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Gr)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Hr)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Vo||n===Vr||n===Wr||n===Xr)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===xs)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Vr)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Wr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Xr)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ui?s.UNSIGNED_INT_24_8:s[n]!==void 0?s[n]:null}return{convert:e}}class Sp extends Re{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class Wt extends de{constructor(){super(),this.isGroup=!0,this.type="Group"}}const yp={type:"move"};class rr{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Wt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Wt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new E,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new E),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Wt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new E,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new E),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let i=null,r=null,a=null;const o=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){a=!0;for(const v of t.hand.values()){const m=e.getJointPose(v,n),d=this._getHandJoint(l,v);m!==null&&(d.matrix.fromArray(m.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=m.radius),d.visible=m!==null}const h=l.joints["index-finger-tip"],u=l.joints["thumb-tip"],f=h.position.distanceTo(u.position),p=.02,g=.005;l.inputState.pinching&&f>p+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&f<=p-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));o!==null&&(i=e.getPose(t.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(yp)))}return o!==null&&(o.visible=i!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new Wt;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const bp=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,wp=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Ep{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const i=new Ae,r=t.properties.get(i);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new ye({vertexShader:bp,fragmentShader:wp,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new I(new ze(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Tp extends _i{constructor(t,e){super();const n=this;let i=null,r=1,a=null,o="local-floor",c=1,l=null,h=null,u=null,f=null,p=null,g=null;const v=new Ep,m=e.getContextAttributes();let d=null,b=null;const w=[],_=[],P=new Rt;let A=null;const C=new Re;C.viewport=new Qt;const D=new Re;D.viewport=new Qt;const S=[C,D],x=new Sp;let R=null,O=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(X){let tt=w[X];return tt===void 0&&(tt=new rr,w[X]=tt),tt.getTargetRaySpace()},this.getControllerGrip=function(X){let tt=w[X];return tt===void 0&&(tt=new rr,w[X]=tt),tt.getGripSpace()},this.getHand=function(X){let tt=w[X];return tt===void 0&&(tt=new rr,w[X]=tt),tt.getHandSpace()};function N(X){const tt=_.indexOf(X.inputSource);if(tt===-1)return;const ut=w[tt];ut!==void 0&&(ut.update(X.inputSource,X.frame,l||a),ut.dispatchEvent({type:X.type,data:X.inputSource}))}function G(){i.removeEventListener("select",N),i.removeEventListener("selectstart",N),i.removeEventListener("selectend",N),i.removeEventListener("squeeze",N),i.removeEventListener("squeezestart",N),i.removeEventListener("squeezeend",N),i.removeEventListener("end",G),i.removeEventListener("inputsourceschange",q);for(let X=0;X<w.length;X++){const tt=_[X];tt!==null&&(_[X]=null,w[X].disconnect(tt))}R=null,O=null,v.reset(),t.setRenderTarget(d),p=null,f=null,u=null,i=null,b=null,Lt.stop(),n.isPresenting=!1,t.setPixelRatio(A),t.setSize(P.width,P.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(X){r=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(X){o=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(X){l=X},this.getBaseLayer=function(){return f!==null?f:p},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function(X){if(i=X,i!==null){if(d=t.getRenderTarget(),i.addEventListener("select",N),i.addEventListener("selectstart",N),i.addEventListener("selectend",N),i.addEventListener("squeeze",N),i.addEventListener("squeezestart",N),i.addEventListener("squeezeend",N),i.addEventListener("end",G),i.addEventListener("inputsourceschange",q),m.xrCompatible!==!0&&await e.makeXRCompatible(),A=t.getPixelRatio(),t.getSize(P),i.renderState.layers===void 0){const tt={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(i,e,tt),i.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),b=new He(p.framebufferWidth,p.framebufferHeight,{format:Ge,type:pn,colorSpace:t.outputColorSpace,stencilBuffer:m.stencil})}else{let tt=null,ut=null,rt=null;m.depth&&(rt=m.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,tt=m.stencil?di:ri,ut=m.stencil?ui:zn);const yt={colorFormat:e.RGBA8,depthFormat:rt,scaleFactor:r};u=new XRWebGLBinding(i,e),f=u.createProjectionLayer(yt),i.updateRenderState({layers:[f]}),t.setPixelRatio(1),t.setSize(f.textureWidth,f.textureHeight,!1),b=new He(f.textureWidth,f.textureHeight,{format:Ge,type:pn,depthTexture:new sc(f.textureWidth,f.textureHeight,ut,void 0,void 0,void 0,void 0,void 0,void 0,tt),stencilBuffer:m.stencil,colorSpace:t.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await i.requestReferenceSpace(o),Lt.setContext(i),Lt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function q(X){for(let tt=0;tt<X.removed.length;tt++){const ut=X.removed[tt],rt=_.indexOf(ut);rt>=0&&(_[rt]=null,w[rt].disconnect(ut))}for(let tt=0;tt<X.added.length;tt++){const ut=X.added[tt];let rt=_.indexOf(ut);if(rt===-1){for(let Pt=0;Pt<w.length;Pt++)if(Pt>=_.length){_.push(ut),rt=Pt;break}else if(_[Pt]===null){_[Pt]=ut,rt=Pt;break}if(rt===-1)break}const yt=w[rt];yt&&yt.connect(ut)}}const W=new E,K=new E;function z(X,tt,ut){W.setFromMatrixPosition(tt.matrixWorld),K.setFromMatrixPosition(ut.matrixWorld);const rt=W.distanceTo(K),yt=tt.projectionMatrix.elements,Pt=ut.projectionMatrix.elements,Nt=yt[14]/(yt[10]-1),ie=yt[14]/(yt[10]+1),Vt=(yt[9]+1)/yt[5],oe=(yt[9]-1)/yt[5],F=(yt[8]-1)/yt[0],he=(Pt[8]+1)/Pt[0],Dt=Nt*F,Gt=Nt*he,Et=rt/(-F+he),se=Et*-F;if(tt.matrixWorld.decompose(X.position,X.quaternion,X.scale),X.translateX(se),X.translateZ(Et),X.matrixWorld.compose(X.position,X.quaternion,X.scale),X.matrixWorldInverse.copy(X.matrixWorld).invert(),yt[10]===-1)X.projectionMatrix.copy(tt.projectionMatrix),X.projectionMatrixInverse.copy(tt.projectionMatrixInverse);else{const Tt=Nt+Et,T=ie+Et,M=Dt-se,B=Gt+(rt-se),$=Vt*ie/T*Tt,J=oe*ie/T*Tt;X.projectionMatrix.makePerspective(M,B,$,J,Tt,T),X.projectionMatrixInverse.copy(X.projectionMatrix).invert()}}function Q(X,tt){tt===null?X.matrixWorld.copy(X.matrix):X.matrixWorld.multiplyMatrices(tt.matrixWorld,X.matrix),X.matrixWorldInverse.copy(X.matrixWorld).invert()}this.updateCamera=function(X){if(i===null)return;let tt=X.near,ut=X.far;v.texture!==null&&(v.depthNear>0&&(tt=v.depthNear),v.depthFar>0&&(ut=v.depthFar)),x.near=D.near=C.near=tt,x.far=D.far=C.far=ut,(R!==x.near||O!==x.far)&&(i.updateRenderState({depthNear:x.near,depthFar:x.far}),R=x.near,O=x.far),C.layers.mask=X.layers.mask|2,D.layers.mask=X.layers.mask|4,x.layers.mask=C.layers.mask|D.layers.mask;const rt=X.parent,yt=x.cameras;Q(x,rt);for(let Pt=0;Pt<yt.length;Pt++)Q(yt[Pt],rt);yt.length===2?z(x,C,D):x.projectionMatrix.copy(C.projectionMatrix),nt(X,x,rt)};function nt(X,tt,ut){ut===null?X.matrix.copy(tt.matrixWorld):(X.matrix.copy(ut.matrixWorld),X.matrix.invert(),X.matrix.multiply(tt.matrixWorld)),X.matrix.decompose(X.position,X.quaternion,X.scale),X.updateMatrixWorld(!0),X.projectionMatrix.copy(tt.projectionMatrix),X.projectionMatrixInverse.copy(tt.projectionMatrixInverse),X.isPerspectiveCamera&&(X.fov=fi*2*Math.atan(1/X.projectionMatrix.elements[5]),X.zoom=1)}this.getCamera=function(){return x},this.getFoveation=function(){if(!(f===null&&p===null))return c},this.setFoveation=function(X){c=X,f!==null&&(f.fixedFoveation=X),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=X)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(x)};let ot=null;function _t(X,tt){if(h=tt.getViewerPose(l||a),g=tt,h!==null){const ut=h.views;p!==null&&(t.setRenderTargetFramebuffer(b,p.framebuffer),t.setRenderTarget(b));let rt=!1;ut.length!==x.cameras.length&&(x.cameras.length=0,rt=!0);for(let Pt=0;Pt<ut.length;Pt++){const Nt=ut[Pt];let ie=null;if(p!==null)ie=p.getViewport(Nt);else{const oe=u.getViewSubImage(f,Nt);ie=oe.viewport,Pt===0&&(t.setRenderTargetTextures(b,oe.colorTexture,f.ignoreDepthValues?void 0:oe.depthStencilTexture),t.setRenderTarget(b))}let Vt=S[Pt];Vt===void 0&&(Vt=new Re,Vt.layers.enable(Pt),Vt.viewport=new Qt,S[Pt]=Vt),Vt.matrix.fromArray(Nt.transform.matrix),Vt.matrix.decompose(Vt.position,Vt.quaternion,Vt.scale),Vt.projectionMatrix.fromArray(Nt.projectionMatrix),Vt.projectionMatrixInverse.copy(Vt.projectionMatrix).invert(),Vt.viewport.set(ie.x,ie.y,ie.width,ie.height),Pt===0&&(x.matrix.copy(Vt.matrix),x.matrix.decompose(x.position,x.quaternion,x.scale)),rt===!0&&x.cameras.push(Vt)}const yt=i.enabledFeatures;if(yt&&yt.includes("depth-sensing")){const Pt=u.getDepthInformation(ut[0]);Pt&&Pt.isValid&&Pt.texture&&v.init(t,Pt,i.renderState)}}for(let ut=0;ut<w.length;ut++){const rt=_[ut],yt=w[ut];rt!==null&&yt!==void 0&&yt.update(rt,tt,l||a)}ot&&ot(X,tt),tt.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:tt}),g=null}const Lt=new ic;Lt.setAnimationLoop(_t),this.setAnimationLoop=function(X){ot=X},this.dispose=function(){}}}const Ln=new $e,Ap=new ce;function Cp(s,t){function e(m,d){m.matrixAutoUpdate===!0&&m.updateMatrix(),d.value.copy(m.matrix)}function n(m,d){d.color.getRGB(m.fogColor.value,tc(s)),d.isFog?(m.fogNear.value=d.near,m.fogFar.value=d.far):d.isFogExp2&&(m.fogDensity.value=d.density)}function i(m,d,b,w,_){d.isMeshBasicMaterial||d.isMeshLambertMaterial?r(m,d):d.isMeshToonMaterial?(r(m,d),u(m,d)):d.isMeshPhongMaterial?(r(m,d),h(m,d)):d.isMeshStandardMaterial?(r(m,d),f(m,d),d.isMeshPhysicalMaterial&&p(m,d,_)):d.isMeshMatcapMaterial?(r(m,d),g(m,d)):d.isMeshDepthMaterial?r(m,d):d.isMeshDistanceMaterial?(r(m,d),v(m,d)):d.isMeshNormalMaterial?r(m,d):d.isLineBasicMaterial?(a(m,d),d.isLineDashedMaterial&&o(m,d)):d.isPointsMaterial?c(m,d,b,w):d.isSpriteMaterial?l(m,d):d.isShadowMaterial?(m.color.value.copy(d.color),m.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function r(m,d){m.opacity.value=d.opacity,d.color&&m.diffuse.value.copy(d.color),d.emissive&&m.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(m.map.value=d.map,e(d.map,m.mapTransform)),d.alphaMap&&(m.alphaMap.value=d.alphaMap,e(d.alphaMap,m.alphaMapTransform)),d.bumpMap&&(m.bumpMap.value=d.bumpMap,e(d.bumpMap,m.bumpMapTransform),m.bumpScale.value=d.bumpScale,d.side===Pe&&(m.bumpScale.value*=-1)),d.normalMap&&(m.normalMap.value=d.normalMap,e(d.normalMap,m.normalMapTransform),m.normalScale.value.copy(d.normalScale),d.side===Pe&&m.normalScale.value.negate()),d.displacementMap&&(m.displacementMap.value=d.displacementMap,e(d.displacementMap,m.displacementMapTransform),m.displacementScale.value=d.displacementScale,m.displacementBias.value=d.displacementBias),d.emissiveMap&&(m.emissiveMap.value=d.emissiveMap,e(d.emissiveMap,m.emissiveMapTransform)),d.specularMap&&(m.specularMap.value=d.specularMap,e(d.specularMap,m.specularMapTransform)),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest);const b=t.get(d),w=b.envMap,_=b.envMapRotation;w&&(m.envMap.value=w,Ln.copy(_),Ln.x*=-1,Ln.y*=-1,Ln.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(Ln.y*=-1,Ln.z*=-1),m.envMapRotation.value.setFromMatrix4(Ap.makeRotationFromEuler(Ln)),m.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=d.reflectivity,m.ior.value=d.ior,m.refractionRatio.value=d.refractionRatio),d.lightMap&&(m.lightMap.value=d.lightMap,m.lightMapIntensity.value=d.lightMapIntensity,e(d.lightMap,m.lightMapTransform)),d.aoMap&&(m.aoMap.value=d.aoMap,m.aoMapIntensity.value=d.aoMapIntensity,e(d.aoMap,m.aoMapTransform))}function a(m,d){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,d.map&&(m.map.value=d.map,e(d.map,m.mapTransform))}function o(m,d){m.dashSize.value=d.dashSize,m.totalSize.value=d.dashSize+d.gapSize,m.scale.value=d.scale}function c(m,d,b,w){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,m.size.value=d.size*b,m.scale.value=w*.5,d.map&&(m.map.value=d.map,e(d.map,m.uvTransform)),d.alphaMap&&(m.alphaMap.value=d.alphaMap,e(d.alphaMap,m.alphaMapTransform)),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest)}function l(m,d){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,m.rotation.value=d.rotation,d.map&&(m.map.value=d.map,e(d.map,m.mapTransform)),d.alphaMap&&(m.alphaMap.value=d.alphaMap,e(d.alphaMap,m.alphaMapTransform)),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest)}function h(m,d){m.specular.value.copy(d.specular),m.shininess.value=Math.max(d.shininess,1e-4)}function u(m,d){d.gradientMap&&(m.gradientMap.value=d.gradientMap)}function f(m,d){m.metalness.value=d.metalness,d.metalnessMap&&(m.metalnessMap.value=d.metalnessMap,e(d.metalnessMap,m.metalnessMapTransform)),m.roughness.value=d.roughness,d.roughnessMap&&(m.roughnessMap.value=d.roughnessMap,e(d.roughnessMap,m.roughnessMapTransform)),d.envMap&&(m.envMapIntensity.value=d.envMapIntensity)}function p(m,d,b){m.ior.value=d.ior,d.sheen>0&&(m.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),m.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(m.sheenColorMap.value=d.sheenColorMap,e(d.sheenColorMap,m.sheenColorMapTransform)),d.sheenRoughnessMap&&(m.sheenRoughnessMap.value=d.sheenRoughnessMap,e(d.sheenRoughnessMap,m.sheenRoughnessMapTransform))),d.clearcoat>0&&(m.clearcoat.value=d.clearcoat,m.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(m.clearcoatMap.value=d.clearcoatMap,e(d.clearcoatMap,m.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,e(d.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(m.clearcoatNormalMap.value=d.clearcoatNormalMap,e(d.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===Pe&&m.clearcoatNormalScale.value.negate())),d.dispersion>0&&(m.dispersion.value=d.dispersion),d.iridescence>0&&(m.iridescence.value=d.iridescence,m.iridescenceIOR.value=d.iridescenceIOR,m.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(m.iridescenceMap.value=d.iridescenceMap,e(d.iridescenceMap,m.iridescenceMapTransform)),d.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=d.iridescenceThicknessMap,e(d.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),d.transmission>0&&(m.transmission.value=d.transmission,m.transmissionSamplerMap.value=b.texture,m.transmissionSamplerSize.value.set(b.width,b.height),d.transmissionMap&&(m.transmissionMap.value=d.transmissionMap,e(d.transmissionMap,m.transmissionMapTransform)),m.thickness.value=d.thickness,d.thicknessMap&&(m.thicknessMap.value=d.thicknessMap,e(d.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=d.attenuationDistance,m.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(m.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(m.anisotropyMap.value=d.anisotropyMap,e(d.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=d.specularIntensity,m.specularColor.value.copy(d.specularColor),d.specularColorMap&&(m.specularColorMap.value=d.specularColorMap,e(d.specularColorMap,m.specularColorMapTransform)),d.specularIntensityMap&&(m.specularIntensityMap.value=d.specularIntensityMap,e(d.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,d){d.matcap&&(m.matcap.value=d.matcap)}function v(m,d){const b=t.get(d).light;m.referencePosition.value.setFromMatrixPosition(b.matrixWorld),m.nearDistance.value=b.shadow.camera.near,m.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function Rp(s,t,e,n){let i={},r={},a=[];const o=s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS);function c(b,w){const _=w.program;n.uniformBlockBinding(b,_)}function l(b,w){let _=i[b.id];_===void 0&&(g(b),_=h(b),i[b.id]=_,b.addEventListener("dispose",m));const P=w.program;n.updateUBOMapping(b,P);const A=t.render.frame;r[b.id]!==A&&(f(b),r[b.id]=A)}function h(b){const w=u();b.__bindingPointIndex=w;const _=s.createBuffer(),P=b.__size,A=b.usage;return s.bindBuffer(s.UNIFORM_BUFFER,_),s.bufferData(s.UNIFORM_BUFFER,P,A),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,w,_),_}function u(){for(let b=0;b<o;b++)if(a.indexOf(b)===-1)return a.push(b),b;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(b){const w=i[b.id],_=b.uniforms,P=b.__cache;s.bindBuffer(s.UNIFORM_BUFFER,w);for(let A=0,C=_.length;A<C;A++){const D=Array.isArray(_[A])?_[A]:[_[A]];for(let S=0,x=D.length;S<x;S++){const R=D[S];if(p(R,A,S,P)===!0){const O=R.__offset,N=Array.isArray(R.value)?R.value:[R.value];let G=0;for(let q=0;q<N.length;q++){const W=N[q],K=v(W);typeof W=="number"||typeof W=="boolean"?(R.__data[0]=W,s.bufferSubData(s.UNIFORM_BUFFER,O+G,R.__data)):W.isMatrix3?(R.__data[0]=W.elements[0],R.__data[1]=W.elements[1],R.__data[2]=W.elements[2],R.__data[3]=0,R.__data[4]=W.elements[3],R.__data[5]=W.elements[4],R.__data[6]=W.elements[5],R.__data[7]=0,R.__data[8]=W.elements[6],R.__data[9]=W.elements[7],R.__data[10]=W.elements[8],R.__data[11]=0):(W.toArray(R.__data,G),G+=K.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(s.UNIFORM_BUFFER,O,R.__data)}}}s.bindBuffer(s.UNIFORM_BUFFER,null)}function p(b,w,_,P){const A=b.value,C=w+"_"+_;if(P[C]===void 0)return typeof A=="number"||typeof A=="boolean"?P[C]=A:P[C]=A.clone(),!0;{const D=P[C];if(typeof A=="number"||typeof A=="boolean"){if(D!==A)return P[C]=A,!0}else if(D.equals(A)===!1)return D.copy(A),!0}return!1}function g(b){const w=b.uniforms;let _=0;const P=16;for(let C=0,D=w.length;C<D;C++){const S=Array.isArray(w[C])?w[C]:[w[C]];for(let x=0,R=S.length;x<R;x++){const O=S[x],N=Array.isArray(O.value)?O.value:[O.value];for(let G=0,q=N.length;G<q;G++){const W=N[G],K=v(W),z=_%P,Q=z%K.boundary,nt=z+Q;_+=Q,nt!==0&&P-nt<K.storage&&(_+=P-nt),O.__data=new Float32Array(K.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=_,_+=K.storage}}}const A=_%P;return A>0&&(_+=P-A),b.__size=_,b.__cache={},this}function v(b){const w={boundary:0,storage:0};return typeof b=="number"||typeof b=="boolean"?(w.boundary=4,w.storage=4):b.isVector2?(w.boundary=8,w.storage=8):b.isVector3||b.isColor?(w.boundary=16,w.storage=12):b.isVector4?(w.boundary=16,w.storage=16):b.isMatrix3?(w.boundary=48,w.storage=48):b.isMatrix4?(w.boundary=64,w.storage=64):b.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",b),w}function m(b){const w=b.target;w.removeEventListener("dispose",m);const _=a.indexOf(w.__bindingPointIndex);a.splice(_,1),s.deleteBuffer(i[w.id]),delete i[w.id],delete r[w.id]}function d(){for(const b in i)s.deleteBuffer(i[b]);a=[],i={},r={}}return{bind:c,update:l,dispose:d}}class Pp{constructor(t={}){const{canvas:e=_l(),context:n=null,depth:i=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:f=!1}=t;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=a;const g=new Uint32Array(4),v=new Int32Array(4);let m=null,d=null;const b=[],w=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=ke,this.toneMapping=wn,this.toneMappingExposure=1;const _=this;let P=!1,A=0,C=0,D=null,S=-1,x=null;const R=new Qt,O=new Qt;let N=null;const G=new Ht(0);let q=0,W=e.width,K=e.height,z=1,Q=null,nt=null;const ot=new Qt(0,0,W,K),_t=new Qt(0,0,W,K);let Lt=!1;const X=new sa;let tt=!1,ut=!1;const rt=new ce,yt=new ce,Pt=new E,Nt=new Qt,ie={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Vt=!1;function oe(){return D===null?z:1}let F=n;function he(y,U){return e.getContext(y,U)}try{const y={alpha:!0,depth:i,stencil:r,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Zr}`),e.addEventListener("webglcontextlost",j,!1),e.addEventListener("webglcontextrestored",pt,!1),e.addEventListener("webglcontextcreationerror",dt,!1),F===null){const U="webgl2";if(F=he(U,y),F===null)throw he(U)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(y){throw console.error("THREE.WebGLRenderer: "+y.message),y}let Dt,Gt,Et,se,Tt,T,M,B,$,J,Z,bt,ht,mt,qt,it,gt,At,Ct,vt,Xt,Bt,ee,L;function lt(){Dt=new Ud(F),Dt.init(),Bt=new Mp(F,Dt),Gt=new Cd(F,Dt,t,Bt),Et=new vp(F,Dt),Gt.reverseDepthBuffer&&f&&Et.buffers.depth.setReversed(!0),se=new Nd(F),Tt=new np,T=new xp(F,Dt,Et,Tt,Gt,Bt,se),M=new Pd(_),B=new Ld(_),$=new Wl(F),ee=new Td(F,$),J=new Fd(F,$,se,ee),Z=new Od(F,J,$,se),Ct=new Bd(F,Gt,T),it=new Rd(Tt),bt=new ep(_,M,B,Dt,Gt,ee,it),ht=new Cp(_,Tt),mt=new sp,qt=new hp(Dt),At=new Ed(_,M,B,Et,Z,p,c),gt=new mp(_,Z,Gt),L=new Rp(F,se,Gt,Et),vt=new Ad(F,Dt,se),Xt=new kd(F,Dt,se),se.programs=bt.programs,_.capabilities=Gt,_.extensions=Dt,_.properties=Tt,_.renderLists=mt,_.shadowMap=gt,_.state=Et,_.info=se}lt();const Y=new Tp(_,F);this.xr=Y,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){const y=Dt.get("WEBGL_lose_context");y&&y.loseContext()},this.forceContextRestore=function(){const y=Dt.get("WEBGL_lose_context");y&&y.restoreContext()},this.getPixelRatio=function(){return z},this.setPixelRatio=function(y){y!==void 0&&(z=y,this.setSize(W,K,!1))},this.getSize=function(y){return y.set(W,K)},this.setSize=function(y,U,H=!0){if(Y.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}W=y,K=U,e.width=Math.floor(y*z),e.height=Math.floor(U*z),H===!0&&(e.style.width=y+"px",e.style.height=U+"px"),this.setViewport(0,0,y,U)},this.getDrawingBufferSize=function(y){return y.set(W*z,K*z).floor()},this.setDrawingBufferSize=function(y,U,H){W=y,K=U,z=H,e.width=Math.floor(y*H),e.height=Math.floor(U*H),this.setViewport(0,0,y,U)},this.getCurrentViewport=function(y){return y.copy(R)},this.getViewport=function(y){return y.copy(ot)},this.setViewport=function(y,U,H,V){y.isVector4?ot.set(y.x,y.y,y.z,y.w):ot.set(y,U,H,V),Et.viewport(R.copy(ot).multiplyScalar(z).round())},this.getScissor=function(y){return y.copy(_t)},this.setScissor=function(y,U,H,V){y.isVector4?_t.set(y.x,y.y,y.z,y.w):_t.set(y,U,H,V),Et.scissor(O.copy(_t).multiplyScalar(z).round())},this.getScissorTest=function(){return Lt},this.setScissorTest=function(y){Et.setScissorTest(Lt=y)},this.setOpaqueSort=function(y){Q=y},this.setTransparentSort=function(y){nt=y},this.getClearColor=function(y){return y.copy(At.getClearColor())},this.setClearColor=function(){At.setClearColor.apply(At,arguments)},this.getClearAlpha=function(){return At.getClearAlpha()},this.setClearAlpha=function(){At.setClearAlpha.apply(At,arguments)},this.clear=function(y=!0,U=!0,H=!0){let V=0;if(y){let k=!1;if(D!==null){const st=D.texture.format;k=st===na||st===ea||st===ta}if(k){const st=D.texture.type,ft=st===pn||st===zn||st===Fi||st===ui||st===Jr||st===Qr,xt=At.getClearColor(),Mt=At.getClearAlpha(),It=xt.r,Ft=xt.g,St=xt.b;ft?(g[0]=It,g[1]=Ft,g[2]=St,g[3]=Mt,F.clearBufferuiv(F.COLOR,0,g)):(v[0]=It,v[1]=Ft,v[2]=St,v[3]=Mt,F.clearBufferiv(F.COLOR,0,v))}else V|=F.COLOR_BUFFER_BIT}U&&(V|=F.DEPTH_BUFFER_BIT),H&&(V|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",j,!1),e.removeEventListener("webglcontextrestored",pt,!1),e.removeEventListener("webglcontextcreationerror",dt,!1),mt.dispose(),qt.dispose(),Tt.dispose(),M.dispose(),B.dispose(),Z.dispose(),ee.dispose(),L.dispose(),bt.dispose(),Y.dispose(),Y.removeEventListener("sessionstart",ua),Y.removeEventListener("sessionend",da),An.stop()};function j(y){y.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),P=!0}function pt(){console.log("THREE.WebGLRenderer: Context Restored."),P=!1;const y=se.autoReset,U=gt.enabled,H=gt.autoUpdate,V=gt.needsUpdate,k=gt.type;lt(),se.autoReset=y,gt.enabled=U,gt.autoUpdate=H,gt.needsUpdate=V,gt.type=k}function dt(y){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function Ut(y){const U=y.target;U.removeEventListener("dispose",Ut),ue(U)}function ue(y){xe(y),Tt.remove(y)}function xe(y){const U=Tt.get(y).programs;U!==void 0&&(U.forEach(function(H){bt.releaseProgram(H)}),y.isShaderMaterial&&bt.releaseShaderCache(y))}this.renderBufferDirect=function(y,U,H,V,k,st){U===null&&(U=ie);const ft=k.isMesh&&k.matrixWorld.determinant()<0,xt=fc(y,U,H,V,k);Et.setMaterial(V,ft);let Mt=H.index,It=1;if(V.wireframe===!0){if(Mt=J.getWireframeAttribute(H),Mt===void 0)return;It=2}const Ft=H.drawRange,St=H.attributes.position;let Zt=Ft.start*It,ne=(Ft.start+Ft.count)*It;st!==null&&(Zt=Math.max(Zt,st.start*It),ne=Math.min(ne,(st.start+st.count)*It)),Mt!==null?(Zt=Math.max(Zt,0),ne=Math.min(ne,Mt.count)):St!=null&&(Zt=Math.max(Zt,0),ne=Math.min(ne,St.count));const re=ne-Zt;if(re<0||re===1/0)return;ee.setup(k,V,xt,H,Mt);let Ce,Kt=vt;if(Mt!==null&&(Ce=$.get(Mt),Kt=Xt,Kt.setIndex(Ce)),k.isMesh)V.wireframe===!0?(Et.setLineWidth(V.wireframeLinewidth*oe()),Kt.setMode(F.LINES)):Kt.setMode(F.TRIANGLES);else if(k.isLine){let wt=V.linewidth;wt===void 0&&(wt=1),Et.setLineWidth(wt*oe()),k.isLineSegments?Kt.setMode(F.LINES):k.isLineLoop?Kt.setMode(F.LINE_LOOP):Kt.setMode(F.LINE_STRIP)}else k.isPoints?Kt.setMode(F.POINTS):k.isSprite&&Kt.setMode(F.TRIANGLES);if(k.isBatchedMesh)if(k._multiDrawInstances!==null)Kt.renderMultiDrawInstances(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount,k._multiDrawInstances);else if(Dt.get("WEBGL_multi_draw"))Kt.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{const wt=k._multiDrawStarts,nn=k._multiDrawCounts,$t=k._multiDrawCount,We=Mt?$.get(Mt).bytesPerElement:1,Hn=Tt.get(V).currentProgram.getUniforms();for(let De=0;De<$t;De++)Hn.setValue(F,"_gl_DrawID",De),Kt.render(wt[De]/We,nn[De])}else if(k.isInstancedMesh)Kt.renderInstances(Zt,re,k.count);else if(H.isInstancedBufferGeometry){const wt=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,nn=Math.min(H.instanceCount,wt);Kt.renderInstances(Zt,re,nn)}else Kt.render(Zt,re)};function jt(y,U,H){y.transparent===!0&&y.side===Ne&&y.forceSinglePass===!1?(y.side=Pe,y.needsUpdate=!0,Gi(y,U,H),y.side=En,y.needsUpdate=!0,Gi(y,U,H),y.side=Ne):Gi(y,U,H)}this.compile=function(y,U,H=null){H===null&&(H=y),d=qt.get(H),d.init(U),w.push(d),H.traverseVisible(function(k){k.isLight&&k.layers.test(U.layers)&&(d.pushLight(k),k.castShadow&&d.pushShadow(k))}),y!==H&&y.traverseVisible(function(k){k.isLight&&k.layers.test(U.layers)&&(d.pushLight(k),k.castShadow&&d.pushShadow(k))}),d.setupLights();const V=new Set;return y.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;const st=k.material;if(st)if(Array.isArray(st))for(let ft=0;ft<st.length;ft++){const xt=st[ft];jt(xt,H,k),V.add(xt)}else jt(st,H,k),V.add(st)}),w.pop(),d=null,V},this.compileAsync=function(y,U,H=null){const V=this.compile(y,U,H);return new Promise(k=>{function st(){if(V.forEach(function(ft){Tt.get(ft).currentProgram.isReady()&&V.delete(ft)}),V.size===0){k(y);return}setTimeout(st,10)}Dt.get("KHR_parallel_shader_compile")!==null?st():setTimeout(st,10)})};let Ve=null;function en(y){Ve&&Ve(y)}function ua(){An.stop()}function da(){An.start()}const An=new ic;An.setAnimationLoop(en),typeof self<"u"&&An.setContext(self),this.setAnimationLoop=function(y){Ve=y,Y.setAnimationLoop(y),y===null?An.stop():An.start()},Y.addEventListener("sessionstart",ua),Y.addEventListener("sessionend",da),this.render=function(y,U){if(U!==void 0&&U.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(P===!0)return;if(y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),Y.enabled===!0&&Y.isPresenting===!0&&(Y.cameraAutoUpdate===!0&&Y.updateCamera(U),U=Y.getCamera()),y.isScene===!0&&y.onBeforeRender(_,y,U,D),d=qt.get(y,w.length),d.init(U),w.push(d),yt.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),X.setFromProjectionMatrix(yt),ut=this.localClippingEnabled,tt=it.init(this.clippingPlanes,ut),m=mt.get(y,b.length),m.init(),b.push(m),Y.enabled===!0&&Y.isPresenting===!0){const st=_.xr.getDepthSensingMesh();st!==null&&Is(st,U,-1/0,_.sortObjects)}Is(y,U,0,_.sortObjects),m.finish(),_.sortObjects===!0&&m.sort(Q,nt),Vt=Y.enabled===!1||Y.isPresenting===!1||Y.hasDepthSensing()===!1,Vt&&At.addToRenderList(m,y),this.info.render.frame++,tt===!0&&it.beginShadows();const H=d.state.shadowsArray;gt.render(H,y,U),tt===!0&&it.endShadows(),this.info.autoReset===!0&&this.info.reset();const V=m.opaque,k=m.transmissive;if(d.setupLights(),U.isArrayCamera){const st=U.cameras;if(k.length>0)for(let ft=0,xt=st.length;ft<xt;ft++){const Mt=st[ft];pa(V,k,y,Mt)}Vt&&At.render(y);for(let ft=0,xt=st.length;ft<xt;ft++){const Mt=st[ft];fa(m,y,Mt,Mt.viewport)}}else k.length>0&&pa(V,k,y,U),Vt&&At.render(y),fa(m,y,U);D!==null&&(T.updateMultisampleRenderTarget(D),T.updateRenderTargetMipmap(D)),y.isScene===!0&&y.onAfterRender(_,y,U),ee.resetDefaultState(),S=-1,x=null,w.pop(),w.length>0?(d=w[w.length-1],tt===!0&&it.setGlobalState(_.clippingPlanes,d.state.camera)):d=null,b.pop(),b.length>0?m=b[b.length-1]:m=null};function Is(y,U,H,V){if(y.visible===!1)return;if(y.layers.test(U.layers)){if(y.isGroup)H=y.renderOrder;else if(y.isLOD)y.autoUpdate===!0&&y.update(U);else if(y.isLight)d.pushLight(y),y.castShadow&&d.pushShadow(y);else if(y.isSprite){if(!y.frustumCulled||X.intersectsSprite(y)){V&&Nt.setFromMatrixPosition(y.matrixWorld).applyMatrix4(yt);const ft=Z.update(y),xt=y.material;xt.visible&&m.push(y,ft,xt,H,Nt.z,null)}}else if((y.isMesh||y.isLine||y.isPoints)&&(!y.frustumCulled||X.intersectsObject(y))){const ft=Z.update(y),xt=y.material;if(V&&(y.boundingSphere!==void 0?(y.boundingSphere===null&&y.computeBoundingSphere(),Nt.copy(y.boundingSphere.center)):(ft.boundingSphere===null&&ft.computeBoundingSphere(),Nt.copy(ft.boundingSphere.center)),Nt.applyMatrix4(y.matrixWorld).applyMatrix4(yt)),Array.isArray(xt)){const Mt=ft.groups;for(let It=0,Ft=Mt.length;It<Ft;It++){const St=Mt[It],Zt=xt[St.materialIndex];Zt&&Zt.visible&&m.push(y,ft,Zt,H,Nt.z,St)}}else xt.visible&&m.push(y,ft,xt,H,Nt.z,null)}}const st=y.children;for(let ft=0,xt=st.length;ft<xt;ft++)Is(st[ft],U,H,V)}function fa(y,U,H,V){const k=y.opaque,st=y.transmissive,ft=y.transparent;d.setupLightsView(H),tt===!0&&it.setGlobalState(_.clippingPlanes,H),V&&Et.viewport(R.copy(V)),k.length>0&&zi(k,U,H),st.length>0&&zi(st,U,H),ft.length>0&&zi(ft,U,H),Et.buffers.depth.setTest(!0),Et.buffers.depth.setMask(!0),Et.buffers.color.setMask(!0),Et.setPolygonOffset(!1)}function pa(y,U,H,V){if((H.isScene===!0?H.overrideMaterial:null)!==null)return;d.state.transmissionRenderTarget[V.id]===void 0&&(d.state.transmissionRenderTarget[V.id]=new He(1,1,{generateMipmaps:!0,type:Dt.has("EXT_color_buffer_half_float")||Dt.has("EXT_color_buffer_float")?tn:pn,minFilter:Qe,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Yt.workingColorSpace}));const st=d.state.transmissionRenderTarget[V.id],ft=V.viewport||R;st.setSize(ft.z,ft.w);const xt=_.getRenderTarget();_.setRenderTarget(st),_.getClearColor(G),q=_.getClearAlpha(),q<1&&_.setClearColor(16777215,.5),_.clear(),Vt&&At.render(H);const Mt=_.toneMapping;_.toneMapping=wn;const It=V.viewport;if(V.viewport!==void 0&&(V.viewport=void 0),d.setupLightsView(V),tt===!0&&it.setGlobalState(_.clippingPlanes,V),zi(y,H,V),T.updateMultisampleRenderTarget(st),T.updateRenderTargetMipmap(st),Dt.has("WEBGL_multisampled_render_to_texture")===!1){let Ft=!1;for(let St=0,Zt=U.length;St<Zt;St++){const ne=U[St],re=ne.object,Ce=ne.geometry,Kt=ne.material,wt=ne.group;if(Kt.side===Ne&&re.layers.test(V.layers)){const nn=Kt.side;Kt.side=Pe,Kt.needsUpdate=!0,ma(re,H,V,Ce,Kt,wt),Kt.side=nn,Kt.needsUpdate=!0,Ft=!0}}Ft===!0&&(T.updateMultisampleRenderTarget(st),T.updateRenderTargetMipmap(st))}_.setRenderTarget(xt),_.setClearColor(G,q),It!==void 0&&(V.viewport=It),_.toneMapping=Mt}function zi(y,U,H){const V=U.isScene===!0?U.overrideMaterial:null;for(let k=0,st=y.length;k<st;k++){const ft=y[k],xt=ft.object,Mt=ft.geometry,It=V===null?ft.material:V,Ft=ft.group;xt.layers.test(H.layers)&&ma(xt,U,H,Mt,It,Ft)}}function ma(y,U,H,V,k,st){y.onBeforeRender(_,U,H,V,k,st),y.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),k.onBeforeRender(_,U,H,V,y,st),k.transparent===!0&&k.side===Ne&&k.forceSinglePass===!1?(k.side=Pe,k.needsUpdate=!0,_.renderBufferDirect(H,U,V,k,y,st),k.side=En,k.needsUpdate=!0,_.renderBufferDirect(H,U,V,k,y,st),k.side=Ne):_.renderBufferDirect(H,U,V,k,y,st),y.onAfterRender(_,U,H,V,k,st)}function Gi(y,U,H){U.isScene!==!0&&(U=ie);const V=Tt.get(y),k=d.state.lights,st=d.state.shadowsArray,ft=k.state.version,xt=bt.getParameters(y,k.state,st,U,H),Mt=bt.getProgramCacheKey(xt);let It=V.programs;V.environment=y.isMeshStandardMaterial?U.environment:null,V.fog=U.fog,V.envMap=(y.isMeshStandardMaterial?B:M).get(y.envMap||V.environment),V.envMapRotation=V.environment!==null&&y.envMap===null?U.environmentRotation:y.envMapRotation,It===void 0&&(y.addEventListener("dispose",Ut),It=new Map,V.programs=It);let Ft=It.get(Mt);if(Ft!==void 0){if(V.currentProgram===Ft&&V.lightsStateVersion===ft)return va(y,xt),Ft}else xt.uniforms=bt.getUniforms(y),y.onBeforeCompile(xt,_),Ft=bt.acquireProgram(xt,Mt),It.set(Mt,Ft),V.uniforms=xt.uniforms;const St=V.uniforms;return(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)&&(St.clippingPlanes=it.uniform),va(y,xt),V.needsLights=mc(y),V.lightsStateVersion=ft,V.needsLights&&(St.ambientLightColor.value=k.state.ambient,St.lightProbe.value=k.state.probe,St.directionalLights.value=k.state.directional,St.directionalLightShadows.value=k.state.directionalShadow,St.spotLights.value=k.state.spot,St.spotLightShadows.value=k.state.spotShadow,St.rectAreaLights.value=k.state.rectArea,St.ltc_1.value=k.state.rectAreaLTC1,St.ltc_2.value=k.state.rectAreaLTC2,St.pointLights.value=k.state.point,St.pointLightShadows.value=k.state.pointShadow,St.hemisphereLights.value=k.state.hemi,St.directionalShadowMap.value=k.state.directionalShadowMap,St.directionalShadowMatrix.value=k.state.directionalShadowMatrix,St.spotShadowMap.value=k.state.spotShadowMap,St.spotLightMatrix.value=k.state.spotLightMatrix,St.spotLightMap.value=k.state.spotLightMap,St.pointShadowMap.value=k.state.pointShadowMap,St.pointShadowMatrix.value=k.state.pointShadowMatrix),V.currentProgram=Ft,V.uniformsList=null,Ft}function ga(y){if(y.uniformsList===null){const U=y.currentProgram.getUniforms();y.uniformsList=Ms.seqWithValue(U.seq,y.uniforms)}return y.uniformsList}function va(y,U){const H=Tt.get(y);H.outputColorSpace=U.outputColorSpace,H.batching=U.batching,H.batchingColor=U.batchingColor,H.instancing=U.instancing,H.instancingColor=U.instancingColor,H.instancingMorph=U.instancingMorph,H.skinning=U.skinning,H.morphTargets=U.morphTargets,H.morphNormals=U.morphNormals,H.morphColors=U.morphColors,H.morphTargetsCount=U.morphTargetsCount,H.numClippingPlanes=U.numClippingPlanes,H.numIntersection=U.numClipIntersection,H.vertexAlphas=U.vertexAlphas,H.vertexTangents=U.vertexTangents,H.toneMapping=U.toneMapping}function fc(y,U,H,V,k){U.isScene!==!0&&(U=ie),T.resetTextureUnits();const st=U.fog,ft=V.isMeshStandardMaterial?U.environment:null,xt=D===null?_.outputColorSpace:D.isXRRenderTarget===!0?D.texture.colorSpace:vi,Mt=(V.isMeshStandardMaterial?B:M).get(V.envMap||ft),It=V.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,Ft=!!H.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),St=!!H.morphAttributes.position,Zt=!!H.morphAttributes.normal,ne=!!H.morphAttributes.color;let re=wn;V.toneMapped&&(D===null||D.isXRRenderTarget===!0)&&(re=_.toneMapping);const Ce=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,Kt=Ce!==void 0?Ce.length:0,wt=Tt.get(V),nn=d.state.lights;if(tt===!0&&(ut===!0||y!==x)){const Be=y===x&&V.id===S;it.setState(V,y,Be)}let $t=!1;V.version===wt.__version?(wt.needsLights&&wt.lightsStateVersion!==nn.state.version||wt.outputColorSpace!==xt||k.isBatchedMesh&&wt.batching===!1||!k.isBatchedMesh&&wt.batching===!0||k.isBatchedMesh&&wt.batchingColor===!0&&k.colorTexture===null||k.isBatchedMesh&&wt.batchingColor===!1&&k.colorTexture!==null||k.isInstancedMesh&&wt.instancing===!1||!k.isInstancedMesh&&wt.instancing===!0||k.isSkinnedMesh&&wt.skinning===!1||!k.isSkinnedMesh&&wt.skinning===!0||k.isInstancedMesh&&wt.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&wt.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&wt.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&wt.instancingMorph===!1&&k.morphTexture!==null||wt.envMap!==Mt||V.fog===!0&&wt.fog!==st||wt.numClippingPlanes!==void 0&&(wt.numClippingPlanes!==it.numPlanes||wt.numIntersection!==it.numIntersection)||wt.vertexAlphas!==It||wt.vertexTangents!==Ft||wt.morphTargets!==St||wt.morphNormals!==Zt||wt.morphColors!==ne||wt.toneMapping!==re||wt.morphTargetsCount!==Kt)&&($t=!0):($t=!0,wt.__version=V.version);let We=wt.currentProgram;$t===!0&&(We=Gi(V,U,k));let Hn=!1,De=!1,bi=!1;const ae=We.getUniforms(),je=wt.uniforms;if(Et.useProgram(We.program)&&(Hn=!0,De=!0,bi=!0),V.id!==S&&(S=V.id,De=!0),Hn||x!==y){Et.buffers.depth.getReversed()?(rt.copy(y.projectionMatrix),Ml(rt),Sl(rt),ae.setValue(F,"projectionMatrix",rt)):ae.setValue(F,"projectionMatrix",y.projectionMatrix),ae.setValue(F,"viewMatrix",y.matrixWorldInverse);const mn=ae.map.cameraPosition;mn!==void 0&&mn.setValue(F,Pt.setFromMatrixPosition(y.matrixWorld)),Gt.logarithmicDepthBuffer&&ae.setValue(F,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&ae.setValue(F,"isOrthographic",y.isOrthographicCamera===!0),x!==y&&(x=y,De=!0,bi=!0)}if(k.isSkinnedMesh){ae.setOptional(F,k,"bindMatrix"),ae.setOptional(F,k,"bindMatrixInverse");const Be=k.skeleton;Be&&(Be.boneTexture===null&&Be.computeBoneTexture(),ae.setValue(F,"boneTexture",Be.boneTexture,T))}k.isBatchedMesh&&(ae.setOptional(F,k,"batchingTexture"),ae.setValue(F,"batchingTexture",k._matricesTexture,T),ae.setOptional(F,k,"batchingIdTexture"),ae.setValue(F,"batchingIdTexture",k._indirectTexture,T),ae.setOptional(F,k,"batchingColorTexture"),k._colorsTexture!==null&&ae.setValue(F,"batchingColorTexture",k._colorsTexture,T));const wi=H.morphAttributes;if((wi.position!==void 0||wi.normal!==void 0||wi.color!==void 0)&&Ct.update(k,H,We),(De||wt.receiveShadow!==k.receiveShadow)&&(wt.receiveShadow=k.receiveShadow,ae.setValue(F,"receiveShadow",k.receiveShadow)),V.isMeshGouraudMaterial&&V.envMap!==null&&(je.envMap.value=Mt,je.flipEnvMap.value=Mt.isCubeTexture&&Mt.isRenderTargetTexture===!1?-1:1),V.isMeshStandardMaterial&&V.envMap===null&&U.environment!==null&&(je.envMapIntensity.value=U.environmentIntensity),De&&(ae.setValue(F,"toneMappingExposure",_.toneMappingExposure),wt.needsLights&&pc(je,bi),st&&V.fog===!0&&ht.refreshFogUniforms(je,st),ht.refreshMaterialUniforms(je,V,z,K,d.state.transmissionRenderTarget[y.id]),Ms.upload(F,ga(wt),je,T)),V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(Ms.upload(F,ga(wt),je,T),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&ae.setValue(F,"center",k.center),ae.setValue(F,"modelViewMatrix",k.modelViewMatrix),ae.setValue(F,"normalMatrix",k.normalMatrix),ae.setValue(F,"modelMatrix",k.matrixWorld),V.isShaderMaterial||V.isRawShaderMaterial){const Be=V.uniformsGroups;for(let mn=0,gn=Be.length;mn<gn;mn++){const _a=Be[mn];L.update(_a,We),L.bind(_a,We)}}return We}function pc(y,U){y.ambientLightColor.needsUpdate=U,y.lightProbe.needsUpdate=U,y.directionalLights.needsUpdate=U,y.directionalLightShadows.needsUpdate=U,y.pointLights.needsUpdate=U,y.pointLightShadows.needsUpdate=U,y.spotLights.needsUpdate=U,y.spotLightShadows.needsUpdate=U,y.rectAreaLights.needsUpdate=U,y.hemisphereLights.needsUpdate=U}function mc(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return D},this.setRenderTargetTextures=function(y,U,H){Tt.get(y.texture).__webglTexture=U,Tt.get(y.depthTexture).__webglTexture=H;const V=Tt.get(y);V.__hasExternalTextures=!0,V.__autoAllocateDepthBuffer=H===void 0,V.__autoAllocateDepthBuffer||Dt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),V.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(y,U){const H=Tt.get(y);H.__webglFramebuffer=U,H.__useDefaultFramebuffer=U===void 0},this.setRenderTarget=function(y,U=0,H=0){D=y,A=U,C=H;let V=!0,k=null,st=!1,ft=!1;if(y){const Mt=Tt.get(y);if(Mt.__useDefaultFramebuffer!==void 0)Et.bindFramebuffer(F.FRAMEBUFFER,null),V=!1;else if(Mt.__webglFramebuffer===void 0)T.setupRenderTarget(y);else if(Mt.__hasExternalTextures)T.rebindTextures(y,Tt.get(y.texture).__webglTexture,Tt.get(y.depthTexture).__webglTexture);else if(y.depthBuffer){const St=y.depthTexture;if(Mt.__boundDepthTexture!==St){if(St!==null&&Tt.has(St)&&(y.width!==St.image.width||y.height!==St.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");T.setupDepthRenderbuffer(y)}}const It=y.texture;(It.isData3DTexture||It.isDataArrayTexture||It.isCompressedArrayTexture)&&(ft=!0);const Ft=Tt.get(y).__webglFramebuffer;y.isWebGLCubeRenderTarget?(Array.isArray(Ft[U])?k=Ft[U][H]:k=Ft[U],st=!0):y.samples>0&&T.useMultisampledRTT(y)===!1?k=Tt.get(y).__webglMultisampledFramebuffer:Array.isArray(Ft)?k=Ft[H]:k=Ft,R.copy(y.viewport),O.copy(y.scissor),N=y.scissorTest}else R.copy(ot).multiplyScalar(z).floor(),O.copy(_t).multiplyScalar(z).floor(),N=Lt;if(Et.bindFramebuffer(F.FRAMEBUFFER,k)&&V&&Et.drawBuffers(y,k),Et.viewport(R),Et.scissor(O),Et.setScissorTest(N),st){const Mt=Tt.get(y.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+U,Mt.__webglTexture,H)}else if(ft){const Mt=Tt.get(y.texture),It=U||0;F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,Mt.__webglTexture,H||0,It)}S=-1},this.readRenderTargetPixels=function(y,U,H,V,k,st,ft){if(!(y&&y.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let xt=Tt.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&ft!==void 0&&(xt=xt[ft]),xt){Et.bindFramebuffer(F.FRAMEBUFFER,xt);try{const Mt=y.texture,It=Mt.format,Ft=Mt.type;if(!Gt.textureFormatReadable(It)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Gt.textureTypeReadable(Ft)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=y.width-V&&H>=0&&H<=y.height-k&&F.readPixels(U,H,V,k,Bt.convert(It),Bt.convert(Ft),st)}finally{const Mt=D!==null?Tt.get(D).__webglFramebuffer:null;Et.bindFramebuffer(F.FRAMEBUFFER,Mt)}}},this.readRenderTargetPixelsAsync=async function(y,U,H,V,k,st,ft){if(!(y&&y.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let xt=Tt.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&ft!==void 0&&(xt=xt[ft]),xt){const Mt=y.texture,It=Mt.format,Ft=Mt.type;if(!Gt.textureFormatReadable(It))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Gt.textureTypeReadable(Ft))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(U>=0&&U<=y.width-V&&H>=0&&H<=y.height-k){Et.bindFramebuffer(F.FRAMEBUFFER,xt);const St=F.createBuffer();F.bindBuffer(F.PIXEL_PACK_BUFFER,St),F.bufferData(F.PIXEL_PACK_BUFFER,st.byteLength,F.STREAM_READ),F.readPixels(U,H,V,k,Bt.convert(It),Bt.convert(Ft),0);const Zt=D!==null?Tt.get(D).__webglFramebuffer:null;Et.bindFramebuffer(F.FRAMEBUFFER,Zt);const ne=F.fenceSync(F.SYNC_GPU_COMMANDS_COMPLETE,0);return F.flush(),await xl(F,ne,4),F.bindBuffer(F.PIXEL_PACK_BUFFER,St),F.getBufferSubData(F.PIXEL_PACK_BUFFER,0,st),F.deleteBuffer(St),F.deleteSync(ne),st}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(y,U=null,H=0){y.isTexture!==!0&&(Pi("WebGLRenderer: copyFramebufferToTexture function signature has changed."),U=arguments[0]||null,y=arguments[1]);const V=Math.pow(2,-H),k=Math.floor(y.image.width*V),st=Math.floor(y.image.height*V),ft=U!==null?U.x:0,xt=U!==null?U.y:0;T.setTexture2D(y,0),F.copyTexSubImage2D(F.TEXTURE_2D,H,0,0,ft,xt,k,st),Et.unbindTexture()},this.copyTextureToTexture=function(y,U,H=null,V=null,k=0){y.isTexture!==!0&&(Pi("WebGLRenderer: copyTextureToTexture function signature has changed."),V=arguments[0]||null,y=arguments[1],U=arguments[2],k=arguments[3]||0,H=null);let st,ft,xt,Mt,It,Ft,St,Zt,ne;const re=y.isCompressedTexture?y.mipmaps[k]:y.image;H!==null?(st=H.max.x-H.min.x,ft=H.max.y-H.min.y,xt=H.isBox3?H.max.z-H.min.z:1,Mt=H.min.x,It=H.min.y,Ft=H.isBox3?H.min.z:0):(st=re.width,ft=re.height,xt=re.depth||1,Mt=0,It=0,Ft=0),V!==null?(St=V.x,Zt=V.y,ne=V.z):(St=0,Zt=0,ne=0);const Ce=Bt.convert(U.format),Kt=Bt.convert(U.type);let wt;U.isData3DTexture?(T.setTexture3D(U,0),wt=F.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?(T.setTexture2DArray(U,0),wt=F.TEXTURE_2D_ARRAY):(T.setTexture2D(U,0),wt=F.TEXTURE_2D),F.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,U.flipY),F.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),F.pixelStorei(F.UNPACK_ALIGNMENT,U.unpackAlignment);const nn=F.getParameter(F.UNPACK_ROW_LENGTH),$t=F.getParameter(F.UNPACK_IMAGE_HEIGHT),We=F.getParameter(F.UNPACK_SKIP_PIXELS),Hn=F.getParameter(F.UNPACK_SKIP_ROWS),De=F.getParameter(F.UNPACK_SKIP_IMAGES);F.pixelStorei(F.UNPACK_ROW_LENGTH,re.width),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,re.height),F.pixelStorei(F.UNPACK_SKIP_PIXELS,Mt),F.pixelStorei(F.UNPACK_SKIP_ROWS,It),F.pixelStorei(F.UNPACK_SKIP_IMAGES,Ft);const bi=y.isDataArrayTexture||y.isData3DTexture,ae=U.isDataArrayTexture||U.isData3DTexture;if(y.isRenderTargetTexture||y.isDepthTexture){const je=Tt.get(y),wi=Tt.get(U),Be=Tt.get(je.__renderTarget),mn=Tt.get(wi.__renderTarget);Et.bindFramebuffer(F.READ_FRAMEBUFFER,Be.__webglFramebuffer),Et.bindFramebuffer(F.DRAW_FRAMEBUFFER,mn.__webglFramebuffer);for(let gn=0;gn<xt;gn++)bi&&F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,Tt.get(y).__webglTexture,k,Ft+gn),y.isDepthTexture?(ae&&F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,Tt.get(U).__webglTexture,k,ne+gn),F.blitFramebuffer(Mt,It,st,ft,St,Zt,st,ft,F.DEPTH_BUFFER_BIT,F.NEAREST)):ae?F.copyTexSubImage3D(wt,k,St,Zt,ne+gn,Mt,It,st,ft):F.copyTexSubImage2D(wt,k,St,Zt,ne+gn,Mt,It,st,ft);Et.bindFramebuffer(F.READ_FRAMEBUFFER,null),Et.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else ae?y.isDataTexture||y.isData3DTexture?F.texSubImage3D(wt,k,St,Zt,ne,st,ft,xt,Ce,Kt,re.data):U.isCompressedArrayTexture?F.compressedTexSubImage3D(wt,k,St,Zt,ne,st,ft,xt,Ce,re.data):F.texSubImage3D(wt,k,St,Zt,ne,st,ft,xt,Ce,Kt,re):y.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,k,St,Zt,st,ft,Ce,Kt,re.data):y.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,k,St,Zt,re.width,re.height,Ce,re.data):F.texSubImage2D(F.TEXTURE_2D,k,St,Zt,st,ft,Ce,Kt,re);F.pixelStorei(F.UNPACK_ROW_LENGTH,nn),F.pixelStorei(F.UNPACK_IMAGE_HEIGHT,$t),F.pixelStorei(F.UNPACK_SKIP_PIXELS,We),F.pixelStorei(F.UNPACK_SKIP_ROWS,Hn),F.pixelStorei(F.UNPACK_SKIP_IMAGES,De),k===0&&U.generateMipmaps&&F.generateMipmap(wt),Et.unbindTexture()},this.copyTextureToTexture3D=function(y,U,H=null,V=null,k=0){return y.isTexture!==!0&&(Pi("WebGLRenderer: copyTextureToTexture3D function signature has changed."),H=arguments[0]||null,V=arguments[1]||null,y=arguments[2],U=arguments[3],k=arguments[4]||0),Pi('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(y,U,H,V,k)},this.initRenderTarget=function(y){Tt.get(y).__webglFramebuffer===void 0&&T.setupRenderTarget(y)},this.initTexture=function(y){y.isCubeTexture?T.setTextureCube(y,0):y.isData3DTexture?T.setTexture3D(y,0):y.isDataArrayTexture||y.isCompressedArrayTexture?T.setTexture2DArray(y,0):T.setTexture2D(y,0),Et.unbindTexture()},this.resetState=function(){A=0,C=0,D=null,Et.reset(),ee.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return un}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorspace=Yt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Yt._getUnpackColorSpace()}}class bs{constructor(t,e=25e-5){this.isFogExp2=!0,this.name="",this.color=new Ht(t),this.density=e}clone(){return new bs(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class Ip extends de{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new $e,this.environmentIntensity=1,this.environmentRotation=new $e,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class hs extends ve{constructor(t,e,n,i=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}class Cs extends Mi{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new Ht(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const _o=new ce,qr=new Ko,us=new Ts,ds=new E;class oa extends de{constructor(t=new _e,e=new Cs){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),us.copy(n.boundingSphere),us.applyMatrix4(i),us.radius+=r,t.ray.intersectsSphere(us)===!1)return;_o.copy(i).invert(),qr.copy(t.ray).applyMatrix4(_o);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=n.index,u=n.attributes.position;if(l!==null){const f=Math.max(0,a.start),p=Math.min(l.count,a.start+a.count);for(let g=f,v=p;g<v;g++){const m=l.getX(g);ds.fromBufferAttribute(u,m),xo(ds,m,c,i,t,e,this)}}else{const f=Math.max(0,a.start),p=Math.min(u.count,a.start+a.count);for(let g=f,v=p;g<v;g++)ds.fromBufferAttribute(u,g),xo(ds,g,c,i,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function xo(s,t,e,n,i,r,a){const o=qr.distanceSqToPoint(s);if(o<e){const c=new E;qr.closestPointToPoint(s,c),c.applyMatrix4(n);const l=i.ray.origin.distanceTo(c);if(l<i.near||l>i.far)return;r.push({distance:l,distanceToRay:Math.sqrt(o),point:c,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}class Ie extends Ae{constructor(t,e,n,i,r,a,o,c,l){super(t,e,n,i,r,a,o,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Rs extends _e{constructor(t=1,e=32,n=0,i=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:i},e=Math.max(3,e);const r=[],a=[],o=[],c=[],l=new E,h=new Rt;a.push(0,0,0),o.push(0,0,1),c.push(.5,.5);for(let u=0,f=3;u<=e;u++,f+=3){const p=n+u/e*i;l.x=t*Math.cos(p),l.y=t*Math.sin(p),a.push(l.x,l.y,l.z),o.push(0,0,1),h.x=(a[f]/t+1)/2,h.y=(a[f+1]/t+1)/2,c.push(h.x,h.y)}for(let u=1;u<=e;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new le(a,3)),this.setAttribute("normal",new le(o,3)),this.setAttribute("uv",new le(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Rs(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class ct extends _e{constructor(t=1,e=1,n=1,i=32,r=1,a=!1,o=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:c};const l=this;i=Math.floor(i),r=Math.floor(r);const h=[],u=[],f=[],p=[];let g=0;const v=[],m=n/2;let d=0;b(),a===!1&&(t>0&&w(!0),e>0&&w(!1)),this.setIndex(h),this.setAttribute("position",new le(u,3)),this.setAttribute("normal",new le(f,3)),this.setAttribute("uv",new le(p,2));function b(){const _=new E,P=new E;let A=0;const C=(e-t)/n;for(let D=0;D<=r;D++){const S=[],x=D/r,R=x*(e-t)+t;for(let O=0;O<=i;O++){const N=O/i,G=N*c+o,q=Math.sin(G),W=Math.cos(G);P.x=R*q,P.y=-x*n+m,P.z=R*W,u.push(P.x,P.y,P.z),_.set(q,C,W).normalize(),f.push(_.x,_.y,_.z),p.push(N,1-x),S.push(g++)}v.push(S)}for(let D=0;D<i;D++)for(let S=0;S<r;S++){const x=v[S][D],R=v[S+1][D],O=v[S+1][D+1],N=v[S][D+1];(t>0||S!==0)&&(h.push(x,R,N),A+=3),(e>0||S!==r-1)&&(h.push(R,O,N),A+=3)}l.addGroup(d,A,0),d+=A}function w(_){const P=g,A=new Rt,C=new E;let D=0;const S=_===!0?t:e,x=_===!0?1:-1;for(let O=1;O<=i;O++)u.push(0,m*x,0),f.push(0,x,0),p.push(.5,.5),g++;const R=g;for(let O=0;O<=i;O++){const G=O/i*c+o,q=Math.cos(G),W=Math.sin(G);C.x=S*W,C.y=m*x,C.z=S*q,u.push(C.x,C.y,C.z),f.push(0,x,0),A.x=q*.5+.5,A.y=W*.5*x+.5,p.push(A.x,A.y),g++}for(let O=0;O<i;O++){const N=P+O,G=R+O;_===!0?h.push(G,G+1,N):h.push(G+1,G,N),D+=3}l.addGroup(d,D,_===!0?1:2),d+=D}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ct(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Oi extends ct{constructor(t=1,e=1,n=32,i=1,r=!1,a=0,o=Math.PI*2){super(0,t,e,n,i,r,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:i,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(t){return new Oi(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class ca extends _e{constructor(t=.5,e=1,n=32,i=1,r=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:i,thetaStart:r,thetaLength:a},n=Math.max(3,n),i=Math.max(1,i);const o=[],c=[],l=[],h=[];let u=t;const f=(e-t)/i,p=new E,g=new Rt;for(let v=0;v<=i;v++){for(let m=0;m<=n;m++){const d=r+m/n*a;p.x=u*Math.cos(d),p.y=u*Math.sin(d),c.push(p.x,p.y,p.z),l.push(0,0,1),g.x=(p.x/e+1)/2,g.y=(p.y/e+1)/2,h.push(g.x,g.y)}u+=f}for(let v=0;v<i;v++){const m=v*(n+1);for(let d=0;d<n;d++){const b=d+m,w=b,_=b+n+1,P=b+n+2,A=b+1;o.push(w,_,A),o.push(_,P,A)}}this.setIndex(o),this.setAttribute("position",new le(c,3)),this.setAttribute("normal",new le(l,3)),this.setAttribute("uv",new le(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ca(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class Gn extends _e{constructor(t=1,e=32,n=16,i=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:i,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const c=Math.min(a+o,Math.PI);let l=0;const h=[],u=new E,f=new E,p=[],g=[],v=[],m=[];for(let d=0;d<=n;d++){const b=[],w=d/n;let _=0;d===0&&a===0?_=.5/e:d===n&&c===Math.PI&&(_=-.5/e);for(let P=0;P<=e;P++){const A=P/e;u.x=-t*Math.cos(i+A*r)*Math.sin(a+w*o),u.y=t*Math.cos(a+w*o),u.z=t*Math.sin(i+A*r)*Math.sin(a+w*o),g.push(u.x,u.y,u.z),f.copy(u).normalize(),v.push(f.x,f.y,f.z),m.push(A+_,1-w),b.push(l++)}h.push(b)}for(let d=0;d<n;d++)for(let b=0;b<e;b++){const w=h[d][b+1],_=h[d][b],P=h[d+1][b],A=h[d+1][b+1];(d!==0||a>0)&&p.push(w,_,A),(d!==n-1||c<Math.PI)&&p.push(_,P,A)}this.setIndex(p),this.setAttribute("position",new le(g,3)),this.setAttribute("normal",new le(v,3)),this.setAttribute("uv",new le(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Gn(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class mi extends _e{constructor(t=1,e=.4,n=12,i=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:i,arc:r},n=Math.floor(n),i=Math.floor(i);const a=[],o=[],c=[],l=[],h=new E,u=new E,f=new E;for(let p=0;p<=n;p++)for(let g=0;g<=i;g++){const v=g/i*r,m=p/n*Math.PI*2;u.x=(t+e*Math.cos(m))*Math.cos(v),u.y=(t+e*Math.cos(m))*Math.sin(v),u.z=e*Math.sin(m),o.push(u.x,u.y,u.z),h.x=t*Math.cos(v),h.y=t*Math.sin(v),f.subVectors(u,h).normalize(),c.push(f.x,f.y,f.z),l.push(g/i),l.push(p/n)}for(let p=1;p<=n;p++)for(let g=1;g<=i;g++){const v=(i+1)*p+g-1,m=(i+1)*(p-1)+g-1,d=(i+1)*(p-1)+g,b=(i+1)*p+g;a.push(v,m,b),a.push(m,d,b)}this.setIndex(a),this.setAttribute("position",new le(o,3)),this.setAttribute("normal",new le(c,3)),this.setAttribute("uv",new le(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new mi(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class Dp extends ye{static get type(){return"RawShaderMaterial"}constructor(t){super(t),this.isRawShaderMaterial=!0}}class zt extends Mi{static get type(){return"MeshStandardMaterial"}constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new Ht(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ht(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Wo,this.normalScale=new Rt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new $e,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Ps extends de{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Ht(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}const ar=new ce,Mo=new E,So=new E;class la{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Rt(512,512),this.map=null,this.mapPass=null,this.matrix=new ce,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new sa,this._frameExtents=new Rt(1,1),this._viewportCount=1,this._viewports=[new Qt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;Mo.setFromMatrixPosition(t.matrixWorld),e.position.copy(Mo),So.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(So),e.updateMatrixWorld(),ar.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ar),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(ar)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class Lp extends la{constructor(){super(new Re(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(t){const e=this.camera,n=fi*2*t.angle*this.focus,i=this.mapSize.width/this.mapSize.height,r=t.distance||e.far;(n!==e.fov||i!==e.aspect||r!==e.far)&&(e.fov=n,e.aspect=i,e.far=r,e.updateProjectionMatrix()),super.updateMatrices(t)}copy(t){return super.copy(t),this.focus=t.focus,this}}class yo extends Ps{constructor(t,e,n=0,i=Math.PI/3,r=0,a=2){super(t,e),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(de.DEFAULT_UP),this.updateMatrix(),this.target=new de,this.distance=n,this.angle=i,this.penumbra=r,this.decay=a,this.map=null,this.shadow=new Lp}get power(){return this.intensity*Math.PI}set power(t){this.intensity=t/Math.PI}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.angle=t.angle,this.penumbra=t.penumbra,this.decay=t.decay,this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}const bo=new ce,Ri=new E,or=new E;class Up extends la{constructor(){super(new Re(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Rt(4,2),this._viewportCount=6,this._viewports=[new Qt(2,1,1,1),new Qt(0,1,1,1),new Qt(3,1,1,1),new Qt(1,1,1,1),new Qt(3,0,1,1),new Qt(1,0,1,1)],this._cubeDirections=[new E(1,0,0),new E(-1,0,0),new E(0,0,1),new E(0,0,-1),new E(0,1,0),new E(0,-1,0)],this._cubeUps=[new E(0,1,0),new E(0,1,0),new E(0,1,0),new E(0,1,0),new E(0,0,1),new E(0,0,-1)]}updateMatrices(t,e=0){const n=this.camera,i=this.matrix,r=t.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Ri.setFromMatrixPosition(t.matrixWorld),n.position.copy(Ri),or.copy(n.position),or.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(or),n.updateMatrixWorld(),i.makeTranslation(-Ri.x,-Ri.y,-Ri.z),bo.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(bo)}}class lc extends Ps{constructor(t,e,n=0,i=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new Up}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class Fp extends la{constructor(){super(new ra(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class wo extends Ps{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(de.DEFAULT_UP),this.updateMatrix(),this.target=new de,this.shadow=new Fp}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class kp extends Ps{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}class Np extends _e{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(t){return super.copy(t),this.instanceCount=t.instanceCount,this}toJSON(){const t=super.toJSON();return t.instanceCount=this.instanceCount,t.isInstancedBufferGeometry=!0,t}}class Bp{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Eo(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=Eo();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function Eo(){return performance.now()}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Zr}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Zr);function Op(){if(typeof document>"u")return null;const s=document.createElement("canvas");s.width=1024,s.height=1024;const t=s.getContext("2d");t.fillStyle="#363c46",t.fillRect(0,0,1024,1024);const e=t.getImageData(0,0,1024,1024),n=e.data;for(let r=0;r<n.length;r+=4){const a=(Math.random()-.5)*22;n[r]=Math.max(0,Math.min(255,n[r]+a)),n[r+1]=Math.max(0,Math.min(255,n[r+1]+a)),n[r+2]=Math.max(0,Math.min(255,n[r+2]+a+2))}t.putImageData(e,0,0),t.strokeStyle="#111317",t.lineWidth=3;for(let r=0;r<=1024;r+=256)t.beginPath(),t.moveTo(r,0),t.lineTo(r,1024),t.stroke();for(let r=0;r<=1024;r+=256)t.beginPath(),t.moveTo(0,r),t.lineTo(1024,r),t.stroke();t.strokeStyle="rgba(70, 75, 85, 0.25)",t.lineWidth=1;for(let r=1;r<=1024;r+=256)t.beginPath(),t.moveTo(r,0),t.lineTo(r,1024),t.stroke();for(let r=1;r<=1024;r+=256)t.beginPath(),t.moveTo(0,r),t.lineTo(1024,r),t.stroke();for(let r=0;r<45;r++){const a=Math.random()*1024,o=Math.random()*1024,c=8+Math.random()*45,l=8+Math.random()*35,h=t.createRadialGradient(a,o,2,a,o,Math.max(c,l));h.addColorStop(0,"rgba(8, 9, 11, 0.7)"),h.addColorStop(.5,"rgba(12, 14, 16, 0.45)"),h.addColorStop(1,"rgba(20, 22, 26, 0)"),t.fillStyle=h,t.beginPath(),t.ellipse(a,o,c,l,Math.random()*Math.PI,0,Math.PI*2),t.fill()}t.strokeStyle="rgba(10, 11, 13, 0.5)",t.lineWidth=14,t.lineCap="round";for(let r=0;r<6;r++){const a=Math.random()*1024;t.beginPath(),t.moveTo(0,a),t.quadraticCurveTo(512+(Math.random()-.5)*200,a+(Math.random()-.5)*100,1024,a+(Math.random()-.5)*80),t.stroke()}const i=new Ie(s);return i.wrapS=te,i.wrapT=te,i}function zp(s=512,t=128){if(typeof document>"u")return null;const e=document.createElement("canvas");e.width=s,e.height=t;const n=e.getContext("2d");n.fillStyle="#e59d0b",n.fillRect(0,0,s,t),n.fillStyle="#141518";const i=36,r=s+t+i*4;n.save();for(let c=-t;c<r;c+=i*2)n.beginPath(),n.moveTo(c,0),n.lineTo(c+i,0),n.lineTo(c+i-t,t),n.lineTo(c-t,t),n.closePath(),n.fill();n.fillStyle="rgba(15, 12, 10, 0.25)";for(let c=0;c<1200;c++){const l=Math.random()*s,h=Math.random()*t,u=1+Math.random()*3;n.fillRect(l,h,u,u)}const a=n.createLinearGradient(0,0,0,t);a.addColorStop(0,"rgba(0,0,0,0.45)"),a.addColorStop(.15,"rgba(0,0,0,0)"),a.addColorStop(.85,"rgba(0,0,0,0)"),a.addColorStop(1,"rgba(0,0,0,0.55)"),n.fillStyle=a,n.fillRect(0,0,s,t),n.restore();const o=new Ie(e);return o.wrapS=te,o.wrapT=te,o}function Gp(){if(typeof document>"u")return null;const s=document.createElement("canvas");s.width=128,s.height=128;const t=s.getContext("2d");t.fillStyle="#0f1115",t.fillRect(0,0,128,128),t.strokeStyle="#3e4450",t.lineWidth=2;const e=16;for(let i=0;i<=128;i+=e)t.beginPath(),t.moveTo(i,0),t.lineTo(i,128),t.stroke(),t.beginPath(),t.moveTo(0,i),t.lineTo(128,i),t.stroke();t.fillStyle="#060709";for(let i=0;i<128;i+=e)for(let r=0;r<128;r+=e)t.fillRect(i+3,r+3,e-6,e-6);const n=new Ie(s);return n.wrapS=te,n.wrapT=te,n}function Hp(){if(typeof document>"u")return null;const s=document.createElement("canvas");s.width=512,s.height=512;const t=s.getContext("2d");t.fillStyle="#2a2f38",t.fillRect(0,0,512,512);for(let n=0;n<900;n++){const i=Math.random()*512,r=Math.random()*512,a=2+Math.random()*18,o=Math.random();o<.4?t.fillStyle="rgba(100, 45, 20, 0.35)":o<.75?t.fillStyle="rgba(145, 65, 28, 0.28)":t.fillStyle="rgba(40, 22, 18, 0.45)",t.beginPath(),t.arc(i,r,a,0,Math.PI*2),t.fill()}const e=new Ie(s);return e.wrapS=te,e.wrapT=te,e}class Vp{constructor(t){this.scene=t,this.group=new Wt,this.group.name="FactoryEnvironment",this.bayPositions=[new E(-32,0,0),new E(-16,0,0),new E(0,0,0),new E(16,0,0),new E(32,0,0)],this.rollingCarts=[],this.workers=[],this.ambientSmoke=null,this.buildTexturesAndMaterials(),this.buildFloor(),this.buildMachineBayPads(),this.buildColumnsAndTrusses(),this.buildOverheadCatwalks(),this.buildOverheadCrane(),this.buildVentilationAndPiping(),this.buildIndustrialWalls(),this.buildSafetyMarkings(),this.buildCratesAndPallets(),this.buildWorkbenches(),this.buildCarts(),this.buildWorkers(),this.buildAmbientSmoke(),this.scene.add(this.group)}buildTexturesAndMaterials(){this.concreteTex=Op(),this.concreteTex&&this.concreteTex.repeat.set(12,6),this.hazardTex=zp(512,128),this.hazardTex&&this.hazardTex.repeat.set(8,1),this.grateTex=Gp(),this.grateTex&&this.grateTex.repeat.set(32,4),this.rustedTex=Hp(),this.rustedTex&&this.rustedTex.repeat.set(4,2),[this.concreteTex,this.hazardTex,this.grateTex,this.rustedTex].forEach(t=>{t&&(t.anisotropy=8,t.minFilter=Qe,t.magFilter=Te)}),this.concreteMat=new zt({map:this.concreteTex||null,roughness:.85,metalness:.12,color:13421772}),this.steelStructureMat=new zt({map:this.rustedTex||null,color:4014925,roughness:.68,metalness:.75}),this.darkIronMat=new zt({color:2237997,roughness:.72,metalness:.65}),this.safetyYellowMat=new zt({color:14458896,roughness:.45,metalness:.35}),this.hazardMat=new zt({map:this.hazardTex||null,roughness:.6,metalness:.2}),this.grateMat=new zt({map:this.grateTex||null,roughness:.55,metalness:.85,transparent:!0,opacity:.95}),this.galvanizedMat=new zt({color:4870492,roughness:.52,metalness:.78}),this.wallMat=new zt({color:1579808,roughness:.92,metalness:.25}),this.pipeRedMat=new zt({color:9051678,roughness:.45,metalness:.5}),this.pipeYellowMat=new zt({color:12881938,roughness:.45,metalness:.45}),this.pipeBlueMat=new zt({color:2049643,roughness:.45,metalness:.5}),this.woodCrateMat=new zt({color:8149558,roughness:.9,metalness:.05}),this.woodPalletMat=new zt({color:6112040,roughness:.92,metalness:.05}),this.drumBlueMat=new zt({color:1985146,roughness:.48,metalness:.65}),this.drumOrangeMat=new zt({color:13194260,roughness:.5,metalness:.55}),this.coverallMat=new zt({color:2370616,roughness:.85,metalness:.1}),this.hiVisMat=new zt({color:16738816,emissive:5579264,emissiveIntensity:.45,roughness:.45,metalness:.1}),this.hardHatMat=new zt({color:16761856,roughness:.3,metalness:.15}),this.skinMat=new zt({color:13015160,roughness:.75,metalness:.05}),this.benchLightMat=new Tn({color:16769187})}buildFloor(){const t=new ze(124,64,32,16),e=new I(t,this.concreteMat);e.rotation.x=-Math.PI/2,e.position.y=0,e.receiveShadow=!0,this.group.add(e)}buildMachineBayPads(){const n=new et(10.5,.18,8.5),i=new et(10.5+.2,.2,8.5+.2);for(let r=0;r<this.bayPositions.length;r++){const a=this.bayPositions[r],o=new Wt;o.name=`BayPad_${r}`,o.position.set(a.x,.09,a.z);const c=new I(i,this.steelStructureMat);c.receiveShadow=!0,c.castShadow=!0,o.add(c);const l=new I(n,this.concreteMat);l.position.y=.02,l.receiveShadow=!0,o.add(l);const h=.5,u=new ze(10.5,h),f=new I(u,this.hazardMat);f.rotation.x=-Math.PI/2,f.position.set(0,.115,8.5/2-.25),f.receiveShadow=!0,o.add(f);const p=new I(u,this.hazardMat);p.rotation.x=-Math.PI/2,p.position.set(0,.115,-8.5/2+.25),p.receiveShadow=!0,o.add(p);const g=new ze(h,8.5),v=new I(g,this.hazardMat);v.rotation.x=-Math.PI/2,v.position.set(-10.5/2+.25,.115,0),v.receiveShadow=!0,o.add(v);const m=new I(g,this.hazardMat);m.rotation.x=-Math.PI/2,m.position.set(10.5/2-.25,.115,0),m.receiveShadow=!0,o.add(m),[[-10.5/2-.35,-8.5/2-.35],[10.5/2+.35,-8.5/2-.35],[-10.5/2-.35,8.5/2+.35],[10.5/2+.35,8.5/2+.35]].forEach(([b,w])=>{const _=new Wt;_.position.set(b,0,w);const P=new ct(.18,.18,1.1,16),A=new I(P,this.safetyYellowMat);A.position.y=.55,A.castShadow=!0,A.receiveShadow=!0,_.add(A);const C=new ct(.185,.185,.12,16),D=new I(C,this.darkIronMat);D.position.y=.85;const S=new I(C,this.darkIronMat);S.position.y=.55,_.add(D),_.add(S);const x=new ct(.28,.28,.08,16),R=new I(x,this.steelStructureMat);R.position.y=.04,_.add(R),o.add(_)}),this.group.add(o)}}buildColumnsAndTrusses(){const t=[-48,-32,-16,0,16,32,48],e=15,n=new et(.6,e,.06),i=new et(.55,e,.05),r=new et(.9,.15,.9),a=new et(.6,.45,.8);t.forEach(c=>{[-16,16].forEach(l=>{const h=new Wt;h.position.set(c,0,l);const u=new I(r,this.steelStructureMat);u.position.y=.075,u.castShadow=!0,h.add(u);const f=new I(n,this.steelStructureMat);f.position.set(-.25,e/2,0),f.castShadow=!0,h.add(f);const p=new I(n,this.steelStructureMat);p.position.set(.25,e/2,0),p.castShadow=!0,h.add(p);const g=new I(i,this.steelStructureMat);g.position.set(0,e/2,0),g.castShadow=!0,h.add(g);const v=new I(a,this.steelStructureMat),m=l<0?.35:-.35;v.position.set(0,11,m),v.castShadow=!0,h.add(v),this.group.add(h)}),this.buildRoofTruss(c)});const o=new et(116,.6,.5);[-15.65,15.65].forEach(c=>{const l=new I(o,this.steelStructureMat);l.position.set(0,11.3,c),l.castShadow=!0,this.group.add(l);const h=new et(116,.15,.12),u=new I(h,this.darkIronMat);u.position.set(0,11.65,c),this.group.add(u)})}buildRoofTruss(t){const e=new Wt;e.position.set(t,14,0);const n=new et(.35,.35,32.4),i=new I(n,this.darkIronMat);e.add(i);const r=Math.sqrt(256+2.2*2.2),a=new et(.35,.35,r),o=Math.atan2(2.2,16),c=new I(a,this.darkIronMat);c.position.set(0,1.1,8),c.rotation.x=-o,e.add(c);const l=new I(a,this.darkIronMat);l.position.set(0,1.1,-8),l.rotation.x=o,e.add(l);const h=new et(.25,2.2,.25),u=new I(h,this.darkIronMat);u.position.set(0,1.1,0),e.add(u);const f=[-12,-8,-4,4,8,12],p=new ct(.08,.08,1.8,8);f.forEach((g,v)=>{const m=new I(p,this.darkIronMat);m.position.set(0,.8,g),m.rotation.x=v%2===0?.45:-.45,e.add(m)}),this.group.add(e)}buildOverheadCatwalks(){const t=new Wt;t.position.set(0,7.2,14.5);const e=new et(104,.06,1.6),n=new I(e,this.grateMat);n.receiveShadow=!0,t.add(n);const i=new et(104,.35,.12),r=new I(i,this.steelStructureMat);r.position.set(0,-.18,.75);const a=new I(i,this.steelStructureMat);a.position.set(0,-.18,-.75),t.add(r),t.add(a);const o=new et(104,.06,.06),c=new I(o,this.safetyYellowMat);c.position.set(0,1.05,.75);const l=new I(o,this.safetyYellowMat);l.position.set(0,.55,.75);const h=new I(o,this.safetyYellowMat);h.position.set(0,1.05,-.75);const u=new I(o,this.safetyYellowMat);u.position.set(0,.55,-.75),t.add(c),t.add(l),t.add(h),t.add(u);const f=new ct(.03,.03,1.1,8);for(let p=-52;p<=52;p+=4){const g=new I(f,this.safetyYellowMat);g.position.set(p,.55,.75);const v=new I(f,this.safetyYellowMat);v.position.set(p,.55,-.75),t.add(g),t.add(v)}this.group.add(t)}buildOverheadCrane(){const t=new Wt;t.name="BridgeCrane",t.position.set(0,12.2,0);const e=new et(.6,1.4,31.2),n=new I(e,this.safetyYellowMat);n.position.set(-.9,0,0),n.castShadow=!0;const i=new I(e,this.safetyYellowMat);i.position.set(.9,0,0),i.castShadow=!0,t.add(n),t.add(i);const r=new et(2.2,.8,2.4),a=new I(r,this.darkIronMat);a.position.set(0,.9,0),t.add(a);const o=new ct(.02,.02,5,8),c=new I(o,this.steelStructureMat);c.position.set(0,-2.1,0),t.add(c);const l=new et(.7,.7,.9),h=new I(l,this.safetyYellowMat);h.position.set(0,-4.8,0),t.add(h),this.group.add(t)}buildVentilationAndPiping(){const t=new ct(.75,.75,116,24),e=new I(t,this.galvanizedMat);e.position.set(0,12.8,-5.5),e.rotation.z=Math.PI/2,e.castShadow=!0,this.group.add(e);const n=new ct(.35,.35,2.5,16),i=new Oi(.65,.4,16);for(let l=0;l<this.bayPositions.length;l++){const h=this.bayPositions[l].x,u=new I(n,this.galvanizedMat);u.position.set(h,11.2,-5.5);const f=new I(i,this.galvanizedMat);f.position.set(h,9.8,-5.5),f.rotation.x=Math.PI,this.group.add(u),this.group.add(f)}const r=new ct(.09,.09,116,12),a=new I(r,this.pipeRedMat);a.position.set(0,4.4,-15.2),a.rotation.z=Math.PI/2,this.group.add(a);const o=new I(r,this.pipeYellowMat);o.position.set(0,4.8,-15.2),o.rotation.z=Math.PI/2,this.group.add(o);const c=new I(r,this.pipeBlueMat);c.position.set(0,5.2,-15.2),c.rotation.z=Math.PI/2,this.group.add(c)}buildIndustrialWalls(){const e=new ze(124,16.5),n=new I(e,this.wallMat);n.position.set(0,16.5/2,-26),n.receiveShadow=!0,this.group.add(n);const i=new I(e,this.wallMat);i.position.set(0,16.5/2,26),i.rotation.y=Math.PI,i.receiveShadow=!0,this.group.add(i);const r=new ze(54,16.5),a=new I(r,this.wallMat);a.position.set(-54,16.5/2,0),a.rotation.y=Math.PI/2,a.receiveShadow=!0,this.group.add(a);const o=new I(r,this.wallMat);o.position.set(54,16.5/2,0),o.rotation.y=-Math.PI/2,o.receiveShadow=!0,this.group.add(o);const c=new ze(8,6.5),l=new zt({color:2567221,roughness:.65,metalness:.7}),h=new I(c,l);h.position.set(-53.8,3.25,0),h.rotation.y=Math.PI/2,this.group.add(h);const u=new I(c,l);u.position.set(53.8,3.25,0),u.rotation.y=-Math.PI/2,this.group.add(u)}buildSafetyMarkings(){const t=new Tn({color:9732618}),e=new ze(110,.12),n=new I(e,t);n.rotation.x=-Math.PI/2,n.position.set(0,.02,6.5),this.group.add(n);const i=new I(e,t);i.rotation.x=-Math.PI/2,i.position.set(0,.02,-6.5),this.group.add(i)}buildCratesAndPallets(){const t=new Wt;t.name="CratesAndPallets";const e=new et(1.5,.14,1.3),n=new et(1.3,1,1.1),i=new et(.95,.8,.95),r=new et(1.34,.06,1.14),a=new ct(.32,.32,.96,14),o=new mi(.325,.018,6,16);o.rotateX(Math.PI/2),[{x:-42,z:-11.5,rot:.08,stack:2,drums:!0},{x:-24,z:-12,rot:-.12,stack:2,drums:!1},{x:-8,z:-11.8,rot:.04,stack:1,drums:!0},{x:8,z:-12.2,rot:-.08,stack:2,drums:!0},{x:24,z:-11.5,rot:.14,stack:2,drums:!1},{x:42,z:-11.8,rot:-.05,stack:2,drums:!0},{x:-41,z:11.2,rot:.1,stack:1,drums:!0},{x:41,z:11.4,rot:-.1,stack:1,drums:!0}].forEach(l=>{const h=new Wt;h.position.set(l.x,0,l.z),h.rotation.y=l.rot;const u=new I(e,this.woodPalletMat);u.position.y=.07,u.castShadow=!0,u.receiveShadow=!0,h.add(u);const f=new I(n,this.woodCrateMat);f.position.y=.64,f.castShadow=!0,f.receiveShadow=!0,h.add(f);const p=new I(r,this.darkIronMat);if(p.position.y=.64,h.add(p),l.stack>=2){const v=new I(i,this.woodCrateMat);v.position.set(.08,1.54,-.05),v.rotation.y=.18,v.castShadow=!0,h.add(v)}const g=new I(i,this.steelStructureMat);g.position.set(1.35,.4,.1),g.castShadow=!0,g.receiveShadow=!0,h.add(g),l.drums&&[-1.35,-2.05].forEach((v,m)=>{const d=new I(a,m===0?this.drumOrangeMat:this.drumBlueMat);d.position.set(v,.48,m*.25),d.castShadow=!0,d.receiveShadow=!0,h.add(d);const b=new I(o,this.darkIronMat);b.position.set(v,.34,m*.25);const w=new I(o,this.darkIronMat);w.position.set(v,.66,m*.25),h.add(b,w)}),t.add(h)}),this.group.add(t)}buildWorkbenches(){const t=new Wt;t.name="Workbenches";const e=[{x:-24,z:-8.8,rot:0},{x:-8,z:-8.8,rot:0},{x:8,z:-8.8,rot:0},{x:24,z:-8.8,rot:0},{x:-24,z:11.4,rot:Math.PI},{x:24,z:11.4,rot:Math.PI}],n=new et(2.8,.1,1),i=new et(.1,.9,.1),r=new et(2.6,.05,.85),a=new et(2.8,.9,.06),o=new et(1.8,.08,.22),c=new ze(1.6,.12),l=new et(.28,.22,.35);e.forEach(h=>{const u=new Wt;u.position.set(h.x,0,h.z),u.rotation.y=h.rot;const f=new I(n,this.woodCrateMat);f.position.y=.92,f.castShadow=!0,f.receiveShadow=!0,u.add(f);const p=new I(r,this.steelStructureMat);p.position.y=.28,u.add(p),[[-1.3,-.4],[1.3,-.4],[-1.3,.4],[1.3,.4]].forEach(([w,_])=>{const P=new I(i,this.darkIronMat);P.position.set(w,.45,_),P.castShadow=!0,u.add(P)});const g=new I(a,this.darkIronMat);g.position.set(0,1.42,-.47),u.add(g);const v=new I(o,this.safetyYellowMat);v.position.set(0,1.92,-.25),u.add(v);const m=new I(c,this.benchLightMat);m.position.set(0,1.87,-.25),m.rotation.x=Math.PI/2,u.add(m);const d=new I(l,this.drumBlueMat);d.position.set(-.95,1.08,.28),u.add(d);const b=new I(new et(.65,.32,.35),this.pipeRedMat);b.position.set(.8,1.13,-.1),b.castShadow=!0,u.add(b),t.add(u)}),this.group.add(t)}_createCartMesh(t=!0){const e=new Wt,n=new et(1.6,.08,.95),i=new I(n,this.safetyYellowMat);i.position.y=.28,i.castShadow=!0,i.receiveShadow=!0,e.add(i);const r=new ct(.11,.11,.07,12);r.rotateX(Math.PI/2),[[-.62,-.36],[.62,-.36],[-.62,.36],[.62,.36]].forEach(([l,h])=>{const u=new I(r,this.darkIronMat);u.position.set(l,.11,h),e.add(u)});const a=new ct(.03,.03,.78,8);[-.38,.38].forEach(l=>{const h=new I(a,this.darkIronMat);h.position.set(-.74,.67,l),e.add(h)});const o=new ct(.03,.03,.82,8);o.rotateX(Math.PI/2);const c=new I(o,this.darkIronMat);if(c.position.set(-.74,1.05,0),e.add(c),t){const l=new I(new et(1,.55,.7),this.steelStructureMat);l.position.set(.12,.6,0),l.castShadow=!0,e.add(l)}else{const l=new I(n,this.pipeRedMat);l.position.y=.88,e.add(l);const h=new et(.05,.6,.05);[[-.7,-.4],[.7,-.4],[-.7,.4],[.7,.4]].forEach(([u,f])=>{const p=new I(h,this.darkIronMat);p.position.set(u,.58,f),e.add(p)})}return e}buildCarts(){const t=new Wt;t.name="IndustrialCarts",[{x:-21.8,z:-8.6,rot:.3,crate:!1},{x:10.2,z:-8.7,rot:-.25,crate:!1},{x:-10.5,z:11,rot:.5,crate:!0}].forEach(i=>{const r=this._createCartMesh(i.crate);r.position.set(i.x,0,i.z),r.rotation.y=i.rot,t.add(r)}),[{z:9.6,minX:-38,maxX:38,speed:2.1,phase:0},{z:-7.5,minX:-36,maxX:36,speed:1.65,phase:Math.PI}].forEach(i=>{const r=this._createCartMesh(!0);r.position.set(0,0,i.z),t.add(r),this.rollingCarts.push({mesh:r,...i})}),this.group.add(t)}_createWorkerMesh(t="walk"){const e=new Wt,n=new et(.16,.72,.18);n.translate(0,-.36,0);const i=new I(n,this.coverallMat);i.position.set(-.11,.75,0),i.castShadow=!0;const r=new I(n,this.coverallMat);r.position.set(.11,.75,0),r.castShadow=!0,e.add(i,r);const a=new I(new et(.46,.58,.26),this.hiVisMat);a.position.y=1.08,a.castShadow=!0,e.add(a);const o=new et(.13,.52,.14);o.translate(0,-.24,0);const c=new I(o,this.coverallMat);c.position.set(-.3,1.32,0),c.castShadow=!0;const l=new I(o,this.coverallMat);l.position.set(.3,1.32,0),l.castShadow=!0,e.add(c,l);const h=new I(new Gn(.14,12,10),this.skinMat);h.position.y=1.52,e.add(h);const u=new I(new Gn(.16,12,8,0,Math.PI*2,0,Math.PI*.55),this.hardHatMat);u.position.y=1.56,e.add(u);const f=new I(new ct(.19,.19,.025,12),this.hardHatMat);return f.position.set(0,1.56,.03),e.add(f),{group:e,leftLeg:i,rightLeg:r,leftArm:c,rightArm:l,role:t}}buildWorkers(){const t=new Wt;t.name="FactoryWorkers",[{x:-24,y:0,z:-7.95,rot:Math.PI,phase:.2},{x:8,y:0,z:-7.95,rot:Math.PI,phase:1.7},{x:24,y:0,z:10.55,rot:0,phase:3.1}].forEach(i=>{const r=this._createWorkerMesh("work");r.group.position.set(i.x,i.y,i.z),r.group.rotation.y=i.rot,t.add(r.group),this.workers.push({...r,...i})}),[{y:7.23,z:14.5,minX:-40,maxX:40,speed:1.35,phase:.5},{y:0,z:10.4,minX:-36,maxX:36,speed:1.45,phase:2.2},{y:0,z:-10,minX:-38,maxX:38,speed:1.25,phase:4.1}].forEach(i=>{const r=this._createWorkerMesh("walk");r.group.position.set(0,i.y,i.z),t.add(r.group),this.workers.push({...r,...i})}),this.group.add(t)}buildAmbientSmoke(){const t=document.createElement("canvas");t.width=64,t.height=64;const e=t.getContext("2d"),n=e.createRadialGradient(32,32,2,32,32,32);n.addColorStop(0,"rgba(220, 226, 235, 0.32)"),n.addColorStop(.45,"rgba(170, 180, 195, 0.14)"),n.addColorStop(1,"rgba(140, 150, 165, 0)"),e.fillStyle=n,e.fillRect(0,0,64,64);const i=new Ie(t),r=240,a=new Float32Array(r*3),o=[],c=[{x:-32,y:1,z:-11},{x:-16,y:1,z:-11},{x:0,y:1,z:-11},{x:16,y:8.5,z:0},{x:32,y:1,z:-11},{x:-40,y:.4,z:8},{x:40,y:.4,z:8}];for(let f=0;f<r;f++){const p=c[f%c.length];a[f*3]=p.x+(Math.random()-.5)*4.5,a[f*3+1]=p.y+Math.random()*11,a[f*3+2]=p.z+(Math.random()-.5)*3.5,o.push({emitter:p,vx:(Math.random()-.5)*.45,vy:.55+Math.random()*.85,vz:(Math.random()-.5)*.35})}const l=new _e;l.setAttribute("position",new ve(a,3));const h=new Cs({size:5.5,map:i,transparent:!0,opacity:.32,depthWrite:!1,blending:On,sizeAttenuation:!0,color:12371668}),u=new oa(l,h);u.frustumCulled=!1,this.group.add(u),this.ambientSmoke={points:u,geo:l,mat:h,tex:i,count:r,velocities:o}}setSkin(t="default"){const e=t==="realistic",n=(i,r)=>{i&&(r.color!==void 0&&i.color.setHex(r.color),r.emissive!==void 0&&i.emissive&&i.emissive.setHex(r.emissive),r.emissiveIntensity!==void 0&&(i.emissiveIntensity=r.emissiveIntensity),r.roughness!==void 0&&(i.roughness=r.roughness),r.metalness!==void 0&&(i.metalness=r.metalness),i.needsUpdate=!0)};n(this.concreteMat,e?{color:7107194,roughness:.94,metalness:.08}:{color:13421772,roughness:.85,metalness:.12}),n(this.steelStructureMat,e?{color:2237996,roughness:.78,metalness:.82}:{color:4014925,roughness:.68,metalness:.75}),n(this.darkIronMat,e?{color:1250842,roughness:.82,metalness:.72}:{color:2237997,roughness:.72,metalness:.65}),n(this.safetyYellowMat,e?{color:8215828,roughness:.68,metalness:.3}:{color:14458896,roughness:.45,metalness:.35}),n(this.hazardMat,e?{color:8025710,roughness:.78,metalness:.18}:{color:16777215,roughness:.6,metalness:.2}),n(this.grateMat,e?{color:6975608,roughness:.7,metalness:.85}:{color:16777215,roughness:.55,metalness:.85}),n(this.galvanizedMat,e?{color:2764598,roughness:.65,metalness:.82}:{color:4870492,roughness:.52,metalness:.78}),n(this.wallMat,e?{color:855827,roughness:.95,metalness:.2}:{color:1579808,roughness:.92,metalness:.25}),n(this.pipeRedMat,e?{color:5052440,roughness:.65,metalness:.45}:{color:9051678,roughness:.45,metalness:.5}),n(this.pipeYellowMat,e?{color:7033110,roughness:.65,metalness:.4}:{color:12881938,roughness:.45,metalness:.45}),n(this.pipeBlueMat,e?{color:1452864,roughness:.65,metalness:.45}:{color:2049643,roughness:.45,metalness:.5}),n(this.woodCrateMat,e?{color:4666916,roughness:.95}:{color:8149558,roughness:.9}),n(this.woodPalletMat,e?{color:3352089,roughness:.96}:{color:6112040,roughness:.92}),n(this.drumBlueMat,e?{color:1452608,roughness:.65,metalness:.6}:{color:1985146,roughness:.48,metalness:.65}),n(this.drumOrangeMat,e?{color:7222037,roughness:.68,metalness:.5}:{color:13194260,roughness:.5,metalness:.55}),n(this.coverallMat,e?{color:1448480,roughness:.9}:{color:2370616,roughness:.85}),n(this.hiVisMat,e?{color:10043912,emissive:1705984,emissiveIntensity:.15,roughness:.7}:{color:16738816,emissive:5579264,emissiveIntensity:.45,roughness:.45}),n(this.hardHatMat,e?{color:10385940,roughness:.48}:{color:16761856,roughness:.3}),this.ambientSmoke&&this.ambientSmoke.mat&&(this.ambientSmoke.mat.color.setHex(e?7042176:12371668),this.ambientSmoke.mat.opacity=e?.24:.32,this.ambientSmoke.mat.needsUpdate=!0)}getBayPosition(t){return t>=0&&t<this.bayPositions.length?this.bayPositions[t].clone():new E(0,0,0)}update(t,e,n){const i=Math.min(e||.016,.05);if(n&&n.kick){const r=(n.kickIntensity||1)*.02;this.group.position.y=(Math.random()-.5)*r}else this.group.position.y=0;for(let r=0;r<this.rollingCarts.length;r++){const a=this.rollingCarts[r],o=(a.maxX-a.minX)*.5,c=(a.maxX+a.minX)*.5,l=a.speed/o,h=t*l+a.phase,u=c+Math.sin(h)*o,f=Math.cos(h)>=0?0:Math.PI;a.mesh.position.x=u,a.mesh.rotation.y=f}for(let r=0;r<this.workers.length;r++){const a=this.workers[r];if(a.role==="walk"){const o=(a.maxX-a.minX)*.5,c=(a.maxX+a.minX)*.5,l=a.speed/o,h=t*l+a.phase,u=c+Math.sin(h)*o,f=Math.cos(h)>=0;a.group.position.x=u,a.group.rotation.y=f?Math.PI/2:-Math.PI/2;const p=Math.sin(t*5.2+a.phase);a.leftLeg.rotation.x=p*.48,a.rightLeg.rotation.x=-p*.48,a.leftArm.rotation.x=-p*.38,a.rightArm.rotation.x=p*.38}else{const o=Math.sin(t*3.6+a.phase);a.rightArm.rotation.x=-.75+o*.32,a.leftArm.rotation.x=-.55-o*.15}}if(this.ambientSmoke){const r=this.ambientSmoke.geo.attributes.position,a=r.array,o=n!=null&&n.isDrop?1.35:1;for(let c=0;c<this.ambientSmoke.count;c++){const l=this.ambientSmoke.velocities[c],h=c*3;a[h]+=l.vx*i,a[h+1]+=l.vy*o*i,a[h+2]+=l.vz*i,a[h+1]>13.5&&(a[h]=l.emitter.x+(Math.random()-.5)*3.5,a[h+1]=l.emitter.y,a[h+2]=l.emitter.z+(Math.random()-.5)*2.5)}r.needsUpdate=!0}}dispose(){[this.concreteTex,this.hazardTex,this.grateTex,this.rustedTex].forEach(t=>t&&t.dispose()),[this.concreteMat,this.steelStructureMat,this.darkIronMat,this.safetyYellowMat,this.hazardMat,this.grateMat,this.galvanizedMat,this.wallMat,this.pipeRedMat,this.pipeYellowMat,this.pipeBlueMat,this.woodCrateMat,this.woodPalletMat,this.drumBlueMat,this.drumOrangeMat,this.coverallMat,this.hiVisMat,this.hardHatMat,this.skinMat,this.benchLightMat].forEach(t=>t&&t.dispose()),this.ambientSmoke&&(this.ambientSmoke.geo.dispose(),this.ambientSmoke.mat.dispose(),this.ambientSmoke.tex.dispose())}}class Wp{constructor(t){this.scene=t,this.group=new Wt,this.group.name="IndustrialLighting",this.baySpotlights=[],this.bayTargets=[],this.beacons=[],this.sodiumLamps=[],this.activeMachineIndex=0,this.bayPositions=[new E(-32,0,0),new E(-16,0,0),new E(0,0,0),new E(16,0,0),new E(32,0,0)],this.buildAmbientAndDirectional(),this.buildBaySpotlights(),this.buildEmergencyBeacons(),this.buildHighBaySodiumLamps(),this.scene.add(this.group)}buildAmbientAndDirectional(){this.ambientLight=new kp(4213596,1.4),this.group.add(this.ambientLight),this.dirLight=new wo(13951730,2.2),this.dirLight.position.set(-15,26,20),this.dirLight.castShadow=!0,this.dirLight.shadow.mapSize.width=1024,this.dirLight.shadow.mapSize.height=1024,this.dirLight.shadow.camera.near=5,this.dirLight.shadow.camera.far=80,this.dirLight.shadow.camera.left=-55,this.dirLight.shadow.camera.right=55,this.dirLight.shadow.camera.top=35,this.dirLight.shadow.camera.bottom=-35,this.dirLight.shadow.bias=-5e-4,this.dirLight.shadow.normalBias=.02,this.group.add(this.dirLight),this.fillLight=new wo(4478310,1.1),this.fillLight.position.set(20,20,-20),this.group.add(this.fillLight)}buildBaySpotlights(){for(let t=0;t<this.bayPositions.length;t++){const e=this.bayPositions[t],n=new de;n.position.set(e.x,1,e.z),this.group.add(n),this.bayTargets.push(n);const i=new yo(16760427,9);i.position.set(e.x,14,e.z),i.target=n,i.angle=.65,i.penumbra=.45,i.decay=1,i.distance=45,i.castShadow=!1,this.group.add(i),this.baySpotlights.push({light:i,baseIntensity:9,currentIntensity:9,targetIntensity:9}),this.buildSpotlightFixture(e.x,14,e.z)}}buildSpotlightFixture(t,e,n){const i=new Wt;i.position.set(t,e,n);const r=new ct(.5,.2,.6,16,1,!0),a=new zt({color:2237997,roughness:.5,metalness:.8,side:Ne}),o=new I(r,a);o.position.y=.25,i.add(o);const c=new Rs(.35,16),l=new Tn({color:16771258,side:Ne}),h=new I(c,l);h.rotation.x=Math.PI/2,i.add(h);const u=new ct(.02,.02,1.8,6),f=new zt({color:3356223,metalness:.9,roughness:.4}),p=new I(u,f);p.position.y=1.4,i.add(p),this.group.add(i)}buildEmergencyBeacons(){[{x:-32,y:7.6,z:15.5},{x:-16,y:7.6,z:-15.5},{x:16,y:7.6,z:15.5},{x:32,y:7.6,z:-15.5}].forEach((e,n)=>{const i=new Wt;i.position.set(e.x,e.y,e.z);const r=new ct(.28,.32,.25,16),a=new zt({color:1711136,metalness:.7,roughness:.4}),o=new I(r,a);i.add(o);const c=new ct(.25,.25,.45,16),l=new zt({color:16717077,opacity:.78,transparent:!0,roughness:.18,metalness:.15,emissive:6684672,emissiveIntensity:.6}),h=new I(c,l);h.position.y=.32,i.add(h);const u=new Wt;u.position.y=.32;const f=new Gn(.12,12,12,0,Math.PI),p=new zt({color:13421772,metalness:.95,roughness:.1}),g=new I(f,p);g.rotation.y=Math.PI/2,u.add(g);const v=new Gn(.06,8,8),m=new Tn({color:16724787}),d=new I(v,m);u.add(d);let b=null;if(n%2===0){b=new yo(16717848,5,18,.45,.4,1.8),b.position.set(0,0,0);const w=new de;w.position.set(10,0,0),u.add(w),b.target=w,u.add(b)}i.add(u),this.group.add(i),this.beacons.push({group:i,rotor:u,spot:b,point:null,domeMat:l,angle:n*Math.PI/2,baseSpeed:2.8,currentSpeed:2.8})})}buildHighBaySodiumLamps(){[-20,20].forEach(t=>{const e=new lc(16754740,4.2,55,1);e.position.set(t,13.8,0),this.group.add(e),this.sodiumLamps.push({light:e,baseIntensity:4.2,flickerOffset:Math.random()*100})})}setSkin(t="default"){const e=t==="realistic";this.skin=e?"realistic":"default",this.ambientLight&&(this.ambientLight.color.setHex(e?2962494:4213596),this.ambientLight.intensity=e?.85:1.4),this.dirLight&&(this.dirLight.color.setHex(e?12899558:13951730),this.dirLight.intensity=e?1.9:2.2),this.fillLight&&(this.fillLight.color.setHex(e?3490383:4478310),this.fillLight.intensity=e?.8:1.1);const n=e?10.5:9;for(let a=0;a<this.baySpotlights.length;a++)this.baySpotlights[a].baseIntensity=n;const i=e?3.2:4.2,r=e?16750648:16754740;for(let a=0;a<this.sodiumLamps.length;a++)this.sodiumLamps[a].baseIntensity=i,this.sodiumLamps[a].light.color.setHex(r)}setActiveMachine(t){this.activeMachineIndex=Math.max(0,Math.min(this.bayPositions.length-1,t))}update(t,e,n){const i=(n==null?void 0:n.kick)||!1,r=(n==null?void 0:n.kickIntensity)||1,a=(n==null?void 0:n.isDrop)||!1,o=(n==null?void 0:n.activeMachineIndex)??this.activeMachineIndex;this.activeMachineIndex=o;for(let h=0;h<this.baySpotlights.length;h++){const u=this.baySpotlights[h];if(h===o)i?u.currentIntensity=u.baseIntensity*(1.8+r*1.6):u.currentIntensity=Ui.lerp(u.currentIntensity,u.baseIntensity*(a?1.4:1.1),e*6),u.light.color.setHex(a?16768938:16760427);else{const p=1+Math.sin(t*12+h)*.08;u.currentIntensity=Ui.lerp(u.currentIntensity,u.baseIntensity*.7*p,e*4),u.light.color.setHex(13933397)}u.light.intensity=u.currentIntensity}const c=a?14:i?9:2.5,l=a?7.5:i?5.5:2;for(let h=0;h<this.beacons.length;h++){const u=this.beacons[h];u.currentSpeed=Ui.lerp(u.currentSpeed,c,e*5),u.angle+=u.currentSpeed*e,u.rotor.rotation.y=u.angle;let f=(Math.sin(u.angle*2)+1)*.5;i&&(f=Math.max(f,.8+r*.4));const p=l*f;u.spot&&(u.spot.intensity=p),u.point&&(u.point.intensity=p*.6),u.domeMat.emissiveIntensity=.3+p*.4}for(let h=0;h<this.sodiumLamps.length;h++){const u=this.sodiumLamps[h],f=t*32+u.flickerOffset;let p=1+Math.sin(f)*.05+Math.sin(f*2.3)*.03;Math.sin(f*.17)>.98&&(p*=.65),u.light.intensity=u.baseIntensity*p}}dispose(){this.beacons.forEach(t=>{var e;(e=t.domeMat)==null||e.dispose()})}}class Xp{constructor(t){this.camera=t,this.machineManager=null,this.mode="auto",this.activeMachineIndex=0,this.currentShotIndex=0,this.baseFov=55,this.currentFov=55,this.targetFov=55,this.currentPosition=new E(0,6.5,22),this.targetPosition=new E(0,6.5,22),this.currentLookAt=new E(0,3,0),this.targetLookAt=new E(0,3,0),this.shakeIntensity=0,this.shakeOffset=new E,this.shakeRotation=new $e(0,0,0,"YXZ"),this.kickCount=0,this.lastKickTime=0,this.isDropActive=!1,this.defaultBayPositions=[new E(-32,0,0),new E(-16,0,0),new E(0,0,0),new E(16,0,0),new E(32,0,0)],this.machinePresets=[[{offset:new E(3.2,2.5,7.5),look:new E(0,2.2,0),fov:50},{offset:new E(0,2,7),look:new E(0,2,0),fov:48},{offset:new E(-4.2,3.8,6.8),look:new E(0,2.4,0),fov:52}],[{offset:new E(5,2.2,5.5),look:new E(0,2,0),fov:50},{offset:new E(-3,1.8,6.5),look:new E(0,1.8,0),fov:48},{offset:new E(3.5,3.5,6.5),look:new E(0,1.8,0),fov:52}],[{offset:new E(-3.2,2.8,6),look:new E(0,2.2,0),fov:50},{offset:new E(2.5,1.8,5.5),look:new E(0,1.8,0),fov:48},{offset:new E(0,2.8,6.5),look:new E(0,2.2,0),fov:50}],[{offset:new E(0,2.4,7.5),look:new E(0,2.4,0),fov:50},{offset:new E(4.5,3.5,6.5),look:new E(0,2.2,0),fov:52},{offset:new E(-4.5,2.5,6),look:new E(0,2.2,0),fov:50}],[{offset:new E(5,2,6),look:new E(0,1.6,0),fov:48},{offset:new E(-3.8,2.2,5.5),look:new E(0,1.5,0),fov:50},{offset:new E(0,4,6.5),look:new E(0,1.4,0),fov:52}]]}setMachineManager(t){this.machineManager=t}getMachinePosition(t){if(this.machineManager&&typeof this.machineManager.getMachinePosition=="function"){const n=this.machineManager.getMachinePosition(t);if(n)return n.clone()}const e=Math.max(0,Math.min(this.defaultBayPositions.length-1,t));return this.defaultBayPositions[e].clone()}setCameraFocus(t,e="focus"){this.activeMachineIndex=Math.max(0,Math.min(4,t)),this.mode=e,this.currentShotIndex=0,this.updateTargetForMachine(this.activeMachineIndex,!0)}triggerScreenShake(t=1){this.shakeIntensity=Math.min(this.shakeIntensity+t,2.5);const e=Math.min(t*3.6,6);this.camera.fov=Math.max(38,this.targetFov-e),this.camera.updateProjectionMatrix()}cycleMachineShot(){this.currentShotIndex=(this.currentShotIndex+1)%3,this.updateTargetForMachine(this.activeMachineIndex,!1)}updateTargetForMachine(t,e=!1){const n=this.getMachinePosition(t),i=this.machinePresets[t]||this.machinePresets[0],r=i[this.currentShotIndex%i.length];this.targetPosition.copy(n).add(r.offset),this.targetLookAt.copy(n).add(r.look),this.targetFov=r.fov||this.baseFov,e&&(this.currentPosition.copy(this.targetPosition),this.currentLookAt.copy(this.targetLookAt),this.camera.position.copy(this.currentPosition),this.camera.lookAt(this.currentLookAt))}updateOverviewCrane(t){const e=t*.12,n=Math.sin(e)*28,i=4.8+Math.sin(e*1.4)*1.8,r=14+Math.cos(e*.8)*2.5;this.targetPosition.set(n,i,r),this.targetLookAt.set(Math.sin(e*.6)*14,2.6,0),this.targetFov=this.baseFov}update(t,e,n){const i=(n==null?void 0:n.kick)||!1,r=(n==null?void 0:n.kickIntensity)||1,a=(n==null?void 0:n.isDrop)||!1,o=(n==null?void 0:n.activeMachineIndex)??this.activeMachineIndex;this.isDropActive=a,i&&(this.kickCount++,this.lastKickTime=t,this.triggerScreenShake(r),this.kickCount%8===0&&(this.currentShotIndex=(this.currentShotIndex+1)%3));const c=t-this.lastKickTime;this.mode==="overview"||this.mode==="orbit"?this.updateOverviewCrane(t):this.mode==="focus"?this.updateTargetForMachine(this.activeMachineIndex,!1):a||i||c<3.2?(this.activeMachineIndex!==o&&(this.activeMachineIndex=o,this.currentShotIndex=0),this.updateTargetForMachine(this.activeMachineIndex,!1)):this.updateOverviewCrane(t);const l=i?10:a?6.5:3.5,h=i?12:a?7.5:4.5;if(this.currentPosition.lerp(this.targetPosition,1-Math.exp(-l*e)),this.currentLookAt.lerp(this.targetLookAt,1-Math.exp(-h*e)),this.camera.fov=Ui.lerp(this.camera.fov,this.targetFov,1-Math.exp(-6*e)),this.camera.updateProjectionMatrix(),this.shakeIntensity>.001){const u=this.shakeIntensity;this.shakeOffset.set((Math.random()-.5)*u*.22,(Math.random()-.5)*u*.26,(Math.random()-.5)*u*.16),this.shakeRotation.set((Math.random()-.5)*u*.035,(Math.random()-.5)*u*.035,(Math.random()-.5)*u*.045),this.shakeIntensity*=Math.exp(-14*e)}else this.shakeIntensity=0,this.shakeOffset.set(0,0,0),this.shakeRotation.set(0,0,0);this.camera.position.copy(this.currentPosition).add(this.shakeOffset),this.camera.lookAt(this.currentLookAt),this.camera.rotation.x+=this.shakeRotation.x,this.camera.rotation.y+=this.shakeRotation.y,this.camera.rotation.z+=this.shakeRotation.z}}const hc={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class yi{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const Yp=new ra(-1,1,1,-1,0,1);class qp extends _e{constructor(){super(),this.setAttribute("position",new le([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new le([0,2,0,0,2,0],2))}}const Zp=new qp;class ha{constructor(t){this._mesh=new I(Zp,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,Yp)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}}class uc extends yi{constructor(t,e){super(),this.textureID=e!==void 0?e:"tDiffuse",t instanceof ye?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=ki.clone(t.uniforms),this.material=new ye({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this.fsQuad=new ha(this.material)}render(t,e,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this.fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}class To extends yi{constructor(t,e){super(),this.scene=t,this.camera=e,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,e,n){const i=t.getContext(),r=t.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(i.REPLACE,i.REPLACE,i.REPLACE),r.buffers.stencil.setFunc(i.ALWAYS,a,4294967295),r.buffers.stencil.setClear(o),r.buffers.stencil.setLocked(!0),t.setRenderTarget(n),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(e),this.clear&&t.clear(),t.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(i.EQUAL,1,4294967295),r.buffers.stencil.setOp(i.KEEP,i.KEEP,i.KEEP),r.buffers.stencil.setLocked(!0)}}class Kp extends yi{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}}class $p{constructor(t,e){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),e===void 0){const n=t.getSize(new Rt);this._width=n.width,this._height=n.height,e=new He(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:tn}),e.texture.name="EffectComposer.rt1"}else this._width=e.width,this._height=e.height;this.renderTarget1=e,this.renderTarget2=e.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new uc(hc),this.copyPass.material.blending=dn,this.clock=new Bp}swapBuffers(){const t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,e){this.passes.splice(e,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){const e=this.passes.indexOf(t);e!==-1&&this.passes.splice(e,1)}isLastEnabledPass(t){for(let e=t+1;e<this.passes.length;e++)if(this.passes[e].enabled)return!1;return!0}render(t){t===void 0&&(t=this.clock.getDelta());const e=this.renderer.getRenderTarget();let n=!1;for(let i=0,r=this.passes.length;i<r;i++){const a=this.passes[i];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(i),a.render(this.renderer,this.writeBuffer,this.readBuffer,t,n),a.needsSwap){if(n){const o=this.renderer.getContext(),c=this.renderer.state.buffers.stencil;c.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),c.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}To!==void 0&&(a instanceof To?n=!0:a instanceof Kp&&(n=!1))}}this.renderer.setRenderTarget(e)}reset(t){if(t===void 0){const e=this.renderer.getSize(new Rt);this._pixelRatio=this.renderer.getPixelRatio(),this._width=e.width,this._height=e.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,e){this._width=t,this._height=e;const n=this._width*this._pixelRatio,i=this._height*this._pixelRatio;this.renderTarget1.setSize(n,i),this.renderTarget2.setSize(n,i);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,i)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class jp extends yi{constructor(t,e,n=null,i=null,r=null){super(),this.scene=t,this.camera=e,this.overrideMaterial=n,this.clearColor=i,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new Ht}render(t,e,n){const i=t.autoClear;t.autoClear=!1;let r,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor,t.getClearAlpha())),this.clearAlpha!==null&&(r=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),t.autoClear=i}}const Jp={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new Ht(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class gi extends yi{constructor(t,e,n,i){super(),this.strength=e!==void 0?e:1,this.radius=n,this.threshold=i,this.resolution=t!==void 0?new Rt(t.x,t.y):new Rt(256,256),this.clearColor=new Ht(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new He(r,a,{type:tn}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let u=0;u<this.nMips;u++){const f=new He(r,a,{type:tn});f.texture.name="UnrealBloomPass.h"+u,f.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(f);const p=new He(r,a,{type:tn});p.texture.name="UnrealBloomPass.v"+u,p.texture.generateMipmaps=!1,this.renderTargetsVertical.push(p),r=Math.round(r/2),a=Math.round(a/2)}const o=Jp;this.highPassUniforms=ki.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=i,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new ye({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];const c=[3,5,7,9,11];r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let u=0;u<this.nMips;u++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(c[u])),this.separableBlurMaterials[u].uniforms.invSize.value=new Rt(1/r,1/a),r=Math.round(r/2),a=Math.round(a/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=e,this.compositeMaterial.uniforms.bloomRadius.value=.1;const l=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=l,this.bloomTintColors=[new E(1,1,1),new E(1,1,1),new E(1,1,1),new E(1,1,1),new E(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;const h=hc;this.copyUniforms=ki.clone(h.uniforms),this.blendMaterial=new ye({uniforms:this.copyUniforms,vertexShader:h.vertexShader,fragmentShader:h.fragmentShader,blending:oi,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new Ht,this.oldClearAlpha=1,this.basic=new Tn,this.fsQuad=new ha(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(t,e){let n=Math.round(t/2),i=Math.round(e/2);this.renderTargetBright.setSize(n,i);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(n,i),this.renderTargetsVertical[r].setSize(n,i),this.separableBlurMaterials[r].uniforms.invSize.value=new Rt(1/n,1/i),n=Math.round(n/2),i=Math.round(i/2)}render(t,e,n,i,r){t.getClearColor(this._oldClearColor),this.oldClearAlpha=t.getClearAlpha();const a=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),r&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=n.texture,t.setRenderTarget(null),t.clear(),this.fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this.fsQuad.render(t);let o=this.renderTargetBright;for(let c=0;c<this.nMips;c++)this.fsQuad.material=this.separableBlurMaterials[c],this.separableBlurMaterials[c].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[c].uniforms.direction.value=gi.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[c]),t.clear(),this.fsQuad.render(t),this.separableBlurMaterials[c].uniforms.colorTexture.value=this.renderTargetsHorizontal[c].texture,this.separableBlurMaterials[c].uniforms.direction.value=gi.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[c]),t.clear(),this.fsQuad.render(t),o=this.renderTargetsVertical[c];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this.fsQuad.render(t),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(n),this.fsQuad.render(t)),t.setClearColor(this._oldClearColor,this.oldClearAlpha),t.autoClear=a}getSeperableBlurMaterial(t){const e=[];for(let n=0;n<t;n++)e.push(.39894*Math.exp(-.5*n*n/(t*t))/t);return new ye({defines:{KERNEL_RADIUS:t},uniforms:{colorTexture:{value:null},invSize:{value:new Rt(.5,.5)},direction:{value:new Rt(.5,.5)},gaussianCoefficients:{value:e}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(t){return new ye({defines:{NUM_MIPS:t},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}}gi.BlurDirectionX=new Rt(1,0);gi.BlurDirectionY=new Rt(0,1);const Qp={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
	
		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};class tm extends yi{constructor(){super();const t=Qp;this.uniforms=ki.clone(t.uniforms),this.material=new Dp({name:t.name,uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader}),this.fsQuad=new ha(this.material),this._outputColorSpace=null,this._toneMapping=null}render(t,e,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=t.toneMappingExposure,(this._outputColorSpace!==t.outputColorSpace||this._toneMapping!==t.toneMapping)&&(this._outputColorSpace=t.outputColorSpace,this._toneMapping=t.toneMapping,this.material.defines={},Yt.getTransfer(this._outputColorSpace)===Jt&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===Co?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===Ro?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===Po?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===$r?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===Io?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===Do&&(this.material.defines.NEUTRAL_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}const em={name:"IndustrialPostShader",uniforms:{tDiffuse:{value:null},uTime:{value:0},uGrainIntensity:{value:.045},uVignetteDarkness:{value:1.25},uVignetteOffset:{value:.95},uKickAberration:{value:0}},vertexShader:`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrainIntensity;
    uniform float uVignetteDarkness;
    uniform float uVignetteOffset;
    uniform float uKickAberration;

    varying vec2 vUv;

    // Pseudo-random noise generator
    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;
      vec2 distFromCenter = uv - vec2(0.5);
      float dist = length(distFromCenter);

      // 1. Kick Chromatic Aberration (Safe radial displacement on heavy kicks)
      vec2 dir = dist > 0.0001 ? normalize(distFromCenter) : vec2(0.0);
      float shift = uKickAberration * dist;

      float r = texture2D(tDiffuse, uv + dir * shift).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - dir * shift).b;
      vec3 color = vec3(r, g, b);

      // 2. Subtle Analog Film Grain
      float grain = (random(uv * 2.5 + fract(uTime * 17.0)) - 0.5) * uGrainIntensity;
      color += grain;

      gl_FragColor = vec4(color, 1.0);
    }
  `};class nm{constructor(t,e,n,i=typeof window<"u"?window.innerWidth:1920,r=typeof window<"u"?window.innerHeight:1080){this.renderer=t,this.scene=e,this.camera=n,this.width=i,this.height=r,this.enabled=!0,this.kickAberration=0,this.initComposer()}initComposer(){try{const t=this.renderer.getPixelRatio?this.renderer.getPixelRatio():1,e=new He(Math.floor(this.width*t),Math.floor(this.height*t),{minFilter:Te,magFilter:Te,format:Ge,type:tn,samples:2});this.composer=new $p(this.renderer,e),this.composer.setPixelRatio(t),this.composer.setSize(this.width,this.height),this.renderPass=new jp(this.scene,this.camera),this.composer.addPass(this.renderPass);const n=new Rt(Math.floor(this.width*.5),Math.floor(this.height*.5));this.bloomPass=new gi(n,.45,.35,.82),this.composer.addPass(this.bloomPass),this.customPass=new uc(em),this.composer.addPass(this.customPass),this.outputPass=new tm,this.composer.addPass(this.outputPass)}catch(t){console.warn("[PostProcessing] Fallback to standard renderer:",t),this.enabled=!1}}setSize(t,e){this.width=t,this.height=e;const n=this.renderer.getPixelRatio?this.renderer.getPixelRatio():1;this.composer&&(this.composer.setPixelRatio(n),this.composer.setSize(t,e)),this.bloomPass&&this.bloomPass.resolution.set(Math.floor(t*.5),Math.floor(e*.5))}setSkin(t="default"){this.skin=t==="realistic"?"realistic":"default"}render(t,e,n){if(!this.enabled||!this.composer){this.renderer.render(this.scene,this.camera);return}const i=(n==null?void 0:n.kick)||!1,r=(n==null?void 0:n.kickIntensity)||1,a=(n==null?void 0:n.isDrop)||!1,o=this.skin==="realistic";if(this.bloomPass){const c=o?a?.42:.28:a?.58:.42,h=i?c+r*(o?.16:.22):c;this.bloomPass.strength=Ui.lerp(this.bloomPass.strength,h,e*12)}i?this.kickAberration=Math.min(this.kickAberration+.0022*r,.006):this.kickAberration*=Math.exp(-14*e),this.customPass&&this.customPass.uniforms&&(this.customPass.uniforms.uTime.value=t,this.customPass.uniforms.uKickAberration.value=this.kickAberration,this.customPass.uniforms.uGrainIntensity.value=a?.016:.01),this.composer.render()}dispose(){this.composer&&this.composer.dispose()}}let fs=null;function im(s=512,t=512){const e=document.createElement("canvas");e.width=s,e.height=t;const n=e.getContext("2d");n.fillStyle="#d99000",n.fillRect(0,0,s,t),n.fillStyle="#161616";const i=48,r=s+t+i*4;n.save();for(let c=-t;c<r;c+=i*2)n.beginPath(),n.moveTo(c,0),n.lineTo(c+i,0),n.lineTo(c+i-t,t),n.lineTo(c-t,t),n.closePath(),n.fill();n.fillStyle="rgba(20, 15, 10, 0.18)";for(let c=0;c<2e3;c++){const l=Math.random()*s,h=Math.random()*t,u=1+Math.random()*4;n.fillRect(l,h,u,u)}const a=n.createLinearGradient(0,0,0,t);a.addColorStop(0,"rgba(0,0,0,0.4)"),a.addColorStop(.1,"rgba(0,0,0,0)"),a.addColorStop(.9,"rgba(0,0,0,0)"),a.addColorStop(1,"rgba(0,0,0,0.5)"),n.fillStyle=a,n.fillRect(0,0,s,t),n.restore();const o=new Ie(e);return o.wrapS=te,o.wrapT=te,o}function sm(s=512,t=512){const e=document.createElement("canvas");e.width=s,e.height=t;const n=e.getContext("2d");n.fillStyle="#55585c",n.fillRect(0,0,s,t),n.strokeStyle="rgba(255, 255, 255, 0.08)",n.lineWidth=1;for(let r=0;r<400;r++){const a=Math.random()*t;n.beginPath(),n.moveTo(0,a),n.lineTo(s,a+(Math.random()-.5)*4),n.stroke()}n.strokeStyle="rgba(15, 15, 15, 0.12)";for(let r=0;r<400;r++){const a=Math.random()*t;n.beginPath(),n.moveTo(0,a),n.lineTo(s,a+(Math.random()-.5)*4),n.stroke()}const i=new Ie(e);return i.wrapS=te,i.wrapT=te,i}function rm(s=256,t=256){const e=document.createElement("canvas");e.width=s,e.height=t;const n=e.getContext("2d");n.fillStyle="#3a2016",n.fillRect(0,0,s,t);for(let r=0;r<1500;r++){const a=Math.random()*s,o=Math.random()*t,c=Math.random()*8,l=Math.random();l<.4?n.fillStyle="rgba(130, 50, 20, 0.25)":l<.8?n.fillStyle="rgba(180, 80, 30, 0.2)":n.fillStyle="rgba(40, 20, 15, 0.35)",n.beginPath(),n.arc(a,o,c,0,Math.PI*2),n.fill()}const i=new Ie(e);return i.wrapS=te,i.wrapT=te,i}function am(s=256,t=256){const e=document.createElement("canvas");e.width=s,e.height=t;const n=e.getContext("2d");n.fillStyle="#1e1c1b",n.fillRect(0,0,s,t);const i=16,r=8,a=t/i,o=s/r;n.strokeStyle="#0d0d0c",n.lineWidth=2;for(let l=0;l<i;l++){const h=l*a,u=l%2===0?0:o/2;for(let f=-1;f<=r;f++){const p=f*o+u,g=35+Math.floor(Math.random()*25),v=g+8,m=g,d=g-5;n.fillStyle=`rgb(${v},${m},${d})`,n.fillRect(p+1,h+1,o-2,a-2),n.strokeRect(p,h,o,a)}}const c=new Ie(e);return c.wrapS=te,c.wrapT=te,c}function dc(){if(fs)return fs;const s=im(),t=sm(),e=rm(),n=am();return[s,t,e,n].forEach(i=>{i&&(i.anisotropy=8,i.minFilter=Qe,i.magFilter=Te)}),fs={castIron:new zt({color:4739164,roughness:.62,metalness:.72,map:t,bumpScale:.05}),darkSteel:new zt({color:4015183,roughness:.5,metalness:.76,map:t}),machinedSteel:new zt({color:13160152,roughness:.24,metalness:.92,map:t}),chromePiston:new zt({color:16054266,roughness:.08,metalness:.98}),yellowPaint:new zt({color:16099840,roughness:.38,metalness:.25}),hazardStripes:new zt({map:s,roughness:.45,metalness:.25}),rustedSteel:new zt({color:8141858,roughness:.88,metalness:.25,map:e}),brass:new zt({color:14590530,roughness:.28,metalness:.85}),rubber:new zt({color:2237480,roughness:.85,metalness:.08}),moltenOrange:new zt({color:16737792,emissive:16730112,emissiveIntensity:4.2,roughness:.3,metalness:.1}),moltenHot:new zt({color:16773856,emissive:16759603,emissiveIntensity:5.5,roughness:.2,metalness:.1}),refractoryBrick:new zt({map:n,roughness:.95,metalness:.05}),gaugeFace:new zt({color:15066588,roughness:.2,metalness:.1}),indicatorRed:new zt({color:16716032,emissive:13369344,emissiveIntensity:1.5,roughness:.3,metalness:.2}),indicatorGreen:new zt({color:65348,emissive:52275,emissiveIntensity:1.5,roughness:.3,metalness:.2}),textures:{hazardTex:s,brushedTex:t,rustTex:e,brickTex:n}},fs}function om(s=512,t=512){const e=document.createElement("canvas");e.width=s,e.height=t;const n=e.getContext("2d");n.fillStyle="#2d3138",n.fillRect(0,0,s,t);for(let r=0;r<650;r++){const a=Math.random()*s,o=Math.random()*t,c=4+Math.random()*24;n.fillStyle=Math.random()<.5?"rgba(14, 15, 17, 0.25)":"rgba(55, 58, 62, 0.2)",n.beginPath(),n.arc(a,o,c,0,Math.PI*2),n.fill()}for(let r=0;r<420;r++){const a=Math.random()*s,o=Math.random()*t,c=2+Math.random()*14,l=Math.random();l<.45?n.fillStyle="rgba(115, 46, 18, 0.34)":l<.8?n.fillStyle="rgba(148, 66, 24, 0.26)":n.fillStyle="rgba(68, 28, 14, 0.4)",n.beginPath(),n.arc(a,o,c,0,Math.PI*2),n.fill(),Math.random()<.22&&(n.fillStyle="rgba(72, 32, 16, 0.22)",n.fillRect(a-1,o,2+Math.random()*3,18+Math.random()*55))}for(let r=0;r<2400;r++){const a=Math.random()*s,o=Math.random()*t,c=1+Math.random()*2.5;n.fillStyle=Math.random()<.65?"rgba(130, 124, 112, 0.16)":"rgba(95, 90, 82, 0.18)",n.fillRect(a,o,c,c)}n.strokeStyle="rgba(180, 185, 192, 0.12)",n.lineWidth=1;for(let r=0;r<160;r++){const a=Math.random()*s,o=Math.random()*t;n.beginPath(),n.moveTo(a,o),n.lineTo(a+(Math.random()-.5)*35,o+(Math.random()-.5)*14),n.stroke()}const i=new Ie(e);return i.wrapS=te,i.wrapT=te,i}function cm(s=512,t=512){const e=document.createElement("canvas");e.width=s,e.height=t;const n=e.getContext("2d");n.fillStyle="#9a9a9a",n.fillRect(0,0,s,t);for(let r=0;r<1600;r++){const a=Math.random()*s,o=Math.random()*t,c=1+Math.random()*9,l=Math.random()<.5?195+Math.floor(Math.random()*55):70+Math.floor(Math.random()*50);n.fillStyle=`rgba(${l},${l},${l},0.35)`,n.beginPath(),n.arc(a,o,c,0,Math.PI*2),n.fill()}const i=new Ie(e);return i.wrapS=te,i.wrapT=te,i}function lm(s=512,t=512){const e=document.createElement("canvas");e.width=s,e.height=t;const n=e.getContext("2d");n.fillStyle="#9e7018",n.fillRect(0,0,s,t);for(let r=0;r<380;r++){const a=Math.random()*s,o=Math.random()*t,c=2+Math.random()*14;n.fillStyle=Math.random()<.55?"rgba(58, 32, 18, 0.48)":"rgba(110, 46, 18, 0.42)",n.beginPath(),n.arc(a,o,c,0,Math.PI*2),n.fill()}for(let r=0;r<2e3;r++){const a=Math.random()*s,o=Math.random()*t,c=1+Math.random()*3;n.fillStyle=Math.random()<.5?"rgba(120, 114, 102, 0.2)":"rgba(20, 18, 16, 0.22)",n.fillRect(a,o,c,c)}const i=new Ie(e);return i.wrapS=te,i.wrapT=te,i}function hm(s=512,t=512){const e=document.createElement("canvas");e.width=s,e.height=t;const n=e.getContext("2d");n.fillStyle="#8c6614",n.fillRect(0,0,s,t),n.fillStyle="#18181a";const i=48,r=s+t+i*4;for(let o=-t;o<r;o+=i*2)n.beginPath(),n.moveTo(o,0),n.lineTo(o+i,0),n.lineTo(o+i-t,t),n.lineTo(o-t,t),n.closePath(),n.fill();for(let o=0;o<450;o++){const c=Math.random()*s,l=Math.random()*t,h=2+Math.random()*11;n.fillStyle=Math.random()<.5?"rgba(105, 44, 18, 0.42)":"rgba(115, 110, 100, 0.28)",n.beginPath(),n.arc(c,l,h,0,Math.PI*2),n.fill()}const a=new Ie(e);return a.wrapS=te,a.wrapT=te,a}let ps=null;function um(){if(ps)return ps;const s=om(),t=cm(),e=lm(),n=hm();return[s,t,e,n].forEach(i=>{i&&(i.anisotropy=8,i.minFilter=Qe,i.magFilter=Te)}),ps={weatheredTex:s,weatheredBumpTex:t,weatheredYellowTex:e,dustyHazardTex:n},ps}function dm(s="default"){const t=dc(),e=s==="realistic",n=t.textures,i=e?um():null,r=(a,o)=>{a&&(o.color!==void 0&&a.color.setHex(o.color),o.roughness!==void 0&&(a.roughness=o.roughness),o.metalness!==void 0&&(a.metalness=o.metalness),"map"in o&&(a.map=o.map),"bumpMap"in o&&(a.bumpMap=o.bumpMap),"bumpScale"in o&&(a.bumpScale=o.bumpScale),"roughnessMap"in o&&(a.roughnessMap=o.roughnessMap),a.needsUpdate=!0)};e?(r(t.castIron,{color:7369850,roughness:.92,metalness:.68,map:i.weatheredTex,bumpMap:i.weatheredBumpTex,bumpScale:.045,roughnessMap:i.weatheredBumpTex}),r(t.darkSteel,{color:6120040,roughness:.88,metalness:.72,map:i.weatheredTex,bumpMap:i.weatheredBumpTex,bumpScale:.035,roughnessMap:i.weatheredBumpTex}),r(t.machinedSteel,{color:10133672,roughness:.44,metalness:.88,map:i.weatheredTex,bumpMap:i.weatheredBumpTex,bumpScale:.015,roughnessMap:null}),r(t.chromePiston,{color:12765392,roughness:.22,metalness:.94,bumpMap:null,roughnessMap:null}),r(t.yellowPaint,{color:16777215,roughness:.82,metalness:.22,map:i.weatheredYellowTex,bumpMap:i.weatheredBumpTex,bumpScale:.03,roughnessMap:i.weatheredBumpTex}),r(t.hazardStripes,{color:16777215,roughness:.85,metalness:.18,map:i.dustyHazardTex,bumpMap:i.weatheredBumpTex,bumpScale:.025,roughnessMap:i.weatheredBumpTex}),r(t.rustedSteel,{color:9060898,roughness:.96,metalness:.18,map:n.rustTex,bumpMap:i.weatheredBumpTex,bumpScale:.055,roughnessMap:i.weatheredBumpTex}),r(t.brass,{color:9202744,roughness:.52,metalness:.8,bumpMap:i.weatheredBumpTex,bumpScale:.015}),r(t.rubber,{color:2500132,roughness:.96,metalness:.04}),r(t.gaugeFace,{color:11578006,roughness:.45,metalness:.08})):(r(t.castIron,{color:4739164,roughness:.62,metalness:.72,map:n.brushedTex,bumpMap:null,bumpScale:.05,roughnessMap:null}),r(t.darkSteel,{color:4015183,roughness:.5,metalness:.76,map:n.brushedTex,bumpMap:null,roughnessMap:null}),r(t.machinedSteel,{color:13160152,roughness:.24,metalness:.92,map:n.brushedTex,bumpMap:null,roughnessMap:null}),r(t.chromePiston,{color:16054266,roughness:.08,metalness:.98,bumpMap:null,roughnessMap:null}),r(t.yellowPaint,{color:16099840,roughness:.38,metalness:.25,map:null,bumpMap:null,roughnessMap:null}),r(t.hazardStripes,{color:16777215,roughness:.45,metalness:.25,map:n.hazardTex,bumpMap:null,roughnessMap:null}),r(t.rustedSteel,{color:8141858,roughness:.88,metalness:.25,map:n.rustTex,bumpMap:null,roughnessMap:null}),r(t.brass,{color:14590530,roughness:.28,metalness:.85,bumpMap:null}),r(t.rubber,{color:2237480,roughness:.85,metalness:.08}),r(t.gaugeFace,{color:15066588,roughness:.2,metalness:.1}))}class fm{constructor(t={}){this.options=t,this.container=null,this.renderer=null,this.scene=null,this.camera=null,this.factory=null,this.lighting=null,this.cameraDirector=null,this.postprocessing=null,this.machineManager=null,this.isInitialized=!1,this.width=typeof window<"u"&&window.innerWidth?window.innerWidth:1920,this.height=typeof window<"u"&&window.innerHeight?window.innerHeight:1080,this._maxPixelRatio=typeof window<"u"?Math.min(window.devicePixelRatio||1,1.5):1,this._currentScale=this._maxPixelRatio,this._fpsAccumTime=0,this._fpsFrames=0,this._onResize=this.onWindowResize.bind(this)}init(t=typeof document<"u"?document.body:null){if(this.isInitialized||!t)return;this.container=t,this.width=t.clientWidth||(typeof window<"u"?window.innerWidth:1920),this.height=t.clientHeight||(typeof window<"u"?window.innerHeight:1080),this.renderer=new Pp({antialias:!0,powerPreference:"high-performance",stencil:!1,depth:!0}),this.renderer.setSize(this.width,this.height);const e=typeof window<"u"?Math.min(window.devicePixelRatio,1.5):1;this.renderer.setPixelRatio(e),this.renderer.outputColorSpace=ke,this.renderer.toneMapping=$r,this.renderer.toneMappingExposure=1.25,this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=Kr,this.container.appendChild(this.renderer.domElement),this.scene=new Ip,this.scene.background=new Ht(921879),this.scene.fog=new bs(1185312,.006);const n=this.width/this.height;this.camera=new Re(55,n,.1,250),this.camera.position.set(0,6.5,22),this.factory=new Vp(this.scene),this.lighting=new Wp(this.scene),this.cameraDirector=new Xp(this.camera),this.machineManager&&this.cameraDirector.setMachineManager(this.machineManager),this.postprocessing=new nm(this.renderer,this.scene,this.camera,this.width,this.height),typeof window<"u"&&window.addEventListener("resize",this._onResize),this.isInitialized=!0,console.log("[SceneEngine] Initialized successfully.")}setMachineManager(t){this.machineManager=t,this.cameraDirector&&this.cameraDirector.setMachineManager(t)}render(t,e,n=null){if(this.isInitialized){if(this._fpsAccumTime+=e,this._fpsFrames++,this._fpsAccumTime>=1){const i=this._fpsFrames/this._fpsAccumTime;this._fpsAccumTime=0,this._fpsFrames=0;let r=this._currentScale;i<32&&r>.72?r=Math.max(.72,r-.12):i>52&&r<this._maxPixelRatio&&(r=Math.min(this._maxPixelRatio,r+.08)),Math.abs(r-this._currentScale)>.02&&(this._currentScale=r,this.renderer.setPixelRatio(r),this.renderer.setSize(this.width,this.height),this.postprocessing&&this.postprocessing.setSize(this.width,this.height))}this.factory&&this.factory.update(t,e,n),this.lighting&&this.lighting.update(t,e,n),this.cameraDirector&&this.cameraDirector.update(t,e,n),this.postprocessing?this.postprocessing.render(t,e,n):this.renderer.render(this.scene,this.camera)}}getScene(){return this.scene}getCamera(){return this.camera}getRenderer(){return this.renderer}getFactoryEnvironment(){return this.factory}getLighting(){return this.lighting}getCameraDirector(){return this.cameraDirector}setCameraFocus(t,e="focus"){this.cameraDirector&&this.cameraDirector.setCameraFocus(t,e),this.lighting&&this.lighting.setActiveMachine(t)}setSkin(t="default"){const e=t==="realistic",n=e?"realistic":"default";this.scene&&(this.scene.background=new Ht(e?592654:921879),this.scene.fog=new bs(e?790034:1185312,e?.0075:.006)),this.renderer&&(this.renderer.toneMappingExposure=e?1.18:1.25),this.factory&&typeof this.factory.setSkin=="function"&&this.factory.setSkin(n),this.lighting&&typeof this.lighting.setSkin=="function"&&this.lighting.setSkin(n),this.postprocessing&&typeof this.postprocessing.setSkin=="function"&&this.postprocessing.setSkin(n),dm(n)}triggerScreenShake(t=1){this.cameraDirector&&this.cameraDirector.triggerScreenShake(t)}onWindowResize(){if(this.isInitialized){if(this.width=this.container&&this.container.clientWidth||(typeof window<"u"?window.innerWidth:1920),this.height=this.container&&this.container.clientHeight||(typeof window<"u"?window.innerHeight:1080),this.camera&&(this.camera.aspect=this.width/this.height,this.camera.updateProjectionMatrix()),this.renderer){this.renderer.setSize(this.width,this.height);const t=typeof window<"u"?Math.min(window.devicePixelRatio,1.5):1;this.renderer.setPixelRatio(t)}this.postprocessing&&this.postprocessing.setSize(this.width,this.height)}}dispose(){typeof window<"u"&&window.removeEventListener("resize",this._onResize),this.factory&&this.factory.dispose(),this.lighting&&this.lighting.dispose(),this.postprocessing&&this.postprocessing.dispose(),this.renderer&&this.renderer.domElement&&this.renderer.domElement.parentElement&&(this.renderer.domElement.parentElement.removeChild(this.renderer.domElement),this.renderer.dispose()),this.isInitialized=!1}}class pm{constructor(t,e){this.materials=t,this.vfx=e,this.group=new Wt,this.name="Hydraulic Stamp Press",this.ramTopY=4.4,this.ramImpactY=1.08,this.ramY=this.ramTopY,this.ramVelocity=0,this.isSlamming=!1,this.impactFired=!1,this.recoilShake=0,this.billetGlow=1,this.cycleTimer=0,this.buildMesh()}buildMesh(){const t=this.materials,e=new et(6.4,.9,4.8),n=new I(e,t.darkSteel);n.position.y=.45,n.castShadow=!0,n.receiveShadow=!0,this.group.add(n);const i=new et(6.42,.25,.05),r=new I(i,t.hazardStripes);r.position.set(0,.45,2.42),this.group.add(r);const a=new I(i,t.hazardStripes);a.position.set(0,.45,-2.42),this.group.add(a);const o=new ct(1.4,1.7,.85,16);this.anvilMesh=new I(o,t.castIron),this.anvilMesh.position.y=1.15,this.anvilMesh.castShadow=!0,this.anvilMesh.receiveShadow=!0,this.group.add(this.anvilMesh);const c=new et(1.6,.25,1.6),l=new I(c,t.machinedSteel);l.position.y=1.65,this.group.add(l);const h=new et(1.1,.2,1.1);this.billetMat=t.moltenOrange.clone(),this.billetMesh=new I(h,this.billetMat),this.billetMesh.position.y=1.82,this.group.add(this.billetMesh);const u=.28,f=7.2,p=new ct(u,u,f,20),g=[[-2.3,-1.6],[2.3,-1.6],[-2.3,1.6],[2.3,1.6]];this.columns=[],g.forEach(([K,z])=>{const Q=new I(p,t.chromePiston);Q.position.set(K,f/2+.9,z),Q.castShadow=!0,this.group.add(Q),this.columns.push(Q);const nt=new ct(.42,.45,.35,16),ot=new I(nt,t.castIron);ot.position.set(K,1.05,z),this.group.add(ot);const _t=new I(nt,t.castIron);_t.position.set(K,7.8,z),this.group.add(_t)}),[-2.8,2.8].forEach(K=>{const z=new et(.6,6.8,3.4),Q=new I(z,t.yellowPaint);Q.position.set(K,4.3,0),Q.castShadow=!0,this.group.add(Q);for(let nt=1.5;nt<=7;nt+=1.3){const ot=new ct(.08,.08,.1,8);ot.rotateZ(Math.PI/2);const _t=new I(ot,t.darkSteel);_t.position.set(K+(K>0?.32:-.32),nt,0),this.group.add(_t)}});const v=new et(6.6,1.4,4.6),m=new I(v,t.castIron);m.position.y=8.1,m.castShadow=!0,this.group.add(m);const d=new ct(1.25,1.35,2.8,24),b=new I(d,t.yellowPaint);b.position.set(0,9.8,0),b.castShadow=!0,this.group.add(b);const w=new ct(1.4,1.4,.4,24),_=new I(w,t.darkSteel);_.position.set(0,11.3,0),this.group.add(_),[-1.8,1.8].forEach(K=>{const z=new Gn(.7,16,16),Q=new I(z,t.machinedSteel);Q.position.set(K,10,.8),this.group.add(Q);const nt=new ct(.18,.18,1.2,12),ot=new I(nt,t.darkSteel);ot.position.set(K,9.1,.8),this.group.add(ot)});const P=new ct(.12,.12,3.2,12);P.rotateZ(Math.PI/2);const A=new I(P,t.brass);A.position.set(0,10.6,1.3),this.group.add(A),this.ventLeftPos=new E(-1.4,11.2,0),this.ventRightPos=new E(1.4,11.2,0);const C=new ct(.18,.12,.6,12);C.rotateZ(Math.PI/2);const D=new I(C,t.brass);D.position.copy(this.ventLeftPos),this.group.add(D);const S=new I(C,t.brass);S.position.copy(this.ventRightPos),this.group.add(S),[-1.1,1.1].forEach(K=>{const z=new ct(.32,.32,.15,16);z.rotateX(Math.PI/2);const Q=new I(z,t.gaugeFace);Q.position.set(K,8.1,2.38),this.group.add(Q);const nt=new mi(.33,.04,8,20),ot=new I(nt,t.brass);ot.position.set(K,8.1,2.45),this.group.add(ot)}),this.ramGroup=new Wt;const x=new et(4.2,1.6,3),R=new I(x,t.castIron);R.castShadow=!0,this.ramGroup.add(R);const O=new et(4.22,.7,.04),N=new I(O,t.hazardStripes);N.position.set(0,0,1.52),this.ramGroup.add(N);const G=new et(1.5,.5,1.5),q=new I(G,t.machinedSteel);q.position.set(0,-1,0),this.ramGroup.add(q);const W=new ct(.7,.7,3.6,20);this.pistonShaft=new I(W,t.chromePiston),this.pistonShaft.position.set(0,2.3,0),this.ramGroup.add(this.pistonShaft),g.forEach(([K,z])=>{const Q=new ct(.44,.44,1.65,16),nt=new I(Q,t.brass);nt.position.set(K,0,z),this.ramGroup.add(nt)}),this.ramGroup.position.y=this.ramY,this.group.add(this.ramGroup),this.impactPosWorld=new E(0,1.95,0)}getGroup(){return this.group}getPosition(){return this.group.position}triggerKick(t=1){this.ramY=this.ramImpactY,this.holdTimer=.06,this.onImpact(t)}update(t,e,n,i){this._basePos||(this._basePos=this.group.position.clone());const r=Math.min(e,.05);if(i&&n&&n.kick&&this.triggerKick(n.kickIntensity||1),i)this.holdTimer>0?(this.holdTimer-=r,this.ramY=this.ramImpactY):this.ramY<this.ramTopY&&(this.ramY+=(this.ramTopY-this.ramY)*(14*r));else{this.cycleTimer+=r*1.8;const a=(Math.sin(this.cycleTimer)+1)*.5,o=Math.pow(a,1.8);if(this.ramY=this.ramImpactY+.3+o*(this.ramTopY-this.ramImpactY-.3),a>.98&&Math.random()<.15&&this.vfx.steam){const c=this.ventLeftPos.clone().add(this.group.position);this.vfx.steam.vent(c,{count:8,speed:4,scale:.7})}}this.recoilShake>.001?(this.recoilShake*=Math.pow(.82,r*60),this.group.position.set(this._basePos.x+(Math.random()-.5)*this.recoilShake*.15,this._basePos.y+(Math.random()-.5)*this.recoilShake,this._basePos.z)):this.group.position.copy(this._basePos),this.ramGroup.position.y=this.ramY,this.billetGlow>1&&(this.billetGlow-=r*2.5,this.billetGlow<1&&(this.billetGlow=1),this.billetMat.emissiveIntensity=2.5*this.billetGlow)}onImpact(t=1){if(this.recoilShake=.35*t,this.billetGlow=3*t,this.impactPosWorld.clone().add(this.group.position),this.vfx.sparks){const e=new E(0,1.84,0).add(this.group.position);this.vfx.sparks.burst(e,{count:Math.max(7,Math.floor(15*t)),speed:14*t,flatRadial:!0,intensity:t})}if(this.vfx.shockwaves){const e=this.group.position.clone();e.y=0,this.vfx.shockwaves.trigger(e,{duration:.38,maxRadius:5.5*t,color:16755234})}if(this.vfx.steam){const e=this.ventLeftPos.clone().add(this.group.position),n=this.ventRightPos.clone().add(this.group.position);this.vfx.steam.vent(e,{count:Math.max(5,Math.floor(9*t)),speed:11,direction:new E(-1,.35,0),scale:.8}),this.vfx.steam.vent(n,{count:Math.max(5,Math.floor(9*t)),speed:11,direction:new E(1,.35,0),scale:.8})}}}class mm{constructor(t,e){this.materials=t,this.vfx=e,this.group=new Wt,this.name="Industrial Guillotine",this.bladeTopY=3.6,this.bladeCutY=.82,this.bladeY=this.bladeTopY,this.bladeVelocity=0,this.isCutting=!1,this.recoilShake=0,this.cycleTimer=0,this.buildMesh()}buildMesh(){const t=this.materials,e=new et(6.8,.8,4.4),n=new I(e,t.darkSteel);n.position.y=.4,n.castShadow=!0,n.receiveShadow=!0,this.group.add(n);const i=new et(6.82,.22,.04),r=new I(i,t.hazardStripes);r.position.set(0,.4,2.22),this.group.add(r);const a=new et(4.6,.65,.8),o=new I(a,t.castIron);o.position.set(0,1.05,0),o.castShadow=!0,this.group.add(o);const c=new et(4.4,.15,.18),l=new I(c,t.machinedSteel);l.position.set(0,1.45,.32),this.group.add(l);const h=new et(4.2,.4,2.2),u=new I(h,t.darkSteel);u.position.set(0,.9,1.5),this.group.add(u),this.rollers=[];for(let S=.7;S<=2.3;S+=.45){const x=new ct(.12,.12,3.8,16);x.rotateZ(Math.PI/2);const R=new I(x,t.machinedSteel);R.position.set(0,1.15,S),R.castShadow=!0,this.group.add(R),this.rollers.push(R)}const f=new et(1.2,.5,3.2);this.beamMesh=new I(f,t.rustedSteel),this.beamMesh.position.set(0,1.45,1.5),this.beamMesh.castShadow=!0,this.group.add(this.beamMesh);const p=new et(4.2,.1,1.6);p.rotateX(.35);const g=new I(p,t.castIron);g.position.set(0,.75,-1.3),this.group.add(g),[-2.6,2.6].forEach(S=>{const x=new et(1.1,6.4,2.6),R=new I(x,t.yellowPaint);R.position.set(S,4,0),R.castShadow=!0,this.group.add(R);const O=new et(.25,5.8,.6),N=new I(O,t.machinedSteel);N.position.set(S>0?S-.55:S+.55,3.8,0),this.group.add(N);const G=new et(.04,5,.6),q=new I(G,t.hazardStripes);q.position.set(S>0?S+.57:S-.57,4,0),this.group.add(q)});const v=new et(6.6,1.2,2.4),m=new I(v,t.castIron);m.position.set(0,7.4,0),m.castShadow=!0,this.group.add(m),this.topCylinders=[],[-1.5,1.5].forEach(S=>{const x=new ct(.48,.52,2.4,16),R=new I(x,t.yellowPaint);R.position.set(S,8.8,0),R.castShadow=!0,this.group.add(R);const O=new ct(.58,.58,.3,16),N=new I(O,t.darkSteel);N.position.set(S,10.1,0),this.group.add(N);const G=new ct(.09,.09,.4,10);G.rotateZ(S>0?Math.PI/2:-Math.PI/2);const q=new I(G,t.brass);q.position.set(S>0?S+.6:S-.6,9.8,0),this.group.add(q)});const d=new ct(.1,.1,3.4,12);d.rotateZ(Math.PI/2);const b=new I(d,t.brass);b.position.set(0,9.4,.65),this.group.add(b),this.bladeGroup=new Wt;const w=new et(4.4,1.5,.5),_=new I(w,t.castIron);_.castShadow=!0,this.bladeGroup.add(_);const P=new et(4.42,.45,.04),A=new I(P,t.hazardStripes);A.position.set(0,.3,.28),this.bladeGroup.add(A);const C=new et(4.3,.65,.14);C.rotateZ(-.065);const D=new I(C,t.machinedSteel);D.position.set(0,-.9,.18),D.castShadow=!0,this.bladeGroup.add(D),[-1.5,1.5].forEach(S=>{const x=new ct(.22,.22,2.8,16),R=new I(x,t.chromePiston);R.position.set(S,2,0),this.bladeGroup.add(R)}),this.clamps=[],[-1.8,-.6,.6,1.8].forEach(S=>{const x=new ct(.12,.12,1.4,12),R=new I(x,t.darkSteel);R.position.set(S,.2,.65),this.group.add(R);const O=new ct(.22,.22,.15,12),N=new I(O,t.machinedSteel);N.position.set(S,1.7,.65),this.group.add(N),this.clamps.push(N)}),this.bladeGroup.position.y=this.bladeY,this.group.add(this.bladeGroup),this.ventPos=new E(0,9.8,0)}getGroup(){return this.group}getPosition(){return this.group.position}triggerKick(t=1){this.bladeY=this.bladeCutY,this.holdTimer=.05,this.onCutImpact(t)}update(t,e,n,i){this._basePos||(this._basePos=this.group.position.clone());const r=Math.min(e,.05),a=i?5.5:1.2;for(const o of this.rollers)o.rotation.x+=a*r;if(i&&n&&n.kick&&this.triggerKick(n.kickIntensity||1),i)this.holdTimer>0?(this.holdTimer-=r,this.bladeY=this.bladeCutY):this.bladeY<this.bladeTopY&&(this.bladeY+=(this.bladeTopY-this.bladeY)*(15*r));else{this.cycleTimer+=r*1.5;const o=(Math.sin(this.cycleTimer)+1)*.5;this.bladeY=this.bladeCutY+.4+Math.pow(o,2)*(this.bladeTopY-this.bladeCutY-.4)}this.recoilShake>.001?(this.recoilShake*=Math.pow(.8,r*60),this.group.position.set(this._basePos.x,this._basePos.y+(Math.random()-.5)*this.recoilShake,this._basePos.z+(Math.random()-.5)*this.recoilShake*.12)):this.group.position.copy(this._basePos),this.bladeGroup.position.y=this.bladeY}onCutImpact(t=1){if(this.recoilShake=.32*t,this.beamMesh.position.x=(Math.random()-.5)*.1,this.vfx.sparks&&[-1.5,-.5,.5,1.5].forEach(e=>{const n=new E(e,1.45,.35).add(this.group.position);this.vfx.sparks.burst(n,{count:Math.max(6,Math.floor(16*t)),speed:20*t,spread:Math.PI*.6,direction:new E(e*.4,.8,1),intensity:t})}),this.vfx.shockwaves){const e=this.group.position.clone();this.vfx.shockwaves.trigger(e,{duration:.32,maxRadius:5.5*t,color:16763972})}this.vfx.steam&&[-1.5,1.5].forEach(e=>{const n=new E(e,9.8,0).add(this.group.position);this.vfx.steam.vent(n,{count:Math.floor(22*t),speed:14,direction:new E(e>0?1:-1,.6,0),scale:1.1})})}}class gm{constructor(t,e){this.materials=t,this.vfx=e,this.group=new Wt,this.name="Column Drill / Industrial Puncher",this.quillTopY=3.6,this.quillPlungeY=1.95,this.quillY=this.quillTopY,this.quillVelocity=0,this.isPlunging=!1,this.spinAngle=0,this.recoilShake=0,this.cycleTimer=0,this.buildMesh()}buildMesh(){const t=this.materials,e=new et(4.8,.7,5.2),n=new I(e,t.castIron);n.position.y=.35,n.castShadow=!0,n.receiveShadow=!0,this.group.add(n);const i=new et(4.82,.2,.04),r=new I(i,t.hazardStripes);r.position.set(0,.35,2.62),this.group.add(r);const a=new et(3.6,.05,.1);[-1,0,1].forEach(he=>{const Dt=new I(a,t.darkSteel);Dt.position.set(0,.71,he),this.group.add(Dt)});const o=.65,c=7.8,l=new ct(o,o,c,24),h=new I(l,t.machinedSteel);h.position.set(0,c/2+.7,-1.1),h.castShadow=!0,this.group.add(h);const u=new ct(1.05,1.15,.5,20),f=new I(u,t.castIron);f.position.set(0,.95,-1.1),this.group.add(f);const p=new et(.18,6.2,.12),g=new I(p,t.darkSteel);g.position.set(0,4.4,-1.78),this.group.add(g);const v=new ct(.85,.85,.8,20),m=new I(v,t.castIron);m.position.set(0,1.7,-1.1),this.group.add(m);const d=new et(1.4,.6,1.8),b=new I(d,t.castIron);b.position.set(0,1.7,-.2),this.group.add(b);const w=new ct(1.6,1.6,.35,24),_=new I(w,t.machinedSteel);_.position.set(0,2.05,.5),_.castShadow=!0,_.receiveShadow=!0,this.group.add(_);const P=new et(1.8,.35,1.2),A=new I(P,t.darkSteel);A.position.set(0,2.38,.5),this.group.add(A);const C=new et(1.6,.3,.2),D=new I(C,t.machinedSteel);D.position.set(0,2.65,.9),this.group.add(D);const S=new I(C,t.machinedSteel);S.position.set(0,2.65,.1),this.group.add(S);const x=new et(1.4,.28,.9);this.workplate=new I(x,t.rustedSteel),this.workplate.position.set(0,2.65,.5),this.workplate.castShadow=!0,this.group.add(this.workplate);const R=new ct(.22,.22,.3,16),O=new I(R,t.moltenOrange);O.position.set(0,2.66,.5),this.group.add(O);const N=new ct(.04,.04,1.8,8),G=new I(N,t.brass);G.position.set(.65,2.9,.2),G.rotation.x=.4,G.rotation.z=-.3,this.group.add(G);const q=new et(2.4,2.2,3.8),W=new I(q,t.yellowPaint);W.position.set(0,7.2,-.4),W.castShadow=!0,this.group.add(W);const K=new et(.04,.8,3.2),z=new I(K,t.hazardStripes);z.position.set(1.22,7.2,-.4),this.group.add(z);const Q=new ct(.65,.65,1.8,16),nt=new I(Q,t.castIron);nt.position.set(0,7.4,-2.6),this.group.add(nt);for(let he=6.7;he<=8.1;he+=.22){const Dt=new ct(.72,.72,.04,16),Gt=new I(Dt,t.darkSteel);Gt.position.set(0,he,-2.6),this.group.add(Gt)}const ot=new et(2,.6,4.4),_t=new I(ot,t.castIron);_t.position.set(0,8.5,-.9),this.group.add(_t);const Lt=new ct(.2,.2,.3,12);Lt.rotateZ(Math.PI/2);const X=new I(Lt,t.machinedSteel);X.position.set(1.35,7,.5),this.group.add(X);for(let he=0;he<3;he++){const Dt=he*Math.PI*2/3,Gt=new ct(.03,.03,.9,8),Et=new I(Gt,t.chromePiston);Et.position.set(1.4,7+Math.sin(Dt)*.45,.5+Math.cos(Dt)*.45),Et.rotation.x=Dt,this.group.add(Et)}this.quillGroup=new Wt;const tt=new ct(.38,.38,2.6,20),ut=new I(tt,t.chromePiston);ut.position.set(0,1.2,.5),ut.castShadow=!0,this.quillGroup.add(ut),this.spindleRotator=new Wt,this.spindleRotator.position.set(0,-.1,.5);const rt=new ct(.48,.38,.75,20),yt=new I(rt,t.darkSteel);yt.castShadow=!0,this.spindleRotator.add(yt);const Pt=new ct(.5,.5,.25,20),Nt=new I(Pt,t.machinedSteel);Nt.position.set(0,.1,0),this.spindleRotator.add(Nt);const ie=new ct(.18,.18,.6,12),Vt=new I(ie,t.machinedSteel);Vt.position.set(0,-.6,0),this.spindleRotator.add(Vt);const oe=new Oi(.18,.75,12);oe.rotateX(Math.PI);const F=new I(oe,t.moltenOrange);F.position.set(0,-1.05,0),this.spindleRotator.add(F),this.quillGroup.add(this.spindleRotator),this.quillGroup.position.y=this.quillY,this.group.add(this.quillGroup),this.impactPosWorld=new E(0,2.8,.5)}getGroup(){return this.group}getPosition(){return this.group.position}triggerKick(t=1){this.quillY=this.quillPlungeY,this.holdTimer=.05,this.onPlungeImpact(t)}update(t,e,n,i){this._basePos||(this._basePos=this.group.position.clone());const r=Math.min(e,.05),a=i?60:18;if(this.spinAngle+=a*r,this.spindleRotator.rotation.y=this.spinAngle,i&&n&&n.kick&&this.triggerKick(n.kickIntensity||1),i)this.holdTimer>0?(this.holdTimer-=r,this.quillY=this.quillPlungeY):this.quillY<this.quillTopY&&(this.quillY+=(this.quillTopY-this.quillY)*(14*r));else{this.cycleTimer+=r*1.6;const o=(Math.sin(this.cycleTimer)+1)*.5;this.quillY=this.quillPlungeY+.35+Math.pow(o,1.6)*(this.quillTopY-this.quillPlungeY-.35)}this.recoilShake>.001?(this.recoilShake*=Math.pow(.85,r*60),this.group.position.set(this._basePos.x+(Math.random()-.5)*this.recoilShake,this._basePos.y+(Math.random()-.5)*this.recoilShake*.5,this._basePos.z)):this.group.position.copy(this._basePos),this.quillGroup.position.y=this.quillY}onPlungeImpact(t=1){this.recoilShake=.28*t;const e=this.impactPosWorld.clone().add(this.group.position);if(this.vfx.sparks&&this.vfx.sparks.burst(e,{count:Math.max(14,Math.floor(44*t)),speed:24*t,spread:Math.PI*.95,direction:new E(0,1,0),intensity:t}),this.vfx.steam&&this.vfx.steam.vent(e,{count:Math.floor(20*t),speed:8,direction:new E(.5,1,.2),scale:.9}),this.vfx.shockwaves){const n=new E(0,2.05,.5).add(this.group.position);this.vfx.shockwaves.trigger(n,{duration:.28,maxRadius:3.5*t,color:16746513})}}}class vm{constructor(t,e){this.materials=t,this.vfx=e,this.group=new Wt,this.name="Blast Furnace / Smelting Crucible",this.doorClosedY=2.4,this.doorOpenY=4.3,this.doorY=this.doorClosedY,this.doorVelocity=0,this.isOpen=!1,this.heatPulse=1,this.recoilShake=0,this.cycleTimer=0,this.buildMesh(),this.buildEmbers()}buildMesh(){const t=this.materials,e=new ct(3.6,3.9,.9,8),n=new I(e,t.castIron);n.position.y=.45,n.castShadow=!0,n.receiveShadow=!0,this.group.add(n);const i=new et(4.2,.22,.05),r=new I(i,t.hazardStripes);r.position.set(0,.45,3.65),this.group.add(r);const a=2.8,o=6.2,c=new ct(2.3,a,o,24),l=new I(c,t.refractoryBrick);l.position.y=o/2+.9,l.castShadow=!0,this.group.add(l);for(let _t=1.4;_t<=6.8;_t+=1.1){const Lt=2.85-(_t-1.4)*.08,X=new mi(Lt,.09,8,24);X.rotateX(Math.PI/2);const tt=new I(X,t.darkSteel);tt.position.y=_t,this.group.add(tt),[-1.8,1.8].forEach(ut=>{const rt=new et(.2,.22,.2),yt=new I(rt,t.machinedSteel);yt.position.set(ut,_t,2.2),this.group.add(yt)})}const h=3.3,u=new mi(h,.28,12,32);u.rotateX(Math.PI/2);const f=new I(u,t.yellowPaint);f.position.y=4.8,this.group.add(f);for(let _t=0;_t<6;_t++){const Lt=_t*Math.PI*2/6;if(Math.abs(Lt-Math.PI/2)<.5)continue;const X=Math.cos(Lt)*3,tt=Math.sin(Lt)*3,ut=new ct(.12,.14,1.1,10);ut.rotateX(Math.PI/2),ut.rotateY(-Lt);const rt=new I(ut,t.brass);rt.position.set(X*.8,4.3,tt*.8),this.group.add(rt)}const p=new Oi(2.4,2.4,20,1,!0),g=new I(p,t.castIron);g.position.y=8.1,this.group.add(g);const v=new ct(.85,.85,3.5,16),m=new I(v,t.darkSteel);m.position.y=10.4,this.group.add(m);const d=new ct(1.05,1.05,.2,16),b=new I(d,t.machinedSteel);b.position.y=11.8,this.group.add(b);const w=new et(2.4,2.6,.8),_=new I(w,t.castIron);_.position.set(0,2.8,2.7),this.group.add(_);const P=new et(1.8,1.8,1.2);this.chamberMat=t.moltenHot.clone();const A=new I(P,this.chamberMat);A.position.set(0,2.8,2.2),this.group.add(A);const C=new ct(1.6,1.6,.2,20);this.lavaMat=t.moltenOrange.clone(),this.lavaMesh=new I(C,this.lavaMat),this.lavaMesh.position.set(0,2.1,1.6),this.group.add(this.lavaMesh);const D=new et(.9,.4,2.8),S=new I(D,t.castIron);S.position.set(0,1.4,3.4),this.group.add(S);const x=new et(.5,.1,2.6),R=new I(x,t.moltenOrange);R.position.set(0,1.6,3.4),this.group.add(R),this.doorGroup=new Wt;const O=new et(1.9,2.1,.35),N=new I(O,t.yellowPaint);N.castShadow=!0,this.doorGroup.add(N);const G=new et(1.92,.6,.04),q=new I(G,t.hazardStripes);q.position.set(0,0,.2),this.doorGroup.add(q);const W=new ct(.2,.2,.45,12);W.rotateX(Math.PI/2);const K=new I(W,t.brass);K.position.set(0,.4,0),this.doorGroup.add(K);const z=new Rs(.12,12),Q=new I(z,t.moltenHot);Q.position.set(0,.4,.24),this.doorGroup.add(Q),[-1.05,1.05].forEach(_t=>{const Lt=new et(.18,4.2,.3),X=new I(Lt,t.machinedSteel);X.position.set(_t,3.6,3.05),this.group.add(X)});const nt=new ct(.18,.18,2.2,12),ot=new I(nt,t.darkSteel);ot.position.set(0,5.2,3),this.group.add(ot),this.doorGroup.position.set(0,this.doorY,2.95),this.group.add(this.doorGroup),this.furnaceLight=new lc(16737792,2,18,1.5),this.furnaceLight.position.set(0,2.8,2.5),this.group.add(this.furnaceLight),this.doorPosWorld=new E(0,2.8,3.1)}buildEmbers(){const e=new _e,n=new Float32Array(270);this.emberData=[];for(let r=0;r<90;r++){const a=(Math.random()-.5)*1.8,o=8.5+Math.random()*4.5,c=(Math.random()-.5)*1.8;n[r*3]=a,n[r*3+1]=o,n[r*3+2]=c,this.emberData.push({x:a,y:o,z:c,speed:1.5+Math.random()*2.5,drift:(Math.random()-.5)*.8})}e.setAttribute("position",new ve(n,3));const i=new Cs({color:16755234,size:.22,transparent:!0,blending:oi,depthWrite:!1});this.embers=new oa(e,i),this.group.add(this.embers)}getGroup(){return this.group}getPosition(){return this.group.position}triggerKick(t=1){this.doorY=this.doorOpenY,this.holdTimer=.06,this.heatPulse=3.8*t,this.onBlastDoorErupt(t)}update(t,e,n,i){this._basePos||(this._basePos=this.group.position.clone());const r=Math.min(e,.05),a=this.embers.geometry.attributes.position;for(let c=0;c<this.emberData.length;c++){const l=this.emberData[c];l.y+=l.speed*r,l.x+=l.drift*r,l.y>13.5&&(l.y=8.5,l.x=(Math.random()-.5)*1.8),a.setXYZ(c,l.x,l.y,l.z)}a.needsUpdate=!0;const o=1+Math.sin(t*6)*.12;if(this.lavaMesh.scale.set(o,1,o),i&&n&&n.kick&&this.triggerKick(n.kickIntensity||1),i)this.holdTimer>0?(this.holdTimer-=r,this.doorY=this.doorOpenY):this.doorY>this.doorClosedY&&(this.doorY-=(this.doorY-this.doorClosedY)*(12*r));else{this.cycleTimer+=r*1.2;const c=(Math.sin(this.cycleTimer)+1)*.5;if(this.doorY=this.doorClosedY+Math.pow(c,4)*.45,c>.95&&Math.random()<.12&&this.vfx.steam){const l=new E(0,12.2,0).add(this.group.position);this.vfx.steam.vent(l,{count:12,speed:6,direction:new E(0,1,0),isFireSmoke:!0,scale:1.2})}}this.heatPulse>1&&(this.heatPulse-=r*3.5,this.heatPulse<1&&(this.heatPulse=1)),this.furnaceLight.intensity=2*this.heatPulse,this.chamberMat.emissiveIntensity=3.5*this.heatPulse,this.lavaMat.emissiveIntensity=3*this.heatPulse,this.recoilShake>.001?(this.recoilShake*=Math.pow(.85,r*60),this.group.position.set(this._basePos.x,this._basePos.y+(Math.random()-.5)*this.recoilShake,this._basePos.z+(Math.random()-.5)*this.recoilShake*.15)):this.group.position.copy(this._basePos),this.doorGroup.position.y=this.doorY}onBlastDoorErupt(t=1){this.recoilShake=.35*t;const e=this.doorPosWorld.clone().add(this.group.position),n=new E(0,12.2,0).add(this.group.position);if(this.vfx.sparks&&this.vfx.sparks.burst(e,{count:Math.max(16,Math.floor(52*t)),speed:26*t,spread:Math.PI*.65,direction:new E(0,.4,1),intensity:t*1.2}),this.vfx.steam&&(this.vfx.steam.vent(n,{count:Math.floor(35*t),speed:16,direction:new E(0,1,0),isFireSmoke:!0,scale:1.6}),this.vfx.steam.vent(e,{count:Math.floor(20*t),speed:10,direction:new E(0,.2,1),scale:1.3})),this.vfx.shockwaves){const i=this.group.position.clone();this.vfx.shockwaves.trigger(i,{duration:.42,maxRadius:6.5*t,color:16729088})}}}class _m{constructor(t,e){this.materials=t,this.vfx=e,this.group=new Wt,this.name="Roll Forming Machine",this.gearAngle=0,this.feedVelocity=2,this.targetFeedVelocity=2,this.sheetOffsetZ=0,this.recoilShake=0,this.buildMesh()}buildMesh(){const t=this.materials,e=8.4,n=3.2,i=new et(n,.7,e),r=new I(i,t.darkSteel);r.position.y=.35,r.castShadow=!0,r.receiveShadow=!0,this.group.add(r);const a=new et(.04,.22,e),o=new I(a,t.hazardStripes);o.position.set(-n/2-.02,.35,0),this.group.add(o);const c=new I(a,t.hazardStripes);c.position.set(n/2+.02,.35,0),this.group.add(c),this.stands=[],this.upperRollers=[],this.lowerRollers=[],this.gears=[];const l=5,h=-3,u=1.5;for(let b=0;b<l;b++){const w=h+b*u,_=new Wt;_.position.z=w,[-1.1,1.1].forEach(_t=>{const Lt=new et(.45,2.6,.55),X=new I(Lt,t.yellowPaint);X.position.set(_t,1.8,0),X.castShadow=!0,_.add(X);const tt=new ct(.08,.08,.6,12),ut=new I(tt,t.machinedSteel);ut.position.set(_t,3.2,0),_.add(ut);const rt=new et(.24,.15,.24),yt=new I(rt,t.brass);yt.position.set(_t,3,0),_.add(yt)});const P=1.4,A=new ct(.12,.12,2.8,16);A.rotateZ(Math.PI/2);const C=new I(A,t.chromePiston);C.position.y=P,_.add(C);const D=.42,S=new ct(D,D,1.7,24);S.rotateZ(Math.PI/2);const x=new I(S,t.machinedSteel);x.position.y=P,x.castShadow=!0,_.add(x),this.lowerRollers.push(x);const R=2.25,O=new ct(.12,.12,2.8,16);O.rotateZ(Math.PI/2);const N=new I(O,t.chromePiston);N.position.y=R,_.add(N);const G=.42,q=new ct(G,G,1.7,24);q.rotateZ(Math.PI/2);const W=new I(q,t.machinedSteel);W.position.y=R,W.castShadow=!0,_.add(W),this.upperRollers.push(W);const K=1.42,z=new ct(.44,.44,.12,18);z.rotateZ(Math.PI/2);const Q=new I(z,t.castIron);Q.position.set(K,P,0),_.add(Q);const nt=new ct(.44,.44,.12,18);nt.rotateZ(Math.PI/2);const ot=new I(nt,t.castIron);ot.position.set(K,R,0),_.add(ot),this.gears.push({lower:Q,upper:ot}),this.group.add(_),this.stands.push(_)}const f=new et(1.6,.04,8.2);this.sheetMesh=new I(f,t.machinedSteel),this.sheetMesh.position.set(0,1.82,0),this.sheetMesh.castShadow=!0,this.group.add(this.sheetMesh);for(let b=.5;b<=3.8;b+=.4){const w=new et(1.58,.08,.15),_=new I(w,t.darkSteel);_.position.set(0,1.87,b),this.group.add(_)}const p=new ct(.65,.65,1.6,16);p.rotateX(Math.PI/2);const g=new I(p,t.castIron);g.position.set(-1.8,1.2,-3.2),this.group.add(g);const v=new ct(1.1,1.1,.25,24);v.rotateZ(Math.PI/2),this.flywheel=new I(v,t.darkSteel),this.flywheel.position.set(-1.8,1.2,-2.2),this.group.add(this.flywheel);for(let b=0;b<4;b++){const w=b*Math.PI/2,_=new ct(.06,.06,1.9,8),P=new I(_,t.machinedSteel);P.position.set(-1.8,1.2,-2.2),P.rotation.x=w,this.group.add(P)}const m=new ct(.1,.1,1.8,12);m.rotateZ(Math.PI/2);const d=new I(m,t.chromePiston);d.position.set(-.8,1.4,-3),this.group.add(d),this.nipPointWorld=new E(0,1.82,0)}getGroup(){return this.group}getPosition(){return this.group.position}triggerKick(t=1){this.feedVelocity=18+t*16,this.onJerkImpact(t)}update(t,e,n,i){this._basePos||(this._basePos=this.group.position.clone());const r=Math.min(e,.05);i&&n&&n.kick&&this.triggerKick(n.kickIntensity||1);const a=i?4.5:2.2;this.feedVelocity>a?this.feedVelocity+=(a-this.feedVelocity)*(6.5*r):this.feedVelocity=a;const o=this.feedVelocity*r;this.gearAngle+=o;for(const c of this.gears)c.lower.rotation.x=this.gearAngle,c.upper.rotation.x=-this.gearAngle;for(const c of this.lowerRollers)c.rotation.x=this.gearAngle;for(const c of this.upperRollers)c.rotation.x=-this.gearAngle;this.flywheel.rotation.x+=o*2.5,this.sheetOffsetZ=(this.sheetOffsetZ+o*.2)%.4,this.sheetMesh.position.z=this.sheetOffsetZ,this.recoilShake>.001?(this.recoilShake*=Math.pow(.82,r*60),this.group.position.set(this._basePos.x+(Math.random()-.5)*this.recoilShake,this._basePos.y,this._basePos.z+(Math.random()-.5)*this.recoilShake*.5)):this.group.position.copy(this._basePos)}onJerkImpact(t=1){if(this.recoilShake=.28*t,this.vfx.sparks&&[-1.5,0,1.5].forEach(e=>{const n=new E(0,1.83,e).add(this.group.position);this.vfx.sparks.burst(n,{count:Math.max(6,Math.floor(14*t)),speed:18*t,spread:Math.PI*.7,direction:new E((Math.random()-.5)*.8,.6,1),intensity:t})}),this.vfx.steam&&[-3,0,3].forEach(e=>{const n=new E(-1.1,3.2,e).add(this.group.position);this.vfx.steam.vent(n,{count:Math.floor(14*t),speed:7,direction:new E(-1,.7,0),scale:.85})}),this.vfx.shockwaves){const e=this.group.position.clone();this.vfx.shockwaves.trigger(e,{duration:.3,maxRadius:4.8*t,color:16759586})}}}class xm{constructor(t=800){this.maxSparks=t,this.activeCount=0,this.positions=new Float32Array(t*3),this.velocities=new Float32Array(t*3),this.colors=new Float32Array(t*3),this.sizes=new Float32Array(t),this.life=new Float32Array(t),this.maxLife=new Float32Array(t),this.initialSize=new Float32Array(t);const e=new Float32Array([-.5,0,0,.5,0,0,.5,1,0,-.5,1,0]),n=new Float32Array([0,0,1,0,1,1,0,1]),i=[0,1,2,0,2,3];this.geometry=new Np,this.geometry.setAttribute("position",new ve(e,3)),this.geometry.setAttribute("uv",new ve(n,2)),this.geometry.setIndex(i),this.posAttr=new hs(this.positions,3),this.velAttr=new hs(this.velocities,3),this.colAttr=new hs(this.colors,3),this.sizeAttr=new hs(this.sizes,1),this.posAttr.setUsage(Vi),this.velAttr.setUsage(Vi),this.colAttr.setUsage(Vi),this.sizeAttr.setUsage(Vi),this.geometry.setAttribute("aPos",this.posAttr),this.geometry.setAttribute("aVel",this.velAttr),this.geometry.setAttribute("aColor",this.colAttr),this.geometry.setAttribute("aSize",this.sizeAttr),this.geometry.instanceCount=0,this.material=new ye({transparent:!0,depthWrite:!1,blending:oi,side:Ne,vertexShader:`
        attribute vec3 aPos;
        attribute vec3 aVel;
        attribute vec3 aColor;
        attribute float aSize;

        varying vec2 vUv;
        varying vec3 vColor;

        void main() {
          vUv = uv;
          vColor = aColor;

          vec4 mvHead = modelViewMatrix * vec4(aPos, 1.0);
          vec3 mvVel = (modelViewMatrix * vec4(aVel, 0.0)).xyz;

          float speed2D = length(mvVel.xy);
          vec2 dir2 = speed2D > 0.001 ? normalize(mvVel.xy) : vec2(0.0, 1.0);
          vec2 perp2 = vec2(-dir2.y, dir2.x);

          float speed3D = length(mvVel);
          float streakLen = clamp(speed3D * 0.022, 0.07, 0.75) * aSize;
          float width = 0.032 * aSize;

          mvHead.xy += perp2 * (position.x * width) - dir2 * ((1.0 - position.y) * streakLen);
          gl_Position = projectionMatrix * mvHead;
        }
      `,fragmentShader:`
        varying vec2 vUv;
        varying vec3 vColor;

        void main() {
          float across = 1.0 - abs(vUv.x * 2.0 - 1.0);
          across = smoothstep(0.0, 0.85, across);
          float along = pow(clamp(vUv.y, 0.0, 1.0), 1.35);
          float core = pow(across, 2.5) * pow(clamp(vUv.y, 0.0, 1.0), 3.0);

          vec3 col = mix(vColor, vec3(1.0, 0.98, 0.9), core * 0.8);
          float alpha = across * along;
          if (alpha < 0.01) discard;

          gl_FragColor = vec4(col * 1.35, alpha);
        }
      `}),this.mesh=new I(this.geometry,this.material),this.mesh.frustumCulled=!1}init(t){t.add(this.mesh)}burst(t,e={}){const n=e.count||18,i=e.speed||15,r=e.spread!==void 0?e.spread:Math.PI*.7,a=e.direction||new E(0,1,0),o=e.intensity||1,c=!!e.flatRadial,l=a.clone().normalize(),h=Math.abs(l.y)>.9?new E(1,0,0):new E(0,1,0),u=new E().crossVectors(l,h).normalize(),f=new E().crossVectors(l,u).normalize();for(let p=0;p<n;p++){this.activeCount>=this.maxSparks&&this.killParticle(0);const g=this.activeCount,v=g*3;let m,d,b;if(c){const A=Math.random()*Math.PI*2,C=(Math.random()-.15)*.45,D=Math.cos(C);m=Math.cos(A)*D,d=Math.sin(C),b=Math.sin(A)*D,this.positions[v]=t.x+Math.cos(A)*.35,this.positions[v+1]=t.y+(Math.random()-.5)*.06,this.positions[v+2]=t.z+Math.sin(A)*.35}else{this.positions[v]=t.x+(Math.random()-.5)*.12,this.positions[v+1]=t.y+(Math.random()-.5)*.12,this.positions[v+2]=t.z+(Math.random()-.5)*.12;const A=Math.random()*r,C=Math.random()*Math.PI*2,D=Math.sin(A),S=Math.cos(A);m=(u.x*Math.cos(C)+f.x*Math.sin(C))*D+l.x*S,d=(u.y*Math.cos(C)+f.y*Math.sin(C))*D+l.y*S,b=(u.z*Math.cos(C)+f.z*Math.sin(C))*D+l.z*S}const w=i*(.45+Math.random()*.85)*Math.min(1.4,o);this.velocities[v]=m*w,this.velocities[v+1]=d*w,this.velocities[v+2]=b*w,this.colors[v]=1,this.colors[v+1]=.88+Math.random()*.12,this.colors[v+2]=.55+Math.random()*.35;const _=.24+Math.random()*.42;this.life[g]=0,this.maxLife[g]=_;const P=(.75+Math.random()*.65)*Math.min(1.3,o);this.initialSize[g]=P,this.sizes[g]=P,this.activeCount++}this.geometry.instanceCount=this.activeCount,this.posAttr.needsUpdate=!0,this.velAttr.needsUpdate=!0,this.colAttr.needsUpdate=!0,this.sizeAttr.needsUpdate=!0}killParticle(t){if(this.activeCount<=0||t>=this.activeCount)return;const e=this.activeCount-1;if(t!==e){const n=t*3,i=e*3;this.positions[n]=this.positions[i],this.positions[n+1]=this.positions[i+1],this.positions[n+2]=this.positions[i+2],this.velocities[n]=this.velocities[i],this.velocities[n+1]=this.velocities[i+1],this.velocities[n+2]=this.velocities[i+2],this.colors[n]=this.colors[i],this.colors[n+1]=this.colors[i+1],this.colors[n+2]=this.colors[i+2],this.sizes[t]=this.sizes[e],this.life[t]=this.life[e],this.maxLife[t]=this.maxLife[e],this.initialSize[t]=this.initialSize[e]}this.activeCount--}update(t){if(this.activeCount===0)return;const e=Math.min(t,.05),n=Math.pow(.9,e*60),i=26*e;let r=0;for(;r<this.activeCount;){if(this.life[r]+=e,this.life[r]>=this.maxLife[r]){this.killParticle(r);continue}const a=this.life[r]/this.maxLife[r],o=r*3;if(this.velocities[o]*=n,this.velocities[o+1]=(this.velocities[o+1]-i)*n,this.velocities[o+2]*=n,this.positions[o]+=this.velocities[o]*e,this.positions[o+1]+=this.velocities[o+1]*e,this.positions[o+2]+=this.velocities[o+2]*e,this.positions[o+1]<.03&&this.velocities[o+1]<0&&(this.positions[o+1]=.03,this.velocities[o+1]=-this.velocities[o+1]*.38,this.velocities[o]*=.65,this.velocities[o+2]*=.65),a<.2)this.colors[o]=1,this.colors[o+1]=.9,this.colors[o+2]=.55;else if(a<.6){const c=(a-.2)/.4;this.colors[o]=1,this.colors[o+1]=.9*(1-c)+.32*c,this.colors[o+2]=.55*(1-c)+.04*c}else{const c=(a-.6)/.4;this.colors[o]=1*(1-c)+.35*c,this.colors[o+1]=.32*(1-c)+.04*c,this.colors[o+2]=.04*(1-c)}this.sizes[r]=this.initialSize[r]*(1-a*.6),r++}this.geometry.instanceCount=this.activeCount,this.posAttr.needsUpdate=!0,this.velAttr.needsUpdate=!0,this.colAttr.needsUpdate=!0,this.sizeAttr.needsUpdate=!0}destroy(t){this.mesh&&t&&(t.remove(this.mesh),this.geometry.dispose(),this.material.dispose())}}class Mm{constructor(t=1200){this.maxPuffs=t,this.activeCount=0,this.positions=new Float32Array(t*3),this.colors=new Float32Array(t*3),this.sizes=new Float32Array(t),this.velocities=new Float32Array(t*3),this.life=new Float32Array(t),this.maxLife=new Float32Array(t),this.startSize=new Float32Array(t),this.endSize=new Float32Array(t),this.baseR=new Float32Array(t),this.baseG=new Float32Array(t),this.baseB=new Float32Array(t),this.geometry=new _e,this.geometry.setAttribute("position",new ve(this.positions,3)),this.geometry.setAttribute("color",new ve(this.colors,3)),this.geometry.setAttribute("size",new ve(this.sizes,1));const e=document.createElement("canvas");e.width=128,e.height=128;const n=e.getContext("2d"),i=n.createRadialGradient(64,64,0,64,64,64);i.addColorStop(0,"rgba(255, 255, 255, 0.85)"),i.addColorStop(.35,"rgba(235, 238, 242, 0.45)"),i.addColorStop(.7,"rgba(200, 205, 215, 0.15)"),i.addColorStop(1,"rgba(180, 185, 195, 0)"),n.fillStyle=i,n.fillRect(0,0,128,128);for(let a=0;a<6;a++){const o=45+Math.random()*38,c=45+Math.random()*38,l=20+Math.random()*25,h=n.createRadialGradient(o,c,0,o,c,l);h.addColorStop(0,"rgba(255, 255, 255, 0.35)"),h.addColorStop(1,"rgba(255, 255, 255, 0)"),n.fillStyle=h,n.beginPath(),n.arc(o,c,l,0,Math.PI*2),n.fill()}const r=new Ie(e);this.material=new Cs({size:1.5,map:r,transparent:!0,depthWrite:!1,vertexColors:!0,sizeAttenuation:!0}),this.points=new oa(this.geometry,this.material),this.points.frustumCulled=!1}init(t){t.add(this.points)}vent(t,e={}){const n=e.count||24,i=e.speed||8,r=e.spread!==void 0?e.spread:.45,a=e.direction||new E(0,1,0),o=e.scale||1,c=e.isFireSmoke||!1,l=a.clone().normalize(),h=Math.abs(l.y)>.9?new E(1,0,0):new E(0,1,0),u=new E().crossVectors(l,h).normalize(),f=new E().crossVectors(l,u).normalize();for(let p=0;p<n;p++){this.activeCount>=this.maxPuffs&&this.killPuff(0);const g=this.activeCount,v=g*3;this.positions[v]=t.x+(Math.random()-.5)*.2*o,this.positions[v+1]=t.y+(Math.random()-.5)*.2*o,this.positions[v+2]=t.z+(Math.random()-.5)*.2*o;const m=Math.random()*r,d=Math.random()*Math.PI*2,b=Math.sin(m),w=Math.cos(m),_=(u.x*Math.cos(d)+f.x*Math.sin(d))*b+l.x*w,P=(u.y*Math.cos(d)+f.y*Math.sin(d))*b+l.y*w,A=(u.z*Math.cos(d)+f.z*Math.sin(d))*b+l.z*w,C=i*(.6+Math.random()*.8);this.velocities[v]=_*C,this.velocities[v+1]=P*C,this.velocities[v+2]=A*C;const D=.8+Math.random()*1;this.life[g]=0,this.maxLife[g]=D;const S=(.6+Math.random()*.5)*o,x=S*(3.5+Math.random()*2.5);if(this.startSize[g]=S,this.endSize[g]=x,this.sizes[g]=S,c)this.baseR[g]=.35+Math.random()*.2,this.baseG[g]=.25+Math.random()*.15,this.baseB[g]=.2+Math.random()*.1;else{const R=.82+Math.random()*.15;this.baseR[g]=R,this.baseG[g]=R+.02,this.baseB[g]=R+.05}this.colors[v]=0,this.colors[v+1]=0,this.colors[v+2]=0,this.activeCount++}this.geometry.attributes.position.needsUpdate=!0,this.geometry.attributes.color.needsUpdate=!0,this.geometry.attributes.size.needsUpdate=!0}killPuff(t){if(this.activeCount<=0||t>=this.activeCount)return;const e=this.activeCount-1;if(t!==e){const n=t*3,i=e*3;this.positions[n]=this.positions[i],this.positions[n+1]=this.positions[i+1],this.positions[n+2]=this.positions[i+2],this.velocities[n]=this.velocities[i],this.velocities[n+1]=this.velocities[i+1],this.velocities[n+2]=this.velocities[i+2],this.colors[n]=this.colors[i],this.colors[n+1]=this.colors[i+1],this.colors[n+2]=this.colors[i+2],this.sizes[t]=this.sizes[e],this.life[t]=this.life[e],this.maxLife[t]=this.maxLife[e],this.startSize[t]=this.startSize[e],this.endSize[t]=this.endSize[e],this.baseR[t]=this.baseR[e],this.baseG[t]=this.baseG[e],this.baseB[t]=this.baseB[e]}this.activeCount--}update(t){if(this.activeCount===0)return;const e=Math.min(t,.05),n=Math.pow(.85,e*60);let i=0;for(;i<this.activeCount;){if(this.life[i]+=e,this.life[i]>=this.maxLife[i]){this.killPuff(i);continue}const r=this.life[i]/this.maxLife[i],a=i*3;this.velocities[a+1]+=3.5*e,this.velocities[a]*=n,this.velocities[a+1]*=n,this.velocities[a+2]*=n,this.positions[a]+=this.velocities[a]*e,this.positions[a+1]+=this.velocities[a+1]*e,this.positions[a+2]+=this.velocities[a+2]*e,this.sizes[i]=this.startSize[i]+(this.endSize[i]-this.startSize[i])*Math.pow(r,.6);let o=0;r<.15?o=r/.15:o=Math.pow(1-(r-.15)/.85,1.4),this.colors[a]=this.baseR[i]*o,this.colors[a+1]=this.baseG[i]*o,this.colors[a+2]=this.baseB[i]*o,i++}this.geometry.setDrawRange(0,this.activeCount),this.geometry.attributes.position.needsUpdate=!0,this.geometry.attributes.color.needsUpdate=!0,this.geometry.attributes.size.needsUpdate=!0}destroy(t){this.points&&t&&(t.remove(this.points),this.geometry.dispose(),this.material.dispose())}}class Sm{constructor(t=16){this.maxWaves=t,this.waves=[];const e=new ca(.85,1,36);e.rotateX(-Math.PI/2);for(let n=0;n<t;n++){const i=new Tn({color:16755251,transparent:!0,opacity:0,side:Ne,depthWrite:!1,blending:oi}),r=new I(e,i);r.visible=!1,this.waves.push({mesh:r,mat:i,active:!1,time:0,duration:.35,maxRadius:4.5})}this.group=new Wt;for(const n of this.waves)this.group.add(n.mesh)}init(t){t.add(this.group)}trigger(t,e={}){const n=this.waves.find(r=>!r.active);if(!n)return;n.active=!0,n.time=0,n.duration=e.duration||.32,n.maxRadius=e.maxRadius||5;const i=e.color!==void 0?e.color:16755234;n.mat.color.setHex(i),n.mesh.position.copy(t),n.mesh.position.y+=.05,n.mesh.scale.set(.1,.1,.1),n.mesh.visible=!0,n.mat.opacity=.9}update(t){for(const e of this.waves){if(!e.active)continue;e.time+=t;const n=e.time/e.duration;if(n>=1){e.active=!1,e.mesh.visible=!1,e.mat.opacity=0;continue}const i=.2+(e.maxRadius-.2)*Math.pow(n,.5);e.mesh.scale.set(i,i,i),e.mat.opacity=Math.pow(1-n,1.8)*.95}}destroy(t){if(this.group&&t){t.remove(this.group);for(const e of this.waves)e.mesh.geometry.dispose(),e.mat.dispose()}}}class ym{constructor(){this.machines=[],this.machinePositions=[],this.focalPositions=[],this.names=["Hydraulic Stamp Press","Industrial Guillotine","Column Drill / Puncher","Blast Furnace","Roll Forming Machine"],this.sparks=new xm(2500),this.steam=new Mm(1200),this.shockwaves=new Sm(16),this.baySpacing=16}init(t){this.scene=t;const e=dc(),n={sparks:this.sparks,steam:this.steam,shockwaves:this.shockwaves};this.machines=[new pm(e,n),new mm(e,n),new gm(e,n),new vm(e,n),new _m(e,n)];const i=(this.machines.length-1)*this.baySpacing/2;this.machines.forEach((r,a)=>{const o=a*this.baySpacing-i,c=r.getGroup();c.position.set(o,0,0),t.add(c),this.machinePositions.push(new E(o,0,0)),this.focalPositions.push(new E(o,3.8,0))}),this.sparks.init(t),this.steam.init(t),this.shockwaves.init(t)}update(t,e,n){const i=n&&typeof n.activeMachineIndex=="number"?Math.max(0,Math.min(4,Math.floor(n.activeMachineIndex))):0;for(let r=0;r<this.machines.length;r++){const a=this.machines[r],o=r===i;a.update(t,e,n,o)}this.sparks.update(e),this.steam.update(e),this.shockwaves.update(e)}getMachine(t){return this.machines[t]||null}getMachineCount(){return 5}getMachinePosition(t){return t>=0&&t<this.machinePositions.length?this.machinePositions[t].clone():new E(0,0,0)}getMachineName(t){return this.names[t]||`Machine #${t}`}triggerManualKick(t,e=1){const n=this.getMachine(t);n&&typeof n.triggerKick=="function"&&n.triggerKick(e)}destroy(){if(this.scene){for(const t of this.machines)this.scene.remove(t.getGroup());this.sparks.destroy(this.scene),this.steam.destroy(this.scene),this.shockwaves.destroy(this.scene)}}}class bm{constructor(){this.container=document.getElementById("hud"),this.startOverlay=document.getElementById("start-overlay"),this.btnStart=document.getElementById("btn-start"),this.screenStrobe=document.getElementById("screen-strobe"),this.systemStatus=document.getElementById("system-status"),this.systemTime=document.getElementById("system-time"),this.kickFlashBox=document.getElementById("kick-flash-box"),this.kickLed=document.getElementById("kick-led"),this.kickEnergyText=document.getElementById("kick-energy-text"),this.dropBanner=document.getElementById("drop-alert-banner"),this.btnCamOrbit=document.getElementById("btn-cam-orbit"),this.btnCamFocus=document.getElementById("btn-cam-focus"),this.btnCamShake=document.getElementById("btn-cam-shake"),this.btnToggleCrt=document.getElementById("btn-toggle-crt"),this.btnToggleSkin=document.getElementById("btn-toggle-skin"),this.crtOverlay=document.querySelector(".crt-overlay"),this.btnOpenCalibrate=document.getElementById("btn-open-calibrate"),this.calibrationDrawer=document.getElementById("calibration-drawer"),this.btnCloseCalibrate=document.getElementById("btn-close-calibrate"),this.dspStatusBadge=document.getElementById("dsp-status-badge"),this.audioDspPill=document.getElementById("audio-dsp-pill"),this.calibWaveformCanvas=document.getElementById("calib-waveform-canvas"),this.calibWaveformCtx=this.calibWaveformCanvas?this.calibWaveformCanvas.getContext("2d"):null,this.calibWaveMinimap=document.getElementById("calib-wave-minimap"),this.calibWaveViewport=document.getElementById("calib-wave-viewport"),this.btnWaveZoomIn=document.getElementById("btn-wave-zoom-in"),this.btnWaveZoomOut=document.getElementById("btn-wave-zoom-out"),this.btnWaveZoomFit=document.getElementById("btn-wave-zoom-fit"),this.btnWaveZoomFollow=document.getElementById("btn-wave-zoom-follow"),this.waveZoomReadout=document.getElementById("wave-zoom-readout"),this.cardMinButtons=document.querySelectorAll(".card-min-btn"),this.modeButtons=document.querySelectorAll(".mode-btn"),this.calibBpmInput=document.getElementById("calib-bpm-input"),this.btnAutoBpm=document.getElementById("btn-auto-bpm"),this.calibBpmSubtext=document.getElementById("calib-bpm-subtext"),this.calibLatencySlider=document.getElementById("calib-latency-slider"),this.calibLatencyReadout=document.getElementById("calib-latency-readout"),this.calibDebounceSlider=document.getElementById("calib-debounce-slider"),this.calibDebounceReadout=document.getElementById("calib-debounce-readout"),this.btnToggleRolls=document.getElementById("btn-toggle-rolls"),this.calibZonesList=document.getElementById("calib-zones-list"),this.btnAddCurrentZone=document.getElementById("btn-add-current-zone"),this.btnResetZonesPreset=document.getElementById("btn-reset-zones-preset"),this.scrubberZonesLayer=document.getElementById("scrubber-zones-layer"),this.trackTitle=document.getElementById("track-title"),this.trackDuration=document.getElementById("track-duration"),this.scrubberTrack=document.getElementById("scrubber-track"),this.scrubberFill=document.getElementById("scrubber-fill"),this.btnPlayPause=document.getElementById("btn-play-pause"),this.audioFileInput=document.getElementById("audio-file-input"),this.volumeSlider=document.getElementById("volume-slider"),this.volumeReadout=document.getElementById("volume-readout"),this.sensitivitySlider=document.getElementById("sensitivity-slider"),this.sensReadout=document.getElementById("sens-readout"),this.scopeCanvas=document.getElementById("scope-canvas"),this.scopeCtx=this.scopeCanvas?this.scopeCanvas.getContext("2d"):null,this.vuBass=document.getElementById("vu-bass"),this.vuMid=document.getElementById("vu-mid"),this.vuTreble=document.getElementById("vu-treble"),this.activeBayIndex=document.getElementById("active-bay-index"),this.activeMachineName=document.getElementById("active-machine-name"),this.activeMachineStatus=document.getElementById("active-machine-status"),this.directorMode=document.getElementById("director-mode"),this.bayButtons=document.querySelectorAll(".bay-btn:not(.auto-bay-btn)"),this.btnAutoBay=document.getElementById("btn-auto-bay"),this.isScreenShakeEnabled=!0,this.isCrtEnabled=!1,this.factorySkin="default",this.isKickRollsEnabled=!0,this.cameraMode="orbit",this.manualBaySelection=null,this.isDraggingScrubber=!1,this.isDraggingWaveform=!1,this.isPanningWaveform=!1,this.isDraggingMinimap=!1,this.waveDragStartFrac=0,this.waveDragCurrFrac=0,this.wavePanAnchorClientX=0,this.wavePanStartView=0,this.waveZoom=1,this.waveViewStart=0,this.renderedZonesHash="",this.currentAudioTime=0,this.currentDuration=0,this._lastSyncedBpm=null,this._lastZoneCount=0,this.callbacks={onPlayPause:()=>{},onSeek:()=>{},onLoadAudio:()=>{},onVolumeChange:()=>{},onSensitivityChange:()=>{},onCameraModeChange:()=>{},onShakeToggle:()=>{},onBaySelect:()=>{},onStart:()=>{},onSkinChange:()=>{},onSyncModeChange:()=>{},onBpmChange:()=>{},onReanalyzeBpm:()=>{},onIncludeRollsChange:()=>{},onLatencyChange:()=>{},onDebounceChange:()=>{},onAddZone:()=>{},onRemoveZone:()=>{},onToggleZone:()=>{},onUpdateZone:()=>{},onResetZones:()=>{}},this.initEventListeners()}setCallbacks(t){this.callbacks={...this.callbacks,...t}}initEventListeners(){if(this.btnStart&&this.btnStart.addEventListener("click",()=>{this.startOverlay&&this.startOverlay.classList.add("hidden"),this.callbacks.onStart()}),this.btnPlayPause&&this.btnPlayPause.addEventListener("click",()=>{this.callbacks.onPlayPause()}),this.audioFileInput&&this.audioFileInput.addEventListener("change",n=>{if(n.target.files&&n.target.files[0]){const i=n.target.files[0];this.setTrackTitle(i.name),this.callbacks.onLoadAudio(i)}}),window.addEventListener("dragover",n=>{n.preventDefault(),n.dataTransfer.dropEffect="copy"}),window.addEventListener("drop",n=>{if(n.preventDefault(),n.dataTransfer.files&&n.dataTransfer.files[0]){const i=n.dataTransfer.files[0];(i.type.startsWith("audio/")||i.name.match(/\.(mp3|wav|ogg|flac|m4a)$/i))&&(this.setTrackTitle(i.name),this.startOverlay&&!this.startOverlay.classList.contains("hidden")&&(this.startOverlay.classList.add("hidden"),this.callbacks.onStart()),this.callbacks.onLoadAudio(i))}}),this.scrubberTrack){const n=i=>{const r=this.scrubberTrack.getBoundingClientRect(),a=Math.max(0,Math.min(1,(i.clientX-r.left)/r.width));this.scrubberFill&&(this.scrubberFill.style.width=`${(a*100).toFixed(1)}%`),this.callbacks.onSeek(a)};this.scrubberTrack.addEventListener("mousedown",i=>{this.isDraggingScrubber=!0,n(i)}),window.addEventListener("mousemove",i=>{this.isDraggingScrubber&&n(i)}),window.addEventListener("mouseup",()=>{this.isDraggingScrubber=!1})}this.volumeSlider&&this.volumeSlider.addEventListener("input",n=>{const i=parseFloat(n.target.value);this.volumeReadout&&(this.volumeReadout.textContent=`${Math.round(i*100)}%`),this.callbacks.onVolumeChange(i)}),this.sensitivitySlider&&this.sensitivitySlider.addEventListener("input",n=>{const i=parseFloat(n.target.value);this.sensReadout&&(this.sensReadout.textContent=`${i.toFixed(1)}x`),this.callbacks.onSensitivityChange(i)}),this.btnCamOrbit&&this.btnCamOrbit.addEventListener("click",()=>{this.setCameraMode("orbit")}),this.btnCamFocus&&this.btnCamFocus.addEventListener("click",()=>{this.setCameraMode("focus")}),this.btnCamShake&&this.btnCamShake.addEventListener("click",()=>{this.isScreenShakeEnabled=!this.isScreenShakeEnabled,this.btnCamShake.classList.toggle("active",this.isScreenShakeEnabled),this.btnCamShake.textContent=`SHAKE [${this.isScreenShakeEnabled?"ON":"OFF"}]`,this.callbacks.onShakeToggle(this.isScreenShakeEnabled)}),this.btnToggleCrt&&(this.btnToggleCrt.classList.toggle("active",this.isCrtEnabled),this.btnToggleCrt.textContent=`CRT [${this.isCrtEnabled?"ON":"OFF"}]`,this.crtOverlay&&(this.crtOverlay.style.opacity=this.isCrtEnabled?"0.85":"0.0"),this.btnToggleCrt.addEventListener("click",()=>{this.isCrtEnabled=!this.isCrtEnabled,this.btnToggleCrt.classList.toggle("active",this.isCrtEnabled),this.btnToggleCrt.textContent=`CRT [${this.isCrtEnabled?"ON":"OFF"}]`,this.crtOverlay&&(this.crtOverlay.style.opacity=this.isCrtEnabled?"0.85":"0.0")})),this.btnToggleSkin&&this.btnToggleSkin.addEventListener("click",()=>{this.factorySkin=this.factorySkin==="default"?"realistic":"default";const n=this.factorySkin==="realistic";this.btnToggleSkin.classList.toggle("active",n),this.btnToggleSkin.textContent=`SKIN [${n?"DARK REAL":"DEFAULT"}]`,this.callbacks.onSkinChange(this.factorySkin)}),this.btnOpenCalibrate&&this.btnOpenCalibrate.addEventListener("click",()=>{this.calibrationDrawer&&this.calibrationDrawer.classList.toggle("hidden")}),this.btnCloseCalibrate&&this.btnCloseCalibrate.addEventListener("click",()=>{this.calibrationDrawer&&this.calibrationDrawer.classList.add("hidden")}),this.modeButtons.forEach(n=>{n.addEventListener("click",()=>{this.modeButtons.forEach(r=>r.classList.remove("active")),n.classList.add("active");const i=n.dataset.mode;this.callbacks.onSyncModeChange(i)})}),this.calibBpmInput&&this.calibBpmInput.addEventListener("change",n=>{const i=parseFloat(n.target.value);Number.isFinite(i)&&i>=60&&i<=240&&(this._lastSyncedBpm=i,this.calibBpmSubtext&&(this.calibBpmSubtext.textContent=`Beat Interval: ${(6e4/i).toFixed(1)} ms`),this.callbacks.onBpmChange(i))}),this.btnAutoBpm&&this.btnAutoBpm.addEventListener("click",()=>{this._lastSyncedBpm=null,this.callbacks.onReanalyzeBpm(null)}),this.calibLatencySlider&&this.calibLatencySlider.addEventListener("input",n=>{const i=parseInt(n.target.value,10);this.calibLatencyReadout&&(this.calibLatencyReadout.textContent=`${i>0?"+":""}${i} ms`),this.callbacks.onLatencyChange(i)}),this.calibDebounceSlider&&this.calibDebounceSlider.addEventListener("input",n=>{const i=parseInt(n.target.value,10);this.calibDebounceReadout&&(this.calibDebounceReadout.textContent=`${i} ms`),this.callbacks.onDebounceChange(i)}),this.btnToggleRolls&&this.btnToggleRolls.addEventListener("click",()=>{this.isKickRollsEnabled=!this.isKickRollsEnabled,this.btnToggleRolls.classList.toggle("active",this.isKickRollsEnabled),this.btnToggleRolls.textContent=`KICK ROLLS [${this.isKickRollsEnabled?"ON":"OFF"}]`,this.callbacks.onIncludeRollsChange(this.isKickRollsEnabled)}),this.cardMinButtons.forEach(n=>{n.addEventListener("click",()=>{const i=n.dataset.target,r=i?document.getElementById(i):n.closest(".hud-card");if(!r)return;const a=r.classList.toggle("minimized");n.textContent=a?"+":"_"})});const t=()=>{this.waveZoom=Math.max(1,Math.min(64,this.waveZoom));const n=1/this.waveZoom;this.waveViewStart=Math.max(0,Math.min(1-n,this.waveViewStart)),this.waveZoomReadout&&(this.waveZoomReadout.textContent=`${this.waveZoom>=10?this.waveZoom.toFixed(0):this.waveZoom.toFixed(1)}x`),this.calibWaveViewport&&(this.calibWaveViewport.style.left=`${(this.waveViewStart*100).toFixed(2)}%`,this.calibWaveViewport.style.width=`${(n*100).toFixed(2)}%`)},e=(n,i=.5)=>{const r=Math.max(1,Math.min(64,n)),a=1/this.waveZoom,o=this.waveViewStart+i*a,c=1/r;this.waveZoom=r,this.waveViewStart=o-i*c,t()};if(this.btnWaveZoomIn&&this.btnWaveZoomIn.addEventListener("click",()=>e(this.waveZoom*2,.5)),this.btnWaveZoomOut&&this.btnWaveZoomOut.addEventListener("click",()=>e(this.waveZoom/2,.5)),this.btnWaveZoomFit&&this.btnWaveZoomFit.addEventListener("click",()=>{this.waveZoom=1,this.waveViewStart=0,t()}),this.btnWaveZoomFollow&&this.btnWaveZoomFollow.addEventListener("click",()=>{if(this.currentDuration>0){this.waveZoom<4&&(this.waveZoom=8);const n=Math.max(0,Math.min(1,this.currentAudioTime/this.currentDuration));this.waveViewStart=n-.5/this.waveZoom,t()}}),this.calibWaveMinimap){const n=i=>{const r=this.calibWaveMinimap.getBoundingClientRect(),a=r.width>0?Math.max(0,Math.min(1,(i-r.left)/r.width)):0,o=1/this.waveZoom;this.waveViewStart=a-o*.5,t()};this.calibWaveMinimap.addEventListener("mousedown",i=>{this.isDraggingMinimap=!0,n(i.clientX)}),window.addEventListener("mousemove",i=>{this.isDraggingMinimap&&n(i.clientX)}),window.addEventListener("mouseup",()=>{this.isDraggingMinimap=!1})}if(this.calibWaveformCanvas){const n=r=>{const a=this.calibWaveformCanvas.getBoundingClientRect();return a.width>0?Math.max(0,Math.min(1,(r-a.left)/a.width)):0},i=r=>{const a=n(r);return Math.max(0,Math.min(1,this.waveViewStart+a/this.waveZoom))};this.calibWaveformCanvas.addEventListener("contextmenu",r=>r.preventDefault()),this.calibWaveformCanvas.addEventListener("wheel",r=>{r.preventDefault();const a=r.deltaY<0?1.35:1/1.35;e(this.waveZoom*a,n(r.clientX))},{passive:!1}),this.calibWaveformCanvas.addEventListener("mousedown",r=>{if(r.button===2||r.button===1||r.shiftKey){this.isPanningWaveform=!0,this.wavePanAnchorClientX=r.clientX,this.wavePanStartView=this.waveViewStart;return}this.isDraggingWaveform=!0;const a=i(r.clientX);this.waveDragStartFrac=a,this.waveDragCurrFrac=a}),window.addEventListener("mousemove",r=>{if(this.isPanningWaveform){const a=this.calibWaveformCanvas.getBoundingClientRect();if(a.width>0){const o=(r.clientX-this.wavePanAnchorClientX)/a.width;this.waveViewStart=this.wavePanStartView-o/this.waveZoom,t()}return}this.isDraggingWaveform&&(this.waveDragCurrFrac=i(r.clientX))}),window.addEventListener("mouseup",()=>{if(this.isPanningWaveform){this.isPanningWaveform=!1;return}if(!this.isDraggingWaveform)return;this.isDraggingWaveform=!1;const r=this.currentDuration||0;if(r<=0)return;const a=Math.min(this.waveDragStartFrac,this.waveDragCurrFrac)*r,o=Math.max(this.waveDragStartFrac,this.waveDragCurrFrac)*r;if(o-a>=.8){const c=this._lastZoneCount%5;this.callbacks.onAddZone(Math.round(a*10)/10,Math.round(o*10)/10,c)}else this.callbacks.onSeek(this.waveDragStartFrac)})}this.btnAddCurrentZone&&this.btnAddCurrentZone.addEventListener("click",()=>{const n=Math.max(0,Math.floor(this.currentAudioTime)),i=Math.min(Math.floor(this.currentDuration||n+20),n+20),r=this._lastZoneCount%5;this.callbacks.onAddZone(n,i,r)}),this.btnResetZonesPreset&&this.btnResetZonesPreset.addEventListener("click",()=>{this.callbacks.onResetZones()}),this.bayButtons.forEach(n=>{n.addEventListener("click",()=>{const i=parseInt(n.dataset.bay,10);this.setManualBay(i)})}),this.btnAutoBay&&this.btnAutoBay.addEventListener("click",()=>{this.setManualBay(null)})}setTrackTitle(t){this.trackTitle&&(this.trackTitle.textContent=t.toUpperCase())}setCameraMode(t){this.cameraMode=t,this.btnCamOrbit&&this.btnCamOrbit.classList.toggle("active",t==="orbit"),this.btnCamFocus&&this.btnCamFocus.classList.toggle("active",t==="focus"),this.callbacks.onCameraModeChange(t)}setManualBay(t){this.manualBaySelection=t,t===null?(this.btnAutoBay&&this.btnAutoBay.classList.add("selected"),this.directorMode&&(this.directorMode.textContent="AUTO-SEQUENCE",this.directorMode.style.color="var(--color-cyan-glow)")):(this.btnAutoBay&&this.btnAutoBay.classList.remove("selected"),this.directorMode&&(this.directorMode.textContent=`MANUAL [BAY 0${t+1}]`,this.directorMode.style.color="var(--color-amber-bright)")),this.callbacks.onBaySelect(t)}formatTime(t){if(isNaN(t)||t<0)return"00:00";const e=Math.floor(t/60),n=Math.floor(t%60);return`${e<10?"0":""}${e}:${n<10?"0":""}${n}`}update(t,e,n,i){var l;if(this.systemTime){const h=new Date,u=String(h.getHours()).padStart(2,"0"),f=String(h.getMinutes()).padStart(2,"0"),p=String(h.getSeconds()).padStart(2,"0"),g=String(Math.floor(h.getMilliseconds()/10)).padStart(2,"0");this.systemTime.textContent=`${u}:${f}:${p}.${g}`}if(!n)return;this.currentAudioTime=n.currentTime||0,this.currentDuration=n.duration||0,this._lastZoneCount=Array.isArray(n.zones)?n.zones.length:0;const r=(h,u=!1)=>{if(h)if(h.classList.remove("analyzing","ready","fallback"),n.analysisStatus==="analyzing")h.textContent=u?"DSP: SCAN...":"DSP: ANALYZING...",h.classList.add("analyzing");else if(n.dspReady){const f=(n.bpmEstimate||0).toFixed(1),p=n.activeKicks?n.activeKicks.length:0;h.textContent=u?`${f} BPM | ${p} K`:`DSP: ${f} BPM // ${p} KICKS`,h.classList.add("ready")}else n.analysisStatus==="fallback"?(h.textContent="DSP: REALTIME FLUX",h.classList.add("fallback")):h.textContent="DSP: STANDBY"};if(r(this.dspStatusBadge,!1),r(this.audioDspPill,!0),n.dspReady&&n.bpmEstimate>0&&this._lastSyncedBpm!==n.bpmEstimate&&(this._lastSyncedBpm=n.bpmEstimate,this.calibBpmInput&&document.activeElement!==this.calibBpmInput&&(this.calibBpmInput.value=n.bpmEstimate.toFixed(1)),this.calibBpmSubtext&&(this.calibBpmSubtext.textContent=`Beat Interval: ${(6e4/n.bpmEstimate).toFixed(1)} ms`)),this.btnPlayPause&&(n.isPlaying?(this.btnPlayPause.textContent="⏸ PAUSE",this.btnPlayPause.classList.add("active"),this.systemStatus&&(n.inZone?this.systemStatus.textContent=`CALIBRATED DROP ZONE // ${((l=n.activeZone)==null?void 0:l.name)||"SYNCED"}`:this.systemStatus.textContent=n.isDrop?"OVERDRIVE BARRAGE":"FACILITY OPERATING")):(this.btnPlayPause.textContent="▶ PLAY",this.btnPlayPause.classList.remove("active"),this.systemStatus&&(this.systemStatus.textContent="FACILITY STANDBY"))),this.trackDuration&&(this.trackDuration.textContent=`${this.formatTime(n.currentTime)} / ${this.formatTime(n.duration)}`),!this.isDraggingScrubber&&this.scrubberFill&&n.duration>0){const h=n.currentTime/n.duration*100;this.scrubberFill.style.width=`${h.toFixed(2)}%`}if(this.renderScrubberZones(n),this.kickFlashBox&&this.kickLed)if(n.kick){if(this.kickFlashBox.classList.add("kick-active"),this.kickEnergyText){const h=(n.kickIntensity*9.2).toFixed(2);this.kickEnergyText.textContent=`${h} G`}this.screenStrobe&&(this.screenStrobe.classList.add("active-flash"),setTimeout(()=>{this.screenStrobe&&this.screenStrobe.classList.remove("active-flash")},80))}else this.kickFlashBox.classList.remove("kick-active");if(this.dropBanner)if(this.dropBanner.classList.toggle("active",!!(n.isDrop||n.inZone)),n.inZone&&n.activeZone){const h=this.dropBanner.querySelector(".drop-text");h&&(h.textContent=`DROP ZONE: ${n.activeZone.name.toUpperCase()}`)}else{const h=this.dropBanner.querySelector(".drop-text");h&&(h.textContent="DROP SEQUENCE ACTIVE")}this.screenStrobe&&this.screenStrobe.classList.toggle("drop-strobe",!!(n.isDrop||n.inZone));const a=document.getElementById("card-telemetry-deck");if(!a||!a.classList.contains("minimized")){if(this.vuBass){const h=Math.min(100,(n.bassEnergy||0)*100);this.vuBass.style.width=`${h.toFixed(1)}%`}if(this.vuMid){const h=Math.min(100,(n.midEnergy||0)*100);this.vuMid.style.width=`${h.toFixed(1)}%`}if(this.vuTreble){const h=Math.min(100,(n.trebleEnergy||0)*100);this.vuTreble.style.width=`${h.toFixed(1)}%`}this.renderScope(n)}const o=n.activeMachineIndex??0;this.activeBayIndex&&(this.activeBayIndex.textContent=`BAY 0${o+1}`);let c=n.machineName;!c&&i&&typeof i.getMachineName=="function"&&(c=i.getMachineName(o)),c||(c=["HYDRAULIC STAMP PRESS","INDUSTRIAL GUILLOTINE","COLUMN DRILL / PUNCH","BLAST FURNACE CRUCIBLE","ROLL FORMING MACHINE"][o]||`MACHINE BAY ${o+1}`),this.activeMachineName&&(this.activeMachineName.textContent=c.toUpperCase()),this.activeMachineStatus&&(n.inZone?(this.activeMachineStatus.textContent="CALIBRATED DROP OVERDRIVE // BEAT-LOCKED",this.activeMachineStatus.style.color="var(--color-red-alert)"):n.isDrop?(this.activeMachineStatus.textContent="OVERDRIVE IMPACT // CONTINUOUS STRIKE",this.activeMachineStatus.style.color="var(--color-red-alert)"):n.kick?(this.activeMachineStatus.textContent="BEAT IMPACT // HYDRAULIC DISCHARGE",this.activeMachineStatus.style.color="var(--color-amber-bright)"):(this.activeMachineStatus.textContent="CYCLE: SYNCHRONIZED [IDLE STROKE]",this.activeMachineStatus.style.color="var(--color-text-dim)")),this.bayButtons.forEach(h=>{const u=parseInt(h.dataset.bay,10);h.classList.toggle("active",u===o)}),this.renderCalibrationZoneList(n.zones),this.calibrationDrawer&&!this.calibrationDrawer.classList.contains("hidden")&&this.renderCalibrationWaveform(n)}renderScrubberZones(t){if(!this.scrubberZonesLayer||!t.duration||t.duration<=0)return;const e=t.zones||[],n=e.map(r=>`${r.id}-${r.start}-${r.end}-${r.active}`).join("|")+`-${t.duration.toFixed(1)}`;this._lastScrubberHash!==n&&(this._lastScrubberHash=n,this.scrubberZonesLayer.innerHTML="",e.forEach(r=>{if(!r.active)return;const a=r.start/t.duration*100,o=Math.max(1,(r.end-r.start)/t.duration*100),c=document.createElement("div");c.className="scrubber-zone-marker",c.dataset.zoneId=r.id,c.style.left=`${a.toFixed(2)}%`,c.style.width=`${o.toFixed(2)}%`,c.title=`${r.name} (${this.formatTime(r.start)} - ${this.formatTime(r.end)})`,c.addEventListener("click",l=>{l.stopPropagation();const h=r.start/t.duration;this.callbacks.onSeek(h)}),this.scrubberZonesLayer.appendChild(c)})),this.scrubberZonesLayer.querySelectorAll(".scrubber-zone-marker").forEach(r=>{const a=t.activeZone&&t.activeZone.id===r.dataset.zoneId;r.classList.toggle("active-now",!!a)})}renderCalibrationZoneList(t=[]){if(!this.calibZonesList)return;const e=t.map(i=>`${i.id}-${i.name}-${i.start}-${i.end}-${i.machineIndex}-${i.active}`).join("|");if(this._lastZonesListHash===e)return;this._lastZonesListHash=e,this.calibZonesList.innerHTML="";const n=[{idx:0,label:"01: Hydraulic Stamp Press"},{idx:1,label:"02: Industrial Guillotine"},{idx:2,label:"03: Column Drill / Punch"},{idx:3,label:"04: Blast Furnace Crucible"},{idx:4,label:"05: Roll Forming Mill"}];t.forEach((i,r)=>{const a=document.createElement("div");a.className=`zone-row ${i.active?"active":"inactive"}`,a.innerHTML=`
        <input type="text" name="zone-name-${r}" class="zone-name-input" value="${i.name}" title="Zone Title" />
        <div class="range-inputs">
          <input type="number" name="zone-start-${r}" class="zone-start-input" min="0" max="9999" step="0.5" value="${i.start.toFixed(1)}" title="Start (sec)" />
          <span>to</span>
          <input type="number" name="zone-end-${r}" class="zone-end-input" min="0" max="9999" step="0.5" value="${i.end.toFixed(1)}" title="End (sec)" />
          <span>s</span>
        </div>
        <select name="zone-machine-${r}" class="zone-machine-select">
          ${n.map(g=>`<option value="${g.idx}" ${i.machineIndex===g.idx?"selected":""}>${g.label}</option>`).join("")}
        </select>
        <button class="hud-btn micro-btn zone-toggle-btn">${i.active?"ENABLED":"MUTED"}</button>
        <button class="zone-btn-del" title="Delete Zone">✕</button>
      `;const o=a.querySelector(".zone-name-input"),c=a.querySelector(".zone-start-input"),l=a.querySelector(".zone-end-input"),h=a.querySelector(".zone-machine-select"),u=a.querySelector(".zone-toggle-btn"),f=a.querySelector(".zone-btn-del"),p=()=>{this.callbacks.onUpdateZone({id:i.id,name:o.value,start:parseFloat(c.value)||0,end:parseFloat(l.value)||0,machineIndex:parseInt(h.value,10),active:i.active})};o.addEventListener("change",p),c.addEventListener("change",p),l.addEventListener("change",p),h.addEventListener("change",p),u.addEventListener("click",()=>{this.callbacks.onToggleZone(i.id,!i.active)}),f.addEventListener("click",()=>{this.callbacks.onRemoveZone(i.id)}),this.calibZonesList.appendChild(a)})}renderScope(t){if(!this.scopeCtx||!this.scopeCanvas)return;const e=this.scopeCtx,n=this.scopeCanvas.width,i=this.scopeCanvas.height;e.clearRect(0,0,n,i);const r=t.frequencyData;if(!r||r.length===0){e.strokeStyle="rgba(255, 170, 0, 0.4)",e.lineWidth=1.5,e.beginPath(),e.moveTo(0,i/2),e.lineTo(n,i/2),e.stroke();return}const a=n/32,c=a-2;e.fillStyle=t.isDrop||t.inZone?"rgba(255, 60, 40, 0.9)":"rgba(255, 170, 0, 0.9)";for(let l=0;l<32;l++){const h=Math.floor(l*(r.length/64)),u=r[h]/255,f=Math.max(3,u*(i-4)),p=l*a,g=i-f;e.fillRect(p,g,c,f)}}renderCalibrationWaveform(t){if(!this.calibWaveformCtx||!this.calibWaveformCanvas)return;const e=this.calibWaveformCtx,n=this.calibWaveformCanvas.width,i=this.calibWaveformCanvas.height,r=16,a=r,o=i-r,c=a+o*.5,l=t.duration||0,h=Math.max(1,this.waveZoom||1),u=1/h,f=Math.max(0,Math.min(1-u,this.waveViewStart||0)),p=f+u,g=d=>(d-f)*h*n;if(this.calibWaveViewport&&(this.calibWaveViewport.style.left=`${(f*100).toFixed(2)}%`,this.calibWaveViewport.style.width=`${(u*100).toFixed(2)}%`),e.fillStyle="#080a0e",e.fillRect(0,0,n,i),e.fillStyle="#0d1118",e.fillRect(0,0,n,r),e.strokeStyle="rgba(255, 255, 255, 0.07)",e.lineWidth=1,l>0){const d=l*u,w=[1,2,5,10,15,30,60,120,300,600].find(P=>d/P<=12)||600,_=Math.ceil(f*l/w)*w;e.fillStyle="#7e8ba0",e.font='10px "Share Tech Mono", monospace',e.textAlign="left";for(let P=_;P<=p*l;P+=w){const A=g(P/l);e.beginPath(),e.moveTo(A,r),e.lineTo(A,i),e.stroke(),e.fillText(this.formatTime(P),Math.min(n-34,A+3),11)}}e.beginPath(),e.moveTo(0,c),e.lineTo(n,c),e.stroke();const v=t.waveform;if(v&&v.length>0){e.fillStyle="rgba(135, 155, 180, 0.36)";const d=v.length,b=Math.max(0,Math.floor(f*d)),w=Math.min(d-1,Math.ceil(p*d)),_=Math.max(1,n/(w-b+1||1));for(let P=b;P<=w;P++){const A=v[P]*(o*.44),C=g(P/d);e.fillRect(C,c-A,_,A*2)}}else e.fillStyle="#6b7688",e.font='12px "Share Tech Mono", monospace',e.textAlign="center",e.fillText(t.analysisStatus==="analyzing"?"ANALYZING PCM SPECTRUM & KICK TEMPLATES...":"AWAITING DSP WAVEFORM ANALYSIS",n/2,c+4);const m=t.subProfile;if(m&&m.length>0){const d=m.length,b=Math.max(0,Math.floor(f*d)),w=Math.min(d-1,Math.ceil(p*d));e.beginPath(),e.moveTo(g(b/d),i);for(let _=b;_<=w;_++){const P=g(_/d),A=i-m[_]*(o*.56);e.lineTo(P,A)}e.lineTo(g(w/d),i),e.closePath(),e.fillStyle="rgba(255, 55, 40, 0.22)",e.fill(),e.strokeStyle="rgba(255, 80, 48, 0.85)",e.lineWidth=1.25,e.stroke()}if(l>0&&Array.isArray(t.zones))for(let d=0;d<t.zones.length;d++){const b=t.zones[d],w=b.start/l,_=b.end/l;if(_<f||w>p)continue;const P=g(w),A=g(_),C=Math.max(3,A-P);b.active?(e.fillStyle="rgba(255, 170, 0, 0.18)",e.fillRect(P,a,C,o),e.strokeStyle="#ffaa00",e.lineWidth=1.5,e.strokeRect(P+.5,a+.5,C-1,o-1),e.fillStyle="#ffcc33",e.font='bold 10px "Share Tech Mono", monospace',e.textAlign="left",e.fillText(`BAY 0${(b.machineIndex||0)+1}`,Math.max(2,P+4),a+12)):(e.fillStyle="rgba(90, 96, 110, 0.14)",e.fillRect(P,a,C,o),e.setLineDash([4,3]),e.strokeStyle="rgba(130, 140, 160, 0.45)",e.strokeRect(P+.5,a+.5,C-1,o-1),e.setLineDash([]))}if(l>0&&Array.isArray(t.activeKicks))for(let d=0;d<t.activeKicks.length;d++){const b=t.activeKicks[d],w=b.t/l;if(w<f||w>p)continue;const _=g(w);if(b.kind==="BEAT"){const P=Math.min(o*.46,Math.max(12,b.strength*o*.34));e.strokeStyle="rgba(255, 204, 0, 0.85)",e.lineWidth=h>=4?2:1.5,e.beginPath(),e.moveTo(_,c-P),e.lineTo(_,c+P),e.stroke()}else e.strokeStyle="rgba(0, 229, 255, 0.9)",e.lineWidth=1.25,e.beginPath(),e.moveTo(_,i-22),e.lineTo(_,i),e.stroke()}if(this.isDraggingWaveform&&l>0){const d=Math.min(this.waveDragStartFrac,this.waveDragCurrFrac),b=Math.max(this.waveDragStartFrac,this.waveDragCurrFrac),w=g(d),_=Math.max(2,g(b)-w);e.fillStyle="rgba(0, 229, 255, 0.22)",e.fillRect(w,a,_,o),e.strokeStyle="#00e5ff",e.lineWidth=2,e.strokeRect(w,a+1,_,o-2),e.fillStyle="#00e5ff",e.font='bold 11px "Share Tech Mono", monospace',e.textAlign="left",e.fillText(`NEW ZONE: ${this.formatTime(d*l)} - ${this.formatTime(b*l)}`,Math.max(4,Math.min(n-170,w+4)),i-8)}if(l>0){const d=(t.currentTime||0)/l;if(d>=f&&d<=p){const b=g(d);e.strokeStyle="#ffffff",e.lineWidth=2,e.beginPath(),e.moveTo(b,0),e.lineTo(b,i),e.stroke()}}}}class wm{constructor(){this.canvasContainer=document.getElementById("canvas-container"),this.hud=new bm,this.audioEngine=new Mc,this.sceneEngine=new fm,this.machineManager=new ym,this.isStarted=!1,this.lastTime=performance.now(),this.currentTrackUrl="./detonated.mp3",this._lastCamTargetIdx=-1,this._lastCamTargetMode=null,this.initHUDCallbacks()}async init(){if(console.log("[App] Initializing Heavy Industrial Visualizer..."),this.canvasContainer&&typeof this.sceneEngine.init=="function")try{this.sceneEngine.init(this.canvasContainer),console.log("[App] SceneEngine initialized successfully.")}catch(e){console.error("[App] Error initializing SceneEngine:",e)}const t=typeof this.sceneEngine.getScene=="function"?this.sceneEngine.getScene():null;if(t&&typeof this.machineManager.init=="function")try{this.machineManager.init(t),typeof this.sceneEngine.setMachineManager=="function"&&this.sceneEngine.setMachineManager(this.machineManager),console.log("[App] MachineManager initialized with 5 industrial bays.")}catch(e){console.error("[App] Error initializing MachineManager:",e)}window.addEventListener("resize",()=>{typeof this.sceneEngine.onWindowResize=="function"&&this.sceneEngine.onWindowResize()});try{await this.audioEngine.loadTrack(this.currentTrackUrl),console.log("[App] Default reference track loaded:",this.currentTrackUrl)}catch(e){console.warn("[App] Deferred track load:",e)}requestAnimationFrame(e=>this.loop(e))}initHUDCallbacks(){this.hud.setCallbacks({onStart:async()=>{try{await this.audioEngine.init(),this.audioEngine.hasLoadedTrack||await this.audioEngine.loadTrack(this.currentTrackUrl),await this.audioEngine.play(),this.isStarted=!0,console.log("[App] Audio and Visualizer engaged.")}catch(t){console.error("[App] Error on engage start:",t)}},onPlayPause:async()=>{if(this.isStarted||(await this.audioEngine.init(),this.audioEngine.hasLoadedTrack||await this.audioEngine.loadTrack(this.currentTrackUrl),this.isStarted=!0),typeof this.audioEngine.togglePlay=="function")await this.audioEngine.togglePlay();else{const t=this.audioEngine.getState();t&&t.isPlaying?this.audioEngine.pause():await this.audioEngine.play()}},onSeek:t=>{const e=this.audioEngine.getState();if(e&&e.duration>0){const n=t*e.duration;typeof this.audioEngine.seek=="function"?this.audioEngine.seek(n):this.audioEngine.audio&&(this.audioEngine.audio.currentTime=n)}},onLoadAudio:async t=>{try{await this.audioEngine.loadTrack(t),await this.audioEngine.play(),this.isStarted=!0,console.log("[App] Loaded custom audio file.")}catch(e){console.error("[App] Failed to load custom audio file:",e)}},onVolumeChange:t=>{typeof this.audioEngine.setVolume=="function"&&this.audioEngine.setVolume(t)},onSensitivityChange:t=>{typeof this.audioEngine.setSensitivity=="function"&&this.audioEngine.setSensitivity(t)},onCameraModeChange:t=>{const e=this.audioEngine.getState(),n=this.hud.manualBaySelection!==null?this.hud.manualBaySelection:e?e.activeMachineIndex:0;this._lastCamTargetIdx=n,this._lastCamTargetMode=t,typeof this.sceneEngine.setCameraFocus=="function"&&this.sceneEngine.setCameraFocus(n,t)},onShakeToggle:t=>{console.log("[App] Screen shake toggled:",t)},onSkinChange:t=>{typeof this.sceneEngine.setSkin=="function"&&this.sceneEngine.setSkin(t),console.log("[App] Factory skin changed:",t)},onBaySelect:t=>{t!==null?(this._lastCamTargetIdx=t,this._lastCamTargetMode="focus",typeof this.sceneEngine.setCameraFocus=="function"&&this.sceneEngine.setCameraFocus(t,"focus"),this.audioEngine.machineDirector&&typeof this.audioEngine.machineDirector.setActiveMachine=="function"&&this.audioEngine.machineDirector.setActiveMachine(t,!1)):(this.audioEngine.machineDirector&&typeof this.audioEngine.machineDirector.setAutoSwitch=="function"&&this.audioEngine.machineDirector.setAutoSwitch(!0),this._lastCamTargetIdx=-1,this._lastCamTargetMode=null,typeof this.sceneEngine.setCameraFocus=="function"&&this.sceneEngine.setCameraFocus(0,this.hud.cameraMode))},onSyncModeChange:t=>{this.audioEngine.setSyncMode(t),console.log("[App] Sync mode changed:",t)},onBpmChange:t=>{this.audioEngine.setBpm(t),this.audioEngine.reanalyzeWithBpm(t),console.log("[App] BPM updated:",t)},onReanalyzeBpm:t=>{this.audioEngine.reanalyzeWithBpm(t),console.log("[App] Re-analyzing track via DSP Worker (overrideBpm =",t,")")},onIncludeRollsChange:t=>{this.audioEngine.setIncludeRolls(t),console.log("[App] Kick Rolls detection:",t)},onLatencyChange:t=>{this.audioEngine.setLatencyOffsetMs(t),console.log("[App] Latency offset updated:",t)},onDebounceChange:t=>{this.audioEngine.setRefractoryMs(t),console.log("[App] Debounce updated:",t)},onAddZone:(t,e,n=0)=>{const i=this.audioEngine.addKickZone(t,e,n);console.log("[App] Added kick zone:",i)},onRemoveZone:t=>{this.audioEngine.removeKickZone(t),console.log("[App] Removed kick zone:",t)},onToggleZone:(t,e)=>{this.audioEngine.toggleKickZone(t,e),console.log("[App] Toggled kick zone:",t,e)},onUpdateZone:t=>{const e=this.audioEngine.getKickZones(),n=e.find(i=>i.id===t.id);n&&Object.assign(n,t),this.audioEngine.setKickZones(e),console.log("[App] Updated kick zone:",t)},onResetZones:()=>{this.audioEngine.resetZonesToAuto(),console.log("[App] Reset zones to auto-detected DSP drop presets.")}})}loop(t){const e=Math.min(.1,(t-this.lastTime)/1e3);this.lastTime=t;const n=t/1e3;typeof this.audioEngine.update=="function"&&this.audioEngine.update();const i=typeof this.audioEngine.getState=="function"?this.audioEngine.getState():null;if(i&&i.kick&&this.hud.isScreenShakeEnabled&&typeof this.sceneEngine.triggerScreenShake=="function"&&this.sceneEngine.triggerScreenShake(i.kickIntensity||1),typeof this.machineManager.update=="function"&&this.machineManager.update(n,e,i),i&&this.hud.manualBaySelection===null){const r=i.inZone||i.isDrop||this.hud.cameraMode==="focus"?"focus":this.hud.cameraMode==="orbit"?"orbit":null;if(r){const a=i.activeMachineIndex??0;(a!==this._lastCamTargetIdx||r!==this._lastCamTargetMode)&&(this._lastCamTargetIdx=a,this._lastCamTargetMode=r,typeof this.sceneEngine.setCameraFocus=="function"&&this.sceneEngine.setCameraFocus(a,r))}}typeof this.sceneEngine.render=="function"&&this.sceneEngine.render(n,e,i),this.hud&&this.hud.update(n,e,i,this.machineManager),requestAnimationFrame(r=>this.loop(r))}}window.addEventListener("DOMContentLoaded",()=>{const s=new wm;window.__app=s,s.init().catch(console.error)});
