const PROGRESS_KEY='skyreach-progress-v1';
const SETTINGS_KEY='skyreach-settings-v1';

const parse=(value,fallback)=>{
  try{return value?JSON.parse(value):fallback}catch{return fallback}
};

export function loadProgress(){
  const value=parse(localStorage.getItem(PROGRESS_KEY),{});
  return {
    beacons:Array.isArray(value.beacons)?value.beacons.slice(0,6):[],
    rings:Array.isArray(value.rings)?value.rings.slice(0,8):[]
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
