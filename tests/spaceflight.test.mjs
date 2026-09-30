import test from 'node:test';
import assert from 'node:assert/strict';
import {EARTH_RADIUS_M,KARMAN_LINE_M,atmosphereDensity,gravityAtAltitude,renderAltitude,physicalAltitude,spaceBlend,stepRocket} from '../src/core/spaceflight.js';

test('atmosphere thins continuously with altitude',()=>{
  assert.equal(atmosphereDensity(0),1);
  assert.ok(atmosphereDensity(12000)<atmosphereDensity(1000));
  assert.ok(atmosphereDensity(KARMAN_LINE_M)<0.00001);
});

test('gravity falls with altitude but stays Earth-like near surface',()=>{
  assert.ok(Math.abs(gravityAtAltitude(0)-9.80665)<1e-6);
  assert.ok(gravityAtAltitude(400000)<gravityAtAltitude(0));
  assert.ok(EARTH_RADIUS_M>6_000_000);
});

test('render altitude mapping is continuous and invertible',()=>{
  for(const h of [0,1,100,1000,12000,100000,400000]){
    const r=renderAltitude(h);
    assert.ok(Number.isFinite(r)&&r>=0);
    assert.ok(Math.abs(physicalAltitude(r)-h)<Math.max(.001,h*1e-9));
  }
});

test('space blend reaches full space at Karman line',()=>{
  assert.equal(spaceBlend(0),0);
  assert.ok(spaceBlend(50000)>0&&spaceBlend(50000)<1);
  assert.equal(spaceBlend(KARMAN_LINE_M),1);
});

test('rocket launch is deterministic and climbs under full thrust',()=>{
  let a={altitude:0,verticalSpeed:0,horizontalSpeed:0,heading:0,pitch:0};
  let b={...a};
  for(let i=0;i<300;i++){
    a=stepRocket(a,{throttle:1,steerX:0,steerY:0},1/60);
    b=stepRocket(b,{throttle:1,steerX:0,steerY:0},1/60);
  }
  assert.deepEqual(a,b);
  assert.ok(a.altitude>1000);
  assert.ok(a.verticalSpeed>0);
});
