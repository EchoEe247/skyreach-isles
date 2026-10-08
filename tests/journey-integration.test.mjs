import test from 'node:test';
import assert from 'node:assert/strict';
import {SOUTH_PADRE} from '../src/core/south-padre.js';
import {terrainHeight,boatCanTravel,submarineCanTravel} from '../src/core/world.js';
import {moveDiscSwept} from '../src/core/collision.js';
import {boatHullCanTravel} from '../src/core/vehicle-safety.js';
import {updateVehicleKinematics} from '../src/core/vehicle-dynamics.js';
import {initCelestialFromRocket,stepCelestial,projectMoonLocal,LANDING_MAX_SPEED_MPS} from '../src/core/celestial.js';

test('full Port Isabel-to-Padre Boulevard causeway follows drivable deck without tunneling',()=>{
 const points=SOUTH_PADRE.route,p={x:points[0].x,z:points[0].z};let total=0,maxElevation=-Infinity;
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),steps=Math.ceil(len/3);
  for(let k=1;k<=steps;k++){
   const goal={x:a.x+dx*k/steps,z:a.z+dz*k/steps};
   const rx=goal.x-p.x,rz=goal.z-p.z,dist=Math.hypot(rx,rz);
   const result=moveDiscSwept(p,rx,rz,{radius:2.3,maxStep:.75,canOccupy:(x,z)=>terrainHeight(x,z)>-.4});
   assert.equal(result.blocked,false,'blocked along '+a.name+' to '+b.name+' at '+k+'/'+steps);
   assert.ok(Math.hypot(p.x-goal.x,p.z-goal.z)<1e-6);
   assert.ok(Number.isFinite(terrainHeight(p.x,p.z)));
   maxElevation=Math.max(maxElevation,terrainHeight(p.x,p.z));
   total+=dist;
  }
 }
 assert.ok(total>6500,total);
 assert.ok(maxElevation>32,'road must actually climb onto causeway');
 assert.ok(Math.hypot(p.x-points.at(-1).x,p.z-points.at(-1).z)<.01);
});
test('open sea vehicles remain in navigable water, and submarines cannot clip seabed',()=>{
 const boat={x:3800,z:1500},boatHeading=.3,water=(x,z)=>boatCanTravel(x,z);
 assert.ok(boatHullCanTravel(boat.x,boat.z,boatHeading,30,water));
 for(let i=0;i<100;i++){
  const res=moveDiscSwept(boat,Math.sin(boatHeading)*3,Math.cos(boatHeading)*3,{canOccupy:(x,z)=>boatHullCanTravel(x,z,boatHeading,30,water),maxStep:.9});
  assert.equal(res.blocked,false);
  assert.ok(submarineCanTravel(boat.x,boat.z,.45,.55));
 }
});
test('Moon-to-Earth and Earth-to-Moon AUTO NAV complete one continuous round trip',()=>{
 let state=initCelestialFromRocket({altitude:100000,verticalSpeed:1600,horizontalSpeed:700,heading:Math.PI,velocityHeading:Math.PI,pitch:.35,worldX:-65,worldZ:-40});
 let moonSteps=0;
 for(;moonSteps<12000&&state.landedBody!=='moon'&&!state.crashedBody;moonSteps++)
  state=stepCelestial(state,{cruise:true,target:'moon',warp:400,sas:true,engineAvailable:true},1/60,{acceleration:40,turnRate:.48,cruiseSpeed:18500});
 assert.equal(state.landedBody,'moon','first leg must land at Moon');
 assert.equal(state.crashedBody??null,null);
 assert.ok(Math.hypot(projectMoonLocal(state.position).x,projectMoonLocal(state.position).z)<2);
 assert.ok(state.impactSpeed<LANDING_MAX_SPEED_MPS);
 let earthSteps=0;
 for(;earthSteps<28000&&state.landedBody!=='earth'&&!state.crashedBody;earthSteps++)
  state=stepCelestial(state,{cruise:true,target:'earth',warp:400,sas:true,engineAvailable:true},1/60,{acceleration:40,turnRate:.48,cruiseSpeed:18500});
 assert.equal(state.landedBody,'earth','second leg must reach Earth');
 assert.equal(state.crashedBody??null,null);
 assert.ok(Math.hypot(state.position[0]+65,state.position[2]+40)<2);
 assert.ok(state.impactSpeed<LANDING_MAX_SPEED_MPS);
});
