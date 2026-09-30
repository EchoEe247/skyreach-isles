import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const path=new URL('../public/assets/boats/speedboat.glb',import.meta.url);

async function loadAsset(){
  const buf=await readFile(path);
  const jsonLength=buf.readUInt32LE(12);
  const doc=JSON.parse(buf.subarray(20,20+jsonLength).toString('utf8').replace(/\0+$/,'').trimEnd());
  return {buf,doc};
}

test('speedboat GLB is valid and its bow is +X',async()=>{
  const {buf,doc}=await loadAsset();
  assert.equal(buf.subarray(0,4).toString('ascii'),'glTF');
  assert.equal(buf.readUInt32LE(4),2);
  assert.equal(buf.readUInt32LE(8),buf.length);
  assert.equal(buf.readUInt32LE(16),0x4e4f534a);
  assert.equal(doc.extensionsRequired,undefined);

  const names=new Set((doc.nodes??[]).map(node=>node.name));
  for(const name of ['Hull','Transom','Foredeck','SternDeck','CockpitBulkhead'])assert.ok(names.has(name),name);

  const nodeByName=name=>doc.nodes.find(node=>node.name===name);
  const boundsForNode=name=>{
    const node=nodeByName(name);
    const mesh=doc.meshes[node.mesh];
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(const primitive of mesh.primitives){
      const acc=doc.accessors[primitive.attributes.POSITION];
      for(let i=0;i<3;i++){min[i]=Math.min(min[i],acc.min[i]);max[i]=Math.max(max[i],acc.max[i])}
    }
    return {min,max};
  };
  const foredeck=boundsForNode('Foredeck');
  const transom=boundsForNode('Transom');
  assert.ok(foredeck.max[0]>4.4,'foredeck should reach the +X bow');
  assert.ok(transom.max[0]<-4.4,'transom should sit at the -X stern');

  let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const mesh of doc.meshes)for(const primitive of mesh.primitives){
    const acc=doc.accessors[primitive.attributes.POSITION];
    for(let i=0;i<3;i++){min[i]=Math.min(min[i],acc.min[i]);max[i]=Math.max(max[i],acc.max[i])}
  }
  const dims=max.map((v,i)=>v-min[i]);
  assert.ok(Math.abs(dims[0]-9.001091)<.01);
  assert.ok(Math.abs(dims[1]-3.229883)<.01);
  assert.ok(Math.abs(dims[2]-2.629994)<.01);
});

test('Three GLTFLoader parses the exact speedboat used by the game',async()=>{
  if(!globalThis.ProgressEvent)globalThis.ProgressEvent=class ProgressEvent{};
  const {buf}=await loadAsset();
  const arrayBuffer=buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength);
  const gltf=await new Promise((resolve,reject)=>new GLTFLoader().parse(arrayBuffer,'',resolve,reject));
  let meshes=0;
  gltf.scene.traverse(node=>{if(node.isMesh)meshes++});
  assert.equal(meshes,117);
});
