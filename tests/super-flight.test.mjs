import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SUPER_FLIGHT,superFlightEligible,superFlightVelocity,clampSuperFlightY} from '../src/core/super-flight.js';

test('super flight is limited to the normal Earth on-foot character',()=>{
  assert.equal(superFlightEligible({mode:'foot'}),true);
  assert.equal(superFlightEligible({mode:'veh'}),false);
  assert.equal(superFlightEligible({mode:'foot',onMoon:true}),false);
  assert.equal(superFlightEligible({mode:'foot',transformed:true}),false);
  assert.equal(superFlightEligible({mode:'foot',swimming:true}),false);
  assert.equal(superFlightEligible({mode:'foot',swimming:true,active:true}),true,'active flight may continue over water so the player can still toggle it off');
});

test('flight command provides Superman-style cruise, super speed, climb and dive',()=>{
  const cruise=superFlightVelocity({stickY:1,yaw:0});
  assert.equal(cruise.horizontalSpeed,SUPER_FLIGHT.cruiseSpeed);
  assert.equal(cruise.z,SUPER_FLIGHT.cruiseSpeed);
  const fast=superFlightVelocity({stickY:1,yaw:Math.PI/2,boost:true,climb:true});
  assert.equal(fast.horizontalSpeed,SUPER_FLIGHT.boostSpeed);
  assert.equal(fast.y,SUPER_FLIGHT.boostVerticalSpeed);
  assert.ok(fast.x>SUPER_FLIGHT.cruiseSpeed);
  const dive=superFlightVelocity({dive:true});
  assert.equal(dive.y,-SUPER_FLIGHT.verticalSpeed);
});

test('flight altitude cannot sink through terrain or climb into the spaceflight layer',()=>{
  assert.equal(clampSuperFlightY(-50,12),12+SUPER_FLIGHT.groundClearance);
  assert.equal(clampSuperFlightY(999,12),SUPER_FLIGHT.maxAltitude);
});

test('game wiring exposes a separate toggle and restores normal movement when off',async()=>{
  const [html,css,game]=await Promise.all([
    readFile(new URL('../index.html',import.meta.url),'utf8'),
    readFile(new URL('../src/style.css',import.meta.url),'utf8'),
    readFile(new URL('../src/game.js',import.meta.url),'utf8')
  ]);
  assert.match(html,/id="fly"/);
  assert.match(css,/#fly\{/);
  assert.match(game,/toggleSuperFlight\(\)/);
  assert.match(game,/KeyF/);
  assert.match(game,/Jump climbs · Dive descends/);
  assert.match(game,/superFlightVelocity\(/);
  assert.match(game,/setSuperFlight\(false,true\)/);
  assert.match(game,/Turn FLY off before interacting or boarding/);
  assert.match(game,/walking:mode=='foot'&&!superFlight/);
});
