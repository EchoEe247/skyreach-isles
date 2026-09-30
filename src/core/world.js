import {smoothstep as sm} from './math.js';

export function terrainHeight(x,z){
  const a=Math.atan2(z,x),d0=Math.hypot(x,z),d=d0*(1+.16*Math.sin(a*3+1)+.09*Math.sin(a*5+2)),f=1-d/320;
  if(f<=0)return Math.max(-80,-3+f*20);
  const n=(Math.sin(x*.03)*Math.cos(z*.027)*7+Math.sin(x*.07+z*.05)*3+Math.sin(z*.11)*Math.cos(x*.13)*1.2)*sm(0,.5,f);
  let h=sm(0,1,f)*30-3+n;
  return h+(6-h)*sm(95,58,d0);
}

export function boatCanTravel(x,z){
  // The island collision field is intentionally finite. Beyond it, ocean is open.
  return Math.hypot(x,z)>=360||terrainHeight(x,z)<=-.7;
}
