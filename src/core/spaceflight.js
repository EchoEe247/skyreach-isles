import {clamp} from './math.js';

export const EARTH_RADIUS_M=6371000;
export const KARMAN_LINE_M=100000;
export const ROCKET_TIME_SCALE=4;
export const EARTH_RENDER_RADIUS=20000;

export function atmosphereDensity(altitudeM){
  const h=Math.max(0,Number(altitudeM)||0);
  return Math.exp(-h/8500);
}

export function gravityAtAltitude(altitudeM){
  const h=Math.max(0,Number(altitudeM)||0);
  return 9.80665*Math.pow(EARTH_RADIUS_M/(EARTH_RADIUS_M+h),2);
}

export function renderAltitude(altitudeM){
  const h=Math.max(0,Number(altitudeM)||0);
  return 1000*Math.log1p(h/1000);
}

export function physicalAltitude(renderM){
  const y=Math.max(0,Number(renderM)||0);
  return 1000*Math.expm1(y/1000);
}

export function spaceBlend(altitudeM){
  return clamp((Math.max(0,altitudeM)-18000)/(KARMAN_LINE_M-18000),0,1);
}

export function atmosphereLabel(altitudeM){
  const h=Math.max(0,altitudeM);
  if(h>=KARMAN_LINE_M)return 'SPACE';
  if(h>=50000)return 'MESOSPHERE';
  if(h>=12000)return 'STRATOSPHERE';
  return 'TROPOSPHERE';
}

export function stepRocket(state,input,dt){
  const s={...state};
  const simDt=Math.max(0,Math.min(.05,dt))*ROCKET_TIME_SCALE;
  const throttle=clamp(Number(input.throttle)||0,0,1);
  const steerX=clamp(Number(input.steerX)||0,-1,1);
  const steerY=clamp(Number(input.steerY)||0,-1,1);
  s.altitude=Math.max(0,Number(s.altitude)||0);
  s.verticalSpeed=Number(s.verticalSpeed)||0;
  s.horizontalSpeed=Number(s.horizontalSpeed)||0;
  s.heading=Number(s.heading)||0;
  s.pitch=Number(s.pitch)||0;
  const density=atmosphereDensity(s.altitude);
  const gravity=gravityAtAltitude(s.altitude);
  const steerAuthority=.22+.78*(1-density);
  const targetPitch=s.altitude<180?0:steerY*.34;
  s.pitch+=(targetPitch-s.pitch)*Math.min(1,simDt*(.55+steerAuthority));
  s.heading-=steerX*(.12+.45*steerAuthority)*simDt;
  const thrustAcceleration=throttle*(31+9*(1-density));
  const verticalThrust=thrustAcceleration*Math.cos(s.pitch);
  const horizontalThrust=thrustAcceleration*Math.sin(s.pitch);
  const verticalDrag=.00023*density*s.verticalSpeed*Math.abs(s.verticalSpeed);
  const horizontalDrag=.00018*density*s.horizontalSpeed*Math.abs(s.horizontalSpeed);
  s.verticalSpeed+=(verticalThrust-gravity-verticalDrag)*simDt;
  s.horizontalSpeed+=(horizontalThrust-horizontalDrag)*simDt;
  if(s.altitude<=0&&s.verticalSpeed<0){s.verticalSpeed=0;s.horizontalSpeed*=Math.exp(-simDt*4)}
  s.altitude=Math.max(0,s.altitude+s.verticalSpeed*simDt);
  return s;
}
