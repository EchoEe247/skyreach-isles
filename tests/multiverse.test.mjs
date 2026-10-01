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

test('Nexus Isle is a fourth navigable offshore island',()=>{
  const island=ISLANDS.find(i=>i.id==='multiverse-nexus');
  assert.ok(island);
  assert.equal(ISLANDS.length,4);
  assert.ok(terrainHeight(island.x,island.z)>8);
  assert.ok(terrainHeight(island.x+island.radius*1.7,island.z)<0);
});

test('three starter realms expose distinct portal characters and game loops',()=>{
  assert.deepEqual(MULTIVERSE_REALMS.map(r=>r.id),['jump','velocity','breaker']);
  const {system}=makeWorld();
  assert.equal(system.portals.length,3);
  assert.equal(system.jumpTokens.length,6);
  assert.equal(system.speedRings.length,14);
  assert.equal(system.smashables.length,9);
});

test('Jump Kingdom portal transforms the player and provides raised platform grounding',()=>{
  const {system,hero,baseRig}=makeWorld(),portal=system.portals.find(p=>p.id==='jump');
  const p=new T.Vector3(portal.p.x,terrainHeight(portal.p.x,portal.p.z),portal.p.z);
  assert.equal(system.interact(p),true);
  assert.equal(system.activeRealm(),'jump');
  assert.equal(baseRig.visible,false);
  assert.equal(system.variants.jump.visible,true);
  const platform=system.platforms[3],base=terrainHeight(platform.x,platform.z);
  assert.ok(system.surfaceHeight(platform.x,platform.z,base)>base);
  assert.equal(system.jumpVelocity(9),10.8);
  const ret=system.returnPads.find(r=>r.id==='jump');p.set(ret.x,terrainHeight(ret.x,ret.z),ret.z);
  assert.equal(system.interact(p),true);
  assert.equal(system.activeRealm(),null);
});

test('Velocity Circuit collects rings and activates a faster boost pad multiplier',()=>{
  const {system}=makeWorld(),portal=system.portals.find(p=>p.id==='velocity');
  const p=new T.Vector3(portal.p.x,terrainHeight(portal.p.x,portal.p.z),portal.p.z);system.interact(p);
  const ring=system.speedRings[0];p.set(ring.x,terrainHeight(ring.x,ring.z),ring.z);system.update({time:1,dt:.016,position:p,moving:true,boosting:false});
  assert.equal(ring.on,true);
  assert.equal(system.speedMultiplier(),1.9);
  const pad=system.speedPads[0];p.set(pad.x,terrainHeight(pad.x,pad.z),pad.z);system.update({time:2,dt:.016,position:p,moving:true,boosting:true});
  assert.equal(system.speedMultiplier(),3);
});

test('unsmashed Breaker cabinets are solid until destroyed',()=>{
  const {system}=makeWorld(),portal=system.portals.find(p=>p.id==='breaker');
  const p=new T.Vector3(portal.p.x,terrainHeight(portal.p.x,portal.p.z),portal.p.z);system.interact(p);
  const block=system.smashables[0];p.set(block.x,terrainHeight(block.x,block.z),block.z);
  assert.equal(system.resolveCollision(p,.5),true);
  assert.ok(Math.hypot(p.x-block.x,p.z-block.z)>=4.14);
  p.set(block.x+4.15,terrainHeight(block.x+4.15,block.z),block.z);assert.equal(system.interact(p),true);
  const before=p.clone();assert.equal(system.resolveCollision(p,.5),false);assert.deepEqual(p.toArray(),before.toArray());
});

test('Breaker Arcade uses the action interaction to destroy every cabinet',()=>{
  const {system}=makeWorld(),portal=system.portals.find(p=>p.id==='breaker');
  const p=new T.Vector3(portal.p.x,terrainHeight(portal.p.x,portal.p.z),portal.p.z);system.interact(p);
  for(const block of system.smashables){p.set(block.x,terrainHeight(block.x,block.z),block.z);assert.equal(system.actionLabel(p),'SMASH');assert.equal(system.interact(p),true)}
  assert.equal(system.completed().breaker,true);
  assert.ok(system.smashables.every(b=>b.on&&!b.g.visible));
});


test('portal proximity identifies the realm and completed Jump finish gate returns to Nexus',()=>{
  const {system}=makeWorld(),portal=system.portals.find(p=>p.id==='jump');
  const p=new T.Vector3(portal.p.x,terrainHeight(portal.p.x,portal.p.z),portal.p.z);
  const hub=system.update({time:0,dt:.016,position:p});
  assert.match(hub.status,/Jump Kingdom/);
  system.interact(p);
  for(const token of system.jumpTokens){
    p.set(token.x,token.y,token.z);
    system.update({time:1,dt:.016,position:p,moving:true});
  }
  assert.equal(system.completed().jump,true);
  p.copy(system.goalArch.position);
  assert.equal(system.actionLabel(p),'Return');
  assert.equal(system.interact(p),true);
  assert.equal(system.activeRealm(),null);
});
