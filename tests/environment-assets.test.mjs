import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ENVIRONMENT_REGIONS,WILDLIFE} from '../src/core/environment-layout.js';
const root=path.resolve('public/assets');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'environment/manifest.json')));
test('selected environment models and shared textures match provenance and resolve offline',()=>{
 for(const entry of [...manifest.assets,...manifest.sharedTextures]){
  const file=path.resolve(root,entry.file);assert.ok(file.startsWith(root+path.sep));
  const bytes=fs.readFileSync(file);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256,entry.file);
  if(!entry.file.endsWith('.glb'))continue;
  assert.equal(entry.license,'CC0-1.0');assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  for(const image of gltf.images||[]){assert.ok(image.uri&&!image.uri.startsWith('http'));assert.ok(fs.existsSync(path.resolve(path.dirname(file),image.uri)),image.uri)}
  if(entry.file.startsWith('animals/'))for(const name of ['Idle','Eating','Walk'])assert.ok(gltf.animations.some(a=>a.name===name));
 }
});
test('every curated model is used and all placements resolve to selected assets',()=>{
 const used=new Set(ENVIRONMENT_REGIONS.flatMap(r=>r.items.map(p=>p.asset+'.glb')));
 for(const a of WILDLIFE)used.add('animals/'+a.species+'.glb');
 const available=new Set(manifest.assets.map(a=>a.file));
 assert.deepEqual(used,available);
 for(const r of ENVIRONMENT_REGIONS)for(const p of r.items){assert.ok(Number.isFinite(p.x+p.z+p.height+p.yaw));assert.ok(p.height>0&&p.height<=10)}
});
test('enrichment keeps roads, inlet, cascade and sea arch free of new solids',()=>{
 const home=ENVIRONMENT_REGIONS.find(r=>r.id==='home');
 for(const p of home.items){assert.ok(Math.abs(p.x)>4&&Math.abs(p.z)>4,'road clearance')}
 const veil=ENVIRONMENT_REGIONS.find(r=>r.id==='veil');
 for(const p of veil.items){
  assert.ok(Math.hypot(p.x+798,p.z-435)>35,'sea arch clearance');
  if(p.x>=-680&&p.x<=-622)assert.ok(Math.abs(p.z-420)>=6,'waterfall viewing corridor');
 }
 const cove=ENVIRONMENT_REGIONS.find(r=>r.id==='tideglass');
 for(const p of cove.items)assert.ok(!(p.x>745&&Math.abs(p.z-350)<20),'inlet clearance');
 assert.equal(new Set(WILDLIFE.map(a=>a.species)).size,3);assert.ok(WILDLIFE.length<=8);
});
