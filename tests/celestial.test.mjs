import test from 'node:test';
import assert from 'node:assert/strict';
import {EARTH_RADIUS_M,MOON_DISTANCE_M,MOON_RADIUS_M,MOON_CENTER,MOON_SITE,bodyMetrics,initCelestialFromRocket,earthReturnTarget,atmosphericStateFromCelestial,stepCelestial,renderDistance,angularRenderRadius,projectMoonLocal,safeWarp,targetDistance,targetGuidance,moonPhysicalFromLocal,MOON_SITE_UP,LANDING_MAX_SPEED_MPS,CRASH_MIN_SPEED_MPS,spacecraftRenderXZ} from '../src/core/celestial.js';

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

test('Karman handoff exposes finite telemetry immediately and caps Moon warp near Earth',()=>{
  const s=initCelestialFromRocket({altitude:100000,verticalSpeed:2264,horizontalSpeed:0,heading:Math.PI,pitch:.35});
  for(const value of [s.earthAltitude,s.moonAltitude,s.speed,s.earthVerticalSpeed,s.moonVerticalSpeed])assert.ok(Number.isFinite(value));
  assert.ok(Math.abs(s.earthAltitude-100000)<1e-6);
  assert.equal(safeWarp(s,400,'moon'),10);
});

test('400x AUTO NAV remains finite through the post-Karman departure',()=>{
  let s=initCelestialFromRocket({altitude:100000,verticalSpeed:2264,horizontalSpeed:0,heading:Math.PI,velocityHeading:Math.PI,pitch:.35});
  for(let i=0;i<900;i++){
    s=stepCelestial(s,{cruise:true,target:'moon',warp:400,sas:true,engineAvailable:true},.05,{acceleration:40,turnRate:.48,cruiseSpeed:18500});
    assert.equal(s.numericalFault,false);
    for(const value of [...s.position,...s.velocity,s.earthAltitude,s.moonAltitude,s.speed])assert.ok(Number.isFinite(value));
  }
});

test('celestial integrator rolls back an overflow instead of returning NaN or Infinity',()=>{
  const s=initCelestialFromRocket({altitude:100000,verticalSpeed:1200,horizontalSpeed:0,heading:Math.PI,pitch:.35});
  s.velocity=[Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE];
  const next=stepCelestial(s,{cruise:true,target:'moon',warp:400,sas:true,engineAvailable:true},.05,{acceleration:40});
  assert.equal(next.numericalFault,true);
  for(const value of [...next.position,...next.velocity,next.earthAltitude,next.moonAltitude,next.speed])assert.ok(Number.isFinite(value));
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

test('Moon AUTO NAV physically completes touchdown without teleporting',()=>{
  let s=initCelestialFromRocket({altitude:100000,verticalSpeed:1600,horizontalSpeed:700,heading:Math.PI,velocityHeading:Math.PI,pitch:.35});
  for(let i=0;i<10000&&s.landedBody!=='moon'&&!s.crashedBody;i++){
    s=stepCelestial(s,{cruise:true,target:'moon',warp:400,sas:true,engineAvailable:true},1/60,{acceleration:40,turnRate:.48,cruiseSpeed:18500});
  }
  assert.equal(s.landedBody,'moon');
  assert.equal(s.crashedBody??null,null);
  const local=projectMoonLocal(s.position);
  assert.ok(Math.hypot(local.x,local.z)<1,'touchdown should be centered on the lunar destination');
  assert.ok(s.impactSpeed<LANDING_MAX_SPEED_MPS);
});

test('Earth return targets the original launch site and preserves reentry velocity',()=>{
  const state=initCelestialFromRocket({altitude:100000,worldX:-65,worldZ:-40,verticalSpeed:1200,horizontalSpeed:300,velocityHeading:Math.PI,heading:Math.PI,pitch:.2});
  assert.deepEqual(earthReturnTarget(state),[-65,EARTH_RADIUS_M+12000,-40]);
  const returning={...state,position:[-65,EARTH_RADIUS_M+80000,-40],velocity:[12,-540,-18]};
  const a=atmosphericStateFromCelestial(returning);
  assert.ok(Math.abs(a.altitude-80000)<1);
  assert.ok(a.verticalSpeed<-539);
  assert.ok(a.horizontalSpeed>20);
  assert.equal(a.worldX,-65);
  assert.equal(a.worldZ,-40);
});

test('Earth AUTO NAV uses alignment then controlled descent to the launch site',()=>{
  let s={position:moonPhysicalFromLocal(0,0,800),velocity:[0,0,0],earthSite:[-65,0,-40],heading:0,pitch:0,landedBody:null};
  for(let i=0;i<24000&&s.landedBody!=='earth'&&!s.crashedBody;i++){
    s=stepCelestial(s,{cruise:true,target:'earth',warp:400,sas:true,engineAvailable:true},1/60,{acceleration:40,turnRate:.48,cruiseSpeed:18500});
  }
  assert.equal(s.landedBody,'earth');
  assert.equal(s.crashedBody??null,null);
  assert.ok(Math.hypot(s.position[0]+65,s.position[2]+40)<1);
  assert.ok(s.impactSpeed<LANDING_MAX_SPEED_MPS);
});

test('Moon guidance points near launch heading and reports the real elevation change',()=>{
  const s=initCelestialFromRocket({altitude:100000,worldX:-65,worldZ:-40,verticalSpeed:1200,horizontalSpeed:400,velocityHeading:Math.PI,heading:Math.PI,pitch:0});
  const g=targetGuidance(s,'moon');
  assert.ok(g.distance>370_000_000&&g.distance<390_000_000);
  assert.ok(Math.abs(g.relativeHeading)<.02,'Moon should begin close to the launch heading');
  assert.ok(g.relativePitch>.5&&g.relativePitch<.72,'Moon should be roughly 35 degrees off the launch vertical');
});

test('high-energy lunar impact crashes instead of becoming a safe landing',()=>{
  const p=moonPhysicalFromLocal(0,0,100),v=MOON_SITE_UP.map(x=>-x*1200);
  let s={position:p,velocity:v,heading:0,pitch:0,landedBody:null};
  for(let i=0;i<20&&!s.crashedBody;i++)s=stepCelestial(s,{throttle:0,steerX:0,steerY:0,sas:true,warp:1,target:'moon'},.05,{acceleration:40});
  assert.equal(s.crashedBody,'moon');
  assert.equal(s.landedBody,null);
  assert.ok(s.impactSpeed>CRASH_MIN_SPEED_MPS);
});
test('gentle lunar contact is a valid landing',()=>{
  const p=moonPhysicalFromLocal(0,0,2),v=MOON_SITE_UP.map(x=>-x*2);
  let s={position:p,velocity:v,heading:0,pitch:0,landedBody:null};
  for(let i=0;i<20&&!s.landedBody;i++)s=stepCelestial(s,{throttle:0,steerX:0,steerY:0,sas:true,warp:1,target:'moon'},.05,{acceleration:40});
  assert.equal(s.landedBody,'moon');
  assert.ok((s.impactSpeed||0)<=LANDING_MAX_SPEED_MPS);
});
test('celestial SAS damps attitude while manual mode carries inertia',()=>{
  const base=initCelestialFromRocket({altitude:140000,verticalSpeed:1000,horizontalSpeed:300,heading:1,velocityHeading:1,pitch:.2});
  let sas=base,manual=base;
  for(let i=0;i<90;i++){
    const steer=i<30?1:0;
    sas=stepCelestial(sas,{throttle:0,steerX:steer,steerY:0,sas:true,warp:1,target:'moon'},1/60,{turnRate:.6});
    manual=stepCelestial(manual,{throttle:0,steerX:steer,steerY:0,sas:false,warp:1,target:'moon'},1/60,{turnRate:.6});
  }
  assert.notEqual(sas.heading,manual.heading);
  assert.ok(Math.abs(sas.yawRate)<Math.abs(manual.yawRate));
});
test('manual flight cannot receive full 400x warp control amplification',()=>{
  const base=initCelestialFromRocket({altitude:2_000_000,verticalSpeed:0,horizontalSpeed:0,heading:0,velocityHeading:0,pitch:0});
  const s=stepCelestial(base,{throttle:1,steerX:1,steerY:1,sas:false,warp:400,target:'moon',cruise:false},1/60,{acceleration:72,turnRate:.72});
  assert.equal(s.requestedWarp,400);
  assert.ok(s.warp<=10);
  assert.ok(Math.abs(s.heading)<1);
});

test('Karman render anchor stays continuous until lunar-local blending begins',()=>{
  const anchor={x:-42.5,z:-31.25};
  assert.deepEqual(spacecraftRenderXZ(anchor.x,anchor.z,1200,-900,0),anchor);
  const half=spacecraftRenderXZ(anchor.x,anchor.z,1200,-900,.5);
  assert.equal(half.x,(anchor.x+1200)/2);
  assert.equal(half.z,(anchor.z-900)/2);
  assert.deepEqual(spacecraftRenderXZ(anchor.x,anchor.z,1200,-900,1),{x:1200,z:-900});
});

test('AUTO NAV completes Moon touchdown for every spacecraft profile',()=>{
  const profiles=[
    {acceleration:40,turnRate:.48,cruiseSpeed:18500},
    {acceleration:58,turnRate:.9,cruiseSpeed:26000},
    {acceleration:72,turnRate:.72,cruiseSpeed:32000}
  ];
  for(const profile of profiles){
    let state=initCelestialFromRocket({altitude:100000,verticalSpeed:1600,horizontalSpeed:700,heading:Math.PI,velocityHeading:Math.PI,pitch:.35,worldX:-65,worldZ:-40});
    for(let i=0;i<18000&&!state.landedBody&&!state.crashedBody;i++)state=stepCelestial(state,{cruise:true,target:'moon',warp:400,sas:true,engineAvailable:true},1/60,profile);
    assert.equal(state.landedBody,'moon');
    assert.equal(state.crashedBody??null,null);
    assert.ok(state.impactSpeed<LANDING_MAX_SPEED_MPS);
  }
});
test('AUTO NAV completes Earth touchdown for every spacecraft profile',()=>{
  const profiles=[
    {acceleration:40,turnRate:.48,cruiseSpeed:18500},
    {acceleration:58,turnRate:.9,cruiseSpeed:26000},
    {acceleration:72,turnRate:.72,cruiseSpeed:32000}
  ];
  for(const profile of profiles){
    let state={position:moonPhysicalFromLocal(0,0,4),velocity:[0,0,0],earthSite:[-65,0,-40],heading:0,pitch:0,landedBody:'moon'};
    for(let i=0;i<36000&&state.landedBody!=='earth'&&!state.crashedBody;i++)state=stepCelestial(state,{cruise:true,target:'earth',warp:400,sas:true,engineAvailable:true},1/60,profile);
    assert.equal(state.landedBody,'earth');
    assert.equal(state.crashedBody??null,null);
    assert.ok(state.impactSpeed<LANDING_MAX_SPEED_MPS);
    assert.ok(Math.hypot(state.position[0]+65,state.position[2]+40)<1);
  }
});
