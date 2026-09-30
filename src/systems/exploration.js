import {angleDelta} from '../core/math.js';

export const distance2D=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

export function nearestPending(items,position){
  let nearest=null;
  let distance=Infinity;
  for(const item of items){
    if(item.on)continue;
    const d=distance2D(item,position);
    if(d<distance){nearest=item;distance=d}
  }
  return nearest?{item:nearest,distance}:null;
}

export function bearingTo(from,to){
  return Math.atan2(to.x-from.x,to.z-from.z);
}

export function relativeBearing(from,to,heading){
  return angleDelta(bearingTo(from,to)-heading);
}

export function haptic(pattern=35){
  try{navigator.vibrate?.(pattern)}catch{}
}
