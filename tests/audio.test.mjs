import test from 'node:test';
import assert from 'node:assert/strict';
import {computeAudioMix} from '../src/systems/audio.js';

test('vehicle audio mixes are mode-specific',()=>{
  const car=computeAudioMix({mode:'car',speed:20});
  const boat=computeAudioMix({mode:'boat',speed:20,ocean:1});
  const plane=computeAudioMix({mode:'plane',speed:60,altitude:100});
  assert.ok(car.car>0&&car.boat===0&&car.plane===0);
  assert.ok(boat.boat>0&&boat.wake>0&&boat.car===0);
  assert.ok(plane.plane>0&&plane.jet>0&&plane.boat===0);
});

test('environment mix reacts to coast, ocean, town, and altitude',()=>{
  const coast=computeAudioMix({mode:'foot',coast:1,ocean:.6,town:0,daylight:1});
  const town=computeAudioMix({mode:'foot',coast:0,ocean:0,town:1,daylight:1});
  const high=computeAudioMix({mode:'plane',speed:80,altitude:500});
  assert.ok(coast.surf>.1&&coast.ocean>0);
  assert.ok(town.town>0&&town.land===0);
  assert.ok(high.wind>.1);
});

test('audio gains stay bounded under extreme speed and altitude',()=>{
  const mix=computeAudioMix({mode:'plane',speed:10000,altitude:100000,ocean:10,coast:10,town:10,daylight:-5});
  for(const [key,value] of Object.entries(mix)){
    assert.ok(Number.isFinite(value),key);
    assert.ok(value>=0&&value<=1,key);
  }
});
