import {clamp} from './math.js';

export const EARTH_RADIUS_M=6371000;
export const MOON_DISTANCE_M=384400000;
export const MOON_RADIUS_M=1737400;
export const MOON_SOI_M=66000000;
export const EARTH_MU=3.986004418e14;
export const MOON_MU=4.9048695e12;
export const SPACE_TIME_SCALE=4;
export const MOON_RENDER_BASE_Y=12000;
export const MOON_LOCAL_RADIUS_M=7000;

const MOON_ANGLE=35*Math.PI/180;
export const MOON_CENTER=Object.freeze([0,Math.cos(MOON_ANGLE)*MOON_DISTANCE_M,-Math.sin(MOON_ANGLE)*MOON_DISTANCE_M]);

const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const len=a=>Math.hypot(a[0],a[1],a[2]);
const norm=a=>{const l=len(a)||1;return mul(a,1/l)};
const mix=(a,b,t)=>norm([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]);
const angleDelta=a=>Math.atan2(Math.sin(a),Math.cos(a));

export const MOON_SITE_UP=Object.freeze(norm(mul(MOON_CENTER,-1)));
export const MOON_SITE=Object.freeze(add(MOON_CENTER,mul(MOON_SITE_UP,MOON_RADIUS_M)));

export function bodyMetrics(position){
  const earthDistance=len(position),moonVector=sub(position,MOON_CENTER),moonDistance=len(moonVector);
  return {earthDistance,moonDistance,earthAltitude:earthDistance-EARTH_RADIUS_M,moonAltitude:moonDistance-MOON_RADIUS_M,distanceToMoon:moonDistance,distanceToEarth:earthDistance,moonInfluence:clamp((MOON_SOI_M-moonDistance)/(MOON_SOI_M*.55),0,1)};
}
function radialUp(position,center){return norm(sub(position,center))}
function controlUp(position){
  const m=bodyMetrics(position),earthUp=radialUp(position,[0,0,0]),moonUp=radialUp(position,MOON_CENTER);
  const t=m.moonInfluence*m.moonInfluence*(3-2*m.moonInfluence);
  return mix(earthUp,moonUp,t);
}
function basisForUp(up){
  let north=sub([0,0,1],mul(up,dot([0,0,1],up)));
  if(len(north)<.001)north=sub([1,0,0],mul(up,dot([1,0,0],up)));
  north=norm(north);
  return {up,north,east:norm(cross(up,north))};
}
function directionFromAttitude(position,heading,pitch){
  const b=basisForUp(controlUp(position)),tangent=norm(add(mul(b.north,Math.cos(heading)),mul(b.east,Math.sin(heading))));
  return norm(add(mul(b.up,Math.cos(pitch)),mul(tangent,Math.sin(pitch))));
}
function attitudeForDirection(position,direction){
  const d=norm(direction),b=basisForUp(controlUp(position)),upDot=clamp(dot(d,b.up),-1,1);
  return {heading:Math.atan2(dot(d,b.east),dot(d,b.north)),pitch:Math.acos(upDot)};
}
function gravityAt(position){
  const out=[0,0,0];
  for(const [center,mu,radius] of [[[0,0,0],EARTH_MU,EARTH_RADIUS_M],[MOON_CENTER,MOON_MU,MOON_RADIUS_M]]){
    const d=sub(center,position),r=Math.max(radius*.96,len(d)),a=mu/(r*r),n=norm(d);
    out[0]+=n[0]*a;out[1]+=n[1]*a;out[2]+=n[2]*a;
  }
  return out;
}

export function initCelestialFromRocket(state){
  const altitude=Math.max(0,state.altitude||0),heading=Number(state.heading)||0,vh=Number.isFinite(state.velocityHeading)?state.velocityHeading:heading;
  return {position:[0,EARTH_RADIUS_M+altitude,0],velocity:[Math.sin(vh)*(state.horizontalSpeed||0),state.verticalSpeed||0,Math.cos(vh)*(state.horizontalSpeed||0)],heading,pitch:Math.max(0,Number(state.pitch)||0),yawRate:0,pitchRate:0,landedBody:null};
}
export function moonLandingTarget(altitude=600){return add(MOON_SITE,mul(MOON_SITE_UP,Math.max(0,altitude)))}
export function earthReturnTarget(altitude=120000){return [0,EARTH_RADIUS_M+Math.max(0,altitude),0]}
export function targetDistance(state,target='moon'){
  const p=state.position||[0,EARTH_RADIUS_M,0],t=target==='earth'?earthReturnTarget():moonLandingTarget();
  return len(sub(t,p));
}
export function cruiseCommand(state,target='moon',profile={}){
  const p=state.position||[0,EARTH_RADIUS_M,0],vel=state.velocity||[0,0,0],metrics=bodyMetrics(p),targetPos=target==='earth'?earthReturnTarget():moonLandingTarget(600);
  const delta=sub(targetPos,p),distance=len(delta),toTarget=norm(delta),speed=len(vel),forwardSpeed=dot(vel,toTarget),accel=Math.max(4,profile.acceleration||36);
  let desiredSpeed=Math.min(profile.cruiseSpeed||18000,Math.sqrt(Math.max(0,2*accel*Math.max(0,distance-1800)))*.62);
  if(target==='moon'&&metrics.moonAltitude<250000)desiredSpeed=Math.min(desiredSpeed,clamp(distance*.012+3,3,700));
  if(target==='earth'&&metrics.earthAltitude<350000)desiredSpeed=Math.min(desiredSpeed,clamp(metrics.earthAltitude*.012+80,80,1200));
  const desiredVelocity=mul(toTarget,desiredSpeed),deltaVelocity=sub(desiredVelocity,vel);
  let direction=norm(deltaVelocity),throttle=clamp(len(deltaVelocity)/(accel*5),0,1);
  return {direction,throttle,desiredSpeed,distance,attitude:attitudeForDirection(p,direction)};
}
export function safeWarp(state,requested=1,target='moon'){
  const m=bodyMetrics(state.position||[0,EARTH_RADIUS_M,0]),d=target==='earth'?m.earthAltitude:len(sub(moonLandingTarget(600),state.position||[0,EARTH_RADIUS_M,0]));
  if(d<10000)return 1;if(d<800000)return Math.min(requested,10);if(d<5000000)return Math.min(requested,50);if(d<30000000)return Math.min(requested,100);return Math.min(requested,400);
}
export function stepCelestial(state,input,dt,profile={}){
  const s={...state,position:[...(state.position||[0,EARTH_RADIUS_M,0])],velocity:[...(state.velocity||[0,0,0])]},requestedWarp=Math.max(1,input.warp||1);
  const warp=safeWarp(s,requestedWarp,input.target||'moon');
  let total=Math.max(0,Math.min(.05,dt))*SPACE_TIME_SCALE*warp;
  const maxStep=warp>100?2.5:warp>10?1.2:.2,steps=Math.max(1,Math.ceil(total/maxStep)),h=total/steps;let auto=null;
  for(let i=0;i<steps;i++){
    if(input.cruise)auto=cruiseCommand(s,input.target||'moon',profile);
    if(auto){s.heading+=angleDelta(auto.attitude.heading-s.heading)*Math.min(1,h*.8);s.pitch+=(auto.attitude.pitch-s.pitch)*Math.min(1,h*.8)}
    else{s.heading-=clamp(input.steerX||0,-1,1)*(profile.turnRate||.55)*h;s.pitch=clamp(s.pitch+clamp(input.steerY||0,-1,1)*(profile.turnRate||.55)*h,-Math.PI,Math.PI)}
    const thrustDir=auto?auto.direction:directionFromAttitude(s.position,s.heading,s.pitch),throttle=clamp(auto?auto.throttle:(input.throttle||0),0,1),acc=(profile.acceleration||36)*throttle,g=gravityAt(s.position);
    s.velocity[0]+=(g[0]+thrustDir[0]*acc)*h;s.velocity[1]+=(g[1]+thrustDir[1]*acc)*h;s.velocity[2]+=(g[2]+thrustDir[2]*acc)*h;
    s.position[0]+=s.velocity[0]*h;s.position[1]+=s.velocity[1]*h;s.position[2]+=s.velocity[2]*h;
    const metrics=bodyMetrics(s.position),body=metrics.moonAltitude<metrics.earthAltitude?'moon':'earth',center=body==='moon'?MOON_CENTER:[0,0,0],radius=body==='moon'?MOON_RADIUS_M:EARTH_RADIUS_M,rel=sub(s.position,center),r=len(rel);
    if(r<radius){const up=norm(rel);s.position=add(center,mul(up,radius));const inward=dot(s.velocity,up);if(inward<0)s.velocity=sub(s.velocity,mul(up,inward));if(len(s.velocity)<3){s.velocity=[0,0,0];s.landedBody=body}}
    else if(s.landedBody&&r>radius+2)s.landedBody=null;
  }
  const metrics=bodyMetrics(s.position),speed=len(s.velocity),moonUp=radialUp(s.position,MOON_CENTER),earthUp=radialUp(s.position,[0,0,0]);
  return {...s,...metrics,speed,moonVerticalSpeed:dot(s.velocity,moonUp),earthVerticalSpeed:dot(s.velocity,earthUp),warp,cruise:auto};
}
export function renderDistance(distanceM){return 1200*Math.log1p(Math.max(0,distanceM)/100000)}
export function renderRelativeVector(relative){const d=len(relative);return d<1e-6?[0,0,0]:mul(relative,renderDistance(d)/d)}
export function angularRenderRadius(radiusM,distanceM){const d=Math.max(radiusM+1,distanceM),rd=renderDistance(d),angle=Math.asin(clamp(radiusM/d,0,.9999));return Math.min(rd*.94,26000,Math.max(1,Math.tan(angle)*rd))}
const SITE_BASIS=basisForUp(MOON_SITE_UP);
export function moonPhysicalFromLocal(x,z,altitude=0){return add(MOON_SITE,add(mul(SITE_BASIS.east,x),add(mul(SITE_BASIS.north,z),mul(MOON_SITE_UP,altitude))))}
export function projectMoonLocal(position){const rel=sub(position,MOON_SITE);return {x:dot(rel,SITE_BASIS.east),z:dot(rel,SITE_BASIS.north),altitude:len(sub(position,MOON_CENTER))-MOON_RADIUS_M}}
export function moonSiteDistance(position){const q=projectMoonLocal(position);return Math.hypot(q.x,q.z)}
export function moonLocalBlend(position){const q=projectMoonLocal(position),alt=clamp((90000-q.altitude)/70000,0,1),lat=clamp((MOON_LOCAL_RADIUS_M-Math.hypot(q.x,q.z))/2500,0,1);return alt*lat}
export function moonLocalRenderAltitude(altitudeM){const h=Math.max(0,altitudeM);return h<2500?h:2500+1800*Math.log1p((h-2500)/1800)}
