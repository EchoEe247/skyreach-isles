import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';

test('mobile SLS derivative is a bounded binary STL',async()=>{
  const file=new URL('../public/assets/space/nasa-sls-block1-mobile.stl',import.meta.url),buf=await readFile(file),info=await stat(file);
  assert.equal(buf.length,info.size);
  const triangles=buf.readUInt32LE(80);
  assert.ok(triangles>=45000&&triangles<=60000);
  assert.ok(info.size<3_500_000);
  assert.equal(buf.length,84+triangles*50);
});
