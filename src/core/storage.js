const PROGRESS_KEY='skyreach-progress-v1';
const SETTINGS_KEY='skyreach-settings-v1';

const parse=(value,fallback)=>{
  try{return value?JSON.parse(value):fallback}catch{return fallback}
};
const read=(key,fallback)=>{
  try{return parse(globalThis.localStorage?.getItem?.(key),fallback)}catch{return fallback}
};
const bools=(value,count)=>Array.isArray(value)?value.slice(0,count).map(Boolean):[];

export function loadProgress(){
  const value=read(PROGRESS_KEY,{});
  return {
    beacons:bools(value.beacons,6),
    rings:bools(value.rings,8),
    shards:bools(value.shards,10),
    discoveries:bools(value.discoveries,9)
  };
}
export function saveProgress(progress){
  try{globalThis.localStorage?.setItem?.(PROGRESS_KEY,JSON.stringify(progress))}catch{}
}
export function loadSettings(){
  const value=read(SETTINGS_KEY,{});
  return {quality:['auto','low','medium','high'].includes(value.quality)?value.quality:'auto'};
}
export function saveSettings(settings){
  try{globalThis.localStorage?.setItem?.(SETTINGS_KEY,JSON.stringify(settings))}catch{}
}

const JOURNEY_KEY='skyreach-journey-v1';
export function loadJourney(){
 const data=read(JOURNEY_KEY,{});
 return Math.max(0,Math.min(5,Number.isInteger(data.stage)?data.stage:0));
}
export function saveJourney(stage){
 const value=Math.max(0,Math.min(5,Math.floor(Number(stage)||0)));
 try{globalThis.localStorage?.setItem?.(JOURNEY_KEY,JSON.stringify({stage:value}))}catch{}
 return value;
}

const LUNAR_KEY='skyreach-lunar-discoveries-v1';
export function loadLunarSites(){
 const data=read(LUNAR_KEY,[]);
 return Array.isArray(data)?[...new Set(data.filter(x=>typeof x==='string'))].slice(0,16):[];
}
export function saveLunarSites(ids=[]){
 const clean=[...new Set(ids.filter(x=>typeof x==='string'))].slice(0,16);
 try{globalThis.localStorage?.setItem?.(LUNAR_KEY,JSON.stringify(clean))}catch{}
 return clean;
}
