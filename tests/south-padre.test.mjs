import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {SOUTH_PADRE,spiRouteHeight,isSpiRoute,spiLandHeight} from '../src/core/south-padre.js';
import {terrainHeight,boatCanTravel} from '../src/core/world.js';

test('uploaded SPI model contains Port Isabel, Queen Isabella bridge, roads and terrain',async()=>{
  const url=new URL('../public/assets/regions/south-padre-island.glb',import.meta.url);
  const bytes=await readFile(url),info=await stat(url);
  assert.ok(info.size>20_000_000);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),SOUTH_PADRE.model.sourceSha256);
  assert.equal(bytes.subarray(0,4).toString(),'glTF');
  const jsonLength=bytes.readUInt32LE(12),jsonType=bytes.subarray(16,20).toString();
  assert.equal(jsonType,'JSON');
  const gltf=JSON.parse(bytes.subarray(20,20+jsonLength).toString('utf8'));
  const names=new Set((gltf.nodes||[]).map(n=>n.name));
  for(const name of ['Port_Isabel','Bridge_QueenIsabella','Terrain','Roads'])assert.ok(names.has(name),name+' missing');
  assert.ok((gltf.meshes||[]).length>=100);
});

test('SPI visual scale is believable relative to player and vehicles',()=>{
  assert.equal(SOUTH_PADRE.model.scale.x,.32);
  assert.equal(SOUTH_PADRE.model.scale.y,.32);
  assert.equal(SOUTH_PADRE.model.scale.z,.32);
  assert.ok(SOUTH_PADRE.model.bridgeYScale>2.5);
  const route=SOUTH_PADRE.route;
  const span=Math.hypot(route.at(-1).x-route[0].x,route.at(-1).z-route[0].z);
  assert.ok(span>1500,'Port Isabel to Padre Boulevard drive should no longer be miniature');
  assert.ok(SOUTH_PADRE.portIsabel.halfX>=200&&SOUTH_PADRE.portIsabel.halfZ>=180);
});

test('SPI road route is continuous from Port Isabel across the raised causeway to Padre Boulevard',()=>{
  const route=SOUTH_PADRE.route;
  assert.ok(route.length>=9);
  for(let i=0;i<route.length-1;i++){
    const a=route[i],b=route[i+1],steps=60;
    for(let n=0;n<=steps;n++){
      const t=n/steps;
      assert.ok(Number.isFinite(spiRouteHeight(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)));
    }
  }
  assert.ok(Math.abs(spiRouteHeight(SOUTH_PADRE.causeway.peak.x,SOUTH_PADRE.causeway.peak.z)-23.8)<.01);
  assert.ok(Math.abs(terrainHeight(SOUTH_PADRE.portIsabel.center.x,SOUTH_PADRE.portIsabel.center.z)-SOUTH_PADRE.portIsabel.elevation)<1e-9);
  assert.ok(terrainHeight(SOUTH_PADRE.padreBlvd.x,SOUTH_PADRE.padreBlvd.z)>0);
  assert.equal(isSpiRoute(SOUTH_PADRE.causeway.peak.x,SOUTH_PADRE.causeway.peak.z),true);
  assert.equal(spiLandHeight(SOUTH_PADRE.causeway.peak.x,SOUTH_PADRE.causeway.peak.z),null);
  assert.ok(terrainHeight(SOUTH_PADRE.bayProbe.x,SOUTH_PADRE.bayProbe.z)<-.7);
  assert.equal(boatCanTravel(SOUTH_PADRE.bayProbe.x,SOUTH_PADRE.bayProbe.z),true);
});

test('curved island collision follows the uploaded terrain footprint instead of the old rectangular island',()=>{
  for(const [z,center,half] of SOUTH_PADRE.shoreline.filter((_,i)=>i%5===0)){
    assert.ok(spiLandHeight(center,z)>0);
    assert.equal(spiLandHeight(center+half+12,z),null);
  }
  assert.ok(SOUTH_PADRE.shoreline.at(-1)[0]<-4000);
});

test('SPI region is lazy-loaded, quality-gated and exposed through Explore',async()=>{
  const [game,atlas,region]=await Promise.all([
    readFile(new URL('../src/game.js',import.meta.url),'utf8'),
    readFile(new URL('../src/systems/atlas.js',import.meta.url),'utf8'),
    readFile(new URL('../src/systems/south-padre-region.js',import.meta.url),'utf8')
  ]);
  assert.match(game,/southPadreDestination/);assert.match(game,/portIsabelDestination/);assert.match(game,/spiCar/);
  assert.match(game,/southPadreRegion\.preload/);assert.match(game,/southPadreRegion\.update\(\{position:P,quality\}\)/);
  assert.match(region,/GLTFLoader/);assert.match(region,/R\.model\.path/);assert.match(region,/startsWith\('Water'\)/);assert.match(region,/quality==='high'/);
  const extent=Number(atlas.match(/extent=(\d+)/)?.[1]||0);assert.ok(extent>=10000);
  assert.ok(SOUTH_PADRE.destination.name.includes('South Padre'));assert.ok(SOUTH_PADRE.portDestination.name.includes('Port Isabel'));
});