import {smoothstep as sm} from './math.js';

import {archipelagoHeight,ISLANDS} from "./archipelago.js";

// The Muse LAX blockout is intentionally compressed to fit the main island while
// preserving its four-runway layout. These constants are shared by terrain,
// vehicle spawning, navigation, and the renderer.
export const AIRPORT_SITE=Object.freeze({
  x:140,
  z:-125,
  elevation:10,
  scale:1.25,
  halfX:99,
  halfZ:74,
  blend:24
});

function mainIslandHeight(x,z){
  const a=Math.atan2(z,x),d0=Math.hypot(x,z),d=d0*(1+.16*Math.sin(a*3+1)+.09*Math.sin(a*5+2)),f=1-d/320;
  if(f<=0)return Math.max(-80,-3+f*20);
  const n=(Math.sin(x*.03)*Math.cos(z*.027)*7+Math.sin(x*.07+z*.05)*3+Math.sin(z*.11)*Math.cos(x*.13)*1.2)*sm(0,.5,f);
  let h=sm(0,1,f)*30-3+n;
  return h+(6-h)*sm(95,58,d0);
}

export function isAirportZone(x,z,margin=0){
  return Math.abs(x-AIRPORT_SITE.x)<=AIRPORT_SITE.halfX+margin&&Math.abs(z-AIRPORT_SITE.z)<=AIRPORT_SITE.halfZ+margin;
}

function airportInfluence(x,z){
  const dx=Math.abs(x-AIRPORT_SITE.x),dz=Math.abs(z-AIRPORT_SITE.z),b=AIRPORT_SITE.blend;
  const ix=1-sm(AIRPORT_SITE.halfX,AIRPORT_SITE.halfX+b,dx);
  const iz=1-sm(AIRPORT_SITE.halfZ,AIRPORT_SITE.halfZ+b,dz);
  return ix*iz;
}

export function terrainHeight(x,z){
  const natural=Math.max(mainIslandHeight(x,z),archipelagoHeight(x,z)),airport=airportInfluence(x,z);
  return natural+(AIRPORT_SITE.elevation-natural)*airport;
}

export function boatCanTravel(x,z){
  // Collision follows actual land, including offshore islands; no world boundary.
  const falls=ISLANDS[2];
  if([-1,1].some(side=>Math.hypot(x-(falls.x-148),z-(falls.z+15+side*16))<7.5))return false;
  return terrainHeight(x,z)<=-.7;
}

export function submarineMaxDepth(x,z,seabedClearance=1.25){
  const floor=terrainHeight(x,z);
  return Math.max(.45,Math.min(28,-floor-Math.max(.5,seabedClearance)));
}

export function submarineCanTravel(x,z,depth=.45,seabedClearance=.55){
  if(!boatCanTravel(x,z))return false;
  const floor=terrainHeight(x,z),centerY=-Math.max(.45,depth);
  return centerY>=floor+Math.max(.5,seabedClearance);
}
