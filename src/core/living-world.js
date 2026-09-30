import {normalizeSunAngle} from './daylight.js';

const PI=Math.PI;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};

export const WEATHER_PROFILES={
  clear:{cloud:0.16,rain:0,fog:0,wind:0.16,darkness:0,roughness:0},
  cloudy:{cloud:0.68,rain:0,fog:0.10,wind:0.38,darkness:0.06,roughness:0.22},
  rain:{cloud:0.88,rain:0.72,fog:0.22,wind:0.52,darkness:0.11,roughness:0.42},
  storm:{cloud:1,rain:1,fog:0.30,wind:0.92,darkness:0.18,roughness:0.78},
  fog:{cloud:0.58,rain:0,fog:0.82,wind:0.12,darkness:0.07,roughness:0.08}
};
const WEATHER_SEGMENTS=[
  ['clear',80],['cloudy',70],['rain',90],['storm',48],
  ['rain',55],['cloudy',72],['fog',68],['clear',117]
];
export const WEATHER_CYCLE_SECONDS=WEATHER_SEGMENTS.reduce((n,x)=>n+x[1],0);

function segmentAt(seconds){
  let t=((seconds%WEATHER_CYCLE_SECONDS)+WEATHER_CYCLE_SECONDS)%WEATHER_CYCLE_SECONDS;
  for(let i=0;i<WEATHER_SEGMENTS.length;i++){
    const [kind,duration]=WEATHER_SEGMENTS[i];
    if(t<duration)return {i,kind,duration,elapsed:t};
    t-=duration;
  }
  return {i:0,kind:'clear',duration:80,elapsed:0};
}

export function weatherAt(seconds){
  const s=segmentAt(Number.isFinite(seconds)?seconds:0);
  const next=WEATHER_SEGMENTS[(s.i+1)%WEATHER_SEGMENTS.length][0];
  const transition=14;
  const blend=s.elapsed>s.duration-transition?smooth((s.elapsed-(s.duration-transition))/transition):0;
  const a=WEATHER_PROFILES[s.kind],b=WEATHER_PROFILES[next];
  const profile={kind:s.kind,next,blend};
  for(const key of ['cloud','rain','fog','wind','darkness','roughness'])profile[key]=mix(a[key],b[key],blend);
  return profile;
}

export function lightningAt(seconds,weather=weatherAt(seconds)){
  if(weather.kind!=='storm'&&weather.next!=='storm')return 0;
  const t=Number.isFinite(seconds)?seconds:0;
  const pulse=Math.max(0,Math.sin(t*.47)*Math.sin(t*1.91));
  return pulse>.88?Math.pow((pulse-.88)/.12,2):0;
}

export function npcPeriod(angle){
  const a=normalizeSunAngle(angle);
  if(a>=PI)return 'night';
  if(a<PI*.22)return 'morning';
  if(a<PI*.76)return 'day';
  return 'evening';
}

export function npcScheduleTarget(index,angle,home={x:0,z:0,radius:42}){
  const p=npcPeriod(angle),r=Math.max(8,home.radius||42),a=index*2.399963229728653;
  let rr,shift=0;
  if(p==='night'){rr=r*.28+(index%3)*r*.055;shift=.15}
  else if(p==='morning'){rr=r*.18+(index%4)*r*.025;shift=-.6}
  else if(p==='day'){rr=r*.50+(index%5)*r*.035;shift=.8}
  else{rr=r*.30+(index%4)*r*.035;shift=1.75}
  return {period:p,x:home.x+Math.cos(a+shift)*rr,z:home.z+Math.sin(a+shift)*rr};
}

export const WORLD_EVENTS=[
  {id:'drifting-cargo',title:'Cargo washed ashore',x:674,z:350,radius:22},
  {id:'lighthouse-outage',title:'Lighthouse outage',x:-135,z:-60,radius:28},
  {id:'stranded-boat',title:'A stranded boat is signaling offshore',x:390,z:255,radius:26}
];
export const EVENT_CYCLE_SECONDS=480;

export function worldEventAt(seconds){
  const t=((Number.isFinite(seconds)?seconds:0)%EVENT_CYCLE_SECONDS+EVENT_CYCLE_SECONDS)%EVENT_CYCLE_SECONDS;
  if(t>=45&&t<115)return WORLD_EVENTS[0];
  if(t>=175&&t<245)return WORLD_EVENTS[1];
  if(t>=315&&t<390)return WORLD_EVENTS[2];
  return null;
}
