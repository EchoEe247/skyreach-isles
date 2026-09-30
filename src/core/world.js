import {smoothstep as sm} from './math.js';

import {archipelagoHeight,ISLANDS} from "./archipelago.js";

function mainIslandHeight(x,z){
  const a=Math.atan2(z,x),d0=Math.hypot(x,z),d=d0*(1+.16*Math.sin(a*3+1)+.09*Math.sin(a*5+2)),f=1-d/320;
  if(f<=0)return Math.max(-80,-3+f*20);
  const n=(Math.sin(x*.03)*Math.cos(z*.027)*7+Math.sin(x*.07+z*.05)*3+Math.sin(z*.11)*Math.cos(x*.13)*1.2)*sm(0,.5,f);
  let h=sm(0,1,f)*30-3+n;
  return h+(6-h)*sm(95,58,d0);
}

export function terrainHeight(x,z){
  return Math.max(mainIslandHeight(x,z),archipelagoHeight(x,z));
}

export function boatCanTravel(x,z){
  // Collision follows actual land, including offshore islands; no world boundary.
  const falls=ISLANDS[2];
  if([-1,1].some(side=>Math.hypot(x-(falls.x-148),z-(falls.z+15+side*16))<7.5))return false;
  return terrainHeight(x,z)<=-.7;
}
