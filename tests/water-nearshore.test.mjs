import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('camera-follow ocean is dense enough for the nearshore procedural waves',async()=>{
  const src=await readFile('src/game.js','utf8');
  const m=src.match(/WATER_SIZE=(\d+),WATER_SEGMENTS=(\d+),WATER_REPEAT_PER_M=([\d.]+),RP=WATER_SIZE\*WATER_REPEAT_PER_M,WATER_BASE_OPACITY=([\d.]+)/);
  assert.ok(m,'water rendering constants are explicit');
  const size=Number(m[1]),segments=Number(m[2]),repeatPerM=Number(m[3]),opacity=Number(m[4]);
  assert.ok(size/2>1400,'camera-follow water extends beyond the normal fog horizon');
  assert.ok(size/segments<=24,'water vertices sample the shoreline waves at <=24 m spacing');
  assert.ok(Math.abs(repeatPerM-.14)<1e-9,'water bump texture keeps the established world-space scale');
  assert.ok(opacity>=.9&&opacity<=.95,'water remains mostly opaque while allowing a subtle shallow-water read');
  assert.match(src,/new T\.PlaneGeometry\(WATER_SIZE,WATER_SIZE,WATER_SEGMENTS,WATER_SEGMENTS\)/);
  assert.match(src,/water\.position\.set\(C\.position\.x,0,C\.position\.z\)/);
  assert.match(src,/wt\.offset\.set\(C\.position\.x\*RP\/WATER_SIZE/);
  assert.match(src,/water\.material\.opacity=surfaceFade\*WATER_BASE_OPACITY/);
});

test('nearshore wave displacement stays small enough to lap the beach without flooding it',async()=>{
  const src=await readFile('src/game.js','utf8');
  const m=src.match(/worldTime\*1\.2\)\*([\d.]+)\+sin\(sea\.y\*\.09-sea\.x\*\.018-worldTime\*1\.7\)\*([\d.]+);/);
  assert.ok(m,'two bounded world-space wave components are present');
  const maxVertical=Number(m[1])+Number(m[2]);
  assert.ok(maxVertical<=.22,'combined geometric wave amplitude stays at or below 22 cm');
});
