import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getVehicleVisualFx,warpDisplay} from '../src/core/flight-guidance.js';
import {stepRocket,KARMAN_LINE_M} from '../src/core/spaceflight.js';
import {initCelestialFromRocket,stepCelestial,safeWarp} from '../src/core/celestial.js';

test('spacecraft FX always resolves through the Three.js scene graph',()=>{
 const effect={plumes:{visible:false},glow:{material:{opacity:0}},gear:{visible:false},crashGlow:{intensity:0}};
 const alien={spacecraft:true,g:{userData:{fx:effect}}};
 const rocket={spacecraft:true,g:{userData:{}}};
 assert.strictEqual(getVehicleVisualFx(alien),effect);
 assert.strictEqual(getVehicleVisualFx(rocket),null);
 assert.strictEqual(getVehicleVisualFx({spacecraft:true}),null);
 assert.strictEqual(getVehicleVisualFx(null),null);
 assert.strictEqual(getVehicleVisualFx({userData:{fx:effect},g:{userData:{}}}),null);
});
test('game rendering cannot dereference vehicle-state userData at Karman line',()=>{
 const source=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
 assert.match(source,/const fx=getVehicleVisualFx\(c\);if\(fx\)/);
 assert.doesNotMatch(source,/c\.userData\.fx/);
 assert.match(source,/rocketBoundaryProbe:/);
 assert.match(source,/flightErrors:/);
});
test('warp HUD distinguishes requested 400x from safely applied 10x near Earth',()=>{
 const near=warpDisplay(400,10);
 assert.equal(near.requested,400);
 assert.equal(near.effective,10);
 assert.equal(near.limited,true);
 assert.equal(near.label,'TIME ×400 (×10)');
 assert.match(near.reason,/automatically limited/);
 const start=warpDisplay(400,400,{atmospheric:true});
 assert.equal(start.effective,1);
 assert.equal(start.limited,true);
 const far=warpDisplay(400,400);
 assert.equal(far.label,'TIME ×400');
 assert.equal(far.limited,false);
});
test('replay screenshot handoff at 100km, 8150km/h and x400 AUTO NAV',()=>{
 const rocket={
   altitude:99850,verticalSpeed:2264,horizontalSpeed:0,
   heading:Math.PI,velocityHeading:Math.PI,pitch:.2,pitchRate:0,yawRate:0
 };
 const launch=stepRocket(rocket,{throttle:1,steerX:0,steerY:0,sas:true},1/60,{acceleration:40});
 assert.ok(launch.altitude>=KARMAN_LINE_M,'must actually cross the 100km line');
 let flight=initCelestialFromRocket({...launch,worldX:-65,worldZ:-40});
 assert.equal(safeWarp(flight,400,'moon'),10);
 const firstAlt=flight.earthAltitude;
 for(let i=0;i<250;i++){
  flight=stepCelestial(flight,{cruise:true,target:'moon',warp:400,sas:true,engineAvailable:true},1/60,{acceleration:40,turnRate:.48,cruiseSpeed:18500});
  assert.equal(flight.numericalFault,false,'numerical fault at frame '+i);
  assert.equal(flight.crashedBody??null,null,'physical crash at frame '+i);
  for(const n of [...flight.position,...flight.velocity,flight.earthAltitude,flight.moonAltitude,flight.speed])assert.ok(Number.isFinite(n));
 }
 assert.ok(flight.earthAltitude>firstAlt+1000,'rocket must make forward progress after transition');
 assert.ok(flight.moonAltitude>0);
});
