import test from 'node:test';
import assert from 'node:assert/strict';
import {ISLANDS,islandHeight} from '../src/core/archipelago.js';
import {terrainHeight,boatCanTravel} from '../src/core/world.js';

test('offshore terrain is solid, finite, and reachable from open water',()=>{
  for(const island of ISLANDS){
    assert.ok(terrainHeight(island.x,island.z)>3,island.name);
    assert.equal(boatCanTravel(island.x,island.z),false,island.name);
    assert.equal(boatCanTravel(island.x,island.z+island.radius*1.3),true,island.name);
    let land=false;
    // The south approach must cross shallow water before walkable land.
    for(let r=island.radius*1.3;r>=0;r-=.5){
      const h=terrainHeight(island.x,island.z+r);
      assert.ok(Number.isFinite(h));
      if(h>-.7){land=true;assert.ok(h<1,'No impassable shore step');break}
    }
    assert.ok(land);
  }
});

test('island height joins the ocean below the waterline',()=>{
  for(const island of ISLANDS)for(let a=0;a<Math.PI*2;a+=.1){
    assert.ok(islandHeight(island,island.x+Math.cos(a)*island.radius*1.16,island.z+Math.sin(a)*island.radius*1.16)<0);
  }
});

test('Tideglass inlet stays navigable from the open sea',()=>{
  const c=ISLANDS[0];
  for(let u=80;u<180;u+=2)assert.equal(boatCanTravel(c.x+u,c.z),true);
  assert.ok(terrainHeight(c.x,c.z)>3);
});

test('all islands leave long-distance sailing unbounded',()=>{
  for(let a=0;a<Math.PI*2;a+=.07)assert.equal(boatCanTravel(Math.cos(a)*3000,Math.sin(a)*3000),true);
});

test('Veilwater terrace has a real height drop beneath the waterfall',()=>{
  const i=ISLANDS[2];
  assert.ok(terrainHeight(i.x-15,i.z)-terrainHeight(i.x+5,i.z)>8);
});

test('sea arch allows the central passage but blocks its rock pillars',()=>{
  const i=ISLANDS[2],x=i.x-148,z=i.z+15;
  assert.equal(boatCanTravel(x,z),true);
  assert.equal(boatCanTravel(x,z-16),false);
  assert.equal(boatCanTravel(x,z+16),false);
});
