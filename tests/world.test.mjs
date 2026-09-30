import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainHeight,boatCanTravel} from '../src/core/world.js';

test('open ocean has no artificial boat boundary',()=>{
  for(const [x,z] of [[360,0],[500,500],[1500,-800],[10000,10000],[-25000,3000]]){
    assert.equal(boatCanTravel(x,z),true,String(x)+','+String(z)+' should be open ocean');
  }
});

test('shoreline collision still blocks the boat on island land',()=>{
  assert.equal(boatCanTravel(0,0),false);
  assert.ok(terrainHeight(0,0)>-.7);
});

test('far-ocean seafloor is capped for stable long-distance travel',()=>{
  assert.equal(terrainHeight(100000,0),-80);
  assert.equal(terrainHeight(-100000,-100000),-80);
});
