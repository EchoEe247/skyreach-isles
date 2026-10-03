import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JET_BOOST_PROFILES,jetBoostEligible,jetBoostProfile} from '../src/core/jet-boost.js';

test('jet boost covers normal vehicle classes and explicitly excludes spacecraft',()=>{
  for(const type of ['car','boat','submarine','plane']){
    assert.equal(jetBoostEligible({type}),true,type+' should support jet boost');
    assert.ok(jetBoostProfile({type}).maxSpeed>0);
  }
  assert.equal(jetBoostEligible({type:'rocket',spacecraft:true}),false);
  assert.equal(jetBoostEligible({type:'alien',spacecraft:true}),false);
  assert.equal(jetBoostProfile({type:'rocket',spacecraft:true}),null);
  assert.ok(JET_BOOST_PROFILES.car.maxSpeed>=150);
  assert.ok(JET_BOOST_PROFILES.boat.maxSpeed>=100);
  assert.ok(JET_BOOST_PROFILES.submarine.maxSpeed>=70);
  assert.ok(JET_BOOST_PROFILES.plane.maxSpeed>=220);
});

test('mobile HUD and runtime wire a separate hold-to-use jet boost without replacing normal Boost',async()=>{
  const [html,css,game]=await Promise.all([
    readFile(new URL('../index.html',import.meta.url),'utf8'),
    readFile(new URL('../src/style.css',import.meta.url),'utf8'),
    readFile(new URL('../src/game.js',import.meta.url),'utf8')
  ]);
  assert.match(html,/id="boost"/);
  assert.match(html,/id="jetboost"/);
  assert.match(html,/JET BOOST/);
  assert.match(css,/#jetboost\{/);
  assert.match(game,/hold\('jetboost',v=>jetBoostF=v\)/);
  assert.match(game,/keys\.KeyJ/);
  assert.match(game,/jetBoostEligible\(c\)/);
  assert.match(game,/jetBoostProfile\(c\)/);
  assert.match(game,/c\.spacecraft/);
  assert.match(game,/jet\?jetProfile\.maxSpeed/);
  assert.match(game,/· JET/);
});
