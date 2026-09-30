import {clamp} from './math.js';
export const DAY_SECONDS=540;
export const NIGHT_SECONDS=180;
const TAU=Math.PI*2;
export function normalizeSunAngle(angle){return ((angle%TAU)+TAU)%TAU;}
export function advanceSunAngle(angle,dt){
  const a=normalizeSunAngle(angle);
  let seconds=a<Math.PI?a/Math.PI*DAY_SECONDS:DAY_SECONDS+(a-Math.PI)/Math.PI*NIGHT_SECONDS;
  seconds=(seconds+Math.max(0,Number.isFinite(dt)?dt:0))%(DAY_SECONDS+NIGHT_SECONDS);
  return seconds<DAY_SECONDS?seconds/DAY_SECONDS*Math.PI:Math.PI+(seconds-DAY_SECONDS)/NIGHT_SECONDS*Math.PI;
}
export function lightingAt(angle){
  const altitude=Math.sin(angle),daylight=clamp(altitude*3+.5,0,1);
  return {
    altitude,daylight,
    hemisphere:.85+.30*daylight,
    ambient:.25-.07*daylight,
    sun:Math.max(0,altitude)*1.1+.32*daylight,
    moon:(1-daylight)*.50,
    waterLightness:.26+.11*daylight,
    twilight:Math.max(0,1-Math.abs(altitude)*4)
  };
}
