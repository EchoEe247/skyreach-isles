import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {SWIM_SURFACE_Y,isSwimmingSurface,swimSpeed,boatExitRadius,vehicleBoardDistance} from '../src/core/swimming.js';

test('surface swimming is Earth-water only and stays near the waterline',()=>{
  assert.equal(isSwimmingSurface('water',false),true);
  assert.equal(isSwimmingSurface('sand',false),false);
  assert.equal(isSwimmingSurface('water',true),false);
  assert.ok(SWIM_SURFACE_Y<-.7&&SWIM_SURFACE_Y>-1.4);
  assert.ok(swimSpeed(false,false)>0);
  assert.ok(swimSpeed(true,false)>swimSpeed(false,false));
  assert.ok(swimSpeed(false,true)>swimSpeed(true,false));
});

test('large DAY FORGE boats exit outside their hull while the small boat keeps its old exit radius',()=>{
  assert.equal(boatExitRadius({type:'boat',dayForge:false}),4);
  assert.equal(boatExitRadius({type:'car',dayForge:true,boardRadius:50}),4);
  assert.ok(boatExitRadius({type:'boat',dayForge:true,boardRadius:45})>=40);
  assert.ok(boatExitRadius({type:'boat',dayForge:true,boardRadius:23})>=20);
});

test('boats can be boarded by planar distance from the water surface',()=>{
  const pos={x:0,y:-.72,z:0};
  const boat={type:'boat',g:{position:{x:12,y:0,z:5}}};
  const car={type:'car',g:{position:{x:12,y:20,z:5}}};
  assert.ok(Math.abs(vehicleBoardDistance(boat,pos)-13)<1e-9);
  assert.ok(vehicleBoardDistance(car,pos)>20);
});

test('game wiring permits deep-water travel and water-to-boat boarding',()=>{
  const game=readFileSync(resolve('src/game.js'),'utf8');
  assert.match(game,/targetSwimming\|\|hf\(nx,nz\)>-6/);
  assert.match(game,/vehicleBoardDistance\(v,P\)/);
  assert.match(game,/boatExitRadius\(cur\)/);
  assert.match(game,/SWIM_SURFACE_Y/);
  assert.match(game,/Swimming · Board nearby boats/);
});
