import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const assets=[
  ['alien_spaceship.glb',new URL('../public/assets/space/alien/alien_spaceship.glb',import.meta.url),5],
  ['alien_ship.glb',new URL('../public/assets/space/alien/alien_ship.glb',import.meta.url),119],
];

for(const [name,path,minMeshes] of assets){
  test(name+' is a valid embedded GLB',async()=>{
    const buf=await readFile(path);
    assert.equal(buf.subarray(0,4).toString('ascii'),'glTF');
    assert.equal(buf.readUInt32LE(4),2);
    assert.equal(buf.readUInt32LE(8),buf.length);
    const jsonLength=buf.readUInt32LE(12),doc=JSON.parse(buf.subarray(20,20+jsonLength).toString('utf8').replace(/\0+$/,'').trimEnd());
    assert.ok((doc.meshes?.length||0)>=minMeshes);
  });
  if(name==='alien_ship.glb')test('Three GLTFLoader parses '+name,async()=>{
    if(!globalThis.ProgressEvent)globalThis.ProgressEvent=class ProgressEvent{};
    const buf=await readFile(path),arrayBuffer=buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength);
    const gltf=await new Promise((resolve,reject)=>new GLTFLoader().parse(arrayBuffer,'',resolve,reject));
    let meshes=0;gltf.scene.traverse(node=>{if(node.isMesh){meshes++;if(!node.geometry.getAttribute('normal'))node.geometry.computeVertexNormals()}});
    assert.ok(meshes>=minMeshes);
  });
}
