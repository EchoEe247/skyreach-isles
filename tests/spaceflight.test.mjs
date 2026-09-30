import test from 'node:test';
import assert from 'node:assert/strict';
import {EARTH_RADIUS_M,KARMAN_LINE_M,atmosphereDensity,gravityAtAltitude,renderAltitude,physicalAltitude,spaceBlend,gravityTurnPitch,stepRocket} from '../src/core/spaceflight.js';

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

test('throttle setting changes ascent rate deterministically',()=>{
  let full={altitude:0,verticalSpeed:0,horizontalSpeed:0,heading:0,pitch:0};
  let half={...full};
  for(let i=0;i<240;i++){
    full=stepRocket(full,{throttle:1,steerX:0,steerY:0,sas:true},1/60);
    half=stepRocket(half,{throttle:.5,steerX:0,steerY:0,sas:true},1/60);
  }
  assert.ok(full.altitude>half.altitude);
  assert.ok(full.verticalSpeed>half.verticalSpeed);
  assert.ok(half.altitude>0);
});

test('SAS returns toward assisted attitude while manual mode carries rotation',()=>{
  let sas={altitude:12000,verticalSpeed:180,horizontalSpeed:0,heading:0,pitch:0,pitchRate:0,yawRate:0};
  let manual={...sas};
  for(let i=0;i<90;i++){
    sas=stepRocket(sas,{throttle:.7,steerX:0,steerY:1,sas:true},1/60);
    manual=stepRocket(manual,{throttle:.7,steerX:0,steerY:1,sas:false},1/60);
  }
  for(let i=0;i<90;i++){
    sas=stepRocket(sas,{throttle:.7,steerX:0,steerY:0,sas:true},1/60);
    manual=stepRocket(manual,{throttle:.7,steerX:0,steerY:0,sas:false},1/60);
  }
  const assisted=gravityTurnPitch(sas.altitude);
  assert.ok(Math.abs(sas.pitch-assisted)<Math.abs(manual.pitch-assisted));
  assert.ok(Math.abs(manual.pitchRate)>Math.abs(sas.pitchRate));
});

test('horizontal velocity keeps its own heading in space',()=>{
  const s=stepRocket({altitude:150000,verticalSpeed:0,horizontalSpeed:500,heading:Math.PI/2,velocityHeading:0,pitch:0},{throttle:0,steerX:0,steerY:0,sas:true},1/30);
  assert.ok(Math.abs(s.velocityHeading)<1e-6);
  assert.ok(s.horizontalSpeed>499);
});
