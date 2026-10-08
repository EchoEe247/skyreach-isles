import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {terrainHeight,submarineCanTravel,submarineMaxDepth} from '../src/core/world.js';

const asset=new URL('../public/assets/vehicles/submarine.glb',import.meta.url);

test('uploaded submarine GLB is intact and parses in Three',async()=>{
  if(!globalThis.ProgressEvent)globalThis.ProgressEvent=class ProgressEvent{};
  const buf=await readFile(asset);
  assert.equal(buf.subarray(0,4).toString('ascii'),'glTF');
  assert.equal(buf.readUInt32LE(4),2);
  assert.equal(buf.readUInt32LE(8),buf.length);
  assert.equal(buf.length,361004);
  const gltf=await new Promise((resolve,reject)=>new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'',resolve,reject));
  let meshes=0;gltf.scene.traverse(n=>{if(n.isMesh)meshes++});
  assert.equal(meshes,125);
});

test('submarine spawn is in navigable water with usable dive clearance',()=>{
  const ba=.8,dkc=Math.cos(ba),dks=Math.sin(ba);let br=150;
  while(terrainHeight(dkc*br,dks*br)>-1.5)br+=2;
  let subR=br+18;while(terrainHeight(dkc*subR,dks*subR)>-4.5&&subR<br+160)subR+=2;
  const x=dkc*subR,z=dks*subR,floor=terrainHeight(x,z);
  assert.ok(floor<=-4.5,'submarine berth should be well clear of the shoreline shelf');
  assert.ok(submarineCanTravel(x,z,.45,.55),'surface movement must be possible at the berth');
  assert.ok(submarineMaxDepth(x,z,1.25)>=2,'berth should permit a meaningful initial dive');
});

test('submarine controls keep Boost separate from Dive and expose Explore guidance',async()=>{
  const [src,index,atlas]=await Promise.all([
    readFile(new URL('../src/game.js',import.meta.url),'utf8'),
    readFile(new URL('../index.html',import.meta.url),'utf8'),
    readFile(new URL('../src/systems/atlas.js',import.meta.url),'utf8')
  ]);
  for(const token of ["type:'submarine'","DEPTH ","Surface and come to a stop before exiting","assets/vehicles/submarine.glb","updateVehicleKinematics(c,{type:'submarine'","diveF","submarineCanTravel"])assert.ok(src.includes(token),token);
  for(const token of ['id="dive"','id="boost"','id="jump"'])assert.ok(index.includes(token),token);
  for(const token of ['Find my submarine',"vehicleType:type","v.type==='submarine'"])assert.ok(atlas.includes(token),token);
  assert.ok(!src.includes('nfloor+2.3'),'old impossible shallow-water clearance check must be gone');
});
