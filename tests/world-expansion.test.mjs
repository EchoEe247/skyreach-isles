import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {readFileSync} from 'node:fs';
import {wheelContact,tractionStep,aircraftForces,hullMotion,submarineAttitude,cameraClearance} from '../src/core/advanced-physics.js';
import {TRAFFIC_LOOP,routeStep,createTownTraffic} from '../src/systems/town-traffic.js';
import {groundedDetailPositions,createWorldPolish} from '../src/systems/world-polish.js';
import {LUNAR_SITES,createLunarActivities} from '../src/systems/lunar-activities.js';
import {moonHeightAt} from '../src/systems/moon.js';
import {MOON_RENDER_BASE_Y} from '../src/core/celestial.js';
import {computeAudioMix} from '../src/systems/audio.js';

test('four-wheel contact captures uphill pitch, cross-slope roll and grounded average',()=>{
 const c=wheelContact(0,0,0,(x,z)=>z*.13+x*.19,4,2);
 assert.equal(c.valid,true);
 assert.ok(Math.abs(c.pitch)>.1);
 assert.ok(Math.abs(c.roll)>.15);
 assert.ok(Math.abs(c.height)<1e-9);
 assert.ok(c.range>0);
 assert.equal(wheelContact(0,0,0,()=>NaN).valid,false);
});
test('wet roads reduce tire grip and drift response stays bounded',()=>{
 const wet={},dry={};
 let a,b;
 for(let i=0;i<120;i++){
  a=tractionStep(wet,{dt:1/60,steering:1,speed:19,wet:1,groundRange:2});
  b=tractionStep(dry,{dt:1/60,steering:1,speed:19,wet:0,groundRange:0});
 }
 assert.ok(a.grip<b.grip);
 assert.ok(Math.abs(a.slip)>Math.abs(b.slip));
 assert.ok(Math.abs(a.roll)<.2);
 assert.equal(a.drift,true);
});
test('high-altitude aircraft stalls below minimum speed and can recover',()=>{
 const stalled=aircraftForces({speed:8,pitch:.3,altitude:130,groundY:0,dt:.05});
 const cruising=aircraftForces({speed:58,pitch:.3,altitude:130,groundY:0,dt:.05});
 assert.equal(stalled.stall,true);
 assert.equal(cruising.stall,false);
 assert.ok(stalled.verticalSpeed<0&&cruising.verticalSpeed>0);
 assert.ok(stalled.altitude>=1.3);
});
test('ships respond to weather and submarines have bounded dive pitch',()=>{
 const calm=hullMotion({time:1,heading:.4,roughness:0,size:20});
 const rough=hullMotion({time:1,heading:.4,roughness:1,size:20});
 assert.ok(Math.abs(rough.heave)>Math.abs(calm.heave));
 let pitch=0;for(let i=0;i<100;i++)pitch=submarineAttitude({pitch,depthDelta:1,dt:.016});
 assert.ok(pitch<0&&pitch>=-.16);
});
test('camera ray stops before building and terrain intersections',()=>{
 const start={x:0,y:5,z:0},end={x:0,y:6,z:20};
 const clear=cameraClearance(start,end,{terrainAt:()=>0,colliders:[{x:0,z:12,r:2,height:16}]});
 assert.ok(clear.z<10&&clear.z>0);
 const ground=cameraClearance(start,{x:0,y:-4,z:12},{terrainAt:()=>0,colliders:[]});
 assert.ok(ground.y>=.55);
 const noObstruction=cameraClearance(start,{x:0,y:12,z:15},{terrainAt:()=>0});
 assert.equal(noObstruction.z,15);
});
test('traffic has continuous routes, stops before pedestrians and avoids blocked cells',()=>{
 assert.ok(TRAFFIC_LOOP.length>=12);
 const actor={x:0,z:0,next:1,speed:10,radius:1};
 let count=0;for(let i=0;i<60;i++){if(routeStep(actor,1/60,[{x:0,z:0},{x:14,z:0},{x:14,z:14},{x:0,z:14}],()=>true))count++}
 assert.ok(count>30&&actor.x>0);
 const blocked={...actor,next:2};
 const old={x:blocked.x,z:blocked.z};
 routeStep(blocked,.05,[{x:0,z:0},{x:14,z:0},{x:14,z:14}],(x,z)=>x<old.x+.01);
 assert.equal(blocked.stopped,true);
 const stopped={x:0,z:0,next:1,speed:15,radius:1};
 routeStep(stopped,.2,[{x:0,z:0},{x:20,z:0}],()=>true,{x:2,z:0});
 assert.equal(stopped.x,0);
});
test('traffic creates real low-poly cars and hides them when player is far away',()=>{
 const scene=new T.Scene(),traffic=createTownTraffic(scene,[],()=>6);
 assert.equal(traffic.vehicles.length,4);
 traffic.update({dt:1/60,position:{x:0,z:0},enabled:true});
 assert.ok(traffic.stats().visible>0);
 const first=traffic.vehicles[0].state.x;
 for(let i=0;i<100;i++)traffic.update({dt:1/60,position:{x:0,z:0},enabled:true});
 assert.ok(traffic.vehicles[0].state.x!==first||traffic.vehicles[0].state.z!==-55);
 traffic.update({dt:.05,position:{x:2000,z:2000},enabled:true});
 assert.equal(traffic.stats().visible,0);
});
test('environment props avoid buildings and conform to exact terrain',()=>{
 const colliders=[{x:0,z:0,r:20},{x:150,z:100,r:8}];
 const height=(x,z)=>7+Math.sin(x*.01);
 const points=groundedDetailPositions({heightAt:height,colliders,count:40});
 assert.ok(points.length>25);
 for(const p of points){assert.equal(p.y,height(p.x,p.z));for(const b of colliders)assert.ok(Math.hypot(p.x-b.x,p.z-b.z)>b.r+2.5)}
 const scene=new T.Scene(),detail=createWorldPolish(scene,colliders,{heightAt:height});
 assert.ok(detail.stats().grounded>50);
 detail.update({position:{x:0,y:5,z:0},daylight:0,rain:.8,time:2,active:true});
 assert.equal(detail.stats().visible,true);
 detail.update({position:{x:2000,y:0,z:2000},active:true});
 assert.equal(detail.stats().visible,false);
});
test('lunar outpost, rover and four discoverable sites are terrain grounded',()=>{
 let saved=[];const scene=new T.Scene();
 const activity=createLunarActivities(scene,{heightAt:moonHeightAt,load:()=>saved,save:x=>{saved=x}});
 assert.equal(LUNAR_SITES.length,4);
 const rover=activity.rover;
 assert.ok(Math.abs(rover.position.y-(MOON_RENDER_BASE_Y+moonHeightAt(rover.position.x,rover.position.z)))<1e-6);
 activity.update({visible:true,time:10});
 assert.equal(activity.group.visible,true);
 for(const site of LUNAR_SITES) {
  const r=activity.scan({x:site.x,y:MOON_RENDER_BASE_Y+moonHeightAt(site.x,site.z),z:site.z});
  assert.equal(r.id,site.id);
 }
 assert.equal(activity.stats().visited,4);assert.equal(activity.stats().wheels,6);assert.equal(saved.length,4);
 const again=createLunarActivities(new T.Scene(),{heightAt:moonHeightAt,load:()=>saved});
 assert.equal(again.stats().visited,4);
});
test('audio mix differentiates rain, tire slip, underwater isolation and lunar rover',()=>{
 const base={mode:'car',speed:36,rain:0,slip:0};
 const wet=computeAudioMix({...base,rain:1,slip:.5}),dry=computeAudioMix(base);
 assert.ok(wet.road>dry.road);
 const sub=computeAudioMix({mode:'submarine',speed:8,underwater:true,rain:1,ocean:1});
 assert.equal(sub.wind,0);assert.equal(sub.rain,0);assert.ok(sub.boat>0&&sub.cabin>0);
 const rover=computeAudioMix({mode:'rover',speed:9,vacuum:true});assert.ok(rover.car>0&&rover.cabin>0);
});
test('runtime integrates all five production systems',()=>{
 const src=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
 for(const fragment of ['createTownTraffic','createWorldPolish','createLunarActivities','lunarActivities.scan(P)','type===\'rover\'','wheelContact(','tractionStep(','aircraftForces(','hullMotion(','submarineAttitude(','cameraClearance(','worldPolish.update(','townTraffic.update('])assert.ok(src.includes(fragment),fragment);
});

test('Moon HUD and navigation override Earth waypoint guidance',()=>{
 const src=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/id=\"lunarMission\"/);
 assert.match(src,/lunarTarget=onMoon&&/);
 assert.match(src,/lunarTarget\?'LUNAR '/);
 assert.match(src,/Lunar research complete/);
 assert.match(src,/c\.type==='rover'/);
});
