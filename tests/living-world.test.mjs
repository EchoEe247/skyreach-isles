import test from 'node:test';
import assert from 'node:assert/strict';
import {WEATHER_CYCLE_SECONDS,weatherAt,lightningAt,npcPeriod,npcScheduleTarget,worldEventAt} from '../src/core/living-world.js';

test('weather cycle stays bounded and includes clear, rain, storm and fog',()=>{
  const kinds=new Set();
  for(let t=0;t<WEATHER_CYCLE_SECONDS;t+=3){
    const w=weatherAt(t);kinds.add(w.kind);
    for(const k of ['cloud','rain','fog','wind','darkness','roughness'])assert.ok(w[k]>=0&&w[k]<=1,k);
  }
  for(const k of ['clear','rain','storm','fog'])assert.ok(kinds.has(k),k);
  assert.deepEqual(weatherAt(0),weatherAt(WEATHER_CYCLE_SECONDS));
});

test('weather transitions remain continuous at segment boundaries',()=>{
  for(let t=1;t<WEATHER_CYCLE_SECONDS;t++){
    const a=weatherAt(t-.001),b=weatherAt(t+.001);
    for(const k of ['cloud','rain','fog','wind','darkness','roughness'])assert.ok(Math.abs(a[k]-b[k])<.01,k+' @ '+t);
  }
});

test('lightning only occurs in storm transition windows and remains bounded',()=>{
  for(let t=0;t<WEATHER_CYCLE_SECONDS;t+=.2){
    const w=weatherAt(t),v=lightningAt(t,w);
    assert.ok(v>=0&&v<=1);
    if(w.kind!=='storm'&&w.next!=='storm')assert.equal(v,0);
  }
});

test('NPC schedule has four periods and keeps targets inside the assigned community',()=>{
  assert.equal(npcPeriod(.1),'morning');
  assert.equal(npcPeriod(Math.PI*.5),'day');
  assert.equal(npcPeriod(Math.PI*.9),'evening');
  assert.equal(npcPeriod(Math.PI*1.5),'night');
  const home={x:720,z:350,radius:70};
  for(let i=0;i<24;i++)for(const a of [.1,Math.PI*.5,Math.PI*.9,Math.PI*1.5]){
    const p=npcScheduleTarget(i,a,home);
    assert.ok(Math.hypot(p.x-home.x,p.z-home.z)<home.radius*.7);
  }
});

test('world events are intermittent rather than a permanent objective list',()=>{
  assert.equal(worldEventAt(0),null);
  assert.equal(worldEventAt(50)?.id,'drifting-cargo');
  assert.equal(worldEventAt(180)?.id,'lighthouse-outage');
  assert.equal(worldEventAt(320)?.id,'stranded-boat');
  assert.equal(worldEventAt(430),null);
  assert.deepEqual(worldEventAt(50),worldEventAt(530));
});
