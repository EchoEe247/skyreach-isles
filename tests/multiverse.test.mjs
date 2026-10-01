import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {ISLANDS} from '../src/core/archipelago.js';
import {terrainHeight} from '../src/core/world.js';
import {createMultiverseIsle,MULTIVERSE_REALMS} from '../src/systems/multiverse-isle.js';

function makeWorld(){
  const island=ISLANDS.find(i=>i.id==='multiverse-nexus');
  const scene=new T.Scene(),hero=new T.Group(),baseRig=new T.Group();hero.add(baseRig);hero.userData.modelState='fallback';
  const toasts=[],haptics=[],system=createMultiverseIsle(scene,[],{island,heightAt:terrainHeight,hero,baseRig,onToast:m=>toasts.push(m),onHaptic:p=>haptics.push(p)});
  return {island,scene,hero,baseRig,system,toasts,haptics};
}
const enter=(system,id)=>{
  const portal=system.portals.find(p=>p.id===id),p=new T.Vector3(portal.p.x,terrainHeight(portal.p.x,portal.p.z),portal.p.z);
  assert.equal(system.interact(p),true);return p;
};

test('Nexus Isle is a fourth navigable offshore island',()=>{
  const island=ISLANDS.find(i=>i.id==='multiverse-nexus');
  assert.ok(island);assert.equal(ISLANDS.length,4);assert.ok(terrainHeight(island.x,island.z)>8);assert.ok(terrainHeight(island.x+island.radius*1.7,island.z)<0);
});

test('three starter realms expose distinct portal characters and expanded game loops',()=>{
  assert.deepEqual(MULTIVERSE_REALMS.map(r=>r.id),['jump','velocity','breaker']);
  const {system}=makeWorld();
  assert.equal(system.portals.length,3);assert.equal(system.jumpTokens.length,6);assert.equal(system.jumpCheckpoints.length,3);assert.equal(system.jumpHazards.length,3);
  assert.equal(system.speedRings.length,14);assert.equal(system.speedCheckpoints.length,3);assert.equal(system.smashables.length,9);assert.equal(system.guards.length,4);
});

test('Jump Kingdom transforms the player and raised platforms only catch landings from above',()=>{
  const {system,baseRig}=makeWorld(),p=enter(system,'jump');
  assert.equal(system.activeRealm(),'jump');assert.equal(baseRig.visible,false);assert.equal(system.variants.jump.visible,true);
  const platform=system.platforms[3],base=terrainHeight(platform.x,platform.z);
  assert.equal(system.surfaceHeight(platform.x,platform.z,base,platform.top-2,-3),base,'player below platform must not snap upward');
  assert.equal(system.surfaceHeight(platform.x,platform.z,base,platform.top+.2,-3),platform.top,'descending player above top should land');
  assert.equal(system.surfaceHeight(platform.x,platform.z,base,platform.top+.2,6),base,'fast upward motion should pass through underside');
  assert.equal(system.jumpVelocity(9),10.8);
  const ret=system.returnPads.find(r=>r.id==='jump');p.set(ret.x,terrainHeight(ret.x,ret.z),ret.z);assert.equal(system.interact(p),true);assert.equal(system.activeRealm(),null);
});

test('Jump sweep hazard restores the latest checkpoint',()=>{
  const {system}=makeWorld(),p=enter(system,'jump'),cp=system.jumpCheckpoints[1];
  p.set(cp.x,cp.y,cp.z);system.update({time:0,dt:.016,position:p,moving:true});
  assert.equal(system.stats().jumpCheckpoint,1);
  system.update({time:1,dt:1.1,position:p});
  const h=system.jumpHazards[0],time=1.25,angle=time*h.speed+h.phase;
  p.set(h.x+Math.cos(angle)*h.r*.45,h.y,h.z-Math.sin(angle)*h.r*.45);
  const state=system.update({time,dt:.016,position:p,moving:true});
  assert.equal(state.resetVertical,true);assert.ok(Math.hypot(p.x-cp.x,p.z-cp.z)<.01);assert.equal(system.stats().hits.jump,1);
});

test('Velocity Circuit requires rings in order and activates a faster boost pad multiplier',()=>{
  const {system}=makeWorld(),p=enter(system,'velocity');
  const later=system.speedRings[2];p.set(later.x,terrainHeight(later.x,later.z),later.z);system.update({time:1,dt:.016,position:p,moving:true,boosting:false});
  assert.equal(later.on,false,'later rings cannot be collected out of order');
  const first=system.speedRings[0];p.set(first.x,terrainHeight(first.x,first.z),first.z);system.update({time:2,dt:.016,position:p,moving:true,boosting:false});
  assert.equal(first.on,true);assert.equal(system.speedMultiplier(),1.9);
  const pad=system.speedPads[0];p.set(pad.x,terrainHeight(pad.x,pad.z),pad.z);system.update({time:3,dt:.016,position:p,moving:true,boosting:true});assert.equal(system.speedMultiplier(),3);
});

test('Velocity checkpoints advance after ring milestones',()=>{
  const {system}=makeWorld(),p=enter(system,'velocity');
  for(let i=0;i<5;i++){const r=system.speedRings[i];p.set(r.x,terrainHeight(r.x,r.z),r.z);system.update({time:i+1,dt:.016,position:p,moving:true})}
  assert.equal(system.stats().speedCheckpoint,1);
  for(let i=5;i<10;i++){const r=system.speedRings[i];p.set(r.x,terrainHeight(r.x,r.z),r.z);system.update({time:i+1,dt:.016,position:p,moving:true})}
  assert.equal(system.stats().speedCheckpoint,2);
});

test('unsmashed Breaker cabinets and guards are solid until destroyed',()=>{
  const {system}=makeWorld(),p=enter(system,'breaker'),block=system.smashables[0];
  p.set(block.x,terrainHeight(block.x,block.z),block.z);assert.equal(system.resolveCollision(p,.5),true);assert.ok(Math.hypot(p.x-block.x,p.z-block.z)>=4.14);
  p.set(block.x+4.15,terrainHeight(block.x+4.15,block.z),block.z);assert.equal(system.interact(p),true);
  const before=p.clone();assert.equal(system.resolveCollision(p,.5),false);assert.deepEqual(p.toArray(),before.toArray());
  const guard=system.guards[0];p.set(guard.g.position.x,guard.g.position.y,guard.g.position.z);assert.equal(system.resolveCollision(p,.5),true);
});

test('Breaker Arcade requires every cabinet and guard and builds score',()=>{
  const {system}=makeWorld(),p=enter(system,'breaker');
  for(const block of system.smashables){p.set(block.g.position.x,block.g.position.y,block.g.position.z);assert.equal(system.actionLabel(p),'SMASH');assert.equal(system.interact(p),true)}
  assert.equal(system.completed().breaker,false,'guards remain after cabinets');
  for(const guard of system.guards){p.set(guard.g.position.x,guard.g.position.y,guard.g.position.z);assert.equal(system.actionLabel(p),'SMASH');assert.equal(system.interact(p),true)}
  assert.equal(system.completed().breaker,true);assert.ok(system.stats().score>=1300);assert.ok([...system.smashables,...system.guards].every(b=>b.on&&!b.g.visible));
});

test('portal proximity identifies the realm and completed Jump finish gate returns to Nexus',()=>{
  const {system}=makeWorld(),portal=system.portals.find(p=>p.id==='jump'),p=new T.Vector3(portal.p.x,terrainHeight(portal.p.x,portal.p.z),portal.p.z);
  const hub=system.update({time:0,dt:.016,position:p});assert.match(hub.status,/Jump Kingdom/);system.interact(p);
  for(const token of system.jumpTokens){p.set(token.x,token.y,token.z);system.update({time:1,dt:.016,position:p,moving:true})}
  assert.equal(system.completed().jump,true);p.copy(system.goalArch.position);assert.equal(system.actionLabel(p),'Return');assert.equal(system.interact(p),true);assert.equal(system.activeRealm(),null);
});

test('replay clears completed flags and resets collectibles and timer',()=>{
 const {system}=makeWorld(),p=enter(system,'velocity');
 for(const r of system.speedRings){p.set(r.x,r.y,r.z);system.update({time:1,dt:.1,position:p})}
 assert.equal(system.completed().velocity,true);const finished=system.stats().finishTime;
 system.update({time:3,dt:2,position:p});assert.equal(system.stats().elapsed,finished,'finish time must freeze');
 system.restart(p);assert.equal(system.completed().velocity,false);assert.equal(system.stats().finishTime,null);
 assert.ok(system.speedRings.every(r=>!r.on));assert.equal(system.stats().elapsed,0);
});
test('falling between platforms recovers at a checkpoint and grace prevents immediate repeat damage',()=>{
 const {system}=makeWorld(),p=enter(system,'jump');
 p.set(system.platforms[2].x,10,system.platforms[2].z);
 const state=system.update({time:2,dt:2,position:p,verticalSpeed:-10});
 assert.equal(state.resetVertical,true);assert.equal(system.stats().hits.jump,1);assert.ok(p.y>=system.platforms[0].top);
});
test('large descending physics steps land on the crossed surface',()=>{
 const {system}=makeWorld();enter(system,'jump');const p=system.platforms[4];
 assert.equal(system.surfaceHeight(p.x,p.z,10,p.top-.6,-18,p.top+.3),p.top);
});
test('stomps bounce, gold blocks award coins and springs launch the runner',()=>{
 const {system}=makeWorld(),p=enter(system,'jump'),e=system.enemies[0];
 const time=2;p.set(e.p.x+Math.sin(time*1.1+e.index)*2,e.p.top+1,e.p.z);
 const stomp=system.update({time,dt:.02,position:p,verticalSpeed:-4});
 assert.equal(e.on,true);assert.equal(stomp.bounceVelocity,9);assert.ok(system.stats().coinScore>=3);
 const b=system.questionBlocks[0];p.set(b.g.position.x,b.g.position.y-2,b.g.position.z);
 system.update({time:3,dt:.02,position:p,verticalSpeed:4});assert.equal(b.on,true);
 system.chooseRealm('velocity',p);const spring=system.springs[0];p.set(spring.x,terrainHeight(spring.x,spring.z),spring.z);
 assert.equal(system.update({time:4,dt:.02,position:p}).bounceVelocity,11);
});
test('all three playable characters return to the original hero and restart cleanly',()=>{
 const {system,baseRig}=makeWorld(),p=new T.Vector3();
 for(const id of ['jump','velocity','breaker']){system.chooseRealm(id,p);assert.equal(system.activeRealm(),id);assert.equal(system.variants[id].visible,true);system.travelToHub(p);assert.equal(system.activeRealm(),null);assert.equal(baseRig.visible,true);assert.ok(Object.values(system.variants).every(v=>!v.visible))}
});
test('platform edge gaps and ascents fit the jump and sprint envelope',()=>{
 const {system}=makeWorld(),v=10.8,gravity=25,speed=11;
 for(let i=1;i<system.platforms.length;i++){
  const a=system.platforms[i-1],b=system.platforms[i],dy=b.top-a.top;
  assert.ok(dy<v*v/(2*gravity),'next platform is below apex');
  const flight=(v+Math.sqrt(v*v-2*gravity*dy))/gravity;
  const gap=Math.hypot(Math.max(0,Math.abs(a.x-b.x)-(a.w+b.w)/2),Math.max(0,Math.abs(a.z-b.z)-(a.d+b.d)/2));
  assert.ok(gap+1.2<speed*flight,'edge-to-edge jump has a landing margin');
 }
});
