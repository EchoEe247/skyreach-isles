import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {SOUTH_PADRE,spiRouteHeight,isSpiRoute,spiLandHeight,spiProximity} from '../src/core/south-padre.js';
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

test('SPI visual scale is calibrated to an adult human and official causeway/lighthouse references',()=>{
  assert.equal(SOUTH_PADRE.model.scale.x,1.5);assert.equal(SOUTH_PADRE.model.scale.y,1.5);assert.equal(SOUTH_PADRE.model.scale.z,1.5);
  assert.ok(Math.abs(SOUTH_PADRE.model.bridgeYScale-.9005)<.001);
  assert.ok(Math.abs(SOUTH_PADRE.model.lighthouseYScale-(21.95/25.83))<1e-9);
  assert.equal(SOUTH_PADRE.causeway.realPeakMeters,23.8);assert.equal(SOUTH_PADRE.causeway.realPeakFeet,78);
  assert.equal(SOUTH_PADRE.causeway.peakHeight,35.7);
  assert.equal(SOUTH_PADRE.model.position.x,9990.443359375);assert.equal(SOUTH_PADRE.model.position.z,564.39);
  const route=SOUTH_PADRE.route,span=Math.hypot(route.at(-1).x-route[0].x,route.at(-1).z-route[0].z);
  assert.ok(span>7000);assert.ok(SOUTH_PADRE.portIsabel.halfX>=300&&SOUTH_PADRE.portIsabel.halfZ>=280);
});

test('SPI road route is continuous from Port Isabel across the raised causeway to Padre Boulevard',()=>{
  const route=SOUTH_PADRE.route;  assert.ok(route.length>=9);
  for(let i=0;i<route.length-1;i++){
    const a=route[i],b=route[i+1],steps=60;
    for(let n=0;n<=steps;n++){
      const t=n/steps;
      assert.ok(Number.isFinite(spiRouteHeight(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)));
    }
  }
  assert.ok(Math.abs(spiRouteHeight(SOUTH_PADRE.causeway.peak.x,SOUTH_PADRE.causeway.peak.z)-35.7)<.01);
  assert.ok(Math.abs(terrainHeight(SOUTH_PADRE.portIsabel.center.x,SOUTH_PADRE.portIsabel.center.z)-SOUTH_PADRE.portIsabel.elevation)<.5);
  assert.ok(terrainHeight(SOUTH_PADRE.padreBlvd.x,SOUTH_PADRE.padreBlvd.z)>0);
  assert.equal(isSpiRoute(SOUTH_PADRE.causeway.peak.x,SOUTH_PADRE.causeway.peak.z),true);
  assert.equal(spiLandHeight(SOUTH_PADRE.causeway.peak.x,SOUTH_PADRE.causeway.peak.z),null);
  assert.ok(terrainHeight(SOUTH_PADRE.bayProbe.x,SOUTH_PADRE.bayProbe.z)<-.7);
  assert.equal(boatCanTravel(SOUTH_PADRE.bayProbe.x,SOUTH_PADRE.bayProbe.z),true);
});

test('causeway joints keep the next segment centerline instead of collapsing into the prior shoulder',()=>{
  const route=SOUTH_PADRE.route,smooth=t=>t*t*(3-2*t);
  for(let i=1;i<route.length-1;i++){
    const a=route[i],b=route[i+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
    for(const distance of [4,12,20,25,32]){
      const t=distance/len,x=a.x+dx*t,z=a.z+dz*t;
      const expected=a.y+(b.y-a.y)*smooth(t),actual=spiRouteHeight(x,z);
      assert.ok(Number.isFinite(actual),a.name+' centerline vanished at '+distance);
      assert.ok(Math.abs(actual-expected)<.02,a.name+' centerline height drifted at '+distance);
    }
  }
});

test('causeway collision does not create invisible shoulders over open bay water',()=>{
  const route=SOUTH_PADRE.route,a=route[4],b=route[5],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
  const mx=a.x+dx*.35,mz=a.z+dz*.35,nx=-dz/len,nz=dx/len;
  assert.ok(Number.isFinite(spiRouteHeight(mx+nx*14,mz+nz*14)));
  assert.equal(spiLandHeight(mx+nx*18,mz+nz*18),null);
  assert.equal(spiRouteHeight(mx+nx*18,mz+nz*18),null);
});

test('curved island collision follows the uploaded terrain footprint instead of the old rectangular island',()=>{  for(const [z,center,half] of SOUTH_PADRE.shoreline.filter((_,i)=>i%5===0)){
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
  const extent=Number(atlas.match(/extent=(\d+)/)?.[1]||0);assert.ok(extent>=100000);
  assert.ok(spiProximity(SOUTH_PADRE.carSpawn).near);assert.equal(spiProximity({x:0,z:0}).near,false);const spiVis=spiProximity(SOUTH_PADRE.carSpawn);assert.equal(spiVis.clearFogNear,12000);assert.equal(spiVis.clearFogFar,79000);assert.equal(spiVis.weatherFogFar,6500);
  assert.match(region,/addContext/);assert.match(region,/Terrain__vc/);assert.match(region,/0xffefc7/);assert.match(region,/lighthouseParts/);assert.match(region,/R\.model\.lighthouseYScale/);
  assert.match(game,/spiCarFallback\.scale\.setScalar\(HUMAN_SCALE\)/);assert.match(game,/boardRadius:18/);assert.ok(Math.abs(spiRouteHeight(SOUTH_PADRE.carSpawn.x,SOUTH_PADRE.carSpawn.z)-SOUTH_PADRE.carSpawn.y)<1e-9);assert.match(game,/spiProximity\(P\)/);assert.match(game,/clearFogFar/);
  assert.ok(SOUTH_PADRE.destination.name.includes('South Padre'));assert.ok(SOUTH_PADRE.portDestination.name.includes('Port Isabel'));
  assert.equal(SOUTH_PADRE.portDestination.x,SOUTH_PADRE.carSpawn.x);assert.equal(SOUTH_PADRE.portDestination.z,SOUTH_PADRE.carSpawn.z);
  assert.match(game,/SOUTH_PADRE\.carSpawn/);assert.match(game,/Port Isabel sports car/);
});
