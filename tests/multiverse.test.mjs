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
  const h=system.jumpHazards[0],time=1.25,angle=time*h.speed+h.phase;
  p.set(h.x+Math.cos(angle)*h.r*.45,h.y,h.z-Math.sin(angle)*h.r*.45);
  const state=system.update({time,dt:.016,position:p,moving:true});
  assert.equal(state.resetVertical,true);assert.ok(Math.hypot(p.x-cp.x,p.z-cp.z)<.01);assert.equal(system.stats().hits.jump,1);
});

test('Velocity Circuit requires rings in order and activates a faster boost pad multiplier',()=>{
  const {system}=makeWorld(),p=enter(system,'velocity');
  const later=system.speedRings[3];p.set(later.x,terrainHeight(later.x,later.z),later.z);system.update({time:1,dt:.016,position:p,moving:true,boosting:false});
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
