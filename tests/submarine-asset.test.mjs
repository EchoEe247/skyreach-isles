import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

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

test('submarine gameplay wiring includes dive, surface, depth HUD and safe exit',async()=>{
  const src=await readFile(new URL('../src/game.js',import.meta.url),'utf8');
  for(const token of ["type:'submarine'","'Dive'","'Surface'","DEPTH ","Surface and come to a stop before exiting","assets/vehicles/submarine.glb"])assert.ok(src.includes(token),token);
});
