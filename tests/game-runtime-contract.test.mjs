import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');

test('lighting declarations are executable, not swallowed by a line comment',()=>{
  assert.match(source,/\/\/ lights & sky\nconst hemi=new T\.HemisphereLight/);
  assert.doesNotMatch(source,/\/\/ lights & skyconst hemi/);
  assert.match(source,/hemi\.intensity=/);
});
