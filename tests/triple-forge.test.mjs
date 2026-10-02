import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const assets=[
  ['public/assets/triple-forge/building/skyhold.glb','SKYHOLD'],
  ['public/assets/triple-forge/building/grovekeep.glb','GROVEKEEP'],
  ['public/assets/triple-forge/ai/arachne.glb','ARACHNE'],
  ['public/assets/triple-forge/ai/steelhound.glb','STEELHOUND']
];

function glbJson(buffer){
  assert.equal(buffer.toString('ascii',0,4),'glTF');
  assert.equal(buffer.readUInt32LE(4),2);
  assert.equal(buffer.readUInt32LE(8),buffer.length);
  const jsonLength=buffer.readUInt32LE(12),jsonType=buffer.readUInt32LE(16);
  assert.equal(jsonType,0x4e4f534a);
  return JSON.parse(buffer.subarray(20,20+jsonLength).toString('utf8').trim());
}

test('selected Triple Forge assets are valid, renderable GLB2 files with repaired emissive semantics',async()=>{
  if(!globalThis.ProgressEvent)globalThis.ProgressEvent=class ProgressEvent{};
  for(const [path,name] of assets){
    const data=await readFile(path);
    assert.ok(data.length>10_000,name+' should not be an empty placeholder');
    const doc=glbJson(data);
    assert.ok((doc.meshes?.length||0)>0,name+' should contain meshes');
    for(const material of doc.materials||[]){
      const e=material.emissiveFactor;
      if(e)for(const v of e)assert.ok(v<=1.000001,name+' emissiveFactor must remain inside glTF core range');
    }
    const arrayBuffer=data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
    const gltf=await new Promise((resolve,reject)=>new GLTFLoader().parse(arrayBuffer,'',resolve,reject));
    let meshes=0;gltf.scene.traverse(node=>{if(node.isMesh)meshes++});
    assert.ok(meshes>0,name+' should parse to renderable Three.js meshes');
  }
});

test('Triple Forge gameplay keeps the four selected assets focused on distinct systems',async()=>{
  const src=await readFile('src/systems/triple-forge-expansion.js','utf8');
  assert.match(src,/Skyhold · Floating Sky Palace/);
  assert.match(src,/Grovekeep · Titan Tree Fortress/);
  assert.match(src,/Arachne Sentinel/);
  assert.match(src,/skyreach-triple-forge-v1/);
  assert.match(src,/houndFollow/);
  assert.match(src,/bossHp/);
  assert.match(src,/planeGroundHeight/);
  assert.match(src,/meshSurface/);
  assert.match(src,/waterBlocked/);
  assert.match(src,/assets\/triple-forge\/building\/skyhold\.glb/);
  assert.match(src,/assets\/triple-forge\/building\/grovekeep\.glb/);
  assert.match(src,/assets\/triple-forge\/ai\/arachne\.glb/);
  assert.match(src,/assets\/triple-forge\/ai\/steelhound\.glb/);
});

test('game wiring exposes Triple Forge destinations, interaction, traversal and QA state',async()=>{
  const game=await readFile('src/game.js','utf8');
  assert.match(game,/createTripleForgeExpansion/);
  assert.match(game,/\.\.\.tripleForge\.destinations/);
  assert.match(game,/tripleForge\.interact\(P\)/);
  assert.match(game,/tripleForge\.walkable/);
  assert.match(game,/tripleForge\.waterBlocked/);
  assert.match(game,/tripleForge\.planeGroundHeight/);
  assert.match(game,/tripleForge\.surfaceHeight/);
  assert.match(game,/tripleForge\.guidance/);
  assert.match(game,/tripleForge:tripleForge\.status\(\)/);
});
