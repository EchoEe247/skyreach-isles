import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {updateVehicleKinematics,updatePlaneAttitude,dynamicCameraProfile,VEHICLE_TUNING} from '../src/core/vehicle-dynamics.js';
import {autoNavPermission,autoNavPhase,landedBaseService} from '../src/core/flight-guidance.js';
import {createFrameBudget} from '../src/core/frame-budget.js';
import {JOURNEY_STOPS,journeyProgress,advanceJourney} from '../src/core/journey.js';
import {causewayPostPositions,createCausewayDetail} from '../src/systems/causeway-detail.js';
import {SOUTH_PADRE,spiRouteHeight} from '../src/core/south-padre.js';

test('car acceleration, braking and reverse are stable and physically bounded',()=>{
 const c={sp:0,h:0};let previous=0;
 for(let i=0;i<160;i++){
  updateVehicleKinematics(c,{type:'car',dt:1/60,throttle:1,max:45});
  assert.ok(c.sp>=previous,'acceleration must be monotone before speed cap');previous=c.sp;
 }
 assert.ok(c.sp>25&&c.sp<=45);
 for(let i=0;i<160;i++)updateVehicleKinematics(c,{type:'car',dt:1/60,throttle:-1,max:45});
 assert.ok(c.sp<1,'brake must bring car to a stop');
 for(let i=0;i<120;i++)updateVehicleKinematics(c,{type:'car',dt:1/60,throttle:-1,max:45});
 assert.ok(c.sp<0&&c.sp>=-VEHICLE_TUNING.car.maxReverse);
});
test('boost and jet throttle increase propulsion without uncontrolled speed',()=>{
 const normal={sp:0,h:0},jet={sp:0,h:0};const profile={acceleration:180,maxSpeed:150,steerFactor:.55};
 for(let i=0;i<200;i++){
  updateVehicleKinematics(normal,{type:'car',dt:.016,throttle:1,max:45});
  updateVehicleKinematics(jet,{type:'car',dt:.016,throttle:1,jet:true,jetProfile:profile,max:45});
 }
 assert.ok(jet.sp>normal.sp*1.5);
 assert.ok(jet.sp<=profile.maxSpeed);
});
test('boat steering responds smoothly and retains heavier inertia than car',()=>{
 const car={sp:19,h:0},boat={sp:19,h:0};
 updateVehicleKinematics(car,{type:'car',dt:.016,throttle:0,steer:1,max:40});
 updateVehicleKinematics(boat,{type:'boat',dt:.016,throttle:0,steer:1,max:30});
 assert.ok(Math.abs(boat.steer)<Math.abs(car.steer));
 assert.ok(boat.sp>car.sp);
});
test('aircraft takes off with lift, flies and touches down on updated terrain',()=>{
 const p={sp:35,h:0,pt:0,rl:0,y:11.3};
 let flying=false;
 for(let i=0;i<120;i++){
  const out=updatePlaneAttitude(p,{dt:1/60,pitchInput:1,steer:0,airborne:p.y>13.5,groundY:10});
  flying||=out.airborne;
 }
 assert.ok(flying&&p.y>20);
 for(let i=0;i<230;i++)updatePlaneAttitude(p,{dt:1/60,pitchInput:-1,steer:0,airborne:p.y>13.5,groundY:10});
 assert.ok(p.y>=11.3);
 assert.ok(p.y<20,'aircraft must be able to descend');
});
test('vehicle cameras vary smoothly with speed and mode',()=>{
 const carSlow=dynamicCameraProfile({type:'car',speed:0,baseDistance:15}),fast=dynamicCameraProfile({type:'car',speed:90,baseDistance:15});
 assert.ok(fast.distance>carSlow.distance&&fast.lookAhead>carSlow.lookAhead&&fast.fov>carSlow.fov);
 const boat=dynamicCameraProfile({type:'boat',speed:30,baseDistance:15});
 const plane=dynamicCameraProfile({type:'plane',speed:30,baseDistance:15});
 assert.ok(plane.distance>boat.distance);
 assert.ok(boat.heightOffset>0);
});
test('autonav refuses fuel exhaustion, crashes and already reached targets',()=>{
 const craft={spacecraft:true,fuel:1,altitude:0};
 assert.equal(autoNavPermission(craft,'moon').ok,true);
 assert.equal(autoNavPermission(craft,'earth').ok,false);
 assert.equal(autoNavPermission({...craft,fuel:0},'moon').ok,false);
 assert.equal(autoNavPermission({...craft,crashedBody:'earth'},'moon').ok,false);
 assert.equal(autoNavPermission({...craft,celestial:{landedBody:'moon'}},'moon').ok,false);
 assert.equal(autoNavPermission({...craft,celestial:{landedBody:'moon'}},'earth').ok,true);
 assert.equal(autoNavPhase(craft,'moon'),'ASCENT');
 assert.equal(autoNavPhase({...craft,celestial:{moonAltitude:1500}},'moon'),'FINAL APPROACH');
 assert.equal(autoNavPhase({...craft,celestial:{moonAltitude:30000}},'moon'),'BRAKING');
});
test('five-stage optional journey advances only on relevant world events',()=>{
 assert.equal(JOURNEY_STOPS.length,5);
 const base={mode:'veh',position:{x:100,z:0,y:0},causeway:{x:100,z:0},airport:{x:0,z:0,y:10},nexus:{x:50,z:60}};
 assert.equal(advanceJourney(0,{...base,vehicle:'boat'}),0);
 assert.equal(advanceJourney(0,{...base,vehicle:'car'}),1);
 assert.equal(advanceJourney(1,{...base,vehicle:'plane',position:{x:0,y:80,z:0}}),2);
 assert.equal(advanceJourney(2,{...base,position:{x:51,y:4,z:60}}),3);
 assert.equal(advanceJourney(3,{...base,onMoon:true}),4);
 assert.equal(advanceJourney(4,{...base,onMoon:false,celestialLanded:'earth'}),5);
 assert.equal(journeyProgress(5).complete,true);
 assert.equal(advanceJourney(5,base),5);
});
test('auto frame budget downshifts under sustained slow frames and recovers only after cooldown',()=>{
 const budget=createFrameBudget({baseRatio:1.25,deviceRatio:2,windowSeconds:1});
 let decision=null;
 for(let i=0;i<22;i++)decision=budget.sample(.06,{auto:true})||decision;
 assert.equal(decision?.scale,.8);
 assert.ok(decision.pixelRatio<=1);
 for(let i=0;i<12*60+140;i++)budget.sample(.016,{auto:true});
 assert.equal(budget.state().scale,1);
 const manual=createFrameBudget({baseRatio:1.25,windowSeconds:1});
 for(let i=0;i<120;i++)assert.equal(manual.sample(.06,{auto:false}),null);
 assert.equal(manual.state().scale,1);
});
test('causeway reflectors follow actual elevated deck and reuse two instanced meshes',()=>{
 const points=causewayPostPositions();
 assert.ok(points.length>100&&points.length<1600,points.length);
 for(const p of points){
  assert.ok(Number.isFinite(p.y));
  assert.ok(Math.abs(p.y-spiRouteHeight(p.x,p.z))<1e-6);
 }
 const scene=new T.Scene(),detail=createCausewayDetail(scene);
 assert.equal(detail.root.children.length,2);
 assert.ok(detail.root.children.every(x=>x.isInstancedMesh));
 detail.update({x:0,z:0});assert.equal(detail.status().visible,false);
 detail.update(SOUTH_PADRE.carSpawn);assert.equal(detail.status().visible,true);
});

test('base refueling requires verified non-crashed touchdown',()=>{
 const c={spacecraft:true,fuel:.12,heat:.6,autoThrottle:.8,celestial:{landedBody:'moon'}};
 assert.equal(landedBaseService(c,'moon',null),true);
 assert.equal(c.fuel,1);
 assert.equal(c.heat,0);
 c.fuel=.2;assert.equal(landedBaseService(c,'moon','moon'),false);
 assert.equal(c.fuel,.2);
 c.celestial.crashedBody='moon';assert.equal(landedBaseService(c,'moon',null),false);
 assert.equal(c.fuel,.2);
});
