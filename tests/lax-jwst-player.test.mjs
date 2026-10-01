import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {terrainHeight,AIRPORT_SITE,isAirportZone} from '../src/core/world.js';

async function glb(path){
  const buf=await readFile(new URL(path,import.meta.url));
  assert.equal(buf.subarray(0,4).toString('ascii'),'glTF');
  assert.equal(buf.readUInt32LE(4),2);
  assert.equal(buf.readUInt32LE(8),buf.length);
  const jsonLength=buf.readUInt32LE(12);
  const doc=JSON.parse(buf.subarray(20,20+jsonLength).toString('utf8').replace(/\0+$/,'').trimEnd());
  return {buf,doc};
}

test('LAX asset fits the flattened main-island airport site',async()=>{
  const {buf,doc}=await glb('../public/assets/world/lax_airport.glb');
  assert.ok(buf.length<400_000);
  assert.equal(doc.meshes?.length,377);
  assert.ok(isAirportZone(AIRPORT_SITE.x,AIRPORT_SITE.z));
  for(const [dx,dz] of [[0,0],[-70,-40],[70,40],[-48*AIRPORT_SITE.scale,-34*AIRPORT_SITE.scale]]){
    assert.ok(Math.abs(terrainHeight(AIRPORT_SITE.x+dx,AIRPORT_SITE.z+dz)-AIRPORT_SITE.elevation)<1e-9);
  }
});

test('JWST asset is compact and fully embedded',async()=>{
  const {buf,doc}=await glb('../public/assets/space/jwst.glb');
  assert.ok(buf.length<250_000);
  assert.equal(doc.meshes?.length,100);
  for(const image of doc.images??[])assert.ok(!image.uri,'JWST images must not depend on external files');
});

test('Nightweaver LOD0 is the textured user-selected player asset',async()=>{
  const {buf,doc}=await glb('../public/assets/characters/nightweaver_LOD0.glb');
  assert.ok(buf.length>1_000_000);
  assert.equal(doc.meshes?.length,104);
  assert.equal(doc.materials?.length,6);
  assert.ok((doc.textures?.length??0)>=20);
  assert.equal(doc.animations?.length??0,0);
  for(const image of doc.images??[])assert.ok(!image.uri,'Nightweaver textures must be embedded');
});

test('Nightweaver exposes semantic limb meshes for procedural articulation',async()=>{
  const {doc}=await glb('../public/assets/characters/nightweaver_LOD0.glb');
  const names=new Set((doc.nodes??[]).map(n=>n.name));
  for(const name of ['upperArmL','forearmL','thighL','calfL','upperArmR','forearmR','thighR','calfR'])assert.ok(names.has(name),name+' must remain available for the runtime rig');
});

test('LAX, airplane locator, and JWST view are exposed in the game UI',async()=>{
  const [game,atlas,html]=await Promise.all([
    readFile(new URL('../src/game.js',import.meta.url),'utf8'),
    readFile(new URL('../src/systems/atlas.js',import.meta.url),'utf8'),
    readFile(new URL('../index.html',import.meta.url),'utf8')
  ]);
  assert.match(game,/LAX International Airport/);
  assert.match(game,/PLAYER_VISUAL_HEIGHT=2\.8/);
  assert.match(game,/buildNightweaverRig/);
  assert.match(game,/NW_Shoulder_L/);
  assert.match(game,/NW_Elbow_R/);
  assert.match(game,/NW_Hip_L/);
  assert.match(game,/NW_Knee_R/);
  assert.match(game,/toward\(rig\.armLU,-swing\*amp\*\.82/);
  assert.match(game,/toward\(rig\.legRU,-swing\*amp/);
  assert.match(game,/nightweaver_LOD0\.glb/);
  assert.match(game,/if\(telescopeView&&jwst\.userData\.modelState==='deferred'\)ensureJwstModel/);
  assert.match(game,/assets\/space\/jwst\.glb/);
  assert.match(atlas,/Find my airplane/);
  assert.match(html,/id="telescope"[^>]*>JWST VIEW</);
});
