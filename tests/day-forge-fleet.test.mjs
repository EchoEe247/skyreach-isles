import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Box3,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DAY_FORGE_FLEET,prepareDayForgeVisual} from '../src/systems/day-forge-fleet.js';

const root=resolve('.');

test('DAY FORGE manifest has ten stable playable vehicles and valid source GLBs',()=>{
  assert.equal(DAY_FORGE_FLEET.length,10);
  assert.equal(new Set(DAY_FORGE_FLEET.map(v=>v.id)).size,10);
  assert.equal(new Set(DAY_FORGE_FLEET.map(v=>v.filename)).size,10);
  assert.deepEqual(DAY_FORGE_FLEET.reduce((a,v)=>(a[v.type]=(a[v.type]||0)+1,a),{}),{boat:5,plane:4,car:1});
  for(const v of DAY_FORGE_FLEET){
    assert.match(v.id,/^day-forge-/);
    const path=resolve(root,'public/assets/day-forge',v.filename);
    assert.ok(existsSync(path),`${v.filename} exists`);
    const buf=readFileSync(path);
    assert.equal(buf.readUInt32LE(0),0x46546c67,`${v.filename} has GLB magic`);
    assert.equal(buf.readUInt32LE(4),2,`${v.filename} is glTF 2`);
    assert.equal(buf.readUInt32LE(8),buf.length,`${v.filename} length is internally consistent`);
    assert.ok(v.targetLength>0&&v.boardRadius>0&&v.cameraDistance>0&&v.cameraHeight>0);
  }
});

test('all repaired DAY FORGE GLBs parse, batch, orient, and scale in Three',async()=>{
  if(!globalThis.ProgressEvent)globalThis.ProgressEvent=class ProgressEvent{};
  for(const v of DAY_FORGE_FLEET){
    const path=resolve(root,'public/assets/day-forge',v.filename),buf=await readFile(path);
    const jsonLength=buf.readUInt32LE(12);
    const doc=JSON.parse(buf.subarray(20,20+jsonLength).toString('utf8').replace(/\0+$/,'').trimEnd());
    for(const mat of doc.materials??[])for(const x of mat.emissiveFactor??[])assert.ok(x>=0&&x<=1,`${v.filename} emissiveFactor must stay in glTF core range`);
    const arrayBuffer=buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength);
    const gltf=await new Promise((resolve,reject)=>new GLTFLoader().parse(arrayBuffer,'',resolve,reject));
    let sourceMeshes=0;gltf.scene.traverse(node=>{if(node.isMesh)sourceMeshes++});
    const prepared=prepareDayForgeVisual(gltf.scene,v);
    let preparedMeshes=0;prepared.traverse(node=>{if(node.isMesh)preparedMeshes++});
    const size=new Box3().setFromObject(prepared).getSize(new Vector3());
    assert.ok(sourceMeshes>0&&preparedMeshes>0,`${v.filename} remains renderable`);
    assert.ok(preparedMeshes<=sourceMeshes,`${v.filename} batching cannot increase mesh count`);
    assert.ok(Math.abs(size.z-v.targetLength)<0.08,`${v.filename} normalizes to requested vehicle length`);
  }
});

test('gameplay and atlas retain live, individually named fleet locators and vehicle interaction metadata',()=>{
  const game=readFileSync(resolve(root,'src/game.js'),'utf8');
  const atlas=readFileSync(resolve(root,'src/systems/atlas.js'),'utf8');
  assert.match(game,/boardRadius\s*\?\?\s*12/);
  assert.match(game,/markerHeight\s*\?\?\s*9/);
  assert.match(game,/createDayForgeFleet/);
  assert.match(atlas,/vehicle\.id/);
  assert.match(atlas,/get x\(\)/);
  assert.match(atlas,/dayForgeVehicles/);
});
