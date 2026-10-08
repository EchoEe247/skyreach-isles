import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';

test('mobile SLS LOD keeps valid geometry and launch-vehicle dimensions',async()=>{
  const file=new URL('../public/assets/space/nasa-sls-block1-mobile.stl',import.meta.url),buf=await readFile(file),info=await stat(file);
  assert.equal(buf.length,info.size);
  const triangles=buf.readUInt32LE(80);
  // Accept the original 55k-triangle model and the smaller mobile LOD.
  assert.ok(triangles>=25000&&triangles<=60000);
  assert.ok(info.size<3_500_000);
  assert.equal(buf.length,84+triangles*50);
  let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<triangles;i++){
    for(let j=0;j<3;j++){
      const offset=84+i*50+12+j*12;
      for(let axis=0;axis<3;axis++){
        const value=buf.readFloatLE(offset+axis*4);
        assert.ok(Number.isFinite(value),'rocket vertices must be finite');
        min[axis]=Math.min(min[axis],value);max[axis]=Math.max(max[axis],value);
      }
    }
  }
  assert.ok(max[0]-min[0]>44,'rocket width must remain intact');
  assert.ok(max[1]-min[1]>22,'rocket depth must remain intact');
  assert.ok(max[2]-min[2]>190,'rocket body must preserve its full height');
});
