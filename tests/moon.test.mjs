import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createMoonSurface,moonHeightAt,LUNAR_GRAVITY_MPS2} from '../src/systems/moon.js';

test('streamed lunar terrain recenters and stays deterministic',()=>{
  const scene=new T.Scene(),moon=createMoonSurface(scene),h=moonHeightAt(10000,-6500);
  moon.ensureCentered(10000,-6500,true);
  assert.deepEqual(moon.center(),{x:9900,z:-6600});
  assert.ok(moon.contains(10000,-6500,4));
  assert.equal(moon.heightAt(10000,-6500),h);
  moon.ensureCentered(12000,-6500);
  assert.ok(moon.contains(12000,-6500,4));
});
test('lunar foot gravity uses the physical Moon value',()=>assert.equal(LUNAR_GRAVITY_MPS2,1.62));
