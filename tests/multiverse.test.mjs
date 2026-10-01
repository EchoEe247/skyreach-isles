import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {ISLANDS} from '../src/core/archipelago.js';
import {terrainHeight} from '../src/core/world.js';
import {createMultiverseIsle,MULTIVERSE_REALMS} from '../src/systems/multiverse-isle.js';

function makeWorld(){
 const island=ISLANDS.find(i=>i.id==='multiverse-nexus'),scene=new T.Scene(),hero=new T.Group(),baseRig=new T.Group();hero.add(baseRig);hero.userData.modelState='fallback';
 const system=createMultiverseIsle(scene,[],{island,heightAt:terrainHeight,hero,baseRig});
 return {island,scene,hero,baseRig,system};
}
function enter(system,id){const ptl=system.portals.find(p=>p.id===id),p=new T.Vector3(ptl.p.x,terrainHeight(ptl.p.x,ptl.p.z),ptl.p.z);assert.equal(system.interact(p),true);return p}

test('Nexus Isle contains exactly the two retained playable districts',()=>{
 assert.deepEqual(MULTIVERSE_REALMS.map(r=>r.id),['velocity','breaker']);
 assert.equal(MULTIVERSE_REALMS.some(r=>/jump|redcap/i.test(r.id+r.name+r.character)),false);
 const {system}=makeWorld();assert.equal(system.portals.length,2);assert.equal(system.variants.jump,undefined);
});

test('Velocity and Breaker entrances are physically separated across Nexus Isle',()=>{
 const {system}=makeWorld(),[v,b]=system.portals;
 assert.ok(Math.hypot(v.p.x-b.p.x,v.p.z-b.p.z)>120);
});

test('Velocity District is a long ordered 24-gate course with four checkpoints',()=>{
 const {system}=makeWorld(),p=enter(system,'velocity');
 assert.equal(system.speedRings.length,24);assert.equal(system.speedCheckpoints.length,4);assert.ok(system.speedPads.length>=5);assert.equal(system.springs.length,3);assert.equal(system.spikes.length,3);assert.ok(system.speedLoop.radius>=6);
 const later=system.speedRings[4];p.set(later.x,terrainHeight(later.x,later.z),later.z);system.update({time:1,dt:.016,position:p,moving:true});assert.equal(later.on,false);
 const first=system.speedRings[0];p.set(first.x,terrainHeight(first.x,first.z),first.z);system.update({time:2,dt:.016,position:p,moving:true});assert.equal(first.on,true);
});

test('Velocity boost pads and Spin Dash materially increase speed',()=>{
 const {system}=makeWorld(),p=enter(system,'velocity');assert.equal(system.speedMultiplier(),2.15);
 const pad=system.speedPads[0];p.set(pad.x,terrainHeight(pad.x,pad.z),pad.z);system.update({time:1,dt:.016,position:p,moving:true});assert.equal(system.speedMultiplier(),3.4);
 assert.equal(system.interact(p),true);assert.equal(system.speedMultiplier(),3.4);
});

test('Spin Dash pivots around the body center and returns exactly neutral',()=>{
 const {system}=makeWorld(),p=enter(system,'velocity'),v=system.variants.velocity;system.interact(p);system.update({time:1,dt:.15,position:p,moving:true});
 assert.ok(Math.abs(v.rotation.x)>1);assert.ok(v.position.y>1);
 system.update({time:2,dt:2,position:p,moving:false});assert.equal(v.rotation.x,0);assert.equal(v.position.y,0);assert.equal(v.position.z,0);
});

test('Velocity ring milestones advance checkpoint recovery',()=>{
 const {system}=makeWorld(),p=enter(system,'velocity');
 for(let i=0;i<=10;i++){const r=system.speedRings[i];p.set(r.x,terrainHeight(r.x,r.z),r.z);system.update({time:i+1,dt:.016,position:p,moving:true})}
 assert.equal(system.stats().loopActive,true);
 for(let i=0;i<100&&system.stats().loopActive;i++)system.update({time:12+i*.02,dt:.02,position:p,moving:true});
 assert.equal(system.stats().loopDone,true);
 for(let i=11;i<19;i++){const r=system.speedRings[i];p.set(r.x,terrainHeight(r.x,r.z),r.z);system.update({time:15+i,dt:.016,position:p,moving:true})}
 assert.equal(system.stats().speedCheckpoint,3);
});

test('Breaker City expands to 12 multi-hit towers and 6 guards',()=>{
 const {system}=makeWorld();enter(system,'breaker');assert.equal(system.smashables.length,12);assert.equal(system.guards.length,6);assert.ok(system.smashables.some(t=>t.maxHp===3));
});

test('Breaker towers require repeated punches before collision disappears',()=>{
 const {system}=makeWorld(),p=enter(system,'breaker'),t=system.smashables.find(x=>x.maxHp===3);
 p.set(t.g.position.x,t.g.position.y,t.g.position.z);assert.equal(system.actionLabel(p),'SMASH');system.interact(p);assert.equal(t.on,false);assert.equal(t.hp,2);
 system.interact(p);assert.equal(t.on,false);assert.equal(t.hp,1);system.interact(p);assert.equal(t.on,true);
 const before=p.clone();assert.equal(system.resolveCollision(p,.5),false);assert.deepEqual(p.toArray(),before.toArray());
});

test('Breaker completion requires all towers and guards and produces score',()=>{
 const {system}=makeWorld(),p=enter(system,'breaker');
 for(const t of [...system.smashables,...system.guards]){while(!t.on){p.set(t.g.position.x,t.g.position.y,t.g.position.z);system.interact(p)}}
 assert.equal(system.completed().breaker,true);assert.ok(system.stats().score>2000);
});

test('travelToHub and return pads restore Nightweaver',()=>{
 const {system,baseRig}=makeWorld(),p=enter(system,'velocity');assert.equal(baseRig.visible,false);system.travelToHub(p);assert.equal(system.activeRealm(),null);assert.equal(baseRig.visible,true);
 enter(system,'breaker');const ret=system.returnPads.find(r=>r.id==='breaker');p.set(ret.x,terrainHeight(ret.x,ret.z),ret.z);assert.equal(system.interact(p),true);assert.equal(system.activeRealm(),null);
});

test('guidance always names the next course gate instead of exposing undefined',()=>{
 const {system}=makeWorld(),p=enter(system,'velocity'),g=system.guidance();assert.equal(g.x,system.speedRings[0].x);assert.equal(g.name,'Gate 1/24');assert.equal(g.name.includes('undefined'),false);
 system.travelToHub(p);enter(system,'breaker');assert.ok(/Target|Guard/.test(system.guidance().name));
});

test('Velocity checkpoint posts are offset from the running line',()=>{
 const {system}=makeWorld();
 for(const cp of system.speedCheckpoints)assert.ok(Math.hypot(cp.markerX-cp.x,cp.markerZ-cp.z)>5);
});

test('Velocity full loop carries the runner vertically and exits back onto the course',()=>{
 const {system}=makeWorld(),p=enter(system,'velocity');
 for(let i=0;i<=10;i++){const r=system.speedRings[i];p.set(r.x,terrainHeight(r.x,r.z),r.z);system.update({time:i+1,dt:.016,position:p,moving:true})}
 assert.equal(system.stats().loopActive,true);const startY=p.y,max=[];
 for(let i=0;i<100&&system.stats().loopActive;i++){system.update({time:20+i*.02,dt:.02,position:p,moving:true});max.push(p.y)}
 assert.equal(system.stats().loopDone,true);assert.ok(Math.max(...max)>startY+system.speedLoop.radius*1.5);assert.ok(Math.abs(p.y-system.speedLoop.y)<1);
});
