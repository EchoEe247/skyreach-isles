import test from 'node:test';
import assert from 'node:assert/strict';
import {nearestPending,relativeBearing,distance2D} from '../src/systems/exploration.js';

test('nearestPending skips completed targets and picks the nearest remaining one',()=>{
  const p={x:0,z:0};
  const items=[{x:2,z:0,on:true},{x:7,z:0,on:false},{x:3,z:4,on:false}];
  const result=nearestPending(items,p);
  assert.equal(result.item,items[2]);
  assert.equal(result.distance,5);
});

test('relativeBearing is relative to the current heading',()=>{
  const from={x:0,z:0};
  const east={x:1,z:0};
  assert.ok(Math.abs(relativeBearing(from,east,0)-Math.PI/2)<1e-9);
  assert.ok(Math.abs(relativeBearing(from,east,Math.PI/2))<1e-9);
});

test('distance2D ignores altitude',()=>{
  assert.equal(distance2D({x:0,y:100,z:0},{x:3,y:-50,z:4}),5);
});
