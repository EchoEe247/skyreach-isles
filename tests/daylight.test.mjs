import test from 'node:test';
import assert from 'node:assert/strict';
import {DAY_SECONDS,NIGHT_SECONDS,advanceSunAngle,lightingAt} from '../src/core/daylight.js';

test('day lasts nine minutes and night three, with exact boundary crossings',()=>{
  assert.equal(DAY_SECONDS,540);assert.equal(NIGHT_SECONDS,180);
  assert.ok(Math.abs(advanceSunAngle(0,DAY_SECONDS)-Math.PI)<1e-10);
  assert.ok(Math.abs(advanceSunAngle(Math.PI,NIGHT_SECONDS))<1e-10);
  assert.ok(advanceSunAngle(Math.PI-.001,1)>Math.PI);
  assert.ok(advanceSunAngle(Math.PI*2-.001,1)<.1);
});

test('one cycle and frame subdivisions produce the same sun phase',()=>{
  const start=.35;
  assert.ok(Math.abs(advanceSunAngle(start,720)-start)<1e-10);
  let angle=start;
  for(let n=0;n<7200;n++)angle=advanceSunAngle(angle,.1);
  assert.ok(Math.abs(angle-start)<1e-8);
  assert.equal(advanceSunAngle(start,-2),advanceSunAngle(start,0));
});

test('midnight retains fill, hemisphere and above-horizon moonlight',()=>{
  const night=lightingAt(Math.PI*1.5),day=lightingAt(Math.PI*.5);
  assert.equal(night.daylight,0);assert.equal(night.sun,0);
  assert.ok(night.hemisphere>=.8&&night.ambient>=.2&&night.moon>=.45);
  assert.ok(night.waterLightness>=.25);
  assert.equal(day.moon,0);assert.ok(day.sun>night.sun);
});

test('lighting changes continuously through dawn and dusk',()=>{
  for(const edge of [0,Math.PI,Math.PI*2]){
    const a=lightingAt(edge-1e-5),b=lightingAt(edge+1e-5);
    for(const key of Object.keys(a))assert.ok(Math.abs(a[key]-b[key])<.001,key);
  }
});
