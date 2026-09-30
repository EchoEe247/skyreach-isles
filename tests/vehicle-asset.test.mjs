import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const path=new URL('../public/assets/vehicles/sports_car.glb',import.meta.url);

test('sports car GLB is valid and exposes the paint material contract',async()=>{
  const buf=await readFile(path);
  assert.equal(buf.subarray(0,4).toString('ascii'),'glTF');
  assert.equal(buf.readUInt32LE(4),2);
  assert.equal(buf.readUInt32LE(8),buf.length);
  const jsonLength=buf.readUInt32LE(12);
  assert.equal(buf.readUInt32LE(16),0x4e4f534a);
  const doc=JSON.parse(buf.subarray(20,20+jsonLength).toString('utf8').replace(/\0+$/,'').trimEnd());
  assert.equal(doc.scenes?.[0]?.nodes?.[0],0);
  assert.equal(doc.nodes?.[0]?.name,'car');
  assert.ok(doc.materials?.some(material=>material.name==='paint'));
  assert.ok((doc.meshes?.length??0)>=70);
});
