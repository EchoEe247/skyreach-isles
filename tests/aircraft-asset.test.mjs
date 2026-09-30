import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const path=new URL('../public/assets/aircraft/airliner.glb',import.meta.url);

test('airliner GLB is valid, complete, and faces +Z for Skyreach flight',async()=>{
  const buf=await readFile(path);
  assert.equal(buf.subarray(0,4).toString('ascii'),'glTF');
  assert.equal(buf.readUInt32LE(4),2);
  assert.equal(buf.readUInt32LE(8),buf.length);
  const jsonLength=buf.readUInt32LE(12);
  assert.equal(buf.readUInt32LE(16),0x4e4f534a);
  const doc=JSON.parse(buf.subarray(20,20+jsonLength).toString('utf8').replace(/\0+$/,'').trimEnd());
  assert.equal(doc.meshes?.length,18);
  const names=new Set((doc.nodes??[]).map(node=>node.name));
  for(const name of ['white','glass','wing','nacelle','fan','gear','tire','hub'])assert.ok(names.has(name),name);
  const glass=doc.nodes.find(node=>node.name==='glass');
  const glassMesh=doc.meshes[glass.mesh];
  const posAccessor=doc.accessors[glassMesh.primitives[0].attributes.POSITION];
  assert.ok(posAccessor.min[2]>14,'cockpit glass must be at the +Z nose');
  let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const mesh of doc.meshes)for(const primitive of mesh.primitives){
    const acc=doc.accessors[primitive.attributes.POSITION];
    for(let i=0;i<3;i++){min[i]=Math.min(min[i],acc.min[i]);max[i]=Math.max(max[i],acc.max[i])}
  }
  const dims=max.map((v,i)=>v-min[i]);
  assert.ok(Math.abs(dims[0]-34.9)<.02);
  assert.ok(Math.abs(dims[1]-11.95)<.02);
  assert.ok(Math.abs(dims[2]-37.45)<.02);
});
