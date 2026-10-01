import test from 'node:test';
import assert from 'node:assert/strict';
import {SOUTH_PADRE,spiTerrainHeight,spiRouteHeight,isSpiRoute,spiLandHeight} from '../src/core/south-padre.js';
import {terrainHeight,boatCanTravel} from '../src/core/world.js';
import {readFile} from 'node:fs/promises';

test('SPI road route is continuous from Port Isabel across the raised causeway to Padre Blvd',()=>{
  const route=SOUTH_PADRE.route;
  assert.equal(route.length,5);
  for(let i=0;i<route.length-1;i++){
    const a=route[i],b=route[i+1],steps=100;
    for(let n=0;n<=steps;n++)assert.ok(Number.isFinite(spiRouteHeight(a.x+(b.x-a.x)*n/steps,a.z+(b.z-a.z)*n/steps)));
  }
  assert.ok(Math.abs(spiRouteHeight(SOUTH_PADRE.causeway.peak.x,SOUTH_PADRE.causeway.peak.z)-23.8)<1e-9);
  assert.ok(Math.abs(terrainHeight(SOUTH_PADRE.portIsabel.center.x,SOUTH_PADRE.portIsabel.center.z)-SOUTH_PADRE.portIsabel.elevation)<1e-9);
  assert.ok(terrainHeight(SOUTH_PADRE.padreBlvd.x,SOUTH_PADRE.padreBlvd.z)>0);
  assert.equal(isSpiRoute(SOUTH_PADRE.causeway.peak.x,SOUTH_PADRE.causeway.peak.z),true);
  assert.equal(spiLandHeight(SOUTH_PADRE.causeway.peak.x,SOUTH_PADRE.causeway.peak.z),null);
  assert.ok(terrainHeight(SOUTH_PADRE.bayProbe.x,SOUTH_PADRE.bayProbe.z)<-.7);
  assert.equal(boatCanTravel(SOUTH_PADRE.bayProbe.x,SOUTH_PADRE.bayProbe.z),true);
});

test('SPI region destination, rendering hooks, and player access are wired',async()=>{
  const [game,atlas]=await Promise.all([readFile(new URL('../src/game.js',import.meta.url),'utf8'),readFile(new URL('../src/systems/atlas.js',import.meta.url),'utf8')]);
  assert.match(game,/southPadreDestination/);assert.match(game,/portIsabelDestination/);assert.match(game,/createSouthPadreRegion/);assert.match(game,/spiCar/);
  assert.match(atlas,/extent=\d+/);
  assert.ok(SOUTH_PADRE.destination.name.includes('South Padre'));assert.ok(SOUTH_PADRE.portDestination.name.includes('Port Isabel'));
});