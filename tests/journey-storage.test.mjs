import test from 'node:test';
import assert from 'node:assert/strict';
const data=new Map();
globalThis.localStorage={getItem:key=>data.get(key)||null,setItem:(k,v)=>data.set(k,String(v))};
const {saveJourney,loadJourney}=await import('../src/core/storage.js');
test('optional journey persists across storage loads and clamps invalid stages',()=>{
 assert.equal(loadJourney(),0);
 for(const stage of [0,1,2,3,4,5]){saveJourney(stage);assert.equal(loadJourney(),stage)}
 assert.equal(saveJourney(200),5);
 data.set('skyreach-journey-v1','broken-json');
 assert.equal(loadJourney(),0);
});
test('journey storage gracefully handles private mode or disabled localStorage',()=>{
 globalThis.localStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 assert.equal(loadJourney(),0);
 assert.doesNotThrow(()=>saveJourney(2));
});
