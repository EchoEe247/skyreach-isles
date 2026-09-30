import test from 'node:test';
import assert from 'node:assert/strict';

const values=new Map();
globalThis.localStorage={
  getItem:key=>values.has(key)?values.get(key):null,
  setItem:(key,value)=>values.set(key,String(value))
};

const {loadProgress,saveProgress}=await import('../src/core/storage.js');

test('progress defaults are backward compatible',()=>{
  values.clear();
  assert.deepEqual(loadProgress(),{beacons:[],rings:[],shards:[],discoveries:[]});
});

test('progress persists the expanded exploration state',()=>{
  values.clear();
  const expected={
    beacons:[true,false],
    rings:[true],
    shards:[false,true,true],
    discoveries:[true,false,true]
  };
  saveProgress(expected);
  assert.deepEqual(loadProgress(),expected);
});

test('eight landmark discoveries survive save and reload',()=>{
  const discoveries=Array.from({length:8},()=>true);
  saveProgress({beacons:[true],rings:[],shards:[],discoveries});
  assert.deepEqual(loadProgress().discoveries,discoveries);
});
