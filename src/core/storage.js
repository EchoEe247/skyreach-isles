const PROGRESS_KEY='skyreach-progress-v1';
const SETTINGS_KEY='skyreach-settings-v1';

const parse=(value,fallback)=>{
  try{return value?JSON.parse(value):fallback}catch{return fallback}
};

const bools=(value,count)=>Array.isArray(value)?value.slice(0,count).map(Boolean):[];

export function loadProgress(){
  const value=parse(localStorage.getItem(PROGRESS_KEY),{});
  return {
    beacons:bools(value.beacons,6),
    rings:bools(value.rings,8),
    shards:bools(value.shards,10),
    discoveries:bools(value.discoveries,5)
  };
}

export function saveProgress(progress){
  try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress))}catch{}
}

export function loadSettings(){
  const value=parse(localStorage.getItem(SETTINGS_KEY),{});
  return {quality:['auto','low','medium','high'].includes(value.quality)?value.quality:'auto'};
}

export function saveSettings(settings){
  try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings))}catch{}
}
