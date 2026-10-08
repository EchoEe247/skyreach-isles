import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {planTrafficLeg,buildTrafficLoop,segmentPassable} from '../src/core/traffic-navigation.js';
import {createTownTraffic,routeStep} from '../src/systems/town-traffic.js';
import {cameraClearance} from '../src/core/advanced-physics.js';
import {createLunarActivities} from '../src/systems/lunar-activities.js';
import {moonHeightAt} from '../src/systems/moon.js';

test('town traffic planner detours around solid buildings without clipping',()=>{
 const obstacles=[{x:0,z:-17,r:7},{x:0,z:0,r:5},{x:12,z:0,r:6}],
  free=(x,z)=>obstacles.every(b=>Math.hypot(x-b.x,z-b.z)>b.r+2);
 const leg=planTrafficLeg({x:-12,z:-25},{x:15,z:20},free,{extent:45,step:2.5});
 assert.ok(leg?.length>=2,'planner must find obstacle-clearing route');
 for(let i=0;i<leg.length-1;i++)assert.ok(segmentPassable(leg[i],leg[i+1],free,.55),'segment '+i+' clips wall');
 const guides=[{x:-35,z:-35},{x:35,z:-35},{x:35,z:35},{x:-35,z:35}];
 const route=buildTrafficLoop(guides,free,{extent:50,step:2.5});
 assert.equal(route.valid,true);
 assert.ok(route.points.length>3);
 for(let i=0;i<route.points.length;i++)assert.ok(segmentPassable(route.points[i],route.points[(i+1)%route.points.length],free,.65),'closed route discontinuity at '+i);
});
test('route planner stays bounded when target is completely unreachable',()=>{
 const free=(x,z)=>Math.abs(x)<18&&Math.abs(z)<18;
 const impossible=planTrafficLeg({x:0,z:0},{x:110,z:110},free,{extent:110,step:4,maxExplored:4000});
 assert.ok(!impossible||impossible.every(p=>Math.abs(p.x)<18&&Math.abs(p.z)<18));
});
test('traffic blocked by static obstacle never skips through wall after waiting',()=>{
 const actor={x:0,z:0,next:1,speed:10,radius:1.2},route=[{x:0,z:0},{x:16,z:0},{x:16,z:16},{x:0,z:16}];
 for(let i=0;i<550;i++)routeStep(actor,.05,route,(x,z)=>x<3);
 assert.equal(actor.next,1);
 assert.ok(actor.x<3);
 assert.equal(actor.stopped,true);
});
test('actual town routing validates full path and every actor makes progress',()=>{
 const scene=new T.Scene(),obstacles=[{x:-10,z:-32,r:4},{x:12,z:20,r:7},{x:36,z:-10,r:4},{x:0,z:0,r:6}],
 traffic=createTownTraffic(scene,obstacles,()=>6),start=traffic.vehicles.map(v=>({x:v.state.x,z:v.state.z}));
 assert.equal(traffic.stats().routeValid,true);
 for(let i=0;i<400;i++)traffic.update({dt:.05,position:{x:0,z:0},enabled:true});
 const stats=traffic.stats();assert.equal(stats.cars,4);
 assert.ok(stats.totalDistance>60,stats.totalDistance);
 for(const actor of stats.actors)assert.ok(actor.distance>6,JSON.stringify(actor));
});
test('camera collision uses individual building heights without clipping high roofs',()=>{
 const target={x:0,y:30,z:0},end={x:0,y:30,z:20};
 const high=cameraClearance(target,end,{terrainAt:()=>0,colliders:[{x:0,z:10,r:2,height:35}]});
 const low=cameraClearance(target,end,{terrainAt:()=>0,colliders:[{x:0,z:10,r:2,height:20}]});
 assert.ok(high.z<10);
 assert.equal(low.z,20);
});
test('lunar wheel pivots rotate around the axle while keeping tire orientation',()=>{
 const lunar=createLunarActivities(new T.Scene(),{heightAt:moonHeightAt});
 const rover=lunar.rover;
 const axles=rover.children.filter(x=>x.type==='Group'&&x.children.some(c=>c.geometry?.type==='CylinderGeometry'));
 assert.equal(axles.length,6);
 lunar.update({visible:true,onRover:true,speed:5});
 assert.ok(axles.every(x=>x.rotation.x<0));
 assert.ok(axles.every(x=>x.children.some(c=>Math.abs(c.rotation.z-Math.PI/2)<.001)));
});
