import test from 'node:test';
import assert from 'node:assert/strict';
import {EARTH_RADIUS_M,MOON_DISTANCE_M,MOON_RADIUS_M,MOON_CENTER,MOON_SITE,bodyMetrics,initCelestialFromRocket,stepCelestial,renderDistance,angularRenderRadius,projectMoonLocal,safeWarp,targetDistance,moonPhysicalFromLocal} from '../src/core/celestial.js';

test('Moon uses real-scale Earth-Moon separation and radius',()=>{
  assert.ok(Math.abs(Math.hypot(...MOON_CENTER)-MOON_DISTANCE_M)<1);
  assert.ok(MOON_RADIUS_M>1_700_000&&MOON_RADIUS_M<1_800_000);
});

test('rocket celestial handoff preserves velocity components',()=>{
  const s=initCelestialFromRocket({altitude:100000,verticalSpeed:1200,horizontalSpeed:400,velocityHeading:Math.PI/2,heading:Math.PI/2,pitch:.3});
  assert.ok(Math.abs(s.position[1]-(EARTH_RADIUS_M+100000))<1e-6);
  assert.ok(Math.abs(s.velocity[0]-400)<1e-6);
  assert.ok(Math.abs(s.velocity[1]-1200)<1e-6);
});

test('celestial integration is deterministic',()=>{
  const base=initCelestialFromRocket({altitude:120000,verticalSpeed:1700,horizontalSpeed:900,velocityHeading:Math.PI,heading:Math.PI,pitch:.5});
  const a=stepCelestial(base,{throttle:.7,steerX:.2,steerY:.1,sas:true,warp:1,target:'moon'},1/60,{acceleration:40});
  const b=stepCelestial(base,{throttle:.7,steerX:.2,steerY:.1,sas:true,warp:1,target:'moon'},1/60,{acceleration:40});
  assert.deepEqual(a,b);
});

test('Moon landing site is on lunar surface',()=>{
  const m=bodyMetrics(MOON_SITE);
  assert.ok(Math.abs(m.moonAltitude)<1e-5);
  const q=projectMoonLocal(MOON_SITE);
  assert.ok(Math.abs(q.x)<1e-5&&Math.abs(q.z)<1e-5&&Math.abs(q.altitude)<1e-5);
});

test('render compression stays finite across Earth-Moon distance',()=>{
  assert.ok(renderDistance(100000)>0);
  assert.ok(renderDistance(MOON_DISTANCE_M)<20000);
  assert.ok(angularRenderRadius(MOON_RADIUS_M,MOON_DISTANCE_M)>1);
});

test('warp automatically collapses near a target body',()=>{
  const moonNear={position:moonPhysicalFromLocal(0,0,5000)};
  assert.equal(safeWarp(moonNear,400,'moon'),1);
});

test('Moon cruise physically intercepts the landing corridor without teleporting',()=>{
  let s=initCelestialFromRocket({altitude:100000,verticalSpeed:1600,horizontalSpeed:700,heading:Math.PI,velocityHeading:Math.PI,pitch:.35});
  let reached=false;
  for(let i=0;i<7000;i++){
    s=stepCelestial(s,{cruise:true,target:'moon',warp:400,sas:true},1/60,{acceleration:40,turnRate:.48,cruiseSpeed:18500});
    if(targetDistance(s,'moon')<300&&s.speed<35){reached=true;break}
  }
  assert.ok(reached,'cruise should deliver a controllable final lunar approach');
  const local=projectMoonLocal(s.position);
  assert.ok(Math.hypot(local.x,local.z)<100,'approach should be over the landing site');
  assert.ok(s.moonAltitude>500&&s.moonAltitude<1400,'handoff should stay above the lunar surface for manual landing');
});
